import React, { useEffect, useState } from "react";
import axios from "axios";
import NavbarAdmin from "../components/NavbarAdmin";
import "../css/admin.css";

const Claims = () => {
  const [claims, setClaims] = useState([]);

  const fetchClaims = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/admin/claims");
      setClaims(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateClaim = async (id, status) => {
    try {
      await axios.patch(`http://127.0.0.1:5000/admin/claims/${id}`, { status });
      fetchClaims();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  return (
    <div>
      <NavbarAdmin />
      <div className="admin-container">
        <h2>Claims</h2>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>User</th>
              <th>Type</th>
              <th>Answer</th>
              <th>Question</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map(c => (
              <tr key={c._id}>
                <td>{c.itemName}</td>
                <td>{c.userName}</td>
                <td>{c.itemType}</td>
                <td>{c.answer}</td>
                <td>{c.question}</td>
                <td>{c.status}</td>
                <td>
                  <button onClick={() => updateClaim(c._id, "Approved")}>Approve</button>
                  <button onClick={() => updateClaim(c._id, "Rejected")}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Claims;
