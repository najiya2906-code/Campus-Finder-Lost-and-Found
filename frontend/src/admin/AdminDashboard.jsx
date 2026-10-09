import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "../css/AdminDashboard.css";

import Items from "./Items";
import Users from "./Users";
import Contacts from "./Contacts";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#004aad", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];
const NOTIF_COLORS = ["#00C49F", "#FF8042"]; // Read / Unread colors

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [itemsByDay, setItemsByDay] = useState([]);
  const [claimsByDay, setClaimsByDay] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifStats, setNotifStats] = useState({
    read: 0,
    unread: 0,
    daily: [],
  });

  const [itemStatusCounts, setItemStatusCounts] = useState({
    Active: 0,
    Resolved: 0,
    Unresolved: 0,
  });

  const API_BASE = "http://127.0.0.1:5000/admin";

  // ------------------------------
  // Recalculate Counts
  // ------------------------------
  const recalcItemStatusCounts = (updatedItems) => {
    const counts = { Active: 0, Resolved: 0, Unresolved: 0 };
    updatedItems.forEach((item) => {
      if (item.status === "Active") counts.Active++;
      else if (item.status === "Resolved") counts.Resolved++;
      else counts.Unresolved++;
    });

    setItemStatusCounts(counts);

    setStats((prev) => ({
      ...prev,
      lostItems: updatedItems.filter((i) => i.type === "lost").length,
      foundItems: updatedItems.filter((i) => i.type === "found").length,
    }));
  };

  // ------------------------------
  // Fetch ALL dashboard data
  // ------------------------------
  const fetchAll = async () => {
    try {
      const [s, u, c, a, ibd, cbd, top, i, n, ns] = await Promise.all([
        axios.get(`${API_BASE}/stats`),
        axios.get(`${API_BASE}/users`),
        axios.get(`${API_BASE}/contacts`),
        axios.get(`${API_BASE}/activity`),
        axios.get(`${API_BASE}/stats/items-by-day`),
        axios.get(`${API_BASE}/stats/claims-by-day`),
        axios.get(`${API_BASE}/stats/top-items`),
        axios.get(`${API_BASE}/items`),
        axios.get(`${API_BASE}/notifications`),
        axios.get(`${API_BASE}/notification-stats`), // Notification visual stats
      ]);

      setStats(s.data);
      setUsers(u.data);
      setContacts(c.data);
      setActivity(a.data);
      setItemsByDay(ibd.data);
      setClaimsByDay(cbd.data);
      setTopItems(top.data);
      setItems(i.data);
      setNotifications(n.data.notifications || []);
      setNotifStats(ns.data || { read: 0, unread: 0, daily: [] });

      recalcItemStatusCounts(i.data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load dashboard data", "error");
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ------------------------------
  // Change Item Status
  // ------------------------------
  const handleItemStatusChange = async (itemId, newStatus) => {
    try {
      const res = await axios.put(`${API_BASE}/items/${itemId}/status`, {
        status: newStatus,
      });

      if (res.data.success) {
        const updatedItems = items.map((item) =>
          item._id === itemId ? { ...item, status: newStatus } : item
        );
        setItems(updatedItems);
        recalcItemStatusCounts(updatedItems);
        Swal.fire("Success", "Item status updated", "success");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update item status", "error");
    }
  };

  // ------------------------------
  // Mark Notification Read
  // ------------------------------
  const markRead = async (id) => {
    try {
      await axios.put(`${API_BASE}/notifications/${id}/read`);
      fetchAll();
      Swal.fire("Marked as Read", "", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update", "error");
    }
  };

  // ------------------------------
  // Delete Notification
  // ------------------------------
  const deleteNotif = async (id) => {
    Swal.fire({
      title: "Delete this notification?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await axios.delete(`${API_BASE}/notifications/${id}`);
          fetchAll();
          Swal.fire("Deleted!", "", "success");
        } catch (err) {
          Swal.fire("Error", "Failed to delete", "error");
        }
      }
    });
  };

  // ------------------------------
  // Logout
  // ------------------------------
  const logout = () => {
    Swal.fire({
      title: "Logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#004aad",
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
      }
    });
  };

  // ------------------------------
  // Dashboard Charts Data
  // ------------------------------
  const pieData = [
    { name: "Users", value: stats.users || 0 },
    { name: "Lost Items", value: stats.lostItems || 0 },
    { name: "Found Items", value: stats.foundItems || 0 },
    { name: "Contacts", value: stats.contacts || 0 },
    { name: "Pending Claims", value: stats.claimsPending || 0 },
  ];

  const itemStatusPieData = [
    { name: "Active", value: itemStatusCounts.Active },
    { name: "Resolved", value: itemStatusCounts.Resolved },
    { name: "Unresolved", value: itemStatusCounts.Unresolved },
  ];

  const notifPieData = [
    { name: "Read", value: notifStats.read },
    { name: "Unread", value: notifStats.unread },
  ];

  return (
    <div className="admin-dashboard">
      <aside className="sidebar">
        <h2>🛡 Admin</h2>
        <ul>
          <li onClick={() => setActiveTab("dashboard")}>🏠 Dashboard</li>
          <li onClick={() => setActiveTab("users")}>👥 Users</li>
          <li onClick={() => setActiveTab("items")}>📦 Items</li>
          <li onClick={() => setActiveTab("contacts")}>📩 Contacts</li>
          <li onClick={() => setActiveTab("activity")}>🧾 Activity</li>
          <li onClick={() => setActiveTab("notifications")}>🔔 Notifications</li>
          <li className="logout" onClick={logout}>🚪 Logout</li>
        </ul>
      </aside>

      <main className="main-content">
        {activeTab === "dashboard" && (
          <>
            <h1>Admin Dashboard</h1>
            <div className="charts-grid">

              {/* Summary */}
              <div className="chart-card">
                <h3>📊 Overview Summary</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" label outerRadius={100}>
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Item Status Pie */}
              <div className="chart-card">
                <h3>📊 Items by Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={itemStatusPieData} dataKey="value" nameKey="name" label outerRadius={80}>
                      {itemStatusPieData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Items & Claims LineChart */}
              <div className="chart-card">
                <h3>📈 Items & Claims (Last 30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line data={itemsByDay} dataKey="count" name="Items" stroke="#004aad" />
                    <Line data={claimsByDay} dataKey="count" name="Claims" stroke="#FF8042" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top Items BarChart */}
              <div className="chart-card">
                <h3>🏆 Top Claimed Items</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topItems}>
                    <XAxis dataKey="itemName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Notifications Charts */}
              <div className="chart-card">
                <h3>🔔 Notifications Per Day (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={notifStats.daily}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="count" stroke="#004aad" name="Notifications" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>🔔 Read vs Unread Notifications</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={notifPieData} dataKey="value" nameKey="name" label outerRadius={80}>
                      {notifPieData.map((entry, index) => (
                        <Cell key={index} fill={NOTIF_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>🔔 Notifications Trend (Bar Chart)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={notifStats.daily}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#FF8042" name="Notifications" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {activeTab === "users" && <Users users={users} refresh={fetchAll} />}
        {activeTab === "items" && <Items items={items} setItems={setItems} refresh={fetchAll} onStatusChange={handleItemStatusChange} />}
        {activeTab === "contacts" && <Contacts contacts={contacts} refresh={fetchAll} />}
        {activeTab === "activity" && <ActivityLog activity={activity} />}
        {activeTab === "notifications" && <AdminNotifications notifications={notifications} markRead={markRead} deleteNotif={deleteNotif} />}
      </main>
    </div>
  );
};

/* ------------------------------ Activity Log ------------------------------ */
const ActivityLog = ({ activity }) => (
  <div className="activity-log">
    <h1>🧾 Admin Activity Logs</h1>
    <table className="table">
      <thead>
        <tr>
          <th>User</th>
          <th>Action</th>
          <th>Target</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {activity.length === 0 ? (
          <tr><td colSpan="4" style={{ textAlign: "center" }}>No activity recorded</td></tr>
        ) : activity.map((log) => (
          <tr key={log._id}>
            <td>{log.user}</td>
            <td>{log.action}</td>
            <td>{log.target}</td>
            <td>{new Date(log.timestamp).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ------------------------------ Admin Notifications ------------------------------ */
const AdminNotifications = ({ notifications, markRead, deleteNotif }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const filtered = notifications
    .filter((n) => {
      if (filter === "read" && !n.isRead) return false;
      if (filter === "unread" && n.isRead) return false;
      return `${n.userName} ${n.userMobile} ${n.message}`.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => sortOrder === "newest" ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="notifications-page">
      <h1>🔔 User Notifications</h1>
      <div className="notif-controls">
        <input type="text" placeholder="Search notifications..." value={search} onChange={(e) => setSearch(e.target.value)} className="notif-search" />
        <div className="notif-filter-buttons">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "unread" ? "active unread-btn" : "unread-btn"} onClick={() => setFilter("unread")}>Unread</button>
          <button className={filter === "read" ? "active read-btn" : "read-btn"} onClick={() => setFilter("read")}>Read</button>
        </div>
        <select className="notif-sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Mobile</th>
            <th>Message</th>
            <th>Status</th>
            <th>Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: "center" }}>No notifications found</td></tr>
          ) : filtered.map((n) => (
            <tr key={n._id}>
              <td>{n.userName || "Unknown"}</td>
              <td>{n.userMobile || "N/A"}</td>
              <td>{n.message}</td>
              <td>{n.isRead ? <span className="badge badge-green">Read</span> : <span className="badge badge-red">Unread</span>}</td>
              <td>{new Date(n.createdAt).toLocaleString()}</td>
              <td>
                {!n.isRead && <button onClick={() => markRead(n._id)} className="btn btn-small btn-blue">Mark Read</button>}
                <button onClick={() => deleteNotif(n._id)} className="btn btn-small btn-red">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
