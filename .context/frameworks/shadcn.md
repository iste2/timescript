# shadcn/ui Documentation

> Documentation for https://ui.shadcn.com - A collection of copy-and-paste components built with React, TypeScript, and Tailwind CSS

## Site Purpose

shadcn/ui is NOT a traditional component library. It's a code distribution platform that provides the actual source code of beautifully designed, accessible React components. Instead of installing a package and importing pre-built components, developers copy the component code directly into their projects for full customization control.

## Core Principles

- **Open Code**: Component source code is fully accessible and modifiable
- **Composition**: Components use a common, composable interface for predictability
- **Distribution**: Flat-file schema and CLI tool for easy component distribution
- **Beautiful Defaults**: Carefully designed default styles for immediate use
- **AI-Ready**: Open code structure designed for LLM understanding and improvement

## Technology Stack

- **Frontend**: React (18/19), TypeScript/JavaScript
- **Styling**: Tailwind CSS (v3/v4), CSS Variables for theming
- **Build Tools**: CLI tool for component installation and management
- **Frameworks**: Primarily Next.js, with support for other React frameworks

## Content Structure

### Main Documentation Sections

1. **Getting Started**

   - Introduction to shadcn/ui philosophy
   - Installation guides for different frameworks
   - Configuration setup (components.json)
   - Theming and dark mode setup

2. **Components** (50+ available)

   - **Form Components**: Button, Input, Textarea, Checkbox, Radio Group, Select, Switch, Toggle, Label
   - **Layout Components**: Card, Sheet, Dialog, Drawer, Separator, Aspect Ratio, Resizable
   - **Navigation**: Breadcrumb, Menubar, Navigation Menu, Pagination, Sidebar
   - **Display Components**: Avatar, Badge, Alert, Table, Tooltip, Skeleton, Progress
   - **Interactive**: Accordion, Collapsible, Combobox, Command, Context Menu, Dropdown Menu, Hover Card, Popover
   - **Data**: Data Table, Calendar, Chart, Date Picker
   - **Feedback**: Toast, Sonner (toast notifications), Alert Dialog
   - **Advanced**: Carousel, Scroll Area, Slider, Tabs

3. **Blocks**

   - Pre-built component compositions (dashboards, authentication forms, etc.)
   - More complex than individual components
   - Copy-paste ready application sections

4. **CLI Documentation**

   - `shadcn init` - Initialize project configuration
   - `shadcn add` - Add components to project
   - `shadcn build` - Build components for registry

5. **Integration Guides**
   - Framework-specific setup (Next.js, Vite, etc.)
   - v0 integration for visual component editing
   - Monorepo configuration

## Key Concepts

### Component Installation Pattern

```bash
npx shadcn@latest add button
```

This copies the Button component source code into your project at `/components/ui/button.tsx`

### Import Pattern

```typescript
import { Button } from "@/components/ui/button";
```

### Configuration File (components.json)

Central configuration defining:

- Style preferences
- Tailwind config paths
- CSS variable usage
- TypeScript/JavaScript preference
- Import aliases

### Theming System

- CSS Variables for colors
- Support for light/dark modes
- Customizable color schemes (zinc, slate, stone, gray, neutral)
- Tailwind v4 OKLCH color support

## Common Use Cases

1. **Adding Individual Components**

   - Use CLI to add specific components
   - Customize component code directly
   - Maintain design system consistency

2. **Building Complex UIs**

   - Combine multiple components
   - Use Blocks for common patterns
   - Leverage composition principles

3. **Custom Design Systems**

   - Modify component source code
   - Adjust theming variables
   - Create custom variants

4. **AI-Assisted Development**
   - LLMs can read and understand component structure
   - Generate new components following existing patterns
   - Suggest improvements and customizations

## File Structure

### Typical Project Structure

```
src/
├── components/
│   └── ui/           # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       └── ...
├── lib/
│   └── utils.ts      # Utility functions (cn helper)
└── styles/
    └── globals.css   # Tailwind and CSS variables
```

### Component File Structure

Each component typically includes:

- Main component with forwardRef (React 18) or ComponentProps (React 19)
- Variants using class-variance-authority (cva)
- TypeScript interfaces
- Export statement

## Important URLs

- **Main Documentation**: https://ui.shadcn.com/docs
- **Components Library**: https://ui.shadcn.com/docs/components
- **Blocks Gallery**: https://ui.shadcn.com/blocks
- **Installation Guide**: https://ui.shadcn.com/docs/installation
- **CLI Documentation**: https://ui.shadcn.com/docs/cli
- **Theming Guide**: https://ui.shadcn.com/docs/theming
- **v0 Integration**: https://ui.shadcn.com/docs/v0

## Framework Support

### Primary Support

- **Next.js**: Full support with App Router and Pages Router
- **Vite**: React + TypeScript setups
- **Remix**: Server-side rendering support

### Installation Commands by Framework

- Next.js: `npx shadcn@latest init`
- Vite: `npx shadcn@latest init`
- Custom: Manual configuration via components.json

## Best Practices for LLMs

1. **Understanding Component Structure**: Each component follows a consistent pattern with variants, props, and forwardRef/ComponentProps
2. **Customization Approach**: Always modify the source code directly rather than wrapping components
3. **Dependency Management**: Components may depend on other shadcn/ui components (registryDependencies) or external packages
4. **Styling Convention**: Use Tailwind classes and CSS variables for theming
5. **Accessibility**: All components include proper ARIA attributes and keyboard navigation
6. **TypeScript Usage**: Strong typing with proper interfaces and component props

## Recent Updates

- **Tailwind v4 Support**: New projects can use Tailwind v4 with OKLCH colors
- **React 19 Support**: Updated component patterns for React 19
- **Enhanced Blocks**: Expanded collection of pre-built component compositions
- **CLI Improvements**: Better dependency management and installation flow

## Community and Contribution

- **Open Source**: MIT licensed, community contributions welcome
- **Block Contributions**: Developers can contribute blocks to the library
- **GitHub**: Source code and issue tracking available
- **Trusted by**: OpenAI, Sonos, Adobe, and other major companies

## Notes for LLM Usage

When working with shadcn/ui:

1. Always check component dependencies before suggesting usage
2. Understand that components are copied into the project, not imported from a package
3. Consider the theming system when customizing colors or styling
4. Remember that the code is fully editable and customizable
5. Use the CLI commands for proper installation and setup
6. Be aware of the difference between components (individual) and blocks (compositions)
