# Testing Guidelines

This document outlines the testing standards and practices for this project. All code contributions should follow these guidelines to ensure comprehensive test coverage and maintainability.

## Unit Tests

Unit tests verify the behavior of individual functions and components in isolation.

### Principles

- **Test both positive and negative cases**: Every unit test should validate both expected behavior (positive cases) and error handling (negative cases)
- **Test all code branches**: Ensure all conditional branches and edge cases are covered by tests
- **File naming convention**: Test files should mirror the source file name with a `.test.js` suffix
  - Example: `app.js` → `app.test.js`

### Structure

- Place test files in the same directory as the source code
- Use descriptive test names that clearly indicate what is being tested
- Keep tests focused on a single piece of functionality
- Use appropriate test setup and teardown

## Integration Tests

Integration tests verify that multiple components work together correctly and validate API endpoints against a real or simulated backend.

### Principles

- **Location**: All integration tests for the backend should be placed in `packages/backend/integration`
- **Start a test server**: Tests should start the backend server before running
- **Use a test database**: Initialize and seed a test database for each test run
- **Real endpoint testing**: Make actual HTTP requests to the running backend to validate responses

### Structure

- Test complete workflows that involve multiple services or components
- Seed the test database with realistic data before running tests
- Clean up resources and databases after tests complete
- Test both successful and error scenarios

## End-to-End (E2E) Tests

End-to-end tests simulate real user interactions and validate the entire application flow from the frontend through the backend.

### Tools

- **Playwright**: Use Playwright for browser automation and UI interaction testing
- **SuperTest**: Use SuperTest for making HTTP requests and validating responses in integration scenarios

### Principles

- Test critical user workflows and happy paths
- Validate that the frontend and backend communicate correctly
- Test across different browsers and viewport sizes (when applicable)
- Include tests for error scenarios and edge cases

## Test Execution

- Run unit tests frequently during development
- Run integration tests before merging to ensure backend functionality
- Run E2E tests as a final validation before releasing to production
