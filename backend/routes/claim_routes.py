from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
from bson.objectid import ObjectId

claim_bp = Blueprint("claim", __name__)

@claim_bp.route("/claim_response", methods=["POST"])
def claim_response():
    try:
        mongo = current_app.mongo
        data = request.json

        # Required fields
        required_fields = ["itemId", "userId", "itemType", "answer"]
        if not all(field in data for field in required_fields):
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        item_id = data.get("itemId")
        user_id = data.get("userId")
        item_type = data.get("itemType")
        answer = data.get("answer", "").strip()

        if not answer:
            return jsonify({"success": False, "message": "Answer cannot be empty"}), 400

        # Fetch the item
        item = mongo.db.items.find_one({"_id": ObjectId(item_id)})
        if not item:
            return jsonify({"success": False, "message": "Item not found"}), 404

        question = item.get("question", "")

        response_doc = {
            "itemId": item_id,
            "userId": user_id,
            "itemType": item_type,
            "answer": answer,
            "question": question,
            "time": datetime.utcnow(),
            "status": "Pending Moderation"
        }

        mongo.db.claim_responses.insert_one(response_doc)

        # ✅ Dynamically update item status (optional)
        today = datetime.utcnow()
        cutoff_date = today - timedelta(days=20)
        responses = list(mongo.db.claim_responses.find({"itemId": item_id}))

        if any(r.get("status") == "Approved" for r in responses):
            item_status = "Resolved"
        elif item["createdAt"] < cutoff_date:
            item_status = "Unresolved"
        else:
            item_status = "Active"

        mongo.db.items.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": {"status": item_status}}
        )

        return jsonify({"success": True, "message": "Response saved successfully"}), 201

    except Exception as e:
        print("Error saving claim response:", e)
        return jsonify({"success": False, "message": str(e)}), 500
