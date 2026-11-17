
const express = require("express");
const mongoose = require("mongoose");
const Mistake = require("../models/Mistake");

const router = express.Router();

// =====================================
// 1. ADD A NEW MISTAKE
// POST /api/mistakes
// =====================================

router.post("/", async (req, res) => {
    try {
        const newMistake = new Mistake({
            topic: req.body.topic,
            category: req.body.category,
            question: req.body.question,
            wrongAnswer: req.body.wrongAnswer || "",
            reason: req.body.reason,
            correctAnswer: req.body.correctAnswer,
            revisionDate: req.body.revisionDate || "",
            status: req.body.status || "Pending",
            attempts: req.body.attempts || 0,
            lastReviewed: req.body.lastReviewed || "",
            createdDate: req.body.createdDate
        });

        const savedMistake = await newMistake.save();

        res.status(201).json({
            success: true,
            message: "Mistake added successfully!",
            data: savedMistake
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});


// =====================================
// 2. GET ALL MISTAKES
// GET /api/mistakes
// =====================================

router.get("/", async (req, res) => {
    try {
        const mistakes = await Mistake.find().sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            count: mistakes.length,
            data: mistakes
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// =====================================
// 3. UPDATE A MISTAKE
// PUT /api/mistakes/:id
// =====================================

router.put("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid mistake ID"
            });
        }

        const updatedMistake = await Mistake.findByIdAndUpdate(
            id,
            {
                topic: req.body.topic,
                category: req.body.category,
                question: req.body.question,
                wrongAnswer: req.body.wrongAnswer || "",
                reason: req.body.reason,
                correctAnswer: req.body.correctAnswer,
                revisionDate: req.body.revisionDate || "",
                status: req.body.status,
                attempts: req.body.attempts,
                lastReviewed: req.body.lastReviewed
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedMistake) {
            return res.status(404).json({
                success: false,
                message: "Mistake not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Mistake updated successfully!",
            data: updatedMistake
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});


// =====================================
// 4. DELETE A MISTAKE
// DELETE /api/mistakes/:id
// =====================================

router.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid mistake ID"
            });
        }

        const deletedMistake = await Mistake.findByIdAndDelete(id);

        if (!deletedMistake) {
            return res.status(404).json({
                success: false,
                message: "Mistake not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Mistake deleted successfully!"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// =====================================
// 5. MARK AS CORRECTED
// PATCH /api/mistakes/:id/correct
// =====================================

router.patch("/:id/correct", async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid mistake ID"
            });
        }

        const correctedMistake = await Mistake.findByIdAndUpdate(
            id,
            {
                status: "Corrected",
                lastReviewed: new Date().toISOString().slice(0, 10)
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!correctedMistake) {
            return res.status(404).json({
                success: false,
                message: "Mistake not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Mistake marked as corrected!",
            data: correctedMistake
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
