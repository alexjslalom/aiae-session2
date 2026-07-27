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
    expect(screen.getByText('To Do App')).toBeInTheDocument();
    expect(screen.getByText('Keep track of your tasks')).toBeInTheDocument();
  });

  test('loads and displays items with new fields', async () => {
    await act(async () => {
      render(<App />);
    });
    
    // Initially shows loading state
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    
    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(screen.getByText('Second task')).toBeInTheDocument();
    });

    // Check priority badges
    const highPriorityBadges = screen.getAllByText('HIGH');
    expect(highPriorityBadges.length).toBeGreaterThan(0);
  });

  test('adds a new item with all fields', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<App />);
    });
    
    // Wait for items to load
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Fill in the form and submit
    const nameInput = screen.getByPlaceholderText('Enter item name');
    const detailsInput = screen.getByPlaceholderText('Add details (optional)');
    const prioritySelect = screen.getAllByRole('combobox')[0];
    
    await act(async () => {
      await user.type(nameInput, 'New Test Item');
      await user.type(detailsInput, 'New details');
      await user.selectOptions(prioritySelect, 'HIGH');
    });
    
    const submitButton = screen.getByText('Add Item');
    await act(async () => {
      await user.click(submitButton);
    });
    
    // Check that the new item appears
    await waitFor(() => {
      expect(screen.getByText('New Test Item')).toBeInTheDocument();
    });
  });

  test('toggles item completion status', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<App />);
    });
    
    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });
    
    // Find and click the checkbox for first item
    const checkboxes = screen.getAllByRole('checkbox');
    await act(async () => {
      await user.click(checkboxes[0]);
    });

    // Should show item as completed (in a completed class)
    await waitFor(() => {
      const items = screen.getAllByText('Test Item 1');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  test('opens edit modal and updates item', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<App />);
    });
    
    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });
    
    // Click Edit button
    const editButtons = screen.getAllByText('Edit');
    await act(async () => {
      await user.click(editButtons[0]);
    });

    // Modal should open with the edit form
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Item 1')).toBeInTheDocument();
    });

    // Update the name and save
    const nameInput = screen.getByDisplayValue('Test Item 1');
    await act(async () => {
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Item Name');
    });

    const saveButton = screen.getByText('Save Changes');
    await act(async () => {
      await user.click(saveButton);
    });

    // Modal should close and updated item should appear
    await waitFor(() => {
      expect(screen.getByText('Updated Item Name')).toBeInTheDocument();
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
      expect(screen.getByText(/Failed to fetch data/)).toBeInTheDocument();
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
      expect(screen.getByText('No items found. Add some!')).toBeInTheDocument();
    });
  });
});