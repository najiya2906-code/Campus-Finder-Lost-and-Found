from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
from bson import ObjectId
import os
from werkzeug.utils import secure_filename

post_bp = Blueprint("post", __name__)
UPLOAD_FOLDER = "uploads"

# Ensure uploads folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ✅ Helper function: Create notification safely
def create_notification(mongo, user_id, title, message, link="/Feed"):
    try:
        notification = {
            "userId": user_id,
            "title": title,
            "message": message,
            "link": link,
            "isRead": False,
            "createdAt": datetime.utcnow(),
        }
        mongo.db.notifications.insert_one(notification)
    except Exception as e:
        print("🔔 Notification Error:", e)


# -------------------- POST NEW ITEM --------------------
@post_bp.route("/postitem", methods=["POST"])
def post_item():
    try:
        mongo = current_app.mongo

        # Extract form data
        user_id = request.form.get("userId")
        itemName = request.form.get("itemName")
        description = request.form.get("description")
        location = request.form.get("location")
        date = request.form.get("date")
        type_ = request.form.get("type")
        question = request.form.get("question")
        image = request.files.get("image")

        # Validate required fields
        if not all([user_id, itemName, description, location, date, type_, question]):
            return jsonify({"success": False, "message": "All fields are required"}), 400

        # Handle image upload
        imageUrl = None
        if image:
            filename = secure_filename(image.filename)
            image.save(os.path.join(UPLOAD_FOLDER, filename))
            imageUrl = f"/uploads/{filename}"

        # Insert item document
        item = {
            "userId": user_id,
            "itemName": itemName,
            "description": description,
            "location": location,
            "date": date,
            "type": type_,
            "question": question,
            "imageUrl": imageUrl,
            "createdAt": datetime.utcnow(),
            "status": "Active",  # Default status
        }

        result = mongo.db.items.insert_one(item)
        item_id = result.inserted_id

        # -------------------- 🔔 NOTIFICATION FEATURE --------------------
        try:
            # Fetch posting user details (if available)
            user_doc = mongo.db.users.find_one({"_id": ObjectId(user_id)})
            user_name = user_doc.get("name", "Someone") if user_doc else "Someone"

            # Notify all users except the one who posted
            all_users = list(mongo.db.users.find({}, {"_id": 1}))
            for u in all_users:
                if str(u["_id"]) != user_id:
                    create_notification(
                        mongo,
                        str(u["_id"]),
                        f"New {type_.capitalize()} Item Posted",
                        f"{user_name} posted a {type_.lower()} item '{itemName}' at {location}. Check the Feed for details!",
                        "/Feed",
                    )
        except Exception as e:
            print("🔔 Broadcast Notification Error:", e)

        return jsonify({"success": True, "message": "Item posted successfully"}), 201

    except Exception as e:
        print("❌ Post Item Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# -------------------- FEED ROUTE --------------------
@post_bp.route("/feed", methods=["GET"])
def feed():
    try:
        mongo = current_app.mongo
        items_cursor = mongo.db.items.find().sort("createdAt", -1)
        today = datetime.utcnow()
        cutoff_date = today - timedelta(days=20)

        items = []
        for item in items_cursor:
            item_id_str = str(item["_id"])
            responses = list(mongo.db.claim_responses.find({"itemId": item_id_str}))

            # Determine status dynamically
            if responses:
                if any(r.get("status") == "Approved" for r in responses):
                    status = "Resolved"
                else:
                    status = "Unresolved" if item["createdAt"] < cutoff_date else "Active"
            else:
                status = "Unresolved" if item["createdAt"] < cutoff_date else "Active"

            items.append({
                "_id": item_id_str,
                "userId": item.get("userId", ""),
                "itemName": item.get("itemName", ""),
                "description": item.get("description", ""),
                "location": item.get("location", ""),
                "date": item.get("date", ""),
                "type": item.get("type", ""),
                "question": item.get("question", ""),
                "imageUrl": item.get("imageUrl", ""),
                "createdAt": item.get("createdAt"),
                "status": status,
            })

        return jsonify({"success": True, "items": items}), 200

    except Exception as e:
        print("❌ Feed Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# -------------------- GET ITEMS FOR REACT --------------------
@post_bp.route("/getitem", methods=["GET"])
def get_items():
    try:
        mongo = current_app.mongo
        items_cursor = mongo.db.items.find().sort("createdAt", -1)
        today = datetime.utcnow()
        cutoff_date = today - timedelta(days=20)

        items = []
        for item in items_cursor:
            item_id_str = str(item["_id"])
            responses = list(mongo.db.claim_responses.find({"itemId": item_id_str}))

            if responses:
                if any(r.get("status") == "Approved" for r in responses):
                    status = "Resolved"
                else:
                    status = "Unresolved" if item["createdAt"] < cutoff_date else "Active"
            else:
                status = "Unresolved" if item["createdAt"] < cutoff_date else "Active"

            items.append({
                "_id": item_id_str,
                "userId": item.get("userId", ""),
                "itemName": item.get("itemName", ""),
                "description": item.get("description", ""),
                "location": item.get("location", ""),
                "date": item.get("date", ""),
                "type": item.get("type", ""),
                "imageUrl": item.get("imageUrl", ""),
                "createdAt": item.get("createdAt"),
                "status": status,
            })

        return jsonify({"success": True, "postitems": items}), 200

    except Exception as e:
        print("❌ Get Items Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500
