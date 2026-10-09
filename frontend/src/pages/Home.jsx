import React, { useRef, useState } from "react";
import { Container, Row, Col, Button, Form, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../css/landing.css";
import Footer from "../components/Footer";

export default function Home() {
  const contactRef = useRef(null);
  const navigate = useNavigate();

  // Contact form state
  const [contactData, setContactData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState(""); // success/error message

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Input change handler
  const handleChange = (e) => {
    setContactData({ ...contactData, [e.target.name]: e.target.value });
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    try {
      // Use full backend URL or proxy in package.json
      const response = await fetch("http://127.0.0.1:5000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus("Message sent successfully! ✅");
        setContactData({ name: "", email: "", message: "" }); // reset form
      } else {
        setStatus(result.error || "Something went wrong ❌");
      }
    } catch (error) {
      console.error("Error sending contact form:", error);
      setStatus("Server error ❌");
    }
  };

  return (
    <>
      <Navbar />
      <div className="home-page">

        {/* HERO SECTION */}
        <section className="hero d-flex flex-column justify-content-center align-items-center text-center">
          <Container>
            <Row className="justify-content-center">
              <Col lg={8}>
                <h1 className="display-3 fw-bold text-light mb-3 hero-title">
                  Welcome to CampusFinder 🎒
                </h1>
                <p className="lead text-light mb-4 fs-5 hero-subtitle">
                  Lost something on campus? We’ll help you find it quickly and effortlessly!
                </p>

                <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 mb-4 hero-buttons">
                  <Button
                    variant="primary"
                    size="lg"
                    className="fw-semibold px-5 py-3 rounded-pill shadow hover-scale"
                    onClick={() => navigate("/Signup")}
                  >
                    Sign Up
                  </Button>
                  <Button
                    variant="success"
                    size="lg"
                    className="fw-semibold px-5 py-3 rounded-pill shadow hover-scale"
                    onClick={() => navigate("/Login")}
                  >
                    Login
                  </Button>
                </div>

                <Button
                  variant="warning"
                  size="lg"
                  className="fw-semibold px-5 py-3 rounded-pill shadow hover-scale"
                  onClick={scrollToContact}
                >
                  Contact Us ↓
                </Button>
              </Col>
            </Row>
          </Container>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-it-works">
          <Container>
            <h2 className="display-5 fw-bold mb-3 text-center">How It Works ⚙️</h2>
            <p className="lead text-muted text-center mb-5">
              Get started in just three simple steps.
            </p>

            <div className="steps-row d-flex justify-content-center flex-wrap gap-4">
              <div className="step text-center">
                <div className="step-number bg-primary">1</div>
                <div className="step-title fw-bold mt-2">Create Account</div>
                <div className="step-desc text-muted mt-1">
                  Register using your student email to start reporting or finding items securely.
                </div>
              </div>

              <div className="step text-center">
                <div className="step-number bg-success">2</div>
                <div className="step-title fw-bold mt-2">List Lost or Found Items</div>
                <div className="step-desc text-muted mt-1">
                  Add item details, photos, and location so others can help reunite them.
                </div>
              </div>

              <div className="step text-center">
                <div className="step-number bg-warning">3</div>
                <div className="step-title fw-bold mt-2">Get Notifications</div>
                <div className="step-desc text-muted mt-1">
                  Receive alerts and connect directly with the finder or owner.
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* CONTACT FORM */}
        <section className="contact-section py-5" ref={contactRef}>
          <Container>
            <Row className="justify-content-center text-center mb-5">
              <Col lg={8}>
                <h2 className="display-5 fw-bold mb-3 contact-title">
                  Contact Us 📩
                </h2>
                <p className="lead text-muted contact-subtitle">
                  Have questions? We'd love to hear from you. Reach out anytime!
                </p>
              </Col>
            </Row>
            <Row className="justify-content-center">
              <Col md={8} lg={6}>
                <Card className="contact-card p-5 shadow-lg border-0">
                  <Card.Body>
                    <Form className="contact-form" onSubmit={handleSubmit}>
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold contact-label">Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          placeholder="Enter your full name"
                          className="contact-input"
                          value={contactData.name}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold contact-label">Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          placeholder="Enter your email"
                          className="contact-input"
                          value={contactData.email}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold contact-label">Message</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          name="message"
                          placeholder="Tell us how we can help..."
                          className="contact-input"
                          value={contactData.message}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>

                      {status && (
                        <p
                          className={`text-center fw-bold ${
                            status.includes("success") ? "text-success" : "text-danger"
                          }`}
                        >
                          {status}
                        </p>
                      )}

                      <div className="d-grid mt-3">
                        <Button
                          type="submit"
                          variant="primary"
                          size="lg"
                          className="fw-semibold rounded-pill py-3 shadow hover-scale"
                        >
                          Send Message
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </section>

         <Footer />
      </div>
    </>
  );
}
