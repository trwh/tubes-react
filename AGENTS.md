# Agent Guide for tubes-react

This document provides coding guidelines and conventions for AI agents working on the tubes-react codebase.

## Project Overview

A React 18 application that displays live London tube arrival times using Transport for London's public API. Built with Vite and uses functional components with hooks.

**Key Architecture:**

- Frontend fetches live arrival data from TFL API every 30 seconds
- Station list is preloaded from `/src/stations.json` (270 stations)
- User's selected stations are persisted in localStorage
- No backend server - direct API calls to TFL endpoints
- No authentication required for TFL API

## Build, Lint, and Test Commands

### Standard Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production (outputs to /dist)
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Running a Single Test

```bash
# No test framework is currently installed. When adding tests, use Vitest:
# npx vitest run <filename>
# npx vitest run --testNamePattern="<pattern>"
```

Note: This project currently has no test files.

## Code Style Guidelines

### Formatting (enforced by Prettier)

- **Indentation:** 2 spaces (no tabs)
- **Semicolons:** Required
- **Quotes:** Double quotes for strings and JSX attributes
- **Trailing commas:** All (ES5+ positions)
- **Line length:** Prettier default (80 chars, with flexibility)

Run `npm run format` to auto-format. Run `npm run lint` to check for issues.

### Import Conventions

**Order:**

1. React hooks and libraries
2. Third-party libraries
3. Local modules (relative imports)
4. JSON data files
5. CSS files

**Examples:**

```javascript
import { useState, useEffect, useCallback } from "react";
import * as tfl from "./tfl.js";
import masterStations from "./stations.json";
```

**Prefer:**

- Named exports for utility functions: `export function functionName()`
- Default export for the main component: `export default App`
- Use `import * as namespace` for modules with multiple exports
- Use ES module `import` syntax (not `require()`)

### Component Structure

**Use functional components with hooks:**

```javascript
function ComponentName({ prop1, prop2 }) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    // side effect on mount
  }, []);

  function handleEvent() {
    // event handler
  }

  return <div>{/* JSX */}</div>;
}
```

**Component organization:**

1. Hook declarations (`useState`, `useRef`)
2. Effects (`useEffect`)
3. Event handlers and helper functions
4. Return JSX

**Props:** Use destructuring in function parameters.

### Naming Conventions

**Variables/Functions:** camelCase

- `masterStations`, `filteredStations`, `userStations`
- `filterChange()`, `addUserStation()`, `updateLineArrivalsOnStations()`

**Components:** PascalCase

- `App`, `UserStationList`, `ArrivalsBoard`, `FilteredStationList`

**Constants:** UPPER_SNAKE_CASE for module-level constants

- `const REFRESH_INTERVAL_MS = 30000;`

**Files:** Components use `.jsx` extension; plain JS modules use `.js`

### Type System

**TypeScript:** Not used. Plain JavaScript (ES module).

**Editor support:** `jsconfig.json` is configured for IntelliSense.

**PropTypes:** Not currently implemented, but ESLint warns on missing prop
validation. Consider adding PropTypes for new components.

### Error Handling

**Promises:** Use `.catch()` for error handling:

```javascript
tfl
  .updateLineArrivalsOnStations(stations)
  .then((updatedStations) => {
    setUserStations(updatedStations);
  })
  .catch((err) => console.log(err));
```

**API calls:** Check `response.ok` before processing:

```javascript
fetch(url).then((response) => {
  if (response.ok) {
    return response.json();
  } else {
    throw new Error("Error message with context");
  }
});
```

### State Management

**Local state only:** No Redux/Context. Use `useState` hooks and props.

**Immutability:** Create new arrays/objects rather than mutating:

```javascript
const newUserStations = userStations.concat(station);
```

### Async Patterns

**tfl.js uses explicit Promises** (not async/await):

```javascript
export function functionName() {
  return new Promise(function (resolve, reject) {
    // async work
    resolve(data);
  });
}
```

**Promise.all** for parallel operations:

```javascript
Promise.all(stationFetchPromises)
  .then((jsonResponses) => {
    /* ... */
  })
  .catch((err) => reject(err));
```

## File Organization

```
index.html           # HTML entry point (Vite convention)
vite.config.js       # Vite build configuration
eslint.config.js     # ESLint flat config
.prettierrc          # Prettier configuration
jsconfig.json        # Editor IntelliSense config
src/
  App.jsx            # Main component and child components
  index.jsx          # React entry point (createRoot)
  tfl.js             # TFL API utilities (exported functions)
  stations.json      # Preloaded station data (270 stations)
```

## Notes for Agents

- UI is currently unstyled - work in progress
- Station list regeneration instructions in README.md if TFL adds stations
- Refresh interval: 30 seconds (`REFRESH_INTERVAL_MS` in `src/App.jsx:5`)
- ESLint uses flat config format (`eslint.config.js`)
- Vite dev server runs on port 3000 (configured in `vite.config.js`)
- Build output goes to `dist/` (not `build/`)
