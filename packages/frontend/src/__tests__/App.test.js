import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

// Mock server to intercept API requests
const server = setupServer(
  // GET /api/items handler
  rest.get('/api/items', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { 
          id: 1, 
          name: 'Test Item 1', 
          details: 'First task',
          completed: 0,
          priority: 'HIGH',
          due_date: '2026-08-15',
          created_at: '2023-01-01T00:00:00.000Z' 
        },
        { 
          id: 2, 
          name: 'Test Item 2',
          details: 'Second task',
          completed: 0,
          priority: 'MEDIUM',
          due_date: null,
          created_at: '2023-01-02T00:00:00.000Z' 
        },
      ])
    );
  }),
  
  // POST /api/items handler
  rest.post('/api/items', (req, res, ctx) => {
    const { name, details, priority, due_date } = req.body;
    
    if (!name || name.trim() === '') {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Item name is required' })
      );
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        name,
        details: details || null,
        completed: 0,
        priority: priority || 'MEDIUM',
        due_date: due_date || null,
        created_at: new Date().toISOString(),
      })
    );
  }),

  // PUT /api/items/:id handler
  rest.put('/api/items/:id', (req, res, ctx) => {
    const { id } = req.params;
    const { name, details, completed, priority, due_date } = req.body;

    if (!name || name.trim() === '') {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Item name must be a non-empty string' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        id: parseInt(id),
        name,
        details: details || null,
        completed: completed ? 1 : 0,
        priority: priority || 'MEDIUM',
        due_date: due_date || null,
        created_at: '2023-01-01T00:00:00.000Z',
      })
    );
  }),

  // DELETE /api/items/:id handler
  rest.delete('/api/items/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ message: 'Item deleted successfully', id: parseInt(req.params.id) })
    );
  })
);

// Setup and teardown for the mock server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the header', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByTestId('app-title')).toBeInTheDocument();
    expect(screen.getByTestId('app-subtitle')).toBeInTheDocument();
  });

  test('loads and displays items with new fields', async () => {
    await act(async () => {
      render(<App />);
    });
    
    // Initially shows loading state
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    
    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByTestId('item-name-1')).toHaveTextContent('Test Item 1');
      expect(screen.getByTestId('item-name-2')).toHaveTextContent('Test Item 2');
      expect(screen.getByTestId('item-details-1')).toHaveTextContent('First task');
      expect(screen.getByTestId('item-details-2')).toHaveTextContent('Second task');
    });

    // Check priority badges
    expect(screen.getByTestId('item-priority-1')).toHaveTextContent('HIGH');
  });

  test('adds a new item with all fields', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<App />);
    });
    
    // Wait for items to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });
    
    // Fill in the form and submit
    const nameInput = screen.getByTestId('new-item-name-input');
    const detailsInput = screen.getByTestId('new-item-details-input');
    const prioritySelect = screen.getByTestId('new-item-priority-select');
    
    await act(async () => {
      await user.type(nameInput, 'New Test Item');
      await user.type(detailsInput, 'New details');
      await user.selectOptions(prioritySelect, 'HIGH');
    });
    
    const submitButton = screen.getByTestId('add-item-submit-button');
    await act(async () => {
      await user.click(submitButton);
    });
    
    // Check that the new item appears
    await waitFor(() => {
      expect(screen.getByTestId('item-name-3')).toHaveTextContent('New Test Item');
    });
  });

  test('toggles item completion status', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<App />);
    });
    
    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
    });
    
    // Find and click the checkbox for first item
    const checkbox = screen.getByTestId('item-checkbox-1');
    await act(async () => {
      await user.click(checkbox);
    });

    // Should show item as completed (in a completed class)
    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toHaveClass('completed');
    });
  });

  test('opens edit modal and updates item', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<App />);
    });
    
    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
    });
    
    // Click Edit button
    const editButton = screen.getByTestId('item-edit-1');
    await act(async () => {
      await user.click(editButton);
    });

    // Modal should open with the edit form
    await waitFor(() => {
      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    });

    // Update the name and save
    const nameInput = screen.getByTestId('edit-item-name-input');
    await act(async () => {
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Item Name');
    });

    const saveButton = screen.getByTestId('edit-item-save-button');
    await act(async () => {
      await user.click(saveButton);
    });

    // Modal should close and updated item should appear
    await waitFor(() => {
      expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('item-name-1')).toHaveTextContent('Updated Item Name');
    });
  });

  test('handles API error', async () => {
    // Override the default handler to simulate an error
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    
    await act(async () => {
      render(<App />);
    });
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toHaveTextContent('Failed to fetch data');
    });
  });

  test('shows empty state when no items', async () => {
    // Override the default handler to return empty array
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );
    
    await act(async () => {
      render(<App />);
    });
    
    // Wait for empty state message
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });
});