const request = require('supertest');
const { app, db } = require('../src/app');

// Close the database connection after all tests
afterAll(() => {
  if (db) {
    db.close();
  }
});

// Test helpers
const createItem = async (name = 'Temp Item to Delete') => {
  const response = await request(app)
    .post('/api/items')
    .send({ name })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /api/items', () => {
    it('should return all items', async () => {
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check if items have the expected structure
      const item = response.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('created_at');
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const newItem = { name: 'Test Item' };
      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newItem.name);
      expect(response.body).toHaveProperty('created_at');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should create item with details, priority, and due_date', async () => {
      const newItem = {
        name: 'Test Item with Details',
        details: 'This is a test item',
        priority: 'HIGH',
        due_date: '2026-08-01'
      };
      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(newItem.name);
      expect(response.body.details).toBe(newItem.details);
      expect(response.body.priority).toBe(newItem.priority);
      expect(response.body.due_date).toBe(newItem.due_date);
      expect(response.body.completed).toBe(0);
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update item name', async () => {
      const item = await createItem('Original Name');
      const updatedName = 'Updated Name';

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: updatedName })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(item.id);
      expect(response.body.name).toBe(updatedName);
    });

    it('should toggle item completion status', async () => {
      const item = await createItem('Item To Complete');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ completed: true })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(1);
    });

    it('should update priority and due_date', async () => {
      const item = await createItem('Item With Details');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({
          priority: 'HIGH',
          due_date: '2026-08-15',
          details: 'Updated details'
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.priority).toBe('HIGH');
      expect(response.body.due_date).toBe('2026-08-15');
      expect(response.body.details).toBe('Updated details');
    });

    it('should return 404 when updating non-existent item', async () => {
      const response = await request(app)
        .put('/api/items/999999')
        .send({ name: 'Non-existent' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 when updating with empty name', async () => {
      const item = await createItem('Item To Update');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app)
        .put('/api/items/invalid')
        .send({ name: 'Updated' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an existing item', async () => {
      const item = await createItem('Item To Be Deleted');

      const deleteResponse = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Item deleted successfully', id: item.id });

      const deleteAgain = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 404 when item does not exist', async () => {
      const response = await request(app).delete('/api/items/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/api/items/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });
  });
});