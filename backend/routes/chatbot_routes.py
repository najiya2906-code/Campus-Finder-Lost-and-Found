from flask import Blueprint, request, jsonify
from datetime import datetime

chatbot_bp = Blueprint("chatbot_bp", __name__)

# ✅ Chatbot Route
@chatbot_bp.route("/chatbot", methods=["POST"])
def chatbot_reply():
    mongo = chatbot_bp.mongo
    data = request.get_json()
    user_message = data.get("message", "").lower()

    # --- Simple rule-based bot replies ---
    if any(word in user_message for word in ["post", "add", "upload", "lost", "found"]):
        reply = (
            "To post a lost or found item, go to the **'Post Item'** page. "
            "Fill in the item name, description, and location where it was lost or found, "
            "and then upload an image if possible."
        )

    elif any(word in user_message for word in ["claim", "retrieve", "get back", "return"]):
        reply = (
            "To claim your item, open the **'Responses'** section. "
            "If someone has responded to your post, match their details. "
            "If it’s your item, the contact number will be shown so you can reach out directly."
        )

    elif any(word in user_message for word in ["contact", "help", "admin", "support"]):
        reply = (
            "You can contact the admin through the **'Contact Us'** page or "
            "email mentioned in the Admin Dashboard."
        )

    elif any(word in user_message for word in ["login", "signup", "register", "account"]):
        reply = (
            "To use Campus Finder, you first need to **sign up or log in**. "
            "Go to the Home page → click on **Login** or **Signup** → fill your details → then access Feed and Post Item pages."
        )

    elif any(word in user_message for word in ["feed", "home", "dashboard"]):
        reply = (
            "The **Feed page** shows all recently posted lost and found items on campus. "
            "You can search by name, date, or location from the search bar."
        )

    elif any(word in user_message for word in ["notification", "alert", "message"]):
        reply = (
            "You’ll get automatic alerts when someone responds to your post. "
            "Notifications appear in your profile or via email (if enabled)."
        )

    elif any(word in user_message for word in ["resolve", "unresolved", "status", "pending"]):
        reply = (
            "If your lost item hasn’t been claimed within 15–20 days, "
            "it’s automatically marked as **Unresolved**. "
            "Resolved and unresolved items are visible under 'My Listings'."
        )

    elif any(word in user_message for word in ["location", "track", "map", "where"]):
        reply = (
            "Campus Finder lets you add the exact **location** where you lost or found an item. "
            "You can type it manually or use your current campus location for accuracy."
        )

    else:
        reply = (
            "I'm not sure about that 🤔. Try asking:\n"
            "- How to post a lost item?\n"
            "- How to claim an item?\n"
            "- How to contact admin?\n"
            "- How to check unresolved items?"
        )

    # --- Save chat in MongoDB ---
    chat_data = {
        "message": user_message,
        "reply": reply,
        "timestamp": datetime.now()
    }
    mongo.db.chatlogs.insert_one(chat_data)

    return jsonify({"reply": reply}), 200


# ✅ Admin can view all chat logs
@chatbot_bp.route("/admin/chatlogs", methods=["GET"])
def get_chatlogs():
    mongo = chatbot_bp.mongo
    logs = list(mongo.db.chatlogs.find({}, {"_id": 0}))
    return jsonify({"logs": logs}), 200
