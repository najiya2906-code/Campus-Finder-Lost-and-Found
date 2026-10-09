import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../css/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const isHome = location.pathname === "/";
  const isAuthPage =
    location.pathname === "/Login" || location.pathname === "/Signup";

  // ------------------ FETCH NOTIFICATIONS ------------------
  const loadNotifications = async () => {
    if (!user?._id) return;

    try {
      const res = await axios.get(
        `http://127.0.0.1:5000/api/notifications/${user._id}`
      );

      const notifs = res.data.notifications || [];

      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.isRead).length); // update unread count
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // ------------------ MARK SINGLE NOTIFICATION READ ------------------
  const markAsRead = async (notifId, link) => {
    try {
      await axios.put(
        `http://127.0.0.1:5000/api/notifications/${notifId}/read`
      );

      // update UI instantly
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0)); // decrease count
      window.dispatchEvent(new Event("notif-updated"));
      setShowDropdown(false);

      if (link) navigate(link);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // ------------------ MARK ALL READ WHEN BELL OPENS ------------------
  const markAllAsRead = async () => {
    try {
      await axios.put(
        `http://127.0.0.1:5000/api/notifications/read-all/${user._id}`
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0); // reset count
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  // ------------------ EFFECT: LOAD + AUTO REFRESH ------------------
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?._id]);

  // ------------------ LISTEN FOR GLOBAL UPDATES ------------------
  useEffect(() => {
    const updateHandler = () => loadNotifications();
    window.addEventListener("notif-updated", updateHandler);
    return () => window.removeEventListener("notif-updated", updateHandler);
  }, []);

  // ------------------ CLOSE DROPDOWN ON OUTSIDE CLICK ------------------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">CampusFinder</Link>
      </div>

      {!isHome && (
        <ul className="nav-links nav-right">
          {isAuthPage ? (
            <>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/About">About</Link></li>
              <li><Link to="/Feed">Feed</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/Postitems">Post Items</Link></li>
              <li><Link to="/Feed">Feed</Link></li>
              <li><Link to="/Responses">Responses</Link></li>
              <li><Link to="/MyListings">My Listings</Link></li>
              <li><Link to="/About">About</Link></li>

              {/* ------------ 🔔 NOTIFICATION BELL ------------ */}
              {user && (
                <li ref={dropdownRef} className="notification-container">
                  <div
                    className="notification-bell"
                    onClick={() => {
                      const toggle = !showDropdown;
                      setShowDropdown(toggle);

                      if (toggle) {
                        markAllAsRead(); // mark all read when opening bell
                      }
                    }}
                  >
                    🔔
                    {unreadCount > 0 && (
                      <span className="notification-count">{unreadCount}</span>
                    )}
                  </div>

                  {showDropdown && (
                    <div className="notification-dropdown">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`notification-item ${n.isRead ? "read" : "unread"}`}
                            onClick={() => markAsRead(n._id, n.link)}
                          >
                            <strong>{n.title}</strong>
                            <p>{n.message}</p>
                            <small>{new Date(n.createdAt).toLocaleString()}</small>
                          </div>
                        ))
                      ) : (
                        <p className="no-notifications">No notifications</p>
                      )}
                    </div>
                  )}
                </li>
              )}

              {user && (
                <li>
                  <button className="logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              )}
            </>
          )}
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
