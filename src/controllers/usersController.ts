import asyncHandler from "../middlewares/asyncHandler";
import { Response, NextFunction } from "express";
import { UserRequest } from "../utils/types/userTypes";
import { User } from "../entities/User";

// Function to update the user's profile
export const updateUserProfile = asyncHandler(
    async (req: UserRequest, res: Response, next: NextFunction) => {
        const { userId } = req.params;
        const { name, phone_number, cv, skills } = req.body;

        const numericUserId = Number(userId);

        if (isNaN(numericUserId)) {
            return res.status(400).json({ message: "Invalid user ID parameter" });
        }

        // Optionally: check if current user has permission to update this user
        if (!req.user || (req.user.role_name !== "admin" && Number(req.user.user_id) !== numericUserId)) {
            return res.status(403).json({ message: "Not authorized to update this user" });
        }

        // Find user by param ID
        const user = await User.findOne({
            where: { user_id: numericUserId },
            relations: ['role']
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update the user's fields
        if (name) user.name = name;
        if (phone_number) user.phone_number = phone_number;
        if (cv) user.cv = cv;
        if (skills) user.skills = skills;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                phone_number: user.phone_number,
                cv: user.cv,
                skills: user.skills,
                role: user.role?.role_name || null,
                updated_at: user.updated_at
            }
        });
    }
);

// Function to get all users
export const getAllUsers = asyncHandler(
    async (req: UserRequest, res: Response, next: NextFunction) => {
        // Ensure the user is an admin
        if (!req.user || req.user.role_name !== "Admin") {
            return res.status(403).json({ message: "Not authorized to view all users" });
        }

        // Fetch all users
        const users = await User.find({ relations: ['role'] });

        return res.status(200).json({
            success: true,
            data: users.map(user => ({
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                phone_number: user.phone_number,
                cv: user.cv,
                role: user.role?.role_name || null,
                created_at: user.created_at,
                updated_at: user.updated_at
            }))
        });
    }
);

// Function to delete a user
export const deleteUser = asyncHandler(
    async (req: UserRequest, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        // Ensure the user is an admin
        if (!req.user || req.user.role_name !== "Admin") {
            return res.status(403).json({ message: "Not authorized to delete users" });
        }

        const numericUserId = Number(userId);

        if (isNaN(numericUserId)) {
            return res.status(400).json({ message: "Invalid user ID parameter" });
        }

        // Find the user to delete
        const user = await User.findOne({ where: { user_id: numericUserId } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Delete the user
        await user.remove();

        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    }
);