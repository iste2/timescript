# Timescript - Comprehensive Development Specification

## Project Overview

AI-powered time tracking app that converts natural language work descriptions into formatted time entries for 3rd party systems. Users describe their work day in natural language, AI processes and structures it, then generates formatted output matching user-defined templates.

## Technical Architecture

- **Framework**: Next.js 15 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **AI Integration**: Vercel AI SDK + Mastra.ai
- **AI Provider**: Anthropic Claude
- **Database**: SQLite (local storage) → Future migration to Supabase
- **Input Methods**: Text input (Phase 1), Voice with speech-to-text (Phase 2)

## Core Application Features

### 1. Main Interface (Single Page Layout)

- **Header**: App title + Settings button
- **Input Area**: Large persistent text box with slash command autocomplete + "Generate" button
- **Result Area**: Cards appear below input (never replace input field)
- **Processing Flow**: Button-triggered (not real-time), one input → one output

### 2. Result Card States

- **Loading**: Spinner + "Processing your work day..."
- **Success**: Two sections:
  - Formatted output (copy-pasteable string matching user template)
  - AI explanation (markdown with visual highlights)
- **Error**: Red-themed card with error message + retry button

### 3. AI Explanation Format (Markdown with Visual Highlights)

```markdown
## Processing Summary

✅ **Identified 3 time blocks** from your description
⚠️ **Assumptions Made:**

- "Morning work" → **9:00-12:00** (using default work hours)
  🔀 **Conflicts Resolved:**
- Overlapping meeting split project time
  📝 **Mapped Projects:**
- "Smith project" → **Project Code 3345**
```

**Visual Highlight Categories:**

- ✅ **Successful parsing**
- ⚠️ **Assumptions/defaults used**
- 🔀 **Conflict resolutions**
- ❓ **Unclear mappings**
- 📝 **Project/code assignments**

## Settings Page - Detailed Specifications

### 1. Output Format Configuration

- **Element Delimiter**: User-defined separator between fields (default: comma `,`)
- **Row End Delimiter**: User-defined end-of-entry marker (default: semicolon `;`)
- **Custom Delimiters**: Tab, pipe, space, or custom string

### 2. Column Definition System (Completely User-Defined)

Each column configured with:

- **Name**: Field identifier (e.g., "Start Time", "Project Code")
- **Description**: What this field represents for AI context
- **Format**: How data should be formatted (e.g., `YYYYMMDDTHHMM`, `HH:MM`, `text`)
- **Possible Values List**: Value + Description pairs
  - Example: `3345 → "Smith Corp Project"`, `ADMIN → "Administrative tasks"`

### 3. Global Generation Context

- **General Description Field**: Free-text instructions for overall generation
  - "Breaks are unpaid and should not be tracked"
  - "Default work day is 9-17 unless specified"
  - "Vacation days should be marked as project code VAC"

### 4. Slash Commands System

- **User-Defined Shortcuts**: `/break` → `"Break from 12:00 to 12:30"`
- **Text Preprocessing**: Commands replaced before AI processing
- **Command Management**: Add/edit/delete custom shortcuts

### 5. Preview Feature

- Live preview showing sample output with current settings
- No validation (user freedom), but preview for verification

### 6. Export/Import Settings

- Save/load complete settings configurations
- Share settings between users/devices

## Data Processing Flow

1. **Input**: User types with slash commands: `"Morning meetings /break then coding"`
2. **Preprocessing**: Expand commands: `"Morning meetings Break from 12:00 to 12:30 then coding"`
3. **AI Processing**: Claude analyzes with user's column definitions and global context
4. **Output**: Formatted string + markdown explanation with highlights

## AI Conflict Resolution Strategy

- **Make reasonable assumptions** and explain them clearly
- **Highlight decisions** in markdown explanation
- **Handle edge cases**:
  - Time ambiguities ("most of morning" → default 9-12)
  - Overlapping activities (split time blocks, prioritize meetings)
  - Missing project info (map to "UNKNOWN" or user-defined default)
  - Unclear durations ("brief call" → 30min default)

## Database Schema (SQLite)

- `user_settings`: Output format, delimiters, columns, global context
- `slash_commands`: Custom shortcuts and expansions
- `column_definitions`: User-defined column specifications
- `processing_history`: (Future feature - not in Phase 1)

## Project Structure

```
timescript/
├── app/
│   ├── page.tsx              # Main processing interface
│   ├── settings/page.tsx     # Settings configuration
│   └── api/generate/route.ts # AI processing endpoint
├── components/
│   ├── ui/                   # shadcn components
│   ├── input-area.tsx        # Main text input with slash commands
│   ├── result-card.tsx       # Output display (success/error/loading)
│   └── settings-form.tsx     # Configuration forms
├── lib/
│   ├── db.ts                 # SQLite operations
│   ├── ai.ts                 # Mastra.ai + Vercel AI setup
│   └── types.ts              # TypeScript definitions
└── data/
    └── settings.db           # Local SQLite database
```

## Development Phases

- **Phase 1**: Text input, core AI processing, settings system, local storage
- **Phase 2**: Voice input with speech-to-text
- **Phase 3**: User history and analytics
- **Phase 4**: Supabase migration, multi-user support
- **Phase 5**: Advanced features (templates, integrations)

## Key Design Principles

- **User flexibility** over built-in assumptions
- **Single-purpose interface** (no chatbot interactions)
- **Transparent AI reasoning** with detailed explanations
- **Privacy-first** with local storage initially
- **Export-focused** (no direct 3rd party integrations in scope)

## Sample Use Cases

### Example Input

```
"Today I worked on the Smith project from 9-11am, then had a client call with ABC Corp until noon, followed by internal meetings and code review until 5pm"
```

### Example Output Format (User-Defined)

```
20250606T0900,20250606T1100,3345,Smith project work;
20250606T1100,20250606T1200,CALL,ABC Corp client call;
20250606T1300,20250606T1700,ADMIN,Internal meetings and code review;
```

### Example AI Explanation

```markdown
## Processing Summary

✅ **Identified 3 distinct time blocks** from your work day description

⚠️ **Assumptions Made:**

- Lunch break **12:00-13:00** (not tracked, based on global settings)
- "Smith project" → **Project Code 3345** (from your project mappings)

📝 **Time Entries Generated:**

- **Morning work**: 9:00-11:00 (2 hours) → Smith project
- **Client call**: 11:00-12:00 (1 hour) → ABC Corp
- **Afternoon work**: 13:00-17:00 (4 hours) → Internal tasks
```

---

_This specification serves as the complete reference for all timescript development and future conversations._
