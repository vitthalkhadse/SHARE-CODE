
import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    try {
        // Request header se token lena
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Token required."
            });
        }

        const token = authHeader.split(" ")[1];

        // JWT token verify karna
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // User information request mein attach karna
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

export default authMiddleware;
