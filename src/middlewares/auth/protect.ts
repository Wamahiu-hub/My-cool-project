import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRequest } from "../../utils/types/userTypes";
import asyncHandler from "../asyncHandler";
import { AppDataSource } from "../../config/data-source";
import { User } from "../../entities/User";

// Auth middleware to protect routes 
export const protect = asyncHandler(async (req: UserRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Get token from Authorization header
    if (req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    // Get token from cookies if not present in headers
    if (!token && req.cookies?.access_token) {
        token = req.cookies.access_token;
    }

    // No token found
    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        // Decode the token
        const decoded = jwt.verify(token, jwtSecret) as { userId: string };

        // Get the user from DB using the decoded userId
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { user_id: Number(decoded.userId) },
            relations: ["role"], // Adjust to your DB schema
        });

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Attach user info to the request object
        req.user = {
            user_id: user.user_id.toString(),
            name: user.name,
            email: user.email,
            role_id: user.role.role_id,
            role_name: user.role.role_name
        };

        next();
    } catch (error) {
        console.error("JWT verification failed:", error);
        res.status(401).json({ message: "Not authorized, token invalid or expired" });
    }
});
