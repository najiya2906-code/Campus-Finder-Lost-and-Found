import React, { useEffect, useState } from "react";
import { Container, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../css/responses.css";

export default function Responses() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?._id;

  // Greeting logic
  useEffect(() => {
    if (user?.name) setUserName(user.name);
  }, [user]);

  // Fetch responses
  const fetchResponses = async () => {
    if (!userId) {
      setError("Please log in to view your responses.");
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/responses/user/${userId}`);
      setResponses(res.data.responses || []);
    } catch (err) {
      console.error("Error fetching responses:", err);
      setError("Failed to fetch responses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [userId]);

  const handleItemClick = (itemId) => {
    navigate(`/item/${itemId}`);
  };

  return (
    <>
      <Navbar />

      {/* Greeting message */}
      {userName && (
        <div
          style={{
            position: "absolute",
            top: "70px",
            left: "20px",
            fontSize: "22px",
            fontWeight: "600",
            color: "#0d6efd",
            zIndex: 1000,
          }}
        >
          Hello, {userName} 👋
        </div>
      )}

      <div className="responses-page mt-5">
        <h3 className="responses-title">My Claim Responses</h3>

        {loading && (
          <div className="text-center">
            <Spinner animation="border" />
            <p>Loading responses...</p>
          </div>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        {!loading && !error && responses.length === 0 && (
          <p className="no-responses">You have not submitted any responses yet.</p>
        )}

        {!loading && !error && responses.length > 0 && (
          <div className="responses-grid">
            {responses.map((r) => (
              <div className="response-card" key={r._id}>
                <h5
                  className="response-itemid clickable"
                  onClick={() => handleItemClick(r.itemId)}
                >
                  Item ID: {r.itemId}
                </h5>
                <p><strong>Question:</strong> {r.question}</p>
                <p><strong>Answer:</strong> {r.answer}</p>

                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`status ${
                      r.status === "Pending Moderation"
                        ? "pending"
                        : r.status === "Approved"
                        ? "approved"
                        : "rejected"
                    }`}
                  >
                    {r.status}
                  </span>
                </p>

                <p className="timestamp">
                  <strong>Time:</strong>{" "}
                  {r.time ? new Date(r.time).toLocaleString() : "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
