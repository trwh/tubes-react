# Agent Guide for tubes-react

This document provides coding guidelines and conventions for AI agents working on the tubes-react codebase.

## Project Overview

A React application that displays live London tube arrival times using Transport for London's public API. Built with Create React App (React 16.8.1) and uses class-based components with lifecycle methods.

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
npm start           # Start development server (localhost:3000)
npm run build       # Build for production (outputs to /build)
npm test            # Run tests in interactive watch mode
```

### Running a Single Test
```bash
# Run a specific test file
npm test -- <filename>

# Run tests matching a pattern
npm test -- --testNamePattern="<pattern>"

# Run tests without watch mode
CI=true npm test
```

Note: This project currently has no test files. When adding tests, follow Jest and React Testing Library conventions.

## Code Style Guidelines

### Import Conventions

**Order:**
1. React imports
2. Third-party libraries
3. Local modules (relative imports)
4. JSON data files
5. CSS files (currently commented out)

**Examples:**
```javascript
import React, { Component } from 'react';
import * as tfl from './tfl.js';
const masterStations = require("./stations.json");
// import './App.css';
```

**Prefer:**
- Named exports for utility functions: `export function functionName()`
- Default export for main component: `export default App`
- Use `import * as namespace` for modules with multiple exports

### Formatting

**Indentation:** 2 spaces (no tabs)

**Semicolons:** Required at end of statements

**Quotes:** Double quotes for strings, JSX attributes

**Spacing:**
- Space after keywords: `if (condition)`, `function (params)`
- No space before function parentheses in definitions: `function simplifyLine(line)`
- Space around operators: `a + b`, `x === y`

**Line Length:** Reasonable limits (~80-100 chars where practical)

### Component Structure

**Use class-based components** (legacy React 16.8 style):
```javascript
class ComponentName extends Component {
  constructor(props) {
    super(props);
    this.state = { /* ... */ };
    this.methodName = this.methodName.bind(this);
  }
  
  componentDidMount() { /* ... */ }
  
  methodName() { /* ... */ }
  
  render() { /* ... */ }
}
```

**Method binding:** Bind event handlers in constructor:
```javascript
this.filterChange = this.filterChange.bind(this);
```

**Component organization:**
1. Constructor with state initialization and bindings
2. Lifecycle methods (componentDidMount, etc.)
3. Custom methods
4. render() method last

### Naming Conventions

**Variables/Functions:** camelCase
- `masterStations`, `filteredStations`, `userStations`
- `filterChange()`, `addUserStation()`, `updateLineArrivalsOnStations()`

**Components:** PascalCase
- `App`, `UserStationList`, `ArrivalsBoard`, `FilteredStationList`

**Constants:** camelCase (not UPPER_CASE in this codebase)
- `const masterStations = require("./stations.json")`

**Boolean prefixes:** Use descriptive names without strict is/has prefix requirement
- State properties: `filterValue` (not `isFilterValue`)

**Private functions:** No underscore prefix; use module scope for privacy

### Type System

**TypeScript:** Not used. This is plain JavaScript (ES6+).

**PropTypes:** Not currently implemented, but recommended for new components:
```javascript
import PropTypes from 'prop-types';

ComponentName.propTypes = {
  stations: PropTypes.array.isRequired,
  onClick: PropTypes.func
};
```

**Type checking:** Rely on ESLint (extends react-app) for basic validation

### Error Handling

**Promises:** Use `.catch()` for error handling
```javascript
tfl.updateLineArrivalsOnStations(this.state.userStations)
  .then(updatedStations => {
    this.setState({ userStations: updatedStations });
  })
  .catch(err => console.log(err));
```

**API calls:** Check response.ok before processing:
```javascript
fetch(url)
  .then(response => {
    if(response.ok) {
      return response.json();
    } else {
      throw new Error("Error message with context");
    }
  })
```

**Console logging:** Use `console.log()` for errors (no structured logging library)

**User-facing errors:** Currently logged to console; consider adding UI feedback for production

### State Management

**Local state only:** No Redux/Context. Use component state and props.

**setState callbacks:** Use when actions depend on state update completion:
```javascript
this.setState({ userStations: newUserStations }, () => {
  this.clearFilterValue();
  this.updateUserStationLineArrivals();
});
```

**Immutability:** Create new arrays/objects rather than mutating:
```javascript
let newUserStations = this.state.userStations.concat(station);
```

### Async Patterns

**Use Promises** (not async/await in current codebase):
```javascript
export function functionName() {
  return new Promise(
    function(resolve, reject) {
      // async work
      resolve(data);
    }
  )
}
```

**Promise.all** for parallel operations:
```javascript
Promise.all(stationFetchPromises)
  .then(jsonResponses => { /* ... */ })
  .catch(err => reject(err));
```

## File Organization

```
src/
  App.js           # Main component with state management
  index.js         # React entry point
  tfl.js           # TFL API utilities (exported functions)
  stations.json    # Preloaded station data (270 stations)
public/
  index.html       # HTML template
  manifest.json    # PWA manifest
```

## Testing Guidelines

When adding tests:
- Use Jest (included with react-scripts)
- Place test files adjacent to source: `Component.test.js`
- Test component rendering, user interactions, and API responses
- Mock fetch calls for TFL API tests

## Common Patterns

**Filtering arrays:**
```javascript
filteredStations = filteredStations.filter((station) => {
  return station.name.toLowerCase().search(
    e.target.value.toLowerCase().trim()) !== -1;
});
```

**Mapping for React rendering:**
```javascript
{this.props.stations.map(station => (
  <div key={station.id}>
    {station.name}
  </div>
))}
```

**LocalStorage persistence:**
```javascript
localStorage.setItem("key", JSON.stringify(data));
const data = JSON.parse(localStorage.getItem("key"));
```

## Notes for Agents

- UI is currently unstyled (CSS imports commented out) - work in progress
- Station list regeneration instructions in README.md if TFL adds stations
- Refresh interval: 30 seconds (hardcoded in App.js:43)
- ESLint config extends "react-app" (package.json:16-18)
- Target browsers defined in browserslist (package.json:19-24)
