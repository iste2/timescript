# Settings Feature Specification

## Overview

The Settings page allows users to configure their personalized time entry format, defining the structure, data types, and output formatting that matches their specific time tracking system requirements.

## User Story

As a TimeScript user, I want to configure my time entry format so that the output matches exactly what my time tracking system expects, including custom columns, data types, and delimiters.

## Core Features

### 1. Time Entry Format Configuration

Users can define the complete structure of their time entries by configuring:

- **Column definitions** with name, type, and description
- **Data types** for each column (free text, enum, number, date/time)
- **Row delimiters** (character that separates columns within a row)
- **Entry delimiters** (character that separates one complete entry from another)
- **General behavior notes** (free text field for documenting special rules and conventions)

### 2. Column Configuration

#### Column Properties

Each column has the following configurable properties:

- **Name**: Display name for the column (e.g., "Start Time", "Project Number")
- **Type**: Data type of the column
  - `free` - Free text input
  - `enum` - Predefined list of values
  - `number` - Numeric input
  - `datetime` - Date/time in specific format
- **Description**: User-friendly explanation of what this column represents
- **Required**: Whether this column is mandatory
- **Format**: For datetime types, the specific format (e.g., "yyyymmddhhMM")

#### Example Column Definition

```
Column: "Start Time"
Type: datetime
Description: "Start time in yyyymmddhhMM format"
Required: true
Format: "yyyymmddhhMM"
```

### 3. Enum Value Management

For columns with type `enum`, users can define:

- **Key-Value Pairs**: The actual value and its human-readable description
- **Display Format**: How the options appear in the interface

#### Example Enum Configuration

```
Column: "Project Number"
Type: enum
Description: "Number of the project that has been worked on"
Values:
  - 3445: "Customer A"
  - 3446: "Customer B"
  - 3447: "General work"
  - 3448: "Internal training"
```

### 4. Output Format Configuration

#### Row Delimiter Options

Users can choose the character that separates columns within each row:

- `,` (comma) - Default CSV format
- `;` (semicolon) - European CSV format
- `|` (pipe) - Common in data processing
- `\t` (tab) - Tab-separated values
- ` ` (space) - Space-separated values
- Custom character - Any single character

#### Entry Delimiter Options

Users can choose the character/string that separates complete entries from each other:

- `\n` (newline) - Standard line break for new entries
- `;` (semicolon) - Semicolon separator between entries
- `|` (pipe) - Pipe separator between entries
- ` ` (space) - Space separator between entries
- Custom string - Any custom separator

#### Example Output Format

With comma row delimiter and semicolon entry delimiter:

```
202506061215,202506061300,3445,presentation;202506061400,202506061500,3446,meeting;
```

With comma row delimiter and newline entry delimiter:

```
202506061215,202506061300,3445,presentation
202506061400,202506061500,3446,meeting
```

### 5. General Behavior Configuration

#### Special Rules and Conventions

Users can document special rules and conventions for their time tracking system in a free text field:

- **Off Days**: How vacation days, sick days, and holidays are recorded
- **Breaks**: How lunch breaks and other breaks are handled
- **Overtime**: Rules for overtime tracking and recording
- **Project Codes**: Special project codes or conventions
- **Time Rounding**: How time should be rounded (e.g., to nearest 15 minutes)
- **Default Values**: Standard values to use for certain scenarios

#### Example General Behavior Notes

```
Special Rules:
- Vacation days: Use project code 9999 with description "Vacation"
- Sick days: Use project code 9998 with description "Sick leave"
- Lunch breaks: Not tracked separately, assume 30min deducted from 8+ hour days
- Time rounding: Round to nearest 15 minutes (12:07 becomes 12:00, 12:08 becomes 12:15)
- Overtime: Anything over 8 hours in a day should use project code 8888
- Default project: Use 3447 for general administrative work when no specific project applies
```

## User Interface Design

### Settings Page Structure

#### 1. Format Overview Section

- Display current format configuration as a preview
- Show example output based on current settings
- Quick actions: Import/Export configuration, Reset to defaults

#### 2. Column Management Section

- **Add Column Button**: Create new column definitions
- **Column List**: Draggable list of existing columns for reordering
- **Column Editor**: Form for editing individual column properties

#### 3. Delimiter Configuration Section

- Radio buttons or dropdown for common row delimiters (column separators)
- Custom row delimiter input field
- Radio buttons or dropdown for entry delimiters (entry separators)
- Custom entry delimiter input field
- Preview of output format with current delimiters

#### 4. Preview Section

- Live preview of output format with current row and entry delimiters
- Sample data generation for testing the configuration

#### 5. General Behavior Section

- Large text area for documenting special rules and conventions
- Helpful prompts and examples for common scenarios
- Save/clear functionality for behavior notes

### Column Editor Interface

#### Basic Properties Form

```
[Column Name Input Field]
[Type Dropdown: free/enum/number/datetime]
[Description Text Area]
[Required Checkbox]
```

#### Type-Specific Configuration

**For DateTime Type:**

```
[Format Input Field] (e.g., "yyyymmddhhMM")
[Format Helper/Examples]
```

**For Enum Type:**

```
[Add Value Button]
[Value List:]
  Key: [Input] Description: [Input] [Delete Button]
  Key: [Input] Description: [Input] [Delete Button]
  ...
```

## Technical Requirements

### 1. Data Storage

- Store user configuration in the backend database associated with user account
- Automatic synchronization across devices for logged-in users
- Export/import capability for configuration sharing and backup

