
import express from "express";
import pool from "./db.js";
import authMiddleware from "./middleware/authMiddleware.js";

const router = express.Router();

// CREATE PROJECT API
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { project_name, code } = req.body;

        if (typeof project_name !== "string" || !project_name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Project name is required"
            });
        }

        // Validate project code type
        if (code !== undefined && typeof code !== "string") {
            return res.status(400).json({
                success: false,
                message: "Code must be a string"
            });
        }

        // Validate project name length (100 characters)
        if (project_name.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: "Project name cannot exceed 100 characters"
            });
        }

        // Validate project code size (1 MB)
        if (Buffer.byteLength(code ?? "", "utf8") > 1024 * 1024) {
            return res.status(400).json({
                success: false,
                message: "Project code cannot exceed 1 MB"
            });
        }

        const result = await pool.query(
            `INSERT INTO projects (user_id, project_name, code)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [req.user.id, project_name.trim(), code ?? ""]
        );

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            project: result.rows[0]
        });

    } catch (error) {
        console.error("Create project error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create project"
        });
    }
});

// GET ALL PROJECTS API
router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, user_id, project_name, code, created_at, updated_at
             FROM projects
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.status(200).json({
            success: true,
            message: "Projects fetched successfully",
            count: result.rows.length,
            projects: result.rows
        });

    } catch (error) {
        console.error("Get projects error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch projects"
        });
    }
});

// GET SINGLE PROJECT API
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, user_id, project_name, code, created_at, updated_at
             FROM projects
             WHERE id = $1 AND user_id = $2`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Project fetched successfully",
            project: result.rows[0]
        });

    } catch (error) {
        console.error("Get single project error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch project"
        });
    }
});

// UPDATE PROJECT API
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { project_name, code } = req.body;

        if (
            project_name === undefined &&
            code === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Nothing to update"
            });
        }

        if (
            project_name !== undefined &&
            (typeof project_name !== "string" || !project_name.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Project name cannot be empty"
            });
        }

        if (code !== undefined && typeof code !== "string") {
            return res.status(400).json({
                success: false,
                message: "Code must be a string"
            });
        }

        // Validate project name length (100 characters)
        if (project_name !== undefined && project_name.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: "Project name cannot exceed 100 characters"
            });
        }

        // Validate project code size (1 MB)
        if (
            code !== undefined &&
            Buffer.byteLength(code, "utf8") > 1024 * 1024
        ) {
            return res.status(400).json({
                success: false,
                message: "Project code cannot exceed 1 MB"
            });
        }

        const result = await pool.query(
            `UPDATE projects
             SET project_name = COALESCE($1, project_name),
                 code = COALESCE($2, code),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND user_id = $4
             RETURNING *`,
            [
                project_name === undefined ? null : project_name.trim(),
                code === undefined ? null : code,
                id,
                req.user.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Project updated successfully",
            project: result.rows[0]
        });

    } catch (error) {
        console.error("Update project error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update project"
        });
    }
});

// DELETE PROJECT API
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM projects
             WHERE id = $1 AND user_id = $2
             RETURNING id, project_name`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Project deleted successfully",
            project: result.rows[0]
        });

    } catch (error) {
        console.error("Delete project error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete project"
        });
    }
});

export default router;
