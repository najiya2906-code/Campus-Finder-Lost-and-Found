import React, { useEffect } from "react";
import "../css/toast.css";

const Toast = ({ message, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <div className={`toast-notification ${show ? "show" : ""}`}>
      <p>{message}</p>
    </div>
  );
};

export default Toast;
