
// Import required packages
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Import MongoDB connection function
const connectDB = require("./config/db");
const mistakeRoutes = require("./routes/mistakeRoutes");

// Create Express application
const app = express();

// Get port number
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Mistake API Routes
app.use("/api/mistakes", mistakeRoutes);

// Serve frontend files from public folder
app.use(express.static(path.join(__dirname, "public")));

// Health Check API
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "MistakeVault backend is running successfully!"
    });
});

// Start server after connecting to MongoDB
const startServer = async () => {
    try {
        // Connect to MongoDB Atlas
        await connectDB();

        // Start Express server
        app.listen(PORT, () => {
            console.log(
                `MistakeVault server running at http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

// Run the application
startServer();
