import React, { useState } from "react";
import "../css/Login.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Spinner } from "react-bootstrap";
import Swal from "sweetalert2";

function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async () => {
    setLoading(true);

    const payload = {
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value.trim(),
    };

    if (!payload.email || !payload.password) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please enter both email and password.",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/login",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.user) {
        const user = response.data.user;

        // ✅ Store user and token
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(user));

        Swal.fire({
          icon: "success",
          title: "Login Successful!",
          text: `Welcome back, ${user.name || "User"} 👋`,
          showConfirmButton: false,
          timer: 1500,
        });

        // ✅ Redirect based on role
        setTimeout(() => {
          if (user.role === "admin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/feed");
          }
        }, 1500);
      }
    } catch (error) {
      const message =
        (error.response && error.response.data.message) ||
        "Something went wrong. Please try again.";

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="login-container">
        <form className="login-box">
          <h1 className="text-center mb-4">Log In</h1>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="button"
            className="btn-submit"
            onClick={login}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : "Log In"}
          </button>

          <p className="text-center mt-3">
            Don't have an account? <a href="/Signup">Sign Up here</a>
          </p>
        </form>
      </div>

      <Footer />
    </>
  );
}

export default Login;
