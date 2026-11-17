# MistakeVault – Student Mistake Tracking and Revision System

## 1. Project Description

**MistakeVault** is a web-based student mistake tracking and revision management application designed to help students identify, record, understand, and learn from their mistakes.

Students often repeat the same mistakes while studying, practising problems, and preparing for examinations. MistakeVault provides a centralized platform where students can record their mistakes, understand why they happened, save the correct answers, and revise them later.

The application helps students improve their learning process through mistake tracking, revision reminders, self-testing, and performance analytics.

## 2. Features

### Dashboard
- Displays the total number of recorded mistakes.
- Shows corrected and pending mistakes.
- Displays mistakes due for revision.
- Identifies frequently repeated topics.
- Shows recently recorded mistakes.

### Add Mistake
- Record the topic and category.
- Store the original question.
- Record the incorrect answer.
- Explain why the mistake happened.
- Store the correct understanding.
- Set a revision date.

### My Mistakes
- View all recorded mistakes.
- Search mistakes using keywords.
- Filter mistakes by category and status.
- Edit existing mistake records.
- Delete unwanted records.
- Mark mistakes as corrected.

### Revision Room
- Displays pending mistakes that have reached their revision date.
- Helps students organize their revision activities.

### Self-Test
- Practise previously recorded mistakes.
- Reveal the correct explanation.
- Mark an answer as correct or needing more practice.
- Track practice attempts and last-reviewed dates.

### Analytics
- View the total number of mistakes.
- Track corrected mistakes.
- Identify repeated topics.
- Visualize mistakes according to category.

### Student Profile
- Save and display the student's name.
- Store the profile name in the browser.

## 3. Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Creates the application structure |
| CSS3 | Provides styling and responsive design |
| JavaScript | Implements frontend functionality |
| Node.js | Runs the backend environment |
| Express.js | Handles server requests and API routes |
| MongoDB Atlas | Stores mistake records in the cloud |
| Mongoose | Connects Node.js with MongoDB and manages data models |
| Git | Version control |
| GitHub | Project hosting and source code management |

## 4. Project Structure

```text
MistakeVault/
│
├── config/
│   └── db.js
│
├── models/
│   └── Mistake.js
│
├── routes/
│   └── mistakeRoutes.js
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

## 5. Installation and Setup Instructions

Follow these steps to run MistakeVault on your local computer.

### Prerequisites

Install the following software:

- Node.js and npm
- Visual Studio Code
- Git
- A MongoDB Atlas account

### Step 1: Clone the Repository

Open your terminal and execute:

```bash
git clone https://github.com/Dishakg1819/MistakeVault.git
```

Navigate into the project folder:

```bash
cd MistakeVault
```

### Step 2: Install Dependencies

Run the following command:

```bash
npm install
```

This installs the required Node.js packages.

### Step 3: Configure MongoDB Atlas

1. Create or sign in to your MongoDB Atlas account.
2. Create a free MongoDB cluster.
3. Create a database user with appropriate database permissions.
4. Configure Network Access to allow your current IP address.
5. Obtain your MongoDB connection string.

### Step 4: Configure Environment Variables

Create a `.env` file in the root project directory.

Add the following configuration:

```env
PORT=3000
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/mistakevault?retryWrites=true&w=majority
```

Replace the placeholder values with your actual MongoDB Atlas credentials.

**Important:** Never share your MongoDB password or upload your `.env` file to GitHub.

### Step 5: Start the Application

Run the following command:

```bash
npm run dev
```

If the connection is successful, the terminal should display messages similar to:

```text
MongoDB Connected: your-cluster.mongodb.net
MistakeVault server running at http://localhost:3000
```

### Step 6: Open the Application

Open your web browser and visit:

```text
http://localhost:3000
```

MistakeVault is now ready to use!

## 6. Backend API Endpoints

The application provides REST API endpoints for managing mistake records.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Checks backend status |
| GET | `/api/mistakes` | Retrieves all mistakes |
| POST | `/api/mistakes` | Adds a new mistake |
| PUT | `/api/mistakes/:id` | Updates an existing mistake |
| DELETE | `/api/mistakes/:id` | Deletes a mistake |
| PATCH | `/api/mistakes/:id/correct` | Marks a mistake as corrected |

## 7. Database

MistakeVault uses **MongoDB Atlas** as its cloud database.

The `Mistake` model stores information such as:

- Topic
- Category
- Question
- Wrong answer
- Reason for the mistake
- Correct answer
- Revision date
- Status
- Number of attempts
- Last reviewed date

Mongoose is used to define the data schema and interact with MongoDB.

## 8. Future Enhancements

The following features can be considered for future development:

- Student registration and login.
- Individual student accounts.
- Personalized dashboards.
- Automated revision notifications.
- Advanced performance reports.
- Exporting mistake records as PDF.
- Spaced repetition-based revision scheduling.

## 9. Project Objective

The main objective of MistakeVault is to encourage students to learn from their mistakes instead of repeating them.

It provides an organized way to record errors, understand concepts, practise difficult questions, and monitor learning progress.

**MistakeVault – Record your mistakes. Understand them. Learn better.**

## 10. Author

**Project Name:** MistakeVault  
**Project Type:** Student Mistake Tracking and Revision Management System  
**GitHub Repository:** https://github.com/Dishakg1819/MistakeVault