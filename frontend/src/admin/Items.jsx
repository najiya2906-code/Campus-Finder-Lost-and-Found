import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:5000/admin";

const statusColors = {
  Active: "#1890ff",
  Resolved: "#52c41a",
  Unresolved: "#faad14",
};

const Items = ({ items, setItems, onStatusChange }) => {
  const [updatingItem, setUpdatingItem] = useState(null);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_BASE}/items`);
      setItems(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch items");
    }
  };

  useEffect(() => {
    if (!items || items.length === 0) {
      fetchItems();
    }
  }, []); // fetch only if items are empty

  const updateStatus = (itemId, newStatus) => {
    if (onStatusChange) {
      setUpdatingItem(itemId);
      onStatusChange(itemId, newStatus).finally(() => setUpdatingItem(null));
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure to delete this item?")) return;

    try {
      await axios.delete(`${API_BASE}/items/${id}`);
      alert("Item deleted successfully");
      fetchItems();
    } catch (err) {
      console.error(err);
      alert("Failed to delete item");
    }
  };

  return (
    <div style={{ overflowX: "auto", padding: "10px" }}>
      <h2>📦 All Items (Lost & Found)</h2>
      <table
        border="1"
        cellPadding="5"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Type</th>
            <th>Location</th>
            <th>Date</th>
            <th>Question</th>
            <th>Posted By</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.itemName}</td>
              <td>{item.type}</td>
              <td>{item.location}</td>
              <td>{item.date}</td>
              <td>{item.question}</td>
              <td>{item.userName}</td>
              <td>
                <button
                  style={{
                    backgroundColor: statusColors[item.status],
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    cursor: "default",
                    marginRight: "5px",
                  }}
                >
                  {item.status}
                </button>
              </td>
              <td>
                <select
                  value={item.status}
                  disabled={updatingItem === item._id}
                  onChange={(e) => updateStatus(item._id, e.target.value)}
                  style={{
                    padding: "3px 6px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    border: "1px solid #d9d9d9",
                    marginRight: "5px",
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Unresolved">Unresolved</option>
                </select>

                <button
                  onClick={() => deleteItem(item._id)}
                  style={{
                    backgroundColor: "#ff4d4f",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  🗑 Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Items;