### Database Schema

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  row_delimiter VARCHAR(10) NOT NULL DEFAULT ',',
  entry_delimiter VARCHAR(10) NOT NULL DEFAULT '\n',
  general_behavior TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE user_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  column_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('free', 'enum', 'number', 'datetime')),
  description TEXT,
  required BOOLEAN DEFAULT false,
  format VARCHAR(100), -- For datetime types
  position INTEGER NOT NULL, -- For column ordering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, column_id),
  UNIQUE(user_id, position)
);

CREATE TABLE user_enum_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES user_columns(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(column_id, key)
);

-- Indexes for performance
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_columns_user_id ON user_columns(user_id);
CREATE INDEX idx_user_columns_position ON user_columns(user_id, position);
CREATE INDEX idx_user_enum_values_column_id ON user_enum_values(column_id);
```

```json
{
  "rowDelimiter": ",",
  "entryDelimiter": "\n",
  "generalBehavior": "Special Rules:\n- Vacation days: Use project code 9999 with description \"Vacation\"\n- Sick days: Use project code 9998 with description \"Sick leave\"\n- Lunch breaks: Not tracked separately, assume 30min deducted from 8+ hour days\n- Time rounding: Round to nearest 15 minutes\n- Default project: Use 3447 for general administrative work",
  "columns": [
    {
      "id": "start_time",
      "name": "Start Time",
      "type": "datetime",
      "description": "Start time in yyyymmddhhMM format",
      "required": true,
      "format": "yyyymmddhhMM"
    },
    {
      "id": "end_time",
      "name": "End Time",
      "type": "datetime",
      "description": "End time in yyyymmddhhMM format",
      "required": true,
      "format": "yyyymmddhhMM"
    },
    {
      "id": "project_number",
      "name": "Project Number",
      "type": "enum",
      "description": "Number of the project that has been worked on",
      "required": true,
      "values": {
        "3445": "Customer A",
        "3446": "Customer B",
        "3447": "General work"
      }
    },
    {
      "id": "description",
      "name": "Description",
      "type": "free",
      "description": "Free text description of work performed",
      "required": false
    }
  ]
}
```

### 3. Backend API Integration

- **GET /api/settings** - Retrieve user's current configuration
- **PUT /api/settings** - Save/update user's configuration
- **POST /api/settings/import** - Import configuration from file
- **GET /api/settings/export** - Export configuration as downloadable file
- **DELETE /api/settings** - Reset configuration to default values

#### Configuration Validation

- Server-side validation of configuration schema
- Validation of column definitions and data types
- Sanitization of delimiter characters and general behavior notes
- Error handling for invalid configurations

#### Authentication & Authorization

- Require user authentication for all settings operations
- Associate settings with authenticated user account
- Ensure users can only access their own configuration data

### Configuration API Response Schema

## Integration with TimeScript Core

### Future Integration Points

When the settings page is later integrated with the main TimeScript workflow:

### 1. AI Processing Integration

- Use column definitions to guide AI interpretation
- Map natural language input to defined column types

### 2. Output Generation

- Generate formatted output according to user configuration
- Apply proper data type formatting
- Use configured row delimiter for column separation
- Use configured entry delimiter for separating complete entries

## Example Usage

### Settings Configuration Example

1. User navigates to Settings page
2. Defines columns: Start Time, End Time, Project Number, Description
3. Sets up project number enum with customer mappings
4. Chooses comma row delimiter and newline entry delimiter
5. Documents special rules in the general behavior section (vacation codes, break handling, etc.)
6. Views preview of the configured output format

### Expected Output Format

With comma row delimiter and newline entry delimiter, the system would be configured to produce:

```
202506061215,202506061300,3445,presentation
```

For multiple entries:

```
202506061215,202506061300,3445,presentation
202506061400,202506061500,3446,meeting
202506061530,202506061630,3447,documentation
```

## Future Enhancements

### Advanced Features

- **Column Dependencies**: Define relationships between columns
- **Conditional Validation**: Rules that depend on other column values
- **Templates**: Save common configurations as reusable templates
- **Import from Systems**: Auto-detect format from existing time tracking exports

### Integration Features

- **API Integration**: Direct connection to popular time tracking systems
- **Batch Processing**: Apply configuration to multiple entries at once
- **Format Conversion**: Convert between different time tracking formats

## Acceptance Criteria

### Must Have

- [ ] Backend API endpoints for settings CRUD operations
- [ ] Database schema for storing user configurations
- [ ] User authentication integration for settings access
- [ ] Server-side validation of configuration data
- [ ] Users can create and edit column definitions
- [ ] Support for free, enum, number, and datetime column types
- [ ] Configurable row delimiters (column separators)
- [ ] Configurable entry delimiters (entry separators)
- [ ] General behavior notes for documenting special rules
- [ ] Enum value management with key-value pairs
- [ ] Preview of output format
- [ ] Save/load configuration settings from backend

### Should Have

- [ ] Cross-device synchronization of settings
- [ ] Configuration backup and restore functionality
- [ ] Drag-and-drop column reordering with backend persistence
- [ ] Import/export configuration via API endpoints
- [ ] Sample data generation
- [ ] Configuration templates stored in backend
- [ ] Offline mode with local caching and sync when online

### Could Have

- [ ] Multi-tenant configuration management
- [ ] Configuration versioning and history
- [ ] Column dependencies with backend validation
- [ ] Format conversion utilities as backend services
- [ ] Integration with external time tracking systems via API
- [ ] Team/organization-wide configuration templates
- [ ] Advanced analytics on configuration usage patterns
