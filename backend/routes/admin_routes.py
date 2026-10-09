import re
from flask import Blueprint, jsonify, request, current_app
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from dateutil import parser as dateparser  # pip install python-dateutil
import pytz
admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

# ---------------- Helper Function ----------------
def log_activity(mongo, user, action, target):
    """
    Logs admin actions to the activity collection
    Ensures: 
        - No empty fields
        - Proper timestamp
        - Prevents breaking if DB insert fails
    """
    try:
        if not user:
            user = "Admin"
        if not action:
            action = "performed action"
        if not target:
            target = "N/A"

        mongo.db.activity.insert_one({
            "user": user,
            "action": action,
            "target": target,
            "timestamp": datetime.utcnow()
        })

    except Exception as e:
        print("Failed to log activity:", e)


# ---------------- Dashboard Stats ----------------
@admin_bp.route("/stats", methods=["GET"])
def get_stats():
    try:
        mongo = current_app.mongo
        users_count = mongo.db.users.count_documents({})
        lost_items_count = mongo.db.items.count_documents({"type": "lost"})
        found_items_count = mongo.db.items.count_documents({"type": "found"})
        contacts_count = mongo.db.contacts.count_documents({})
        claims_pending = mongo.db.claim_responses.count_documents({"status": "Pending Moderation"})

        return jsonify({
            "users": users_count,
            "lostItems": lost_items_count,
            "foundItems": found_items_count,
            "contacts": contacts_count,
            "claimsPending": claims_pending
        }), 200
    except Exception as e:
        print("Error fetching stats:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- Chart: Items by Day ----------------
@admin_bp.route("/stats/items-by-day", methods=["GET"])
def items_by_day():
    try:
        days = int(request.args.get("days", 30))
        mongo = current_app.mongo
        cutoff = datetime.utcnow() - timedelta(days=days - 1)

        pipeline = [
            {
                "$project": {
                    "createdAt": {
                        "$cond": [
                            {"$ifNull": ["$createdAt", False]},
                            "$createdAt",
                            "$$NOW"
                        ]
                    }
                }
            },
            {
                "$addFields": {
                    "createdAtDate": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": {"$toDate": "$createdAt"}}
                    }
                }
            },
            {
                "$group": {
                    "_id": "$createdAtDate",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]

        try:
            agg = list(mongo.db.items.aggregate(pipeline))
            result = [{"date": a["_id"], "count": a["count"]} for a in agg]
        except Exception:
            docs = list(mongo.db.items.find({}, {"createdAt": 1}))
            counts = {}
            for d in docs:
                raw = d.get("createdAt")
                if not raw:
                    continue
                try:
                    dt = dateparser.parse(raw)
                except Exception:
                    continue
                if dt < cutoff:
                    continue
                key = dt.strftime("%Y-%m-%d")
                counts[key] = counts.get(key, 0) + 1
            result = []
            for i in range(days - 1, -1, -1):
                day = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
                result.append({"date": day, "count": counts.get(day, 0)})

        return jsonify(result), 200
    except Exception as e:
        print("Error items_by_day:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- Chart: Claims by Day ----------------
@admin_bp.route("/stats/claims-by-day", methods=["GET"])
def claims_by_day():
    try:
        days = int(request.args.get("days", 30))
        mongo = current_app.mongo
        cutoff = datetime.utcnow() - timedelta(days=days - 1)

        pipeline = [
            {
                "$project": {
                    "time": {
                        "$cond": [
                            {"$ifNull": ["$time", False]},
                            "$time",
                            "$$NOW"
                        ]
                    }
                }
            },
            {
                "$addFields": {
                    "timeDate": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": {"$toDate": "$time"}}
                    }
                }
            },
            {
                "$group": {
                    "_id": "$timeDate",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]

        try:
            agg = list(mongo.db.claim_responses.aggregate(pipeline))
            result = [{"date": a["_id"], "count": a["count"]} for a in agg]
        except Exception:
            docs = list(mongo.db.claim_responses.find({}, {"time": 1}))
            counts = {}
            for d in docs:
                raw = d.get("time")
                if not raw:
                    continue
                try:
                    dt = dateparser.parse(raw)
                except Exception:
                    continue
                if dt < cutoff:
                    continue
                key = dt.strftime("%Y-%m-%d")
                counts[key] = counts.get(key, 0) + 1
            result = []
            for i in range(days - 1, -1, -1):
                day = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
                result.append({"date": day, "count": counts.get(day, 0)})

        return jsonify(result), 200
    except Exception as e:
        print("Error claims_by_day:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- Chart: Top Items ----------------
@admin_bp.route("/stats/top-items", methods=["GET"])
def top_items():
    try:
        n = int(request.args.get("n", 8))
        mongo = current_app.mongo

        pipeline = [
            {"$group": {"_id": "$itemId", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": n}
        ]

        agg = list(mongo.db.claim_responses.aggregate(pipeline))

        result = []
        for entry in agg:
            item_id = entry["_id"]
            count = entry["count"]

            item_doc = mongo.db.items.find_one({"_id": ObjectId(item_id)})
            item_name = item_doc.get("itemName") if item_doc else "Unknown"

            result.append({"itemId": item_id, "itemName": item_name, "count": count})

        return jsonify(result), 200
    except Exception as e:
        print("Error top_items:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- Users ----------------
@admin_bp.route("/users", methods=["GET"])
def get_users():
    try:
        mongo = current_app.mongo
        users = list(mongo.db.users.find({}, {"password": 0}))
        for u in users:
            u["_id"] = str(u["_id"])
        return jsonify(users), 200
    except Exception as e:
        print("Error fetching users:", e)
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/users/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    try:
        mongo = current_app.mongo

        # ✅ Fetch user BEFORE deletion
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        username = user.get("name", "Unknown User") if user else "Unknown User"

        # ✅ Delete user
        mongo.db.users.delete_one({"_id": ObjectId(user_id)})

        # ✅ Log readable name instead of ID
        log_activity(mongo, "Admin", "deleted user", username)

        return jsonify({"success": True, "message": f"{username} deleted successfully"}), 200

    except Exception as e:
        print("Error deleting user:", e)
        return jsonify({"error": str(e)}), 500



@admin_bp.route("/users/<user_id>", methods=["PATCH"])
def patch_user(user_id):
    try:
        mongo = current_app.mongo
        data = request.json or {}
        allowed = ["name", "contactNumber", "role"]
        update = {k: data[k] for k in data if k in allowed}

        if update:
            mongo.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update})

            log_activity(mongo, "Admin", "updated user", user_id)

            return jsonify({"success": True, "message": "User updated"}), 200

        return jsonify({"success": False, "message": "No valid fields"}), 400
    except Exception as e:
        print("Error patching user:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- Items ----------------
@admin_bp.route("/items", methods=["GET"])
def get_items():
    try:
        mongo = current_app.mongo
        items_cursor = mongo.db.items.find()
        items = []

        for item in items_cursor:
            user = None
            try:
                user = mongo.db.users.find_one({"_id": ObjectId(item.get("userId"))})
            except Exception:
                user = None

            status = item.get("status", "Active")

            if status not in ["Resolved", "Unresolved", "Active"]:
                item_id_str = str(item["_id"])
                approved_claim = mongo.db.claim_responses.find_one(
                    {"itemId": item_id_str, "status": "Approved"}
                )
                if approved_claim:
                    status = "Resolved"
                    mongo.db.items.update_one(
                        {"_id": ObjectId(item_id_str)},
                        {"$set": {"status": "Resolved"}}
                    )

            items.append({
                "_id": str(item["_id"]),
                "itemName": item.get("itemName"),
                "description": item.get("description"),
                "location": item.get("location"),
                "date": item.get("date"),
                "type": item.get("type"),
                "question": item.get("question"),
                "userName": user.get("name") if user else "Unknown",
                "imageUrl": item.get("imageUrl"),
                "createdAt": item.get("createdAt"),
                "status": status
            })

        return jsonify(items), 200
    except Exception as e:
        print("Error fetching items:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- Update Item Status ----------------
@admin_bp.route("/items/<item_id>/status", methods=["PUT"])
def update_item_status(item_id):
    try:
        mongo = current_app.mongo
        data = request.json or {}
        new_status = data.get("status")

        if new_status not in ["Active", "Resolved", "Unresolved"]:
            return jsonify({"success": False, "message": "Invalid status"}), 400

        # ✅ Fetch item name before update
        item = mongo.db.items.find_one({"_id": ObjectId(item_id)})
        item_name = item.get("itemName", "Unknown Item") if item else "Unknown Item"

        mongo.db.items.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": {"status": new_status}}
        )

        # ✅ Log readable name
        log_activity(mongo, "Admin", f"changed status to {new_status}", item_name)

        return jsonify({"success": True, "message": f"{item_name} marked as {new_status}"}), 200

    except Exception as e:
        print("Error updating item status:", e)
        return jsonify({"error": str(e)}), 500



# ---------------- Contacts ----------------
@admin_bp.route("/contacts", methods=["GET"])
def get_contacts():
    try:
        mongo = current_app.mongo
        contacts = list(mongo.db.contacts.find())
        for c in contacts:
            c["_id"] = str(c["_id"])
        return jsonify(contacts), 200
    except Exception as e:
        print("Error fetching contacts:", e)
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/contacts/<contact_id>", methods=["DELETE"])
def delete_contact(contact_id):
    try:
        mongo = current_app.mongo

        # ✅ Fetch contact before deletion
        contact = mongo.db.contacts.find_one({"_id": ObjectId(contact_id)})
        contact_name = contact.get("name", "Unknown Contact") if contact else "Unknown Contact"

        # ✅ Delete contact
        mongo.db.contacts.delete_one({"_id": ObjectId(contact_id)})

        # ✅ Log readable name
        log_activity(mongo, "Admin", "deleted contact", contact_name)

        return jsonify({"success": True, "message": f"{contact_name} deleted successfully"}), 200
    except Exception as e:
        print("Error deleting contact:", e)
        return jsonify({"error": str(e)}), 500



# ---------------- Claims ----------------
@admin_bp.route("/claims", methods=["GET"])
def get_claims():
    try:
        mongo = current_app.mongo
        claims_cursor = mongo.db.claim_responses.find()
        claims = []

        for c in claims_cursor:
            try:
                user = mongo.db.users.find_one({"_id": ObjectId(c.get("userId"))})
            except Exception:
                user = None

            try:
                item = mongo.db.items.find_one({"_id": ObjectId(c.get("itemId"))})
            except Exception:
                item = None

            claims.append({
                "_id": str(c["_id"]),
                "itemName": item.get("itemName") if item else "Unknown",
                "userName": user.get("name") if user else "Unknown",
                "itemType": c.get("itemType"),
                "answer": c.get("answer"),
                "question": c.get("question"),
                "status": c.get("status"),
                "time": c.get("time")
            })

        return jsonify(claims), 200

    except Exception as e:
        print("Error fetching claims:", e)
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/claims/<claim_id>", methods=["PATCH"])
def update_claim(claim_id):
    try:
        mongo = current_app.mongo
        data = request.json or {}
        status = data.get("status")

        if status not in ["Approved", "Rejected"]:
            return jsonify({"error": "Invalid status"}), 400

        claim = mongo.db.claim_responses.find_one({"_id": ObjectId(claim_id)})
        if not claim:
            return jsonify({"error": "Claim not found"}), 404

        # ✅ Fetch readable item name
        item = mongo.db.items.find_one({"_id": ObjectId(claim.get("itemId"))})
        item_name = item.get("itemName", "Unknown Item") if item else "Unknown Item"

        mongo.db.claim_responses.update_one(
            {"_id": ObjectId(claim_id)},
            {"$set": {"status": status}}
        )

        if status == "Approved":
            mongo.db.items.update_one(
                {"_id": ObjectId(claim["itemId"])},
                {"$set": {"status": "Resolved"}}
            )

        # ✅ Log readable name instead of ID
        log_activity(mongo, "Admin", f"{status.lower()} claim", item_name)

        return jsonify({"success": True, "message": f"{item_name} claim {status}"}), 200
    except Exception as e:
        print("Error updating claim:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- Delete Item ----------------
@admin_bp.route("/items/<item_id>", methods=["DELETE"])
def delete_item(item_id):
    try:
        mongo = current_app.mongo

        # ✅ Fetch item BEFORE deleting
        item = mongo.db.items.find_one({"_id": ObjectId(item_id)})
        item_name = item.get("itemName", "Unknown Item") if item else "Unknown Item"

        # ✅ Delete item
        result = mongo.db.items.delete_one({"_id": ObjectId(item_id)})

        if result.deleted_count == 0:
            return jsonify({"success": False, "message": "Item not found"}), 404

        # ✅ Delete linked claims
        mongo.db.claim_responses.delete_many({"itemId": item_id})

        # ✅ Log readable name
        log_activity(mongo, "Admin", "deleted item", item_name)

        return jsonify({"success": True, "message": f"{item_name} deleted successfully"}), 200

    except Exception as e:
        print("Error deleting item:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- Activity Tracking ----------------

@admin_bp.route("/activity", methods=["GET"])
def get_activity():
    try:
        mongo = current_app.mongo

        logs_cursor = mongo.db.activity.find().sort("timestamp", -1).limit(200)

        IST = pytz.timezone("Asia/Kolkata")

        activity = []
        for log in logs_cursor:
            timestamp_value = log.get("timestamp")

            # ✅ Convert UTC → IST
            if isinstance(timestamp_value, datetime):
                timestamp_value = (
                    timestamp_value.replace(tzinfo=pytz.UTC)
                    .astimezone(IST)
                    .strftime("%Y-%m-%d %I:%M:%S %p")
                )
            else:
                timestamp_value = "N/A"

            raw_target = log.get("target", "N/A")
            target_name = raw_target  # fallback

            # ✅ Extract ObjectId from target text
            match = re.search(r"[0-9a-fA-F]{24}", str(raw_target))
            if match:
                oid = ObjectId(match.group(0))

                # ✅ Check Users Collection
                if "user" in raw_target.lower():
                    user = mongo.db.users.find_one({"_id": oid})
                    if user:
                        target_name = user.get("name") or user.get("email") or "Unknown User"

                # ✅ Check Items Collection
                elif "item" in raw_target.lower():
                    item = mongo.db.items.find_one({"_id": oid})
                    if item:
                        target_name = item.get("title") or item.get("name") or "Unknown Item"

                # ✅ Check Contacts Collection
                elif "contact" in raw_target.lower():
                    contact = mongo.db.contacts.find_one({"_id": oid})
                    if contact:
                        target_name = contact.get("name") or contact.get("email") or "Unknown Contact"

            activity.append({
                "_id": str(log.get("_id")),
                "user": log.get("user", "Admin"),
                "action": log.get("action"),
                "target": target_name,  # ✅ NOW SHOWS PROPER NAME
                "timestamp": timestamp_value
            })

        return jsonify(activity), 200

    except Exception as e:
        print("Error fetching activity logs:", e)
        return jsonify({"error": str(e)}), 500
