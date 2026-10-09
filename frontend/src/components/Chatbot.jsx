import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../css/Chatbot.css";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm CampusBot — how can I help you today? 😊" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { from: "user", text: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // ✅ Fixed endpoint to match Flask
      const res = await axios.post("http://127.0.0.1:5000/chatbot", {
        message: userMsg.text,
      });

      const botText = res.data?.reply || "Sorry, I didn't understand that.";
      setMessages((m) => [...m, { from: "bot", text: botText }]);
    } catch (err) {
      console.error("Chat error", err);
      setMessages((m) => [
        ...m,
        { from: "bot", text: "Sorry — the chat service is unavailable." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <>
      <div className={`chatbot ${open ? "open" : ""}`}>
        <div className="chat-header" onClick={() => setOpen((o) => !o)}>
          <div>CampusBot</div>
          <div className="status-dot" title="Assistant"></div>
        </div>

        <div className="chat-body">
          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.from}`}>
                <div className="message-text">{m.text}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask how to post, claim, or contact admin..."
            />
            <button onClick={sendMessage} disabled={loading}>
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>

      {/* Floating button */}
      <button
        className="chat-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open chat"
      >
        💬
      </button>
    </>
  );
}
