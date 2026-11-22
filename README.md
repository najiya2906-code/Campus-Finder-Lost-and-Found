Campus Finder – Lost & Found Item System

Campus Finder is a full-stack web application designed to help campus users report, search, and manage lost and found items efficiently. It provides a centralized platform where users can share information about missing belongings and found items within their campus.

Features

* Report Lost Items: Post details of items that have been lost on campus.
* Report Found Items: Share information about items found on campus.
* Search Items: Browse and search for lost and found item listings.
* Item Management: Store and manage item details in a database.
* Responsive User Interface: Access the application through a React.js-based interface.
* REST API Integration: Communicate between the frontend and backend using Flask APIs.

Tech Stack

Frontend

* React.js
* CSS
* JavaScript

Backend

* Python
* Flask
* REST APIs

Database

* MongoDB

Development Tools

* Visual Studio Code
* Git
* GitHub
* npm
* Python pip

Project Structure

Campus-Finder/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── ...
├── .gitignore
└── README.md

How It Works

1. Campus users access the application through the React.js frontend.
2. Users can submit information about lost or found items.
3. The frontend communicates with the Flask backend through API requests.
4. Flask processes requests and interacts with MongoDB to store or retrieve item information.
5. The application displays the available item details to users.

Installation and Setup

Prerequisites

Install the following before running the application:

* Node.js and npm
* Python 3
* MongoDB
* Git

1. Clone the Repository

git clone https://github.com/najiya2906-code/Campus-Finder-Lost-and-Found.git
cd Campus-Finder-Lost-and-Found

2. Set Up the Backend

Open a terminal in the backend folder:

cd backend

Create a Python virtual environment:

python -m venv venv

Activate it on Windows PowerShell:

.\venv\Scripts\Activate.ps1

Install the required packages:

pip install -r requirements.txt

Configure the MongoDB connection and other required environment variables according to your backend code. Do not publish database credentials or secret keys.

Start the Flask application using the correct entry file. For example, if the entry file is "app.py":

python app.py

The server address and port depend on the Flask configuration in your project.

3. Set Up the Frontend

Open another terminal:

cd frontend

Install the dependencies:

npm install

Start the React development server:

npm run dev

If your project uses Create React App instead of Vite, use "npm start".

Open the local URL displayed in the terminal to access the frontend.

Database Configuration

Campus Finder uses MongoDB to store and manage lost and found item information.

Before running the application:

* Ensure MongoDB is running or your MongoDB Atlas database is accessible.
* Configure the connection string using the method expected by your backend.
* Keep credentials in environment variables and exclude ".env" files from GitHub.

Future Enhancements

* User authentication and authorization
* Advanced search and category filters
* Item image uploads
* Item claim and return workflow
* Email notifications for matching items

Learning Outcomes

Through this collaborative project, we gained practical experience with:

* Building a responsive frontend using React.js.
* Developing backend APIs using Python Flask.
* Integrating a MongoDB database.
* Connecting frontend components with backend APIs.
* Understanding the workflow of a full-stack web application.
* Collaborating on software development using Git and GitHub.

Contributors

This project was collaboratively developed by:

Najiya Gulam Shaikh

GitHub: https://github.com/najiya2906-code

Yashashree Parte

GitHub: https://github.com/yashashree2025

Both contributors collaborated on the design, development, and implementation of this project.

License

This project is available for educational and learning purposes. Add a formal license if you intend to distribute it under specific reuse terms.￼Enter
