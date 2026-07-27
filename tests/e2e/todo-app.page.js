/**
 * Page Object Model for Todo App
 * Encapsulates all interactions with the Todo application UI
 */
class TodoAppPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to the todo app
   */
  async goto() {
    await this.page.goto('http://localhost:3000');
    // Wait for the app header to be visible
    await this.page.waitForSelector('h1:has-text("To Do App")');
  }

  /**
   * Get the header text
   */
  async getHeaderText() {
    return await this.page.textContent('.App-header h1');
  }

  /**
   * Fill in the new todo form
   */
  async fillNewTodoForm(name, details = '', priority = 'MEDIUM', dueDate = '') {
    await this.page.fill('input[placeholder="Enter item name"]', name);
    if (details) {
      await this.page.fill('textarea[placeholder="Add details (optional)"]', details);
    }
    if (priority !== 'MEDIUM') {
      await this.page.selectOption('select', priority);
    }
    if (dueDate) {
      const dateInputs = await this.page.locator('input[type="date"]').all();
      if (dateInputs.length > 0) {
        await dateInputs[0].fill(dueDate);
      }
    }
  }

  /**
   * Submit the new todo form
   */
  async submitNewTodoForm() {
    await this.page.click('button:has-text("Add Item")');
    // Wait for the new item to appear in the list
    await this.page.waitForTimeout(500);
  }

  /**
   * Add a new todo with all fields
   */
  async addNewTodo(name, details = '', priority = 'MEDIUM', dueDate = '') {
    await this.fillNewTodoForm(name, details, priority, dueDate);
    await this.submitNewTodoForm();
  }

  /**
   * Get all todo items
   */
  async getTodoItems() {
    const items = await this.page.locator('.items-list .item').all();
    return items;
  }

  /**
   * Get todo item by name
   */
  async getTodoItemByName(name) {
    // Escape special characters in the name for the selector
    const escapedName = name.replace(/"/g, '\\"');
    return await this.page.locator(`.items-list .item:has-text("${escapedName}")`).first();
  }

  /**
   * Get todo names from the list
   */
  async getTodoNames() {
    // Wait a bit for any pending updates
    await this.page.waitForTimeout(300);
    const items = await this.getTodoItems();
    const names = [];
    for (const item of items) {
      try {
        const nameElement = await item.locator('.item-name').first();
        const text = await nameElement.textContent();
        if (text) {
          names.push(text.trim());
        }
      } catch (e) {
        // Skip items that can't be read
      }
    }
    return names;
  }

  /**
   * Check if todo exists by name
   */
  async todoExists(name) {
    const names = await this.getTodoNames();
    return names.includes(name);
  }

  /**
   * Toggle completion checkbox for a todo
   */
  async toggleTodoCompletion(todoName) {
    const item = await this.getTodoItemByName(todoName);
    const checkbox = await item.locator('.item-checkbox').first();
    await checkbox.click();
    // Wait for the completion state to update
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if todo is marked as completed
   */
  async isTodoCompleted(todoName) {
    // Wait a bit for React to update
    await this.page.waitForTimeout(500);
    // Re-fetch the item to get updated DOM
    const item = await this.getTodoItemByName(todoName);
    const classes = await item.getAttribute('class');
    return classes && classes.includes('completed');
  }

  /**
   * Click edit button for a todo
   */
  async clickEditButton(todoName) {
    const item = await this.getTodoItemByName(todoName);
    const editButton = await item.locator('button:has-text("Edit")').first();
    await editButton.click();
    // Wait for modal to appear
    await this.page.waitForSelector('.modal-overlay');
  }

  /**
   * Update todo in the edit modal
   */
  async updateTodoInModal(updates) {
    const { name, details, priority, dueDate } = updates;

    // Get the modal inputs
    const nameInput = await this.page.locator('.modal input[type="text"]').first();
    const detailsTextarea = await this.page.locator('.modal textarea').first();
    const prioritySelect = await this.page.locator('.modal select').first();
    const dateInputs = await this.page.locator('.modal input[type="date"]').all();

    if (name) {
      await nameInput.fill(name);
    }

    if (details !== undefined) {
      await detailsTextarea.fill(details);
    }

    if (priority) {
      await prioritySelect.selectOption(priority);
    }

    if (dueDate !== undefined && dateInputs.length > 0) {
      await dateInputs[0].fill(dueDate);
    }
  }

  /**
   * Save changes in the edit modal
   */
  async saveModalChanges() {
    await this.page.click('.modal button:has-text("Save Changes")');
    // Wait for modal to close
    await this.page.waitForSelector('.modal-overlay', { state: 'hidden' });
  }

  /**
   * Cancel edit modal
   */
  async cancelModalEdit() {
    await this.page.click('.modal button:has-text("Cancel")');
    // Wait for modal to close
    await this.page.waitForSelector('.modal-overlay', { state: 'hidden' });
  }

  /**
   * Edit a todo
   */
  async editTodo(todoName, updates) {
    await this.clickEditButton(todoName);
    await this.updateTodoInModal(updates);
    await this.saveModalChanges();
    await this.page.waitForTimeout(300);
  }

  /**
   * Get priority of a todo
   */
  async getTodoPriority(todoName) {
    const item = await this.getTodoItemByName(todoName);
    const badge = await item.locator('.priority-badge').first();
    return await badge.textContent();
  }

  /**
   * Get details of a todo
   */
  async getTodoDetails(todoName) {
    const item = await this.getTodoItemByName(todoName);
    const description = await item.locator('.item-description').first();
    const text = await description.textContent();
    return text.trim();
  }

  /**
   * Get due date of a todo
   */
  async getTodoDueDate(todoName) {
    const item = await this.getTodoItemByName(todoName);
    const dueDate = await item.locator('.item-due-date').first();
    const text = await dueDate.textContent();
    return text.replace('Due: ', '').trim();
  }

  /**
   * Delete a todo
   */
  async deleteTodo(todoName) {
    const item = await this.getTodoItemByName(todoName);
    const deleteButton = await item.locator('button:has-text("Delete")').first();
    await deleteButton.click();
    // Wait for item to be removed from DOM
    await this.page.waitForTimeout(800);
    // Wait for the item to not be visible
    try {
      await item.waitFor({ state: 'hidden', timeout: 3000 });
    } catch (e) {
      // If it doesn't hide within timeout, continue anyway
    }
  }

  /**
   * Check if todo is deleted
   */
  async isTodoDeleted(todoName) {
    // Wait for potential DOM updates
    await this.page.waitForTimeout(1000);
    
    // Retry multiple times to ensure deletion
    for (let i = 0; i < 3; i++) {
      const exists = await this.todoExists(todoName);
      if (!exists) {
        return true;
      }
      // If still exists, wait a bit and retry
      if (i < 2) {
        await this.page.waitForTimeout(300);
      }
    }
    
    return !(await this.todoExists(todoName));
  }

  /**
   * Get error message
   */
  async getErrorMessage() {
    const error = await this.page.locator('.error').first();
    return await error.textContent();
  }

  /**
   * Check if error is displayed
   */
  async isErrorDisplayed() {
    return await this.page.locator('.error').isVisible();
  }

  /**
   * Check if loading is displayed
   */
  async isLoadingDisplayed() {
    return await this.page.locator('text=Loading data...').isVisible();
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad() {
    // Wait for loading to complete
    await this.page.waitForSelector('text=Items from Database', { timeout: 5000 });
    // Wait for any loading state to disappear
    await this.page.waitForTimeout(500);
  }

  /**
   * Clear new todo form
   */
  async clearNewTodoForm() {
    const nameInput = await this.page.locator('input[placeholder="Enter item name"]').first();
    await nameInput.fill('');
    const detailsInput = await this.page.locator('textarea[placeholder="Add details (optional)"]').first();
    await detailsInput.fill('');
  }
}

module.exports = TodoAppPage;
