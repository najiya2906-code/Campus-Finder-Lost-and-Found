import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../css/About.css";

export default function About() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="about-page">
      <Navbar userName={user?.name} />

      <section className="about-hero">
        <div className="about-hero-text">
          <h1>About CampusFinder</h1>
          <p>
            CampusFinder helps students quickly find lost items or report found items on campus. 
            Our mission is to make campus life safer and more organized.
          </p>
        </div>
      </section>

      <section className="about-content">
        <div className="content-card">
          <h2>Our Mission</h2>
          <p>
            We aim to simplify the process of returning lost items to their rightful owners 
            and create a community-driven solution for campus safety and organization.
          </p>
        </div>

        <div className="content-card">
          <h2>How It Works</h2>
          <p>
            Students can post lost or found items. Users can view feeds and respond to items. 
            The platform keeps everyone connected, reducing the stress of losing personal belongings.
          </p>
        </div>

        <div className="content-card">
          <h2>Our Vision</h2>
          <p>
            To become the most trusted and user-friendly campus lost & found solution, 
            helping students save time and reduce the worry of losing items.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
