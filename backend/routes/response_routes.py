from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime, timedelta

response_bp = Blueprint("responses", __name__)

# ------------------------------
# Helper: Update item status
# ------------------------------
def update_item_status(mongo, item_id):
    try:
        item = mongo.db.items.find_one({"_id": ObjectId(item_id)})
        if not item:
            print(f"[update_item_status] Item not found for ID={item_id}")
            return

        today = datetime.utcnow()
        cutoff_date = today - timedelta(days=20)

        responses = list(mongo.db.claim_responses.find({"itemId": item_id}))
        if any(r.get("status") == "Approved" for r in responses):
            status = "Resolved"
        elif item.get("createdAt") and item["createdAt"] < cutoff_date:
            status = "Unresolved"
        else:
            status = "Active"

        mongo.db.items.update_one({"_id": item["_id"]}, {"$set": {"status": status}})
        print(f"[update_item_status] Updated: {item['_id']} -> {status}")
    except Exception as e:
        print("❌ update_item_status error:", e)


# ------------------------------
# Helper: Create Notification
# ------------------------------
def create_notification(mongo, user_id, title, message, link=""):
    try:
        notification = {
            "userId": str(user_id),
            "title": title,
            "message": message,
            "link": link,
            "isRead": False,
            "createdAt": datetime.utcnow(),
        }
        mongo.db.notifications.insert_one(notification)
        print("🔔 Notification Created:", notification)
    except Exception as e:
        print("❌ create_notification error:", e)


# ------------------------------
# POST — Submit Response to Item
# ------------------------------
@response_bp.route("/api/items/<item_id>/responses", methods=["POST"])
def submit_response(item_id):
    try:
        mongo = current_app.mongo
        data = request.json
        user_id = data.get("userId")
        question = data.get("question")
        answer = data.get("answer")

        if not all([user_id, question, answer]):
            return jsonify({"success": False, "message": "Missing fields"}), 400

        # Save response
        response_doc = {
            "itemId": item_id,
            "userId": str(user_id),
            "question": question,
            "answer": answer,
            "time": datetime.utcnow(),
            "status": "Pending Moderation"
        }

        insert_result = mongo.db.claim_responses.insert_one(response_doc)
        response_doc["_id"] = str(insert_result.inserted_id)

        # Attach user info
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        response_doc["userName"] = user["name"] if user else "Unknown"
        response_doc["userMobile"] = user.get("contactNumber", "N/A") if user else "N/A"

        # Notify owner about new response
        item = mongo.db.items.find_one({"_id": ObjectId(item_id)})
        if item:
            owner_id = str(item["userId"])
            item_name = item.get("itemName", "")
            create_notification(
                mongo,
                owner_id,
                "New Response Received",
                f"{response_doc['userName']} responded to your item '{item_name}', Check your My Listing",
                "/MyListings"
            )
            update_item_status(mongo, item_id)

        print("📥 Response Saved:", response_doc)
        return jsonify({"success": True, "response": response_doc}), 201

    except Exception as e:
        print("❌ Submit Response Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# ------------------------------
# GET all responses for a user
# ------------------------------
@response_bp.route("/api/responses/user/<user_id>", methods=["GET"])
def get_user_responses(user_id):
    try:
        mongo = current_app.mongo
        responses = list(mongo.db.claim_responses.find({"userId": user_id}).sort("time", -1))
        result = []
        for r in responses:
            r["_id"] = str(r["_id"])
            r["itemId"] = str(r.get("itemId"))
            user = mongo.db.users.find_one({"_id": ObjectId(r["userId"])})
            r["userName"] = user["name"] if user else "Unknown"
            r["userMobile"] = user.get("contactNumber", "N/A") if user else "N/A"
            result.append(r)
        return jsonify({"success": True, "responses": result}), 200
    except Exception as e:
        print("❌ get_user_responses error:", e)
        return jsonify({"success": False, "error": str(e)}), 500


# ------------------------------
# GET all responses for an item
# ------------------------------
@response_bp.route("/api/items/<item_id>/responses", methods=["GET"])
def get_item_responses(item_id):
    try:
        mongo = current_app.mongo
        responses = list(mongo.db.claim_responses.find({"itemId": item_id}).sort("time", -1))
        for r in responses:
            user = mongo.db.users.find_one({"_id": ObjectId(r["userId"])})
            r["_id"] = str(r["_id"])
            r["userName"] = user["name"] if user else "Unknown"
            r["userMobile"] = user.get("contactNumber", "N/A") if user else "N/A"
        return jsonify({"success": True, "responses": responses}), 200
    except Exception as e:
        print("❌ get_item_responses error:", e)
        return jsonify({"success": False, "message": "Failed to fetch responses"}), 500


# ------------------------------
# PUT — Moderate response (approve/reject)
# ------------------------------
@response_bp.route("/api/responses/<response_id>/moderate", methods=["PUT"])
def moderate_response(response_id):
    try:
        mongo = current_app.mongo
        data = request.json
        status = data.get("status")
        if status not in ["Approved", "Rejected"]:
            return jsonify({"success": False, "message": "Invalid status value"}), 400

        # Update response status
        result = mongo.db.claim_responses.update_one(
            {"_id": ObjectId(response_id)},
            {"$set": {"status": status}}
        )

        if result.matched_count == 0:
            return jsonify({"success": False, "message": "Response not found"}), 404

        updated = mongo.db.claim_responses.find_one({"_id": ObjectId(response_id)})
        user = mongo.db.users.find_one({"_id": ObjectId(updated["userId"])}) if updated else None
        updated["_id"] = str(updated["_id"])
        updated["userName"] = user["name"] if user else "Unknown"
        updated["userMobile"] = user.get("contactNumber", "N/A") if user else "N/A"

        # Get item info
        item = mongo.db.items.find_one({"_id": ObjectId(updated["itemId"])})
        item_name = item.get("itemName", "") if item else ""

        # Notify responder: "Your response was approved/rejected"
        create_notification(
            mongo,
            updated["userId"],
            f"Your claim was {status}",
            f"Your response for '{item_name}' was {status.lower()} by the owner.",
            f"/item/{updated['itemId']}"
        )

        # Notify owner: "You marked a response as approved/rejected"
        if item:
            create_notification(
                mongo,
                str(item["userId"]),
                f"Claim {status}",
                f"You marked a response for '{item_name}' as {status}.",
                f"/item/{updated['itemId']}"
            )

        # Update item status
        update_item_status(mongo, updated["itemId"])

        return jsonify({"success": True, "response": updated}), 200

    except Exception as e:
        print("❌ moderate_response error:", e)
        return jsonify({"success": False, "message": "Failed to update response status"}), 500
