from flask import Flask
from flask import send_from_directory
from flask_pymongo import PyMongo
from flask_cors import CORS
import os

# Import blueprints
from routes.auth_routes import auth_bp
from routes.post_routes import post_bp   # ✅ new import
from routes.feed_routes import feed_bp 
from routes.claim_routes import claim_bp
from routes.response_routes import response_bp
from routes.feed_routes import item_bp
from routes.contact_routes import contact_bp
from routes.admin_routes import admin_bp
from routes.chatbot_routes import chatbot_bp
from routes.notification_routes import notification_bp
from routes.admin_notification_routes import admin_notification_bp

app = Flask(__name__)
CORS(app)

# ---------------- MongoDB Config ----------------
app.config["MONGO_URI"] = "mongodb://localhost:27017/Lost_Found"
mongo = PyMongo(app)

# ---------------- Secret Key ----------------
app.config['SECRET_KEY'] = "your_secret_key_here"

# Attach mongo to app context so blueprint can use it
app.mongo = mongo
chatbot_bp.mongo = mongo


# ---------------- Ensure Uploads Folder Exists ----------------
os.makedirs("uploads", exist_ok=True)

# ---------------- Register blueprints ----------------
app.register_blueprint(auth_bp)
app.register_blueprint(post_bp)   # ✅ new blueprint added
app.register_blueprint(feed_bp)
app.register_blueprint(claim_bp)
app.register_blueprint(response_bp)
app.register_blueprint(item_bp)
app.register_blueprint(contact_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(chatbot_bp)
app.register_blueprint(notification_bp)
app.register_blueprint(admin_notification_bp)

# ---------------- Serve Uploaded Images ----------------
@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory("uploads", filename)

# ---------------- Root Test Route ----------------
@app.route("/")
def index():
    return "Lost & Found API is running!"

if __name__ == "__main__":
    app.run(debug=True)
