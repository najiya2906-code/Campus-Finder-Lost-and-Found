from flask_pymongo import PyMongo
from flask import current_app as app
import bcrypt

mongo = PyMongo()

def create_user(payload):
    db = mongo.db
    # Check if email already exists
    existing = db.users.find_one({"email": payload["email"]})
    if existing:
        return {"success": False, "message": "Email already registered"}

    # Hash the password
    hashed = bcrypt.hashpw(payload["password"].encode("utf-8"), bcrypt.gensalt())

    user = {
        "name": payload["name"],
        "email": payload["email"],
        "contactNumber": payload["contactNumber"],
        "password": hashed,
        "role": payload.get("role", "user"),
    }
    db.users.insert_one(user)
    return {"success": True, "message": "User created successfully"}
