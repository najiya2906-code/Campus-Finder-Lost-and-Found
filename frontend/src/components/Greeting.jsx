// src/components/Greeting.jsx
import React from "react";

const Greeting = () => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userName = user?.name;

  if (!userName) return null; // Don't show if no user

  return <>Hello, {userName} 👋</>; // Just plain text
};

export default Greeting;
