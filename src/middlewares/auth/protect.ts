import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRequest } from "../../utils/types/userTypes";
import asyncHandler from "../asyncHandler";
import { AppDataSource } from "../../config/data-source";
import { User } from "../../entities/User";
import { Role } from "../../entities/Role";

// Auth middleware to protect routes 
export const protect = asyncHandler(async (req: UserRequest, res: Response, next: NextFunction) => {
    let token;

    // Try to get token from Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    // Get token from cookies if not in header
    if (!token && req.cookies?.access_token) {
        token = req.cookies.access_token;
    }

    // If no token found
    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; roleId: number };

        // Get the user from the database using TypeORM
        const userRepository = AppDataSource.getRepository(User);

        const user = await userRepository.findOne({
            where: { user_Id: Number(decoded.userId) },
            relations: ["role"], // assuming the relation is named 'role' in User entity
        });

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Attach user to the request
        req.user = {
            id: user.user_Id.toString(),
            name: user.name,
            email: user.email,
            role_id: user.role.role_id,
            role_name: user.role.role_name
        };

        next();

    } catch (error) {
        console.error("JWT Error:", error);
        res.status(401).json({ message: "Not authorized, token failed" });
    }
});
