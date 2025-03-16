# GENTUBE-AI-MULTI - DEVELOPMENT COMMANDS AND GUIDELINES

## Build & Run Commands
- `npm run dev` - Start development server with Turbo
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prettier-fix` - Run Prettier and fix issues

## Testing
- `npm run test` - Run all tests
- `npx jest tests/ipUtils.test.ts` - Run a specific test file

## Code Style Guidelines
- **Imports**: Use absolute imports with `@/` prefix (e.g., `@/components/ui/Button`)
- **Formatting**: Single quotes, 2-space indentation, trailing commas: none
- **Components**: Use functional components with TypeScript (React.FC)
- **Naming**:
  - PascalCase for components and interfaces
  - camelCase for functions and variables
  - kebab-case for file names
- **Types**: Use explicit TypeScript types for props, state, and functions
- **Error Handling**: Use try/catch blocks with specific error handling
- **CSS**: Use Tailwind CSS and CSS modules (.module.css)
- **State Management**: Use React contexts and hooks for shared state

## Project Structure
- `/components` - UI components (dynamic, static, ui)
- `/services` - API service functions
- `/utils` - Utility functions
- `/pages/api` & `/app/api` - API routes