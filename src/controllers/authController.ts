import { Response, NextFunction } from "express";
import asyncHandler from "../middlewares/asyncHandler";
import { UserRequest } from "../utils/types/userTypes";
import { User } from "../entities/User";
import bcrypt from 'bcryptjs';
import { Role } from "../entities/Role";
import { generateToken } from "../utils/helpers/generateToken";

export const register = asyncHandler(async (req: UserRequest, res: Response, next: NextFunction) => {
    const { name, email, password, role_id } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }

    // Get the role entity
    const role = await Role.findOne({ where: { role_id } });
    if (!role) {
        return res.status(404).json({ message: "Role not found" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = User.create({
        name,
        email,
        password: hashedPassword,
        role,
        is_active: true
    });

    // Save user to database
    await user.save();

    return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role.role_name
        }
    });
});

// Login function
export const login = asyncHandler(async (req: UserRequest, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email }, relations: ["role"] });
    if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token using the generateToken functio

    const {accessToken, refreshToken} = generateToken(user.user_id, user.role.role_name);

    const token = generateToken(user.user_id, user.role.role_name);

    return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        data: {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role.role_name,
            accessToken,
            refreshToken
        }
    });
});