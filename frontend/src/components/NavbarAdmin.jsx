import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/admin.css";

const NavbarAdmin = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="admin-navbar">
      <h2>Campus Admin Panel</h2>
      <ul>
        <li><Link to="/admin/dashboard">Dashboard</Link></li>
        <li><Link to="/admin/users">Users</Link></li>
        <li><Link to="/admin/items">Items</Link></li>
        <li><Link to="/admin/contacts">Contacts</Link></li>
        <li><Link to="/admin/claims">Claims</Link></li>
        <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
      </ul>
    </nav>
  );
};

export default NavbarAdmin;
