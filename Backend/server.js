
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";
import pool from "./db.js";

const app = express();

app.use(express.json());
app.use(express.static("public"));

const httpServer = createServer(app);

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

// Start server
httpServer.listen(3000, "0.0.0.0", () => {
    console.log("Server is running on port 3000");
});
