import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Greeting from "../components/Greeting";
import "../css/Postitems.css";

export default function PostItem() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(""); // simple manual location
  const [date, setDate] = useState("");
  const [type, setType] = useState("lost");
  const [image, setImage] = useState(null);
  const [question, setQuestion] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const formData = new FormData();
    formData.append("userId", user?._id);
    formData.append("itemName", itemName);
    formData.append("description", description);
    formData.append("location", location); // simple text
    formData.append("date", date);
    formData.append("type", type);
    formData.append("question", question);
    if (image) formData.append("image", image);

    Axios.post("http://127.0.0.1:5000/postitem", formData)
      .then((res) => {
        if (res.data.success) {
          navigate("/Feed");
        } else {
          setErrorMsg(res.data.message || "Error occurred while posting item.");
        }
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(
          err.response?.data?.message || "Error occurred while posting item."
        );
      })
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <Navbar />
      <div
        style={{
          position: "absolute",
          top: "70px",
          left: "20px",
          fontSize: "22px",
          fontWeight: "600",
          color: "#0d6efd",
        }}
      >
        <Greeting />
      </div>

      <div className="postitem-page" style={{ padding: "20px" }}>
        <div className="postitem-card">
          <h2>Post New Item</h2>
          {errorMsg && <p className="error-msg">{errorMsg}</p>}

          <form onSubmit={handleSubmit}>
            <label>Item Name</label>
            <input
              type="text"
              placeholder="Enter item name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />

            <label>Description</label>
            <textarea
              placeholder="Enter item description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <label>📍 Location</label>
            <input
              type="text"
              placeholder="Enter where you lost/found it (e.g. Library, Parking Area)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />

            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>

            <label>Enter a Question Based on Item</label>
            <input
              type="text"
              placeholder="Enter a question related to the item (for verification)"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />

            <label>Image</label>
            <input type="file" onChange={(e) => setImage(e.target.files[0])} />

            <button type="submit" disabled={loading}>
              {loading ? "Posting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
