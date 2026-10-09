from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime

notification_bp = Blueprint("notification_bp", __name__)


# ---------------------------------------------------
# CREATE NOTIFICATION
# ---------------------------------------------------
@notification_bp.route("/api/notifications", methods=["POST"])
def create_notification_route():
    try:
        mongo = current_app.mongo
        data = request.get_json()

        notification = {
            "userId": str(data.get("userId")),
            "title": data.get("title"),
            "message": data.get("message"),
            "link": data.get("link", ""),
            "isRead": False,
            "createdAt": datetime.utcnow(),
        }

        mongo.db.notifications.insert_one(notification)

        print("✅ Notification created:", notification)

        return jsonify({
            "success": True,
            "message": "Notification created successfully"
        }), 201

    except Exception as e:
        print("❌ Notification Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# ---------------------------------------------------
# GET ALL NOTIFICATIONS FOR A USER
# ---------------------------------------------------
@notification_bp.route("/api/notifications/<user_id>", methods=["GET"])
def get_notifications(user_id):
    try:
        mongo = current_app.mongo

        notifications = list(
            mongo.db.notifications.find({"userId": str(user_id)}).sort("createdAt", -1)
        )

        # Convert ObjectId to string for frontend
        for n in notifications:
            n["_id"] = str(n["_id"])
            n["createdAt"] = n["createdAt"].isoformat()

        return jsonify({
            "success": True,
            "notifications": notifications
        }), 200

    except Exception as e:
        print("❌ Fetch Notification Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# ---------------------------------------------------
# MARK ONE NOTIFICATION AS READ
# ---------------------------------------------------
@notification_bp.route("/api/notifications/<notif_id>/read", methods=["PUT"])
def mark_as_read(notif_id):
    try:
        mongo = current_app.mongo

        mongo.db.notifications.update_one(
            {"_id": ObjectId(notif_id)},
            {"$set": {"isRead": True}}
        )

        print(f"✅ Notification {notif_id} marked as read.")

        return jsonify({
            "success": True,
            "message": "Notification marked as read"
        }), 200

    except Exception as e:
        print("❌ Mark Read Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# ---------------------------------------------------
# MARK ALL NOTIFICATIONS AS READ FOR A USER
# ---------------------------------------------------
@notification_bp.route("/api/notifications/read-all/<user_id>", methods=["PUT"])
def mark_all_notifications_read(user_id):
    try:
        mongo = current_app.mongo

        mongo.db.notifications.update_many(
            {"userId": str(user_id), "isRead": False},
            {"$set": {"isRead": True}}
        )

        print(f"✅ All notifications for user {user_id} marked as read.")

        return jsonify({
            "success": True,
            "message": "All notifications marked as read"
        }), 200

    except Exception as e:
        print("❌ Mark All Read Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500
