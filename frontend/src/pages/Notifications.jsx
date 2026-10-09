import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../css/Notifications.css";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id || user?.id;
  const navigate = useNavigate();

  // ---------------------------- SOCKET.IO ----------------------------
  useEffect(() => {
    if (!userId) return;

    const socket = io("http://127.0.0.1:5000"); // connect to backend Socket.IO
    socket.emit("join", { userId }); // join user-specific room

    socket.on("new_notification", (n) => {
      setNotifs((prev) => [n, ...prev]); // add new notification on top

      // Dispatch global event for bell
      window.dispatchEvent(new Event("notif-updated"));

      // Show toast popup
      Swal.fire({
        title: n.title,
        text: n.message,
        icon: "info",
        toast: true,
        position: "top-end",
        showConfirmButton: true,
        confirmButtonText: "Open",
        timer: 5000,
        timerProgressBar: true,
        didClose: () => markRead(n._id, n.link),
      });
    });

    return () => socket.disconnect();
  }, [userId]);

  // ---------------------------- FETCH EXISTING NOTIFICATIONS ----------------------------
  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const res = await axios.get(
        `http://127.0.0.1:5000/api/notifications/${userId}`
      );
      const data = res.data.notifications || [];
      setNotifs(data);
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  // ---------------------------- MARK SINGLE NOTIFICATION READ ----------------------------
  const markRead = async (id, link) => {
    try {
      await axios.put(`http://127.0.0.1:5000/api/notifications/${id}/read`);

      setNotifs((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );

      window.dispatchEvent(new Event("notif-updated")); // update bell count globally
      if (link) navigate(link);
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  // ---------------------------- MARK ALL READ ----------------------------
  const markAllRead = async () => {
    try {
      const unread = notifs.filter((n) => !n.isRead);

      await Promise.all(
        unread.map((n) =>
          axios.put(`http://127.0.0.1:5000/api/notifications/${n._id}/read`)
        )
      );

      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event("notif-updated"));
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Notifications</h3>
          <div>
            <Button
              size="sm"
              variant="secondary"
              onClick={fetchNotifications}
              className="me-2"
            >
              Refresh
            </Button>
            <Button size="sm" variant="primary" onClick={markAllRead}>
              Mark all read
            </Button>
          </div>
        </div>

        {loading && <p>Loading...</p>}
        {!loading && notifs.length === 0 && <p>No notifications yet.</p>}

        <div className="notifications-list">
          {notifs.map((n) => (
            <div
              key={n._id}
              className={`notification-page-item ${
                n.isRead ? "read" : "unread"
              }`}
            >
              <div className="notification-page-content">
                <div className="notification-page-header">
                  <strong>{n.title}</strong>
                  <small className="text-muted">
                    {new Date(n.createdAt).toLocaleString()}
                  </small>
                </div>

                <p className="mb-1">{n.message}</p>

                <div className="notification-actions">
                  {!n.isRead ? (
                    <Button
                      size="sm"
                      variant="outline-success"
                      onClick={() => markRead(n._id, n.link)}
                    >
                      Open / Mark read
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => n.link && navigate(n.link)}
                    >
                      Open
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
