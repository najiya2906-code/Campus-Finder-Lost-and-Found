import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Card, Button, Form, Spinner, Badge } from "react-bootstrap";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../css/itemDetail.css";
import "../css/ModalPopups.css";

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [popup, setPopup] = useState({ visible: false, type: "", message: "" });
  const [confirmPopup, setConfirmPopup] = useState(false);
  const [questionPopup, setQuestionPopup] = useState(false);
  const [answer, setAnswer] = useState("");

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?._id;

  // Load item details
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:5000/feed`);
        const foundItem = res.data.items?.find((it) => it._id === id);
        if (foundItem) setItem(foundItem);
        else showPopupMessage("error", "Item not found.");
      } catch {
        showPopupMessage("error", "Failed to load item details.");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  // Top Popup Message
  const showPopupMessage = (type, message) => {
    setPopup({ visible: true, type, message });
    setTimeout(() => setPopup({ visible: false, type: "", message: "" }), 3000);
  };

  // When user clicks claim button
  const handleClaimClick = () => {
    if (!userId) {
      showPopupMessage("error", "Please log in to perform this action.");
      return;
    }
    setConfirmPopup(true);
  };

  const handleConfirmYes = () => {
    setConfirmPopup(false);
    setQuestionPopup(true);
  };

  // SUBMIT RESPONSE API
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      showPopupMessage("error", "Please provide an answer.");
      return;
    }

    try {
      await axios.post(
        `http://127.0.0.1:5000/api/items/${item._id}/responses`,
        {
          userId,
          question: item.question,
          answer
        }
      );

      setQuestionPopup(false);
      showPopupMessage("success", "Your response has been submitted!");

      setAnswer("");
    } catch (err) {
      console.error("❌ Response submission error:", err);
      showPopupMessage("error", "Failed to submit response.");
    }
  };

  if (loading)
    return (
      <>
        <Navbar />
        <div className="text-center mt-5">
          <Spinner animation="border" />
        </div>
        <Footer />
      </>
    );

  return (
    <>
      <Navbar />
      <Container className="item-detail-page">
        <Card className="item-detail-card shadow-lg">
          <Card.Img
            variant="top"
            src={`http://127.0.0.1:5000${item.imageUrl}`}
            alt={item.itemName}
            className="detail-image"
          />
          <Card.Body>
            <Badge bg={item.type === "lost" ? "danger" : "success"} className="mb-3">
              {item.type.toUpperCase()}
            </Badge>

            <Card.Title>{item.itemName}</Card.Title>
            <Card.Text><strong>Description:</strong> {item.description}</Card.Text>
            <Card.Text><strong>Location:</strong> {item.location}</Card.Text>
            <Card.Text><strong>Date:</strong> {item.date}</Card.Text>

            <div className="text-center mt-4">
              <Button
                className={item.type === "lost" ? "found-btn" : "lost-btn"}
                onClick={handleClaimClick}
              >
                {item.type === "lost" ? "I Found This Item" : "I Lost This Item"}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>

      {/* Confirm Popup */}
      {confirmPopup && (
        <div className="top-popup confirm">
          Are you sure you want to {item.type === "lost" ? "claim this lost item?" : "report this found item as lost?"}
          <div className="popup-buttons">
            <Button variant="outline-secondary" size="sm" onClick={() => setConfirmPopup(false)}>No</Button>
            <Button variant="primary" size="sm" onClick={handleConfirmYes}>Yes</Button>
          </div>
        </div>
      )}

      {/* Question Popup */}
      {questionPopup && (
        <div className="top-popup question">
          <strong>Question:</strong> {item.question}
          <Form.Group className="mt-2">
            <Form.Control
              type="text"
              placeholder="Type your answer here"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </Form.Group>
          <div className="popup-buttons mt-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setQuestionPopup(false)}>Close</Button>
            <Button variant="success" size="sm" onClick={handleSubmitAnswer}>Submit</Button>
          </div>
        </div>
      )}

      {/* Success/Error Popup */}
      {popup.visible && (
        <div className={`top-popup ${popup.type}`}>
          {popup.type === "success" ? "✔" : "❌"} {popup.message}
        </div>
      )}

      <Footer />
    </>
  );
}
