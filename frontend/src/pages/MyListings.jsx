import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Button,
  Spinner,
  Badge,
  Alert,
  Form,
  Image,
  Modal,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../css/MyListings.css";

export default function MyListings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null); // modal open item
  const [formData, setFormData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [responses, setResponses] = useState({});
  const [viewingResponses, setViewingResponses] = useState({});
  const [userName, setUserName] = useState("");

  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?._id;

  useEffect(() => {
    if (user?.name) setUserName(user.name);
  }, [user]);

  if (!userId)
    return (
      <>
        <Navbar />
        <Container className="text-center mt-5">
          <p>You must log in to see this page.</p>
        </Container>
        <Footer />
      </>
    );

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/items/user/${userId}`);
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch your items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [userId]);

  const fetchResponses = async (itemId) => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/items/${itemId}/responses`);
      setResponses((prev) => ({ ...prev, [itemId]: res.data.responses }));
      setViewingResponses((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleModerate = async (itemId, responseId, status, userMobile) => {
    try {
      await axios.put(`http://127.0.0.1:5000/api/responses/${responseId}/moderate`, { status });
      const res = await axios.get(`http://127.0.0.1:5000/api/items/${itemId}/responses`);
      setResponses((prev) => ({ ...prev, [itemId]: res.data.responses }));
      if (status === "Approved") {
        alert(`Response Approved!\nContact: ${userMobile}`);
      } else {
        alert("Response Rejected!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update response status.");
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName,
      description: item.description,
      location: item.location,
      date: item.date,
      type: item.type,
      question: item.question,
      imageUrl: item.imageUrl || "",
    });
    setSelectedImage(null);
    setSuccessMsg("");
  };

  const handleSave = async (itemId) => {
    try {
      let updatedItem = { ...formData, updatedAt: new Date().toISOString() };
      if (selectedImage) {
        const imageData = new FormData();
        imageData.append("image", selectedImage);
        const imageRes = await axios.post(`http://127.0.0.1:5000/api/items/upload`, imageData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updatedItem.imageUrl = imageRes.data.imageUrl;
      }
      await axios.put(`http://127.0.0.1:5000/api/items/${itemId}`, updatedItem);
      setItems(items.map((it) => (it._id === itemId ? { ...it, ...updatedItem } : it)));
      setEditingItem(null);
      setSelectedImage(null);
      setSuccessMsg("Item updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to update item.");
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

      <Container className="mylistings-page mt-5">
        <h2 className="mylistings-title">My Listings</h2>
        {loading && <Spinner animation="border" className="d-block mx-auto" />}
        {error && <Alert variant="danger">{error}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}

        <div className="mylistings-grid">
          {items.map((item) => (
            <div className="mylistings-card shadow-sm" key={item._id}>
              <img
                src={item.imageUrl ? `http://127.0.0.1:5000${item.imageUrl}` : "https://via.placeholder.com/150"}
                className="feed-image clickable-image"
                alt={item.itemName}
                onClick={() => navigate(`/item/${item._id}`)}
              />
              <div className="card-body">
                <Badge bg={item.type === "lost" ? "warning" : "success"} className="mb-2 status-badge">
                  {item.type.toUpperCase()}
                </Badge>
                <h5 className="card-title">{item.itemName}</h5>
                <p className="card-text">{item.description}</p>
                <p className="card-text"><strong>Location:</strong> {item.location}</p>
                <p className="card-text"><strong>Date:</strong> {item.date}</p>

                <div className="action-buttons">
                  <Button className="btn-edit" onClick={() => handleEditClick(item)}>✏️ Edit</Button>
                  <Button className="btn-delete" onClick={async () => {
                    if (window.confirm("Are you sure you want to delete this item?")) {
                      await axios.delete(`http://127.0.0.1:5000/api/items/${item._id}`);
                      setItems(items.filter((i) => i._id !== item._id));
                    }
                  }}>🗑️ Delete</Button>
                  <Button className="btn-view" onClick={() => fetchResponses(item._id)}>
                    {viewingResponses[item._id] ? "👁️ Hide" : "💬 View"} Responses
                  </Button>
                </div>

                {/* Responses Section */}
                <div className={`responses-container ${viewingResponses[item._id] ? "show" : ""}`}>
                  {viewingResponses[item._id] &&
                    responses[item._id] &&
                    responses[item._id].map((r) => (
                      <Card key={r._id} className="mt-2 p-2 bg-light">
                        <p><strong>Q:</strong> {r.question}</p>
                        <p><strong>A:</strong> {r.answer}</p>
                        <p><small>{new Date(r.time).toLocaleString()}</small></p>
                        <p><strong>User:</strong> {r.userName}</p>
                        {r.status === "Approved" ? (
                          <p><strong>Contact:</strong> {r.userMobile}</p>
                        ) : (
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() =>
                                handleModerate(item._id, r._id, "Approved", r.userMobile)
                              }
                            >
                              Yes
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                handleModerate(item._id, r._id, "Rejected")
                              }
                            >
                              No
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Edit Modal */}
      <Modal
        show={editingItem !== null}
        onHide={() => setEditingItem(null)}
        centered
        size="lg"
        className="edit-item-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Item</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {editingItem && (
            <div className="edit-item-card">
              <div className="edit-image-container">
                <Image
                  src={
                    selectedImage
                      ? URL.createObjectURL(selectedImage)
                      : editingItem.imageUrl
                      ? `http://127.0.0.1:5000${editingItem.imageUrl}`
                      : "https://via.placeholder.com/180"
                  }
                  alt="Preview"
                  className="edit-image-preview"
                />
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedImage(e.target.files[0])}
                />
              </div>

              <div className="form-column">
                <Form.Group>
                  <Form.Label>Item Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.itemName}
                    onChange={(e) =>
                      setFormData({ ...formData, itemName: e.target.value })
                    }
                    placeholder="Enter item name"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter description"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Enter location"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    <option value="lost">Lost</option>
                    <option value="found">Found</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label>Question</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                    placeholder="Enter any question"
                  />
                </Form.Group>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditingItem(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleSave(editingItem._id)}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      <Footer />
    </>
  );
}
