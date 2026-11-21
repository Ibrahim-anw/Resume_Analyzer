import os
import re
import uuid

import mysql.connector

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv

from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

from PyPDF2 import PdfReader
from docx import Document


# Load Environment Variables
load_dotenv()


# Flask App Configuration
app = Flask(_name_)

app.secret_key = os.getenv("SECRET_KEY")

if not app.secret_key:
    raise RuntimeError("SECRET_KEY is missing from your .env file.")

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "docx"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False
)

CORS(
    app,
    origins=["http://localhost:5173"],
    supports_credentials=True
)


# MySQL Database Connection
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="resume_app",
        password=os.getenv("DB_PASSWORD"),
        database="resume_analyzer"
    )


# Database Table Creation
def create_users_table():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        connection.commit()

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Database Connection Test
@app.route("/db-test", methods=["GET"])
def db_test():
    connection = None

    try:
        connection = get_db_connection()

        return jsonify({
            "message": "MySQL Database Connected Successfully!",
            "status": "success"
        }), 200

    except Exception:
        app.logger.exception("Database connection failed")

        return jsonify({
            "error": "Database connection failed. Check MySQL settings."
        }), 500

    finally:
        if connection and connection.is_connected():
            connection.close()


# Register API
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Invalid request data"
        }), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({
            "error": "All fields are required"
        }), 400

    if len(password) < 8:
        return jsonify({
            "error": "Password must be at least 8 characters"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT id FROM users WHERE email = %s",
            (email,)
        )

        if cursor.fetchone():
            return jsonify({
                "error": "Email already registered"
            }), 409

        hashed_password = generate_password_hash(password)

        cursor.execute("""
            INSERT INTO users (name, email, password)
            VALUES (%s, %s, %s)
        """, (name, email, hashed_password))

        connection.commit()

        return jsonify({
            "message": "Registration successful!",
            "status": "success"
        }), 201

    except Exception:
        app.logger.exception("Registration failed")

        return jsonify({
            "error": "Registration failed"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Login API
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Invalid request data"
        }), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM users WHERE email = %s",
            (email,)
        )

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "error": "Invalid email or password"
            }), 401

        if not check_password_hash(user["password"], password):
            return jsonify({
                "error": "Invalid email or password"
            }), 401

        session.clear()

        session["user_id"] = user["id"]
        session["user_name"] = user["name"]
        session["user_email"] = user["email"]

        return jsonify({
            "message": "Login successful!",
            "status": "success",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        }), 200

    except Exception:
        app.logger.exception("Login failed")

        return jsonify({
            "error": "Login failed"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Current User / Profile API
@app.route("/me", methods=["GET"])
def current_user():
    if "user_id" not in session:
        return jsonify({
            "error": "Please login first"
        }), 401

    return jsonify({
        "status": "success",
        "user": {
            "id": session["user_id"],
            "name": session.get("user_name"),
            "email": session.get("user_email")
        }
    }), 200

    # Update User Profile API
@app.route("/update-profile", methods=["PUT"])
def update_profile():

    if "user_id" not in session:
        return jsonify({
            "error": "Please login first"
        }), 401

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Invalid request data"
        }), 400

    name = data.get("name", "").strip()

    if not name:
        return jsonify({
            "error": "Name is required"
        }), 400

    if len(name) > 100:
        return jsonify({
            "error": "Name cannot exceed 100 characters"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "UPDATE users SET name = %s WHERE id = %s",
            (name, session["user_id"])
        )

        connection.commit()

        session["user_name"] = name

        return jsonify({
            "message": "Profile updated successfully!",
            "status": "success",
            "user": {
                "id": session["user_id"],
                "name": name,
                "email": session.get("user_email")
            }
        }), 200

    except Exception:
        app.logger.exception("Profile update failed")

        return jsonify({
            "error": "Could not update profile"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Logout API
@app.route("/logout", methods=["POST"])
def logout():
    session.clear()

    return jsonify({
        "message": "Logout successful!",
        "status": "success"
    }), 200


# Check Allowed File
def allowed_file(filename):
    return (
        "." in filename and
        filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


# Extract PDF Text
def extract_pdf_text(filepath):
    text = ""

    reader = PdfReader(filepath)

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


# Extract DOCX Text
def extract_docx_text(filepath):
    document = Document(filepath)

    text = ""

    for paragraph in document.paragraphs:
        text += paragraph.text + "\n"

    return text


# Supported Skills
SKILLS = [
    "Python",
    "Java",
    "C++",
    "C#",
    "C",
    "JavaScript",
    "TypeScript",
    "React",
    "Angular",
    "Vue",
    "HTML",
    "CSS",
    "Flask",
    "Django",
    "Node.js",
    "Express",
    "SQL",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "REST API",
    "Git",
    "GitHub",
    "Docker",
    "AWS",
    "Machine Learning",
    "Deep Learning",
    "NLP",
    "Data Analysis",
    "Pandas",
    "NumPy",
    "TensorFlow",
    "PyTorch",
    "Excel",
    "Communication",
    "Problem Solving",
    "Teamwork"
]


# Find Skills in Text
def find_skills(text):
    found = []

    text = text.lower()

    for skill in SKILLS:
        pattern = (
            r"(?<![a-z0-9])" +
            re.escape(skill.lower()) +
            r"(?![a-z0-9])"
        )

        if re.search(pattern, text):
            found.append(skill)

    return found


# Resume Analyze API
@app.route("/analyze", methods=["POST"])
def analyze_resume():
    if "user_id" not in session:
        return jsonify({
            "error": "Please login first"
        }), 401

    if "resume" not in request.files:
        return jsonify({
            "error": "No resume file uploaded"
        }), 400

    resume_file = request.files["resume"]

    job_description = request.form.get(
        "job_description", ""
    ).strip()

    if resume_file.filename == "":
        return jsonify({
            "error": "Please select a resume file"
        }), 400

    if not job_description:
        return jsonify({
            "error": "Please enter a job description"
        }), 400

    if not allowed_file(resume_file.filename):
        return jsonify({
            "error": "Only PDF and DOCX files are allowed"
        }), 400

    original_filename = secure_filename(resume_file.filename)

    extension = original_filename.rsplit(".", 1)[1].lower()

    unique_filename = str(uuid.uuid4()) + "." + extension

    filepath = os.path.join(
        app.config["UPLOAD_FOLDER"],
        unique_filename
    )

    try:
        resume_file.save(filepath)

        # Extract Resume Text
        if extension == "pdf":
            resume_text = extract_pdf_text(filepath)
        else:
            resume_text = extract_docx_text(filepath)

        if not resume_text.strip():
            return jsonify({
                "error": "Could not extract readable text from this resume"
            }), 400

        # Find Required Skills
        required_skills = find_skills(job_description)

        # Find Skills in Resume
        resume_skills = find_skills(resume_text)

        # Compare Skills
        found_skills = [
            skill for skill in required_skills
            if skill in resume_skills
        ]

        missing_skills = [
            skill for skill in required_skills
            if skill not in resume_skills
        ]

        # Calculate Match Percentage
        if len(required_skills) > 0:
            match_percentage = round(
                (len(found_skills) / len(required_skills)) * 100
            )
        else:
            match_percentage = 0

        # Generate Suggestions
        suggestions = []

        for skill in missing_skills:
            suggestions.append(
                f"Consider adding relevant experience or projects demonstrating {skill}, if you have that experience."
            )

        if not required_skills:
            suggestions.append(
                "No supported skills were detected in the job description. Try providing a more detailed job description."
            )

        return jsonify({
            "message": "Resume analyzed successfully",
            "filename": original_filename,
            "requiredSkills": required_skills,
            "foundSkills": found_skills,
            "missingSkills": missing_skills,
            "matchPercentage": match_percentage,
            "suggestions": suggestions
        }), 200

    except Exception:
        app.logger.exception("Resume analysis failed")

        return jsonify({
            "error": "Resume analysis failed. Please check the file and try again."
        }), 500

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


# Resume Upload API
@app.route("/upload", methods=["POST"])
def upload_resume():
    if "user_id" not in session:
        return jsonify({
            "error": "Please login first"
        }), 401

    if "resume" not in request.files:
        return jsonify({
            "error": "No resume file uploaded"
        }), 400

    resume_file = request.files["resume"]

    if resume_file.filename == "":
        return jsonify({
            "error": "No file selected"
        }), 400

    if not allowed_file(resume_file.filename):
        return jsonify({
            "error": "Only PDF and DOCX files are allowed"
        }), 400

    filename = secure_filename(resume_file.filename)

    extension = filename.rsplit(".", 1)[1].lower()

    unique_filename = str(uuid.uuid4()) + "." + extension

    filepath = os.path.join(
        app.config["UPLOAD_FOLDER"],
        unique_filename
    )

    try:
        resume_file.save(filepath)

        if extension == "pdf":
            text = extract_pdf_text(filepath)
        else:
            text = extract_docx_text(filepath)

        return jsonify({
            "message": "Resume uploaded successfully",
            "filename": filename,
            "text": text
        }), 200

    except Exception:
        app.logger.exception("Resume extraction failed")

        return jsonify({
            "error": "Could not extract resume text"
        }), 500

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


# Home Route
@app.route("/", methods=["GET"])
def home():
    return "Resume Analyzer Backend is Running!"


# Run Flask Server
if _name_ == "_main_":
    try:
        create_users_table()
        print("Users table is ready!")

    except Exception:
        app.logger.exception("Database initialization failed")
        raise

    app.run(debug=True)
