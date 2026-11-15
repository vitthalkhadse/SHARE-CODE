
import pool from "./db.js";

async function testConnection() {
    try {
        const result = await pool.query(
            "SELECT current_database(), NOW()"
        );

        console.log("Database connection successful!");
        console.log(result.rows[0]);

    } catch (error) {
        console.error("Database connection failed:", error.message);
    } finally {
        await pool.end();
    }
}

testConnection();
