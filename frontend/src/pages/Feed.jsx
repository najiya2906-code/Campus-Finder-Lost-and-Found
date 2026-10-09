import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Spinner, Badge, Alert, Form } from "react-bootstrap";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../css/feed.css";

export default function Feed() {
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // New status filter

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.name) {
      setUserName(user.name);
    }

    const fetchFeed = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:5000/feed");
        const data = res.data.items || [];

        setLostItems(data.filter((item) => item.type === "lost"));
        setFoundItems(data.filter((item) => item.type === "found"));
      } catch (err) {
        console.error("Error fetching feed:", err);
        setError("Failed to fetch items. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const filteredLostItems = lostItems.filter(
    (item) =>
      (item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.date.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter ? item.status === statusFilter : true)
  );

  const filteredFoundItems = foundItems.filter(
    (item) =>
      (item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.date.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter ? item.status === statusFilter : true)
  );

  const renderStatusBadge = (status) => {
    switch (status) {
      case "Resolved":
        return <Badge bg="secondary" className="ms-2">{status}</Badge>;
      case "Unresolved":
        return <Badge bg="warning" className="ms-2">{status}</Badge>;
      case "Active":
      default:
        return <Badge bg="info" className="ms-2">{status}</Badge>;
    }
  };

  return (
    <>
      <Navbar />

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

      <Container className="feed-page">
        <div className="feed-header">
          <h3 className="feed-title">Campus Lost & Found Feed</h3>

          <div className="d-flex flex-column flex-md-row align-items-md-center gap-2 mt-2">
            <div className="search-bar-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input
                type="text"
                className="search-bar-with-icon"
                placeholder="Search by item name, date, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Form.Select
              style={{ width: "200px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Unresolved">Unresolved</option>
              <option value="Resolved">Resolved</option>
            </Form.Select>
          </div>
        </div>

        {loading && (
          <div className="text-center mt-4">
            <Spinner animation="border" />
            <p>Loading items...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="mt-4 text-center">
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            {/* 🟥 Lost Items Section */}
            <section className="feed-section">
              <h4 className="section-title lost">
                Lost Items ({filteredLostItems.length})
              </h4>
              {filteredLostItems.length > 0 ? (
                <Row className="feed-cards-row">
                  {filteredLostItems.map((item) => (
                    <Col key={item._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                      <Card className="feed-card shadow-sm clickable-card">
                        <Link to={`/item/${item._id}`} className="text-decoration-none">
                          <Card.Img
                            variant="top"
                            src={item.imageUrl ? `http://127.0.0.1:5000${item.imageUrl}` : "https://via.placeholder.com/150"}
                            alt={item.itemName}
                            className="feed-image"
                          />
                        </Link>
                        <Card.Body>
                          <Badge bg="danger">Lost</Badge>
                          {renderStatusBadge(item.status)}

                          <Card.Title className="mt-2">{item.itemName}</Card.Title>
                          <Card.Text>{item.description}</Card.Text>
                          <Card.Text><strong>Location:</strong> {item.location}</Card.Text>
                          <Card.Text><strong>Date:</strong> {item.date}</Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <p className="no-items text-center">No lost items match your search.</p>
              )}
            </section>

            {/* 🟩 Found Items Section */}
            <section className="feed-section">
              <h4 className="section-title found">
                Found Items ({filteredFoundItems.length})
              </h4>
              {filteredFoundItems.length > 0 ? (
                <Row className="feed-cards-row">
                  {filteredFoundItems.map((item) => (
                    <Col key={item._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                      <Card className="feed-card shadow-sm clickable-card">
                        <Link to={`/item/${item._id}`} className="text-decoration-none">
                          <Card.Img
                            variant="top"
                            src={item.imageUrl ? `http://127.0.0.1:5000${item.imageUrl}` : "https://via.placeholder.com/150"}
                            alt={item.itemName}
                            className="feed-image"
                          />
                        </Link>
                        <Card.Body>
                          <Badge bg="success">Found</Badge>
                          {renderStatusBadge(item.status)}

                          <Card.Title className="mt-2">{item.itemName}</Card.Title>
                          <Card.Text>{item.description}</Card.Text>
                          <Card.Text><strong>Location:</strong> {item.location}</Card.Text>
                          <Card.Text><strong>Date:</strong> {item.date}</Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <p className="no-items text-center">No found items match your search.</p>
              )}
            </section>
          </>
        )}
      </Container>

      <Footer />
    </>
  );
}
