from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt

auth_bp = Blueprint("auth", __name__)

# ----------------- SIGNUP -----------------
@auth_bp.route("/signup", methods=["POST"])
def signup():
    try:
        mongo = current_app.mongo   # ✅ FIX: use mongo from current_app
        data = request.get_json()
        print("Signup Data Received:", data)  # 👈 Debug print

        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        contactNumber = data.get("contactNumber")
        role = data.get("role", "user")

        if not all([name, email, password, contactNumber]):
            return jsonify({"success": False, "message": "All fields are required"}), 400

        if mongo.db.users.find_one({"email": email}):
            return jsonify({"success": False, "message": "Email already exists"}), 400

        hashed_password = generate_password_hash(password)
        user = {
            "name": name,
            "email": email,
            "password": hashed_password,
            "contactNumber": contactNumber,
            "role": role,
            "createdAt": datetime.utcnow()
        }

        mongo.db.users.insert_one(user)
        print("✅ User inserted successfully!")  # 👈 Debug print

        return jsonify({"success": True, "message": "User created successfully"}), 201

    except Exception as e:
        import traceback
        print("Signup Error:", e)
        traceback.print_exc()  # 👈 Shows exact line of error
        return jsonify({"success": False, "message": str(e)}), 500


# ----------------- LOGIN -----------------
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"message": "Email and password are required"}), 400

        mongo = current_app.mongo
        SECRET_KEY = current_app.config['SECRET_KEY']

        user = mongo.db.users.find_one({"email": email})
        if not user:
            return jsonify({"message": "Email not found"}), 404

        if not check_password_hash(user["password"], password):
            return jsonify({"message": "Incorrect password"}), 401

        token = jwt.encode(
            {
                "user_id": str(user["_id"]),
                "email": user["email"],
                "exp": datetime.utcnow() + timedelta(days=1)
            },
            SECRET_KEY,
            algorithm="HS256"
        )

        user_data = {
            "_id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "contactNumber": user["contactNumber"],
            "role": user["role"]
        }

        return jsonify({"user": user_data, "token": token}), 200

    except Exception as e:
        print("Login Error:", e)
        return jsonify({"message": "Internal server error"}), 500
