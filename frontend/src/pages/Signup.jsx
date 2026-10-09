import React, { Component } from "react";
import "../css/Signup.css";
import axios from "axios";
import Navbar from "../components/Navbar";
import { Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2"; // ✅ Import SweetAlert2
import Footer from "../components/Footer";
export default class Signup extends Component {
  constructor() {
    super();
    this.state = {
      loading: false,
      role: "user",
      showPassword: false,
      showCPassword: false,
    };
  }

  validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  validatePhone = (number) => /^[0-9]{10}$/.test(number);

  togglePassword = (field) => {
    if (field === "password") {
      this.setState({ showPassword: !this.state.showPassword });
    } else if (field === "cpassword") {
      this.setState({ showCPassword: !this.state.showCPassword });
    }
  };

  submit = () => {
    this.setState({ loading: true });

    const payload = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      contactNumber: document.getElementById("number").value.trim(),
      password: document.getElementById("password").value,
      cpassword: document.getElementById("cpassword").value,
      role: this.state.role,
    };

    // ---- Frontend Validations ----
    if (
      !payload.name ||
      !payload.email ||
      !payload.contactNumber ||
      !payload.password ||
      !payload.cpassword
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields!",
        text: "Please fill out all fields before continuing.",
      });
      this.setState({ loading: false });
      return;
    }

    if (!this.validateEmail(payload.email)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Email Format!",
        text: "Please enter a valid email address.",
      });
      this.setState({ loading: false });
      return;
    }

    if (!this.validatePhone(payload.contactNumber)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Phone Number!",
        text: "Phone number must contain exactly 10 digits.",
      });
      this.setState({ loading: false });
      return;
    }

    if (payload.password !== payload.cpassword) {
      Swal.fire({
        icon: "error",
        title: "Password Mismatch!",
        text: "Passwords do not match. Please try again.",
      });
      this.setState({ loading: false });
      return;
    }

    // ---- Send to Backend ----
    axios
      .post("http://127.0.0.1:5000/signup", payload, {
        headers: { "Content-Type": "application/json" },
      })
      .then((response) => {
        const res = response.data;

        if (res.success) {
          Swal.fire({
            icon: "success",
            title: "Account Created Successfully 🎉",
            text: "Redirecting you to the login page...",
            showConfirmButton: false,
            timer: 1800,
          });

          setTimeout(() => (window.location.href = "/Login"), 1800);
        } else {
          Swal.fire({
            icon: "info",
            title: "Signup Info",
            text: res.message || "Signup completed with a note.",
          });
        }

        this.setState({ loading: false });
      })
      .catch((error) => {
        const errMsg =
          error.response?.data?.message ||
          error.response?.data?.errors?.[0] ||
          "⚠️ Something went wrong. Please try again later.";

        Swal.fire({
          icon: "error",
          title: "Signup Failed!",
          text: errMsg,
        });

        this.setState({ loading: false });
      });
  };

  handleRoleChange = (e) => {
    this.setState({ role: e.target.value });
  };

  render() {
    const { loading, role, showPassword, showCPassword } = this.state;

    return (
      <>
        <Navbar />
        <div className="signup-container">
          <form className="signup-box" onSubmit={(e) => e.preventDefault()}>
            <h1>Create Account</h1>

            <input type="text" id="name" placeholder="Full Name" required />
            <input type="email" id="email" placeholder="Email" required />

            <input
              type="text"
              id="number"
              placeholder="Phone Number"
              maxLength="10"
              pattern="[0-9]*"
              inputMode="numeric"
              onInput={(e) =>
                (e.target.value = e.target.value.replace(/[^0-9]/g, ""))
              }
              required
            />

            {/* Password Field */}
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Password"
                required
              />
              <span
                className="toggle-eye"
                onClick={() => this.togglePassword("password")}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </span>
            </div>

            {/* Confirm Password Field */}
            <div className="password-field">
              <input
                type={showCPassword ? "text" : "password"}
                id="cpassword"
                placeholder="Confirm Password"
                required
              />
              <span
                className="toggle-eye"
                onClick={() => this.togglePassword("cpassword")}
              >
                {showCPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </span>
            </div>

            <select value={role} onChange={this.handleRoleChange}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            <button
              type="button"
              className="btn-submit"
              onClick={this.submit}
              disabled={loading}
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>

            <p>
              Already have an account? <a href="/Login">Log in here</a>
            </p>
          </form>
        </div>
         <Footer />
      </>
    );
  }    
}
