const request = require('supertest');
const { app, db } = require('../../src/app');

// Close the database connection after all tests
afterAll(() => {
  if (db) {
    db.close();
  }
});

describe('TODO API Integration Tests', () => {
  describe('GET /api/items - Retrieve todos', () => {
    it('should retrieve all todos with complete structure', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify structure of returned items
      response.body.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('details');
        expect(item).toHaveProperty('completed');
        expect(item).toHaveProperty('priority');
        expect(item).toHaveProperty('due_date');
        expect(item).toHaveProperty('created_at');
      });
    });

    it('should return items in descending order by created_at', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect(200);

      const items = response.body;
      for (let i = 0; i < items.length - 1; i++) {
        const currentDate = new Date(items[i].created_at);
        const nextDate = new Date(items[i + 1].created_at);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });
  });

  describe('POST /api/items - Create todos', () => {
    it('should create a todo with all fields', async () => {
      const newTodo = {
        name: 'Complete Project',
        details: 'Finish all implementation tasks',
        priority: 'HIGH',
        due_date: '2026-08-30'
      };

      const response = await request(app)
        .post('/api/items')
        .send(newTodo)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newTodo.name);
      expect(response.body.details).toBe(newTodo.details);
      expect(response.body.priority).toBe(newTodo.priority);
      expect(response.body.due_date).toBe(newTodo.due_date);
      expect(response.body.completed).toBe(0);
      expect(response.body).toHaveProperty('created_at');
    });

    it('should create a todo with only required fields', async () => {
      const newTodo = {
        name: 'Simple Task'
      };

      const response = await request(app)
        .post('/api/items')
        .send(newTodo)
        .expect(201);

      expect(response.body.name).toBe(newTodo.name);
      expect(response.body.priority).toBe('MEDIUM'); // Default priority
      expect(response.body.details).toBeNull();
      expect(response.body.due_date).toBeNull();
    });

    it('should create todos with different priority levels', async () => {
      const priorities = ['LOW', 'MEDIUM', 'HIGH'];

      for (const priority of priorities) {
        const response = await request(app)
          .post('/api/items')
          .send({
            name: `Task with ${priority} priority`,
            priority
          })
          .expect(201);

        expect(response.body.priority).toBe(priority);
      }
    });

    it('should default invalid priority to MEDIUM', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          name: 'Task with invalid priority',
          priority: 'URGENT' // Invalid priority
        })
        .expect(201);

      expect(response.body.priority).toBe('MEDIUM');
    });

    it('should accept null/empty due_date', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          name: 'Task without due date',
          due_date: ''
        })
        .expect(201);

      expect(response.body.due_date).toBeNull();
    });

    it('should reject empty name', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          name: '   ' // Whitespace only
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should reject missing name', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          priority: 'HIGH'
        })
        .expect(400);

      expect(response.body.error).toBe('Item name is required');
    });
  });

  describe('PUT /api/items/:id - Update todos', () => {
    let testTodoId;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          name: 'Todo to Update',
          details: 'Original details',
          priority: 'LOW',
          due_date: '2026-09-01'
        });
      testTodoId = response.body.id;
    });

    it('should update todo name', async () => {
      const response = await request(app)
        .put(`/api/items/${testTodoId}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      // Other fields should remain unchanged
      expect(response.body.details).toBe('Original details');
      expect(response.body.priority).toBe('LOW');
    });

    it('should update todo details', async () => {
      const newDetails = 'Updated details content';
      const response = await request(app)
        .put(`/api/items/${testTodoId}`)
        .send({ details: newDetails })
        .expect(200);

      expect(response.body.details).toBe(newDetails);
    });

    it('should update todo priority', async () => {
      const response = await request(app)
        .put(`/api/items/${testTodoId}`)
        .send({ priority: 'HIGH' })
        .expect(200);

      expect(response.body.priority).toBe('HIGH');
    });

    it('should update due_date', async () => {
      const newDate = '2026-10-15';
      const response = await request(app)
        .put(`/api/items/${testTodoId}`)
        .send({ due_date: newDate })
        .expect(200);

      expect(response.body.due_date).toBe(newDate);
    });

    it('should toggle completion status', async () => {
      // Mark as complete
      let response = await request(app)
        .put(`/api/items/${testTodoId}`)
        .send({ completed: true })
        .expect(200);

      expect(response.body.completed).toBe(1);

      // Mark as incomplete
      response = await request(app)
        .put(`/api/items/${testTodoId}`)
        .send({ completed: false })
        .expect(200);

      expect(response.body.completed).toBe(0);
    });

    it('should update multiple fields at once', async () => {
      const updates = {
        name: 'Fully Updated Todo',
        details: 'All fields updated',
        priority: 'MEDIUM',
        due_date: '2026-11-20',
        completed: true
      };

      const response = await request(app)
        .put(`/api/items/${testTodoId}`)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(response.body.details).toBe(updates.details);
      expect(response.body.priority).toBe(updates.priority);
      expect(response.body.due_date).toBe(updates.due_date);
      expect(response.body.completed).toBe(1);
    });

    it('should reject empty name in update', async () => {
      const response = await request(app)
        .put(`/api/items/${testTodoId}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent todo', async () => {
      const response = await request(app)
        .put('/api/items/999999')
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.error).toBe('Item not found');
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app)
        .put('/api/items/invalid-id')
        .send({ name: 'Updated' })
        .expect(400);

      expect(response.body.error).toBe('Valid item ID is required');
    });
  });

  describe('DELETE /api/items/:id - Delete todos', () => {
    let todoToDelete;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          name: 'Todo to Delete',
          details: 'This will be deleted',
          priority: 'LOW'
        });
      todoToDelete = response.body.id;
    });

    it('should delete a todo and return success message', async () => {
      const response = await request(app)
        .delete(`/api/items/${todoToDelete}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Item deleted successfully',
        id: todoToDelete
      });
    });

    it('should confirm todo is deleted', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect(200);

      const deletedTodo = response.body.find(item => item.id === todoToDelete);
      expect(deletedTodo).toBeUndefined();
    });

    it('should return 404 when deleting non-existent todo', async () => {
      const response = await request(app)
        .delete('/api/items/999999')
        .expect(404);

      expect(response.body.error).toBe('Item not found');
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app)
        .delete('/api/items/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('Valid item ID is required');
    });
  });

  describe('Complete workflow - CRUD operations', () => {
    it('should complete full todo lifecycle', async () => {
      // Step 1: Create a todo
      const createResponse = await request(app)
        .post('/api/items')
        .send({
          name: 'Lifecycle Test Todo',
          details: 'Testing complete workflow',
          priority: 'MEDIUM',
          due_date: '2026-08-25'
        })
        .expect(201);

      const todoId = createResponse.body.id;
      expect(createResponse.body.completed).toBe(0);

      // Step 2: Retrieve the todo
      const getResponse = await request(app)
        .get('/api/items')
        .expect(200);

      const createdTodo = getResponse.body.find(item => item.id === todoId);
      expect(createdTodo).toBeDefined();
      expect(createdTodo.name).toBe('Lifecycle Test Todo');

      // Step 3: Update the todo
      const updateResponse = await request(app)
        .put(`/api/items/${todoId}`)
        .send({
          name: 'Updated Lifecycle Todo',
          priority: 'HIGH',
          completed: true
        })
        .expect(200);

      expect(updateResponse.body.name).toBe('Updated Lifecycle Todo');
      expect(updateResponse.body.priority).toBe('HIGH');
      expect(updateResponse.body.completed).toBe(1);

      // Step 4: Delete the todo
      const deleteResponse = await request(app)
        .delete(`/api/items/${todoId}`)
        .expect(200);

      expect(deleteResponse.body.id).toBe(todoId);

      // Step 5: Verify deletion
      const finalGetResponse = await request(app)
        .get('/api/items')
        .expect(200);

      const deletedTodo = finalGetResponse.body.find(item => item.id === todoId);
      expect(deletedTodo).toBeUndefined();
    });

    it('should handle multiple todos with different priorities', async () => {
      // Create todos with different priorities
      const todos = [];
      const priorities = ['HIGH', 'MEDIUM', 'LOW'];

      for (const priority of priorities) {
        const response = await request(app)
          .post('/api/items')
          .send({
            name: `${priority} priority todo`,
            priority,
            due_date: '2026-09-01'
          })
          .expect(201);
        todos.push(response.body);
      }

      // Retrieve all todos
      const getResponse = await request(app)
        .get('/api/items')
        .expect(200);

      // Verify all todos exist
      todos.forEach(todo => {
        const found = getResponse.body.find(item => item.id === todo.id);
        expect(found).toBeDefined();
        expect(found.priority).toBe(todo.priority);
      });

      // Clean up
      for (const todo of todos) {
        await request(app)
          .delete(`/api/items/${todo.id}`)
          .expect(200);
      }
    });
  });
});
