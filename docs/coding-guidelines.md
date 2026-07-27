# Coding Guidelines

This document outlines the coding standards and best practices for this project. All code contributions should follow these guidelines to ensure consistency, maintainability, and quality across the codebase.

## Table of Contents

- [General Principles](#general-principles)
- [Backend (Node.js/Express)](#backend-nodejs-express)
- [Frontend (React)](#frontend-react)
- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [Error Handling](#error-handling)
- [Comments and Documentation](#comments-and-documentation)
- [Code Style](#code-style)

## General Principles

- **Consistency**: Follow established patterns in the codebase
- **Readability**: Write code that is easy to understand and maintain
- **DRY (Don't Repeat Yourself)**: Extract repeated logic into reusable functions
- **Single Responsibility**: Each function or component should have one clear purpose
- **Testing**: Write tests alongside code (see [Testing Guidelines](./testing-guidelines.md))

## Backend (Node.js/Express)

### Module System

- Use **CommonJS** (`require`/`module.exports`) for backend code
- Place the main app initialization in `src/app.js` and server startup in `src/index.js`
- Export the `app` object from `app.js` to enable testing without starting the server

```javascript
// app.js
const express = require('express');
const app = express();

// Middleware and routes setup
app.use(express.json());
app.get('/api/items', (req, res) => {
  // Handler code
});

module.exports = { app };

// index.js
const { app } = require('./app');
const PORT = process.env.PORT || 3030;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Middleware Setup

- Initialize middleware early in the application
- Use standard middleware for common tasks:
  - `express.json()` for JSON body parsing
  - `cors()` for cross-origin requests
  - `morgan()` for request logging

```javascript
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
```

### Error Handling

- Use try-catch blocks for async operations and database queries
- Return appropriate HTTP status codes (e.g., 200 for success, 404 for not found, 500 for errors)
- Log errors to console for debugging
- Respond with clear error messages

```javascript
app.get('/api/items', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM items').all();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});
```

### Database Operations

- Use prepared statements to prevent SQL injection
- Include proper error handling and logging
- Close database connections cleanly in test teardown

```javascript
const insertStmt = db.prepare('INSERT INTO items (name) VALUES (?)');
insertStmt.run(itemName);

const items = db.prepare('SELECT * FROM items ORDER BY created_at DESC').all();
```

## Frontend (React)

### Module System

- Use **ES6 modules** (`import`/`export`) for frontend code
- Import React and necessary hooks at the top of component files

```javascript
import React, { useState, useEffect } from 'react';
import './App.css';
```

### Component Structure

- Organize components with state management using React hooks
- Use `useState` for local component state
- Use `useEffect` for side effects (data fetching, subscriptions)
- Keep components focused on a single responsibility

```javascript
function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    // JSX content
  );
}

export default App;
```

### State Management

- Maintain separate state for data, loading status, and error states
- Use descriptive state variable names that indicate their purpose
- Always include a `finally` block in async operations to clean up loading state

```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

### Event Handling

- Use descriptive handler function names (e.g., `handleSubmit`, `handleClick`)
- Validate user input before processing (e.g., check for empty strings)
- Prevent default actions where appropriate

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!newItem.trim()) return;
  
  // Handle submission
};
```

## File Organization

### Backend Structure

```
packages/backend/
├── src/
│   ├── app.js          # Express app setup and routes
│   └── index.js        # Server startup
├── __tests__/
│   └── app.test.js     # Unit and integration tests for app.js
├── integration/        # Integration test directory (future)
├── jest.config.js      # Jest configuration
└── package.json
```

### Frontend Structure

```
packages/frontend/
├── src/
│   ├── App.js          # Main App component
│   ├── App.css         # App styling
│   ├── index.js        # React DOM render entry point
│   ├── index.css       # Global styles
│   ├── setupTests.js   # Test setup configuration
│   └── __tests__/
│       └── App.test.js # Component tests
├── public/
│   └── index.html      # HTML template
└── package.json
```

## Naming Conventions

### Variables and Functions

- Use **camelCase** for variables and function names
- Use descriptive names that clearly indicate purpose
- Prefix boolean variables with `is`, `has`, or `can` (e.g., `isLoading`, `hasError`)

```javascript
// Good
const userData = [];
const isLoading = true;
const fetchUserData = async () => {};

// Avoid
const data = [];
const loading = true;
const getData = async () => {};
```

### Constants

- Use **UPPER_SNAKE_CASE** for constants
- Define constants at module level or in configuration files

```javascript
const API_ENDPOINT = '/api/items';
const DEFAULT_PORT = 3030;
```

### Components (React)

- Use **PascalCase** for component names
- Match component file names to component names

```javascript
// File: App.js
function App() {
  // Component code
}
export default App;
```

## Error Handling

### Principles

- Always use try-catch for operations that might fail (async calls, database queries)
- Provide meaningful error messages to users and console
- Log errors with sufficient context for debugging

### Backend Pattern

```javascript
try {
  const result = db.prepare('SELECT * FROM items').all();
  res.json(result);
} catch (error) {
  console.error('Error message with context:', error);
  res.status(500).json({ error: 'User-friendly error message' });
}
```

### Frontend Pattern

```javascript
try {
  const response = await fetch('/api/items');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  setData(data);
  setError(null);
} catch (error) {
  console.error('Error details:', error);
  setError('User-friendly error message: ' + error.message);
} finally {
  setLoading(false);
}
```

## Comments and Documentation

### When to Comment

- Explain complex logic or algorithms
- Document non-obvious design decisions
- Add comments for important setup or configuration
- Avoid obvious comments that restate the code

### Comment Style

- Use `//` for single-line comments
- Use `/* */` for multi-line comments
- Place comments on the line above or inline with the code

```javascript
// Good: Explains why, not what
// Initialize in-memory database for demo purposes
const db = new Database(':memory:');

// Avoid: Obvious comment
// Set loading to false
setLoading(false);
```

### JSDoc (Optional but Recommended)

- Use JSDoc for complex functions or public APIs
- Include parameter types and return types

```javascript
/**
 * Fetches all items from the database
 * @returns {Array} Array of item objects with id, name, and created_at
 * @throws {Error} If database query fails
 */
const fetchAllItems = () => {
  // Implementation
};
```

## Code Style

### Indentation and Formatting

- Use **2 spaces** for indentation (configured in project defaults)
- Use semicolons at the end of statements
- Keep lines reasonably short (max ~100 characters when practical)

### Imports/Requires

- Group imports by type (external, internal, styles)
- Arrange in alphabetical order within groups

```javascript
// Backend (CommonJS)
const cors = require('cors');
const express = require('express');
const Database = require('better-sqlite3');

// Frontend (ES6 modules)
import React, { useState, useEffect } from 'react';
import './App.css';
```

### Operators and Spacing

- Use consistent spacing around operators
- Use meaningful variable names instead of single letters (except in loops)

```javascript
// Good
const result = value * 2 + offset;
if (count > 0 && isValid) {
  // Logic
}

// Avoid
const result=value*2+offset;
if(count>0&&isValid){
  // Logic
}
```

### String Literals

- Use single quotes (`'`) or backticks (`` ` ``) for strings
- Use template literals for string interpolation

```javascript
const message = 'Success';
const url = `/api/items/${itemId}`;
const error = `Error: ${errorCode} - ${errorMessage}`;
```
