import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
//import 'bootstrap/dist/css/bootstrap.min.css';

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Feed from "./pages/Feed"; // add Feed page after login
import Postitems from "./pages/Postitems";
import About from "./pages/About"; // Import About page with uppercase
import MyListings from "./pages/MyListings";
import ItemDetail from "./pages/ItemDetail";
import Responses from "./pages/Responses";
import AdminDashboard from "./admin/AdminDashboard";
import Users from "./admin/Users";
import Items from "./admin/Items";
import Contacts from "./admin/Contacts";
import Claims from "./admin/Claims";
import Chatbot from "./components/Chatbot";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/Feed" element={<Feed />} /> {/* After login page */}
        <Route path="/Postitems" element={<Postitems />} /> {/* After login page */}
        <Route path="/About" element={<About />} /> {/* About page */}
        <Route path="/mylistings" element={<MyListings />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/responses" element={<Responses />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/items" element={<Items />} />
        <Route path="/admin/contacts" element={<Contacts />} />
        <Route path="/admin/claims" element={<Claims />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
      <Chatbot />
    </Router>
    
  );
  
}

export default App;
