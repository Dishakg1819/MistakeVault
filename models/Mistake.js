
const mongoose = require("mongoose");

// Define Mistake Schema
const mistakeSchema = new mongoose.Schema(
    {
        topic: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        question: {
            type: String,
            required: true,
            trim: true
        },

        wrongAnswer: {
            type: String,
            default: ""
        },

        reason: {
            type: String,
            required: true,
            trim: true
        },

        correctAnswer: {
            type: String,
            required: true,
            trim: true
        },

        revisionDate: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: ["Pending", "Corrected"],
            default: "Pending"
        },

        attempts: {
            type: Number,
            default: 0
        },

        lastReviewed: {
            type: String,
            default: ""
        },

        createdDate: {
            type: String,
            default: () => new Date().toISOString().slice(0, 10)
        }
    },
    {
        timestamps: true
    }
);

// Create and export Mistake Model
const Mistake = mongoose.model("Mistake", mistakeSchema);

module.exports = Mistake;
