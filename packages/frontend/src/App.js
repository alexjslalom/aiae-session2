import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    details: '',
    priority: 'MEDIUM',
    due_date: ''
  });
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      const result = await response.json();
      setData([result, ...data]);
      setNewItem({
        name: '',
        details: '',
        priority: 'MEDIUM',
        due_date: ''
      });
      setError(null);
    } catch (err) {
      setError('Error adding item: ' + err.message);
      console.error('Error adding item:', err);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setData(data.filter(item => item.id !== itemId));
      setError(null);
    } catch (err) {
      setError('Error deleting item: ' + err.message);
      console.error('Error deleting item:', err);
    }
  };

  const handleToggleComplete = async (item) => {
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          completed: !item.completed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const updatedItem = await response.json();
      setData(data.map(i => i.id === item.id ? updatedItem : i));
      setError(null);
    } catch (err) {
      setError('Error updating item: ' + err.message);
      console.error('Error updating item:', err);
    }
  };

  const handleEditClick = (item) => {
    setEditingItem({ ...item });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem.name.trim()) return;

    try {
      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingItem),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const updatedItem = await response.json();
      setData(data.map(item => item.id === editingItem.id ? updatedItem : item));
      setShowEditModal(false);
      setEditingItem(null);
      setError(null);
    } catch (err) {
      setError('Error updating item: ' + err.message);
      console.error('Error updating item:', err);
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return '#d32f2f';
      case 'MEDIUM':
        return '#f57c00';
      case 'LOW':
        return '#388e3c';
      default:
        return '#666';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>To Do App</h1>
        <p>Keep track of your tasks</p>
      </header>

      <main>
        <section className="add-item-section">
          <h2>Add New Item</h2>
          <form onSubmit={handleSubmit} className="add-item-form">
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Enter item name"
              required
            />
            <textarea
              value={newItem.details}
              onChange={(e) => setNewItem({ ...newItem, details: e.target.value })}
              placeholder="Add details (optional)"
              rows="2"
            />
            <div className="form-row">
              <select
                value={newItem.priority}
                onChange={(e) => setNewItem({ ...newItem, priority: e.target.value })}
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>
              <input
                type="date"
                value={newItem.due_date}
                onChange={(e) => setNewItem({ ...newItem, due_date: e.target.value })}
              />
            </div>
            <button type="submit">Add Item</button>
          </form>
        </section>

        <section className="items-section">
          <h2>Items from Database</h2>
          {loading && <p>Loading data...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && (
            <ul className="items-list">
              {data.length > 0 ? (
                data.map((item) => (
                  <li key={item.id} className={`item ${item.completed ? 'completed' : ''}`}>
                    <div className="item-content">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleComplete(item)}
                        className="item-checkbox"
                      />
                      <div className="item-details">
                        <div className="item-header">
                          <span className="item-name">{item.name}</span>
                          <span 
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(item.priority) }}
                          >
                            {item.priority}
                          </span>
                        </div>
                        {item.details && (
                          <p className="item-description">{item.details}</p>
                        )}
                        {item.due_date && (
                          <p className={`item-due-date ${isOverdue(item.due_date) ? 'overdue' : ''}`}>
                            Due: {formatDate(item.due_date)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="item-actions">
                      <button 
                        onClick={() => handleEditClick(item)}
                        className="edit-btn"
                        type="button"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="delete-btn"
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <p>No items found. Add some!</p>
              )}
            </ul>
          )}
        </section>

        {showEditModal && editingItem && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Edit Item</h2>
              <form onSubmit={handleEditSubmit}>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="Item name"
                  required
                />
                <textarea
                  value={editingItem.details || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, details: e.target.value })}
                  placeholder="Add details (optional)"
                  rows="3"
                />
                <div className="form-row">
                  <select
                    value={editingItem.priority}
                    onChange={(e) => setEditingItem({ ...editingItem, priority: e.target.value })}
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                  </select>
                  <input
                    type="date"
                    value={editingItem.due_date || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, due_date: e.target.value })}
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="save-btn">Save Changes</button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingItem(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;