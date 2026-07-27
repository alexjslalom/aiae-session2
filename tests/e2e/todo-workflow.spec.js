const { test, expect } = require('@playwright/test');
const TodoAppPage = require('./todo-app.page');

test.describe('Todo App E2E Tests', () => {
  let todoAppPage;

  test.beforeEach(async ({ page }) => {
    todoAppPage = new TodoAppPage(page);
    await todoAppPage.goto();
    await todoAppPage.waitForPageLoad();
  });

  test('should create a todo with all fields (name, details, priority, due date)', async () => {
    // Add a new todo with all fields
    await todoAppPage.addNewTodo(
      'Complete Project Setup',
      'Set up all development environments',
      'HIGH',
      '2026-08-30'
    );

    // Verify todo was created
    const exists = await todoAppPage.todoExists('Complete Project Setup');
    expect(exists).toBe(true);

    // Verify details
    const details = await todoAppPage.getTodoDetails('Complete Project Setup');
    expect(details).toContain('Set up all development environments');

    // Verify priority
    const priority = await todoAppPage.getTodoPriority('Complete Project Setup');
    expect(priority).toContain('HIGH');

    // Verify due date
    const dueDate = await todoAppPage.getTodoDueDate('Complete Project Setup');
    expect(dueDate).toBe('Aug 30, 2026');
  });

  test('should toggle todo completion status', async () => {
    // Create a todo
    await todoAppPage.addNewTodo('Test Completion Toggle', 'This should be toggleable');

    // Verify todo exists and is not completed
    let isCompleted = await todoAppPage.isTodoCompleted('Test Completion Toggle');
    expect(isCompleted).toBe(false);

    // Toggle completion
    await todoAppPage.toggleTodoCompletion('Test Completion Toggle');

    // Verify todo is now completed
    isCompleted = await todoAppPage.isTodoCompleted('Test Completion Toggle');
    expect(isCompleted).toBe(true);

    // Toggle back to incomplete
    await todoAppPage.toggleTodoCompletion('Test Completion Toggle');

    // Verify todo is no longer completed
    isCompleted = await todoAppPage.isTodoCompleted('Test Completion Toggle');
    expect(isCompleted).toBe(false);
  });

  test('should edit a todo and update its fields', async () => {
    // Create a todo
    await todoAppPage.addNewTodo(
      'Original Title',
      'Original details',
      'LOW',
      '2026-09-01'
    );

    // Edit the todo
    await todoAppPage.editTodo('Original Title', {
      name: 'Updated Title',
      details: 'Updated details',
      priority: 'HIGH',
      dueDate: '2026-09-15'
    });

    // Verify updates
    const exists = await todoAppPage.todoExists('Updated Title');
    expect(exists).toBe(true);

    const details = await todoAppPage.getTodoDetails('Updated Title');
    expect(details).toContain('Updated details');

    const priority = await todoAppPage.getTodoPriority('Updated Title');
    expect(priority).toContain('HIGH');

    const dueDate = await todoAppPage.getTodoDueDate('Updated Title');
    expect(dueDate).toBe('Sep 15, 2026');

    // Verify old name is gone
    const oldExists = await todoAppPage.todoExists('Original Title');
    expect(oldExists).toBe(false);
  });

  test('should delete a todo', async () => {
    // Create a todo
    await todoAppPage.addNewTodo('Todo to Delete', 'This will be deleted');

    // Verify todo exists
    let exists = await todoAppPage.todoExists('Todo to Delete');
    expect(exists).toBe(true);

    // Delete the todo
    await todoAppPage.deleteTodo('Todo to Delete');

    // Verify todo is deleted
    exists = await todoAppPage.isTodoDeleted('Todo to Delete');
    expect(exists).toBe(true);
  });

  test('should complete full todo workflow: create → edit → complete → delete', async () => {
    const todoName = 'Full Workflow Todo';

    // Step 1: Create a todo
    await todoAppPage.addNewTodo(
      todoName,
      'Testing full workflow',
      'MEDIUM',
      '2026-08-25'
    );

    let exists = await todoAppPage.todoExists(todoName);
    expect(exists).toBe(true);

    // Step 2: Edit the todo
    await todoAppPage.editTodo(todoName, {
      name: 'Updated Workflow Todo',
      priority: 'HIGH'
    });

    exists = await todoAppPage.todoExists('Updated Workflow Todo');
    expect(exists).toBe(true);

    // Step 3: Mark as complete
    await todoAppPage.toggleTodoCompletion('Updated Workflow Todo');
    let isCompleted = await todoAppPage.isTodoCompleted('Updated Workflow Todo');
    expect(isCompleted).toBe(true);

    // Step 4: Delete the todo
    await todoAppPage.deleteTodo('Updated Workflow Todo');

    // Wait a bit for the deletion to complete
    await todoAppPage.page.waitForTimeout(1000);
  });

  test('should handle multiple todos with different priorities', async () => {
    const todos = [
      { name: 'High Priority Task', priority: 'HIGH' },
      { name: 'Medium Priority Task', priority: 'MEDIUM' },
      { name: 'Low Priority Task', priority: 'LOW' }
    ];

    // Create multiple todos
    for (const todo of todos) {
      await todoAppPage.addNewTodo(todo.name, '', todo.priority);
    }

    // Verify all todos exist with correct priorities
    for (const todo of todos) {
      const exists = await todoAppPage.todoExists(todo.name);
      expect(exists).toBe(true);

      const priority = await todoAppPage.getTodoPriority(todo.name);
      expect(priority).toContain(todo.priority);
    }

    // Clean up - delete all created todos
    for (const todo of todos) {
      await todoAppPage.deleteTodo(todo.name);
    }
  });

  test('should handle todos with and without optional fields', async () => {
    // Create todo without optional fields
    await todoAppPage.addNewTodo('Minimal Todo');

    let exists = await todoAppPage.todoExists('Minimal Todo');
    expect(exists).toBe(true);

    // Verify it uses default priority
    const priority = await todoAppPage.getTodoPriority('Minimal Todo');
    expect(priority).toContain('MEDIUM');

    // Create todo with all optional fields
    await todoAppPage.addNewTodo(
      'Complete Todo',
      'Full details here',
      'HIGH',
      '2026-09-20'
    );

    exists = await todoAppPage.todoExists('Complete Todo');
    expect(exists).toBe(true);

    const details = await todoAppPage.getTodoDetails('Complete Todo');
    expect(details).toBeTruthy();

    // Clean up
    await todoAppPage.deleteTodo('Minimal Todo');
    await todoAppPage.deleteTodo('Complete Todo');
  });

  test('should mark todo as complete and persist state after edit', async () => {
    // Create and complete a todo
    await todoAppPage.addNewTodo('Persistent Todo', 'Testing state persistence');
    await todoAppPage.toggleTodoCompletion('Persistent Todo');

    let isCompleted = await todoAppPage.isTodoCompleted('Persistent Todo');
    expect(isCompleted).toBe(true);

    // Edit the todo while it's completed
    await todoAppPage.editTodo('Persistent Todo', {
      details: 'Updated while completed'
    });

    // Verify todo is still marked as completed
    isCompleted = await todoAppPage.isTodoCompleted('Persistent Todo');
    expect(isCompleted).toBe(true);

    // Verify details were updated
    const details = await todoAppPage.getTodoDetails('Persistent Todo');
    expect(details).toContain('Updated while completed');

    // Clean up
    await todoAppPage.deleteTodo('Persistent Todo');
  });

  test('should display multiple todos and allow operations on each', async () => {
    // Create multiple todos
    const todoNames = ['First Task E2E', 'Second Task E2E', 'Third Task E2E'];

    for (const name of todoNames) {
      await todoAppPage.addNewTodo(name);
    }

    // Verify all todos are displayed
    for (const name of todoNames) {
      const exists = await todoAppPage.todoExists(name);
      expect(exists).toBe(true);
    }

    // Complete first todo
    await todoAppPage.toggleTodoCompletion('First Task E2E');
    let isCompleted = await todoAppPage.isTodoCompleted('First Task E2E');
    expect(isCompleted).toBe(true);

    // Edit second todo
    await todoAppPage.editTodo('Second Task E2E', {
      name: 'Updated Second Task E2E',
      priority: 'HIGH'
    });

    const updated = await todoAppPage.todoExists('Updated Second Task E2E');
    expect(updated).toBe(true);

    // Delete third todo
    await todoAppPage.deleteTodo('Third Task E2E');
    
    // Wait for deletion to propagate
    await todoAppPage.page.waitForTimeout(1000);

    // Clean up - delete the other tasks
    await todoAppPage.deleteTodo('First Task E2E');
    await todoAppPage.deleteTodo('Updated Second Task E2E');
  });
});
