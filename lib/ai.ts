import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import {
  AIProcessingRequest,
  ProcessingResult,
  ColumnDefinition,
  ColumnValue,
  SlashCommand,
  UserSettings,
} from "./types";
import { executeDefaultCommand } from "./default-commands";

// Define the schema for structured output
const TimeEntrySchema = z.object({
  entries: z
    .array(z.record(z.string()))
    .describe("Array of time entries with column names as keys"),
  assumptions: z
    .array(z.string())
    .describe("List of assumptions made during processing"),
  conflicts: z.array(z.string()).describe("List of conflicts resolved"),
  uncertainMappings: z
    .array(z.string())
    .describe("List of uncertain mappings made"),
  summary: z.string().describe("Brief summary of what was processed"),
});

type StructuredTimeEntry = z.infer<typeof TimeEntrySchema>;

// Preprocess input by expanding slash commands
export function expandSlashCommands(
  input: string,
  commands: SlashCommand[]
): string {
  let processedInput = input;

  // First, process default commands (dynamic functions)
  // Find all potential slash commands in the input
  const slashCommandRegex = /\/\w+/g;
  const matches = processedInput.match(slashCommandRegex);

  if (matches) {
    matches.forEach((match) => {
      const defaultResult = executeDefaultCommand(match);
      if (defaultResult !== null) {
        // Replace all instances of this default command
        const regex = new RegExp(
          match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "gi"
        );
        processedInput = processedInput.replace(regex, defaultResult);
      }
    });
  }

  // Then, process user-defined commands (text replacement)
  commands.forEach((command) => {
    // Replace all instances of the command (case-insensitive)
    const regex = new RegExp(
      command.command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi"
    );
    processedInput = processedInput.replace(regex, command.expansion);
  });

  return processedInput;
}

// Build the AI prompt for processing time entries
function buildPrompt(request: AIProcessingRequest): string {
  const { input, settings, columns, columnValues } = request;

  // Build column information
  const columnInfo = columns
    .map((col) => {
      const values = columnValues.filter((val) => val.columnId === col.id);
      const valuesText =
        values.length > 0
          ? `\nPossible values: ${values
              .map((v) => `"${v.value}" (${v.description})`)
              .join(", ")}`
          : "";

      return `**${col.name}** (${col.description})
Format: ${col.format}${valuesText}`;
    })
    .join("\n\n");

  return `You are a time tracking assistant that converts natural language work descriptions into structured time entries.

**GLOBAL CONTEXT:**
${settings.globalContext}

**COLUMN DEFINITIONS:**
${columnInfo}

**INPUT TO PROCESS:**
"${input}"

**INSTRUCTIONS:**
1. Parse the input to identify distinct time blocks and activities
2. Map activities to appropriate project codes using the possible values provided
3. Make reasonable assumptions for missing information (document these in the assumptions array)
4. Handle conflicts by prioritizing meetings over regular work (document in conflicts array)
5. Use default work hours (9:00-17:00) unless specified
6. For uncertain mappings, document them in the uncertainMappings array
7. Generate time entries as objects with column names as keys and values as strings

Return structured data with:
- entries: Array of objects where each key is a column name and value is the formatted entry value
- assumptions: Array of strings describing assumptions made
- conflicts: Array of strings describing conflicts resolved
- uncertainMappings: Array of strings describing uncertain mappings
- summary: Brief summary of processing results`;
}

// Convert structured data to formatted output
function formatStructuredOutput(
  data: StructuredTimeEntry,
  settings: UserSettings,
  columns: ColumnDefinition[]
): { formattedOutput: string; explanation: string } {
  // Sort columns by sort order
  const sortedColumns = [...columns].sort((a, b) => a.sortOrder - b.sortOrder);

  // Generate formatted output
  const formattedLines = data.entries.map((entry) => {
    const values = sortedColumns.map((col) => entry[col.name] || "");
    return values.join(settings.elementDelimiter);
  });

  const formattedOutput =
    formattedLines.join(settings.rowEndDelimiter + "\n") +
    (formattedLines.length > 0 ? settings.rowEndDelimiter : "");

  // Generate explanation in markdown format
  const explanation = `## Processing Summary
${data.summary}

**✅ Successful Processing:**
- Generated ${data.entries.length} time entries

${
  data.assumptions.length > 0
    ? `**⚠️ Assumptions Made:**
${data.assumptions.map((a) => `- ${a}`).join("\n")}

`
    : ""
}${
    data.conflicts.length > 0
      ? `**🔀 Conflicts Resolved:**
${data.conflicts.map((c) => `- ${c}`).join("\n")}

`
      : ""
  }${
    data.uncertainMappings.length > 0
      ? `**❓ Uncertain Mappings:**
${data.uncertainMappings.map((u) => `- ${u}`).join("\n")}

`
      : ""
  }**📝 Time Entries Generated:**
${data.entries
  .map((entry, i) => `- Entry ${i + 1}: ${Object.values(entry).join(" | ")}`)
  .join("\n")}`;

  return { formattedOutput, explanation };
}

// Main AI processing function
export async function processTimeEntry(
  request: AIProcessingRequest
): Promise<ProcessingResult> {
  try {
    // Expand slash commands in input
    const expandedInput = expandSlashCommands(
      request.input,
      request.slashCommands
    );

    // Update request with expanded input
    const processedRequest = {
      ...request,
      input: expandedInput,
    };

    // Build the prompt
    const prompt = buildPrompt(processedRequest);

    // Call the AI with structured output
    const result = await generateObject({
      model: anthropic("claude-3-5-haiku-20241022"),
      prompt,
      schema: TimeEntrySchema,
      maxTokens: 2000,
      temperature: 0.1, // Low temperature for consistency
    });

    // Format the structured output
    const { formattedOutput, explanation } = formatStructuredOutput(
      result.object,
      request.settings,
      request.columns
    );

    if (!formattedOutput) {
      throw new Error("AI did not generate formatted output");
    }

    return {
      success: true,
      formattedOutput,
      explanation,
    };
  } catch (error) {
    console.error("AI processing error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred during processing",
    };
  }
}

// Utility function to validate time format
export function validateTimeFormat(
  timeString: string,
  format: string
): boolean {
  try {
    switch (format.toUpperCase()) {
      case "YYYYMMDDTHHMM":
        return /^\d{8}T\d{4}$/.test(timeString);
      case "HH:MM":
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString);
      case "YYYY-MM-DD":
        return /^\d{4}-\d{2}-\d{2}$/.test(timeString);
      case "TEXT":
      case "text":
        return true; // Any text is valid
      default:
        return true; // Unknown format, assume valid
    }
  } catch {
    return false;
  }
}

// Generate sample output for preview
export function generatePreviewOutput(
  settings: UserSettings,
  columns: ColumnDefinition[],
  sampleData?: Record<string, string>
): string {
  const sample = sampleData || {
    "Start Time": "20250606T0900",
    "End Time": "20250606T1100",
    "Project Code": "DEV",
    Description: "Sample development work",
  };

  const values = columns
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((col) => sample[col.name] || "VALUE")
    .join(settings.elementDelimiter);

  return values + settings.rowEndDelimiter;
}
