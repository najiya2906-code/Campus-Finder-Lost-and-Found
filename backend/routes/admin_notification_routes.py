from flask import Blueprint, jsonify, current_app
from bson import ObjectId
from datetime import datetime, timedelta
import pytz

admin_notification_bp = Blueprint("admin_notifications", __name__, url_prefix="/admin")

# ✅ Reusable Activity Logger
def log_activity(mongo, action, target):
    mongo.db.activity.insert_one({
        "user": "Admin",
        "action": action,
        "target": target,
        "timestamp": datetime.utcnow()
    })


# ---------------------------------------------------------
# GET ALL NOTIFICATIONS (Admin can see every notification)
# ---------------------------------------------------------
@admin_notification_bp.route("/notifications", methods=["GET"])
def get_all_notifications():
    try:
        mongo = current_app.mongo

        notifications = list(
            mongo.db.notifications.find().sort("createdAt", -1)
        )

        for n in notifications:
            user = mongo.db.users.find_one({"_id": ObjectId(n["userId"])})

            n["_id"] = str(n["_id"])
            n["userName"] = user["name"] if user else "Unknown"
            n["userMobile"] = user.get("contactNumber", "N/A") if user else "N/A"

            if isinstance(n["createdAt"], datetime):
                IST = pytz.timezone("Asia/Kolkata")
                n["createdAt"] = n["createdAt"].replace(
                    tzinfo=pytz.UTC).astimezone(IST).strftime("%Y-%m-%d %I:%M:%S %p")

        return jsonify({
            "success": True,
            "notifications": notifications
        }), 200

    except Exception as e:
        print("❌ Admin Get Notifications Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500

# ---------------------------------------------------------
# MARK ONE NOTIFICATION AS READ (Admin)
# ---------------------------------------------------------
@admin_notification_bp.route("/notifications/<notif_id>/read", methods=["PUT"])
def admin_mark_notification_read(notif_id):
    try:
        mongo = current_app.mongo

        notif = mongo.db.notifications.find_one({"_id": ObjectId(notif_id)})
        if not notif:
            return jsonify({"success": False, "message": "Notification not found"}), 404

        mongo.db.notifications.update_one(
            {"_id": ObjectId(notif_id)},
            {"$set": {"isRead": True}}
        )

        # ✅ Extract notification text
        notif_message = notif.get("message") or notif.get("text") or notif.get("content") or "Notification"

        # ✅ Fetch user name
        user = mongo.db.users.find_one({"_id": ObjectId(notif["userId"])})
        username = user.get("name") if user else "Unknown"

        # ✅ Combine username + message
        target_text = f"{username} — {notif_message}"

        # ✅ Log activity
        log_activity(mongo, "marked notification as read", target_text)

        return jsonify({
            "success": True,
            "message": "Notification marked as read"
        }), 200

    except Exception as e:
        print("❌ Admin Mark Read Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# ---------------------------------------------------------
# DELETE A NOTIFICATION (Admin)
# ---------------------------------------------------------
@admin_notification_bp.route("/notifications/<notif_id>", methods=["DELETE"])
def delete_notification(notif_id):
    try:
        mongo = current_app.mongo

        notif = mongo.db.notifications.find_one({"_id": ObjectId(notif_id)})
        if not notif:
            return jsonify({"success": False, "message": "Notification not found"}), 404

        # ✅ Extract notification text before deleting
        notif_message = notif.get("message") or notif.get("text") or notif.get("content") or "Notification"

        # ✅ Fetch user name
        user = mongo.db.users.find_one({"_id": ObjectId(notif["userId"])})
        username = user.get("name") if user else "Unknown"

        # ✅ Combine username + message
        target_text = f"{username} — {notif_message}"

        mongo.db.notifications.delete_one({"_id": ObjectId(notif_id)})

        # ✅ Log Activity
        log_activity(mongo, "deleted notification", target_text)

        return jsonify({
            "success": True,
            "message": "Notification deleted"
        }), 200

    except Exception as e:
        print("❌ Delete Notification Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# ------------------ NEW STATS ROUTE ------------------
@admin_notification_bp.route("/notification-stats", methods=["GET"])
def notification_stats():
    try:
        mongo = current_app.mongo

        read_count = mongo.db.notifications.count_documents({"isRead": True})
        unread_count = mongo.db.notifications.count_documents({"isRead": False})

        today = datetime.utcnow()
        daily_data = []

        for i in range(7):
            day = today - timedelta(days=i)
            start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
            count = mongo.db.notifications.count_documents({"createdAt": {"$gte": start, "$lte": end}})
            daily_data.append({"date": day.strftime("%Y-%m-%d"), "count": count})

        daily_data.reverse()

        return jsonify({"read": read_count, "unread": unread_count, "daily": daily_data})

    except Exception as e:
        print("❌ Notification Stats Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500
