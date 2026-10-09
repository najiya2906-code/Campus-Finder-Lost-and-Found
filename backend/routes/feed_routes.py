# routes/feed_routes.py

from flask import Blueprint, jsonify, request, current_app
from datetime import datetime, timedelta
from bson import ObjectId
import os
from werkzeug.utils import secure_filename

feed_bp = Blueprint("feed", __name__)
item_bp = Blueprint("item", __name__)

# Allowed image extensions
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
UPLOAD_FOLDER = "uploads"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# -------------------- FEED ROUTE --------------------
@feed_bp.route("/feed", methods=["GET"])
def get_feed():
    try:
        mongo = current_app.mongo
        items = list(mongo.db.items.find())

        today = datetime.utcnow()
        cutoff_date = today - timedelta(days=20)
        formatted_items = []

        for item in items:
            item_id_str = str(item["_id"])
            responses = list(mongo.db.claim_responses.find({"itemId": item_id_str}))

            # Determine status according to rules
            status = "Active"
            if responses:
                if any(r.get("status") == "Approved" for r in responses):
                    status = "Resolved"
                else:
                    status = "Unresolved" if item["createdAt"] < cutoff_date else "Active"
            else:
                status = "Unresolved" if item["createdAt"] < cutoff_date else "Active"

            formatted_items.append({
                "_id": item_id_str,
                "userId": item.get("userId", ""),
                "itemName": item.get("itemName", ""),
                "description": item.get("description", ""),
                "location": item.get("location", ""),
                "date": item.get("date", ""),
                "type": item.get("type", ""),
                "imageUrl": item.get("imageUrl", ""),
                "createdAt": item.get("createdAt", datetime.now()).isoformat(),
                "status": status
            })

        # Sort latest first
        formatted_items.sort(key=lambda x: datetime.fromisoformat(x["createdAt"]), reverse=True)

        return jsonify(formatted_items), 200

    except Exception as e:
        print("Error fetching feed:", e)
        return jsonify({"error": str(e)}), 500


# -------------------- GET ITEMS FOR REACT --------------------
@item_bp.route("/getitem", methods=["GET"])
def get_items():
    try:
        mongo = current_app.mongo
        items = list(mongo.db.items.find())

        today = datetime.utcnow()
        cutoff_date = today - timedelta(days=20)
        formatted_items = []

        for item in items:
            item_id_str = str(item["_id"])
            responses = list(mongo.db.claim_responses.find({"itemId": item_id_str}))

            status = "Active"
            if responses:
                if any(r.get("status") == "Approved" for r in responses):
                    status = "Resolved"
                else:
                    status = "Unresolved" if item["createdAt"] < cutoff_date else "Active"
            else:
                status = "Unresolved" if item["createdAt"] < cutoff_date else "Active"

            formatted_items.append({
                "_id": item_id_str,
                "userId": item.get("userId", ""),
                "itemName": item.get("itemName", ""),
                "description": item.get("description", ""),
                "location": item.get("location", ""),
                "date": item.get("date", ""),
                "type": item.get("type", ""),
                "imageUrl": item.get("imageUrl", ""),
                "createdAt": item.get("createdAt"),
                "status": status
            })

        return jsonify({"success": True, "postitems": formatted_items}), 200

    except Exception as e:
        print("Get Items Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# -------------------- GET ITEMS BY USER --------------------
@item_bp.route("/api/items/user/<user_id>", methods=["GET"])
def get_items_by_user(user_id):
    try:
        mongo = current_app.mongo
        user_items = list(mongo.db.items.find({"userId": user_id}))

        today = datetime.utcnow()
        cutoff_date = today - timedelta(days=20)
        for item in user_items:
            item_id_str = str(item["_id"])
            responses = list(mongo.db.claim_responses.find({"itemId": item_id_str}))

            status = "Active"
            if responses:
                if any(r.get("status") == "Approved" for r in responses):
                    status = "Resolved"
                else:
                    status = "Unresolved" if item["createdAt"] < cutoff_date else "Active"
            else:
                status = "Unresolved" if item["createdAt"] < cutoff_date else "Active"

            item["status"] = status
            item["_id"] = item_id_str

        return jsonify({"items": user_items}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- UPDATE ITEM --------------------
@item_bp.route("/api/items/<item_id>", methods=["PUT"])
def update_item(item_id):
    try:
        mongo = current_app.mongo
        data = request.get_json()

        required_fields = ["itemName", "description", "location", "date", "question", "type", "imageUrl"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        result = mongo.db.items.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": {
                "itemName": data["itemName"],
                "description": data["description"],
                "location": data["location"],
                "date": data["date"],
                "question": data["question"],
                "type": data["type"],
                "imageUrl": data["imageUrl"]
            }}
        )

        if result.matched_count == 0:
            return jsonify({"message": "Item not found"}), 404

        return jsonify({"message": "Item updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- DELETE ITEM --------------------
@item_bp.route("/api/items/<item_id>", methods=["DELETE"])
def delete_item(item_id):
    try:
        mongo = current_app.mongo
        result = mongo.db.items.delete_one({"_id": ObjectId(item_id)})

        if result.deleted_count == 0:
            return jsonify({"message": "Item not found"}), 404

        return jsonify({"message": "Item deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- IMAGE UPLOAD --------------------
@item_bp.route("/api/items/upload", methods=["POST"])
def upload_item_image():
    if "image" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}")
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        return jsonify({"imageUrl": f"/{UPLOAD_FOLDER}/{filename}"}), 200
    else:
        return jsonify({"error": "File type not allowed"}), 400
