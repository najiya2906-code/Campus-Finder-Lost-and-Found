from flask import Blueprint, request, jsonify, current_app
from datetime import datetime

contact_bp = Blueprint("contact", __name__)

# ---------------- POST: Submit contact message ----------------
@contact_bp.route("/api/contact", methods=["POST"])
def submit_contact():
    try:
        mongo = current_app.mongo

        # Get JSON data from frontend
        data = request.get_json()
        print("Received contact data:", data)  # Debugging

        # Extract fields
        name = data.get("name")
        email = data.get("email")
        message = data.get("message")

        # Validate required fields
        if not all([name, email, message]):
            return jsonify({"error": "All fields are required"}), 400

        # Insert into MongoDB
        contact_doc = {
            "full_name": name,
            "email": email,
            "message": message,
            "created_at": datetime.utcnow()
        }

        mongo.db.contacts.insert_one(contact_doc)
        return jsonify({"message": "Message submitted successfully"}), 201

    except Exception as e:
        print("Error in contact submission:", e)
        return jsonify({"error": str(e)}), 500

# ---------------- GET: Fetch all contacts (admin) ----------------
@contact_bp.route("/api/contact", methods=["GET"])
@contact_bp.route("/api/contact", methods=["GET"])
def get_contacts():
    try:
        mongo = current_app.mongo
        contacts = list(mongo.db.contacts.find())

        # Convert ObjectId and datetime to string safely
        for c in contacts:
            c["_id"] = str(c["_id"])
            # Only call isoformat if created_at is datetime
            if isinstance(c.get("created_at"), datetime):
                c["created_at"] = c["created_at"].isoformat()
            else:
                # keep as is (string) or provide fallback
                c["created_at"] = str(c.get("created_at", ""))

        return jsonify(contacts), 200

    except Exception as e:
        print("Error fetching contacts:", e)
        return jsonify({"error": str(e)}), 500
