
// Import required packages
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Get port number
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files from public folder
app.use(express.static(path.join(__dirname, "public")));

// First API route - Health Check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "MistakeVault backend is running successfully!"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`MistakeVault server running at http://localhost:${PORT}`);
});
