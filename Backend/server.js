
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";
import pool from "./db.js";
import authRouter from "./auth.js";
import authMiddleware from "./middleware/authMiddleware.js";
import projectsRouter from "./projects.js";

const app = express();

// Middleware
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

// Authentication API
app.use("/api/auth", authRouter);

// Project Management API
app.use("/api/projects", projectsRouter);

// HTTP server
const httpServer = createServer(app);

// Socket.IO server
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Yjs real-time collaboration
const ySocketIO = new YSocketIO(io);
ySocketIO.initialize();

// Health check + database connection check
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.status(200).json({
            message: "Server and database are working",
            success: true,
            database: "connected"
        });

    } catch (error) {
        console.error("Database health check failed:", error.message);

        res.status(500).json({
            message: "Database connection failed",
            success: false,
            database: "disconnected"
        });
    }
});

// Protected Profile API
app.get("/api/profile", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, username, email FROM users WHERE id = $1",
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Profile error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch profile"
        });
    }
});

// Start server
httpServer.listen(3000, "0.0.0.0", () => {
    console.log("Server is running on port 3000");
});
