import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import {
  AIProcessingRequest,
  ProcessingResult,
  ColumnDefinition,
  ColumnValue,
  SlashCommand,
  UserSettings
} from './types';

// Preprocess input by expanding slash commands
export function expandSlashCommands(input: string, commands: SlashCommand[]): string {
  let processedInput = input;
  
  commands.forEach(command => {
    // Replace all instances of the command (case-insensitive)
    const regex = new RegExp(command.command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    processedInput = processedInput.replace(regex, command.expansion);
  });
  
  return processedInput;
}

// Build the AI prompt for processing time entries
function buildPrompt(request: AIProcessingRequest): string {
  const { input, settings, columns, columnValues } = request;
  
  // Build column information
  const columnInfo = columns.map(col => {
    const values = columnValues.filter(val => val.columnId === col.id);
    const valuesText = values.length > 0 
      ? `\nPossible values: ${values.map(v => `"${v.value}" (${v.description})`).join(', ')}`
      : '';
    
    return `**${col.name}** (${col.description})
Format: ${col.format}${valuesText}`;
  }).join('\n\n');

  const delimiter = settings.elementDelimiter === '\t' ? '\\t' : settings.elementDelimiter;
  const rowEnd = settings.rowEndDelimiter === '\n' ? '\\n' : settings.rowEndDelimiter;

  return `You are a time tracking assistant that converts natural language work descriptions into structured time entries.

**GLOBAL CONTEXT:**
${settings.globalContext}

**OUTPUT FORMAT:**
- Fields separated by: "${delimiter}"
- Rows ended by: "${rowEnd}"
- Column order: ${columns.map(c => c.name).join(', ')}

**COLUMN DEFINITIONS:**
${columnInfo}

**INPUT TO PROCESS:**
"${input}"

**INSTRUCTIONS:**
1. Parse the input to identify distinct time blocks and activities
2. Map activities to appropriate project codes using the possible values provided
3. Make reasonable assumptions for missing information (document these)
4. Handle conflicts by prioritizing meetings over regular work
5. Use default work hours (9:00-17:00) unless specified
6. Generate formatted output exactly matching the column order and delimiters

**RESPONSE FORMAT:**
Provide your response in exactly this structure:

FORMATTED_OUTPUT:
[Your formatted time entries here]

EXPLANATION:
## Processing Summary
✅ **[Success category]:** [What was successfully parsed]

⚠️ **Assumptions Made:**
- [List any assumptions with reasoning]

🔀 **Conflicts Resolved:**
- [List any conflicts and how they were resolved]

❓ **Unclear Mappings:**
- [List any uncertain mappings made]

📝 **Time Entries Generated:**
- [List each entry with human-readable details]

Generate the response now.`;
}

// Process the AI response to extract formatted output and explanation
function parseAIResponse(response: string): { formattedOutput: string; explanation: string } {
  const lines = response.split('\n');
  let inFormattedOutput = false;
  let inExplanation = false;
  let formattedOutput = '';
  let explanation = '';

  for (const line of lines) {
    if (line.trim() === 'FORMATTED_OUTPUT:') {
      inFormattedOutput = true;
      inExplanation = false;
      continue;
    }
    
    if (line.trim() === 'EXPLANATION:') {
      inFormattedOutput = false;
      inExplanation = true;
      continue;
    }

    if (inFormattedOutput && line.trim()) {
      formattedOutput += line.trim() + '\n';
    }
    
    if (inExplanation) {
      explanation += line + '\n';
    }
  }

  return {
    formattedOutput: formattedOutput.trim(),
    explanation: explanation.trim()
  };
}

// Main AI processing function
export async function processTimeEntry(request: AIProcessingRequest): Promise<ProcessingResult> {
  try {
    // Expand slash commands in input
    const expandedInput = expandSlashCommands(request.input, request.slashCommands);
    
    // Update request with expanded input
    const processedRequest = {
      ...request,
      input: expandedInput
    };

    // Build the prompt
    const prompt = buildPrompt(processedRequest);

    // Call the AI
    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      prompt,
      maxTokens: 2000,
      temperature: 0.1, // Low temperature for consistency
    });

    // Parse the response
    const { formattedOutput, explanation } = parseAIResponse(result.text);

    if (!formattedOutput) {
      throw new Error('AI did not generate formatted output');
    }

    return {
      success: true,
      formattedOutput,
      explanation
    };

  } catch (error) {
    console.error('AI processing error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during processing'
    };
  }
}

// Utility function to validate time format
export function validateTimeFormat(timeString: string, format: string): boolean {
  try {
    switch (format.toUpperCase()) {
      case 'YYYYMMDDTHHMM':
        return /^\d{8}T\d{4}$/.test(timeString);
      case 'HH:MM':
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString);
      case 'YYYY-MM-DD':
        return /^\d{4}-\d{2}-\d{2}$/.test(timeString);
      case 'TEXT':
      case 'text':
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
    'Start Time': '20250606T0900',
    'End Time': '20250606T1100', 
    'Project Code': 'DEV',
    'Description': 'Sample development work'
  };

  const values = columns
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(col => sample[col.name] || 'VALUE')
    .join(settings.elementDelimiter);

  return values + settings.rowEndDelimiter;
}