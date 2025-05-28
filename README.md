🛠️ Project Setup & Installation Guide
To run this project locally, follow the steps below to set up both the client-side and server-side environments.

📦 Step 1: Clone the Repository
First, clone the repository to your local machine:
git clone git@github.com:your-username/your-repo-name.git
cd your-repo-name

📁 Step 2: Install Dependencies
Install the required dependencies for both the server and client:

Server Dependencies:
cd server
npm install

Client Dependencies:
Open a new terminal tab or window:
cd client
npm install
This is necessary because the project uses a Node.js backend and a React frontend, each with their own set of dependencies.

🧩 Step 3: Initialize the Database
Within the server directory, initialize the MongoDB database using the following command:
node init.js your_email@example.com YourUsername YourPassword
Replace:

your_email@example.com with any email ID

YourUsername with a desired username

YourPassword with a chosen password

🚀 Step 4: Run the Application
Start the backend server using nodemon:
cd server
nodemon server.js

In a separate terminal, start the frontend React app:
cd client
npm start

🌐 Application Access
Once both the server and client are running, you can access the application at:
http://localhost:3000
🧰 Technologies Used
React (Frontend)

Node.js (Backend)

MongoDB (Database)
