import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { RequestWithUser } from "../utils/types/customTypes";
import asyncHandler from "../middlewares/asyncHandler";
import { generateToken } from "../utils/helpers/generateToken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../utils/helpers/emailService"
import { MoreThanOrEqual } from "typeorm";

const userRepository = AppDataSource.getRepository(User);
const roleRepository = AppDataSource.getRepository(Role);

export const register = asyncHandler(async (req: Request, res: Response) => {
    const {
        full_name, email, password, role_name,
        mobile_number, skills, experience_years,
        current_position, current_company, linkedin_url
    } = req.body;

    // Check if user exists
    const userExists = await userRepository.findOne({ where: { email } });
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }

    // Get role
    const role = await roleRepository.findOne({ where: { role_name } });
    if (!role) {
        return res.status(400).json({ message: "Invalid role specified" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = userRepository.create({
        full_name,
        email,
        password: hashedPassword,
        role,
        mobile_number,
        skills,
        experience_years,
        current_position,
        current_company,
        linkedin_url,
        email_verification_token: emailVerificationToken,
        email_verified: false
    });

    await userRepository.save(user);

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`;
    await sendEmail({
        to: email,
        subject: "Verify your email",
        text: `Please verify your email by clicking: ${verificationUrl}`
    });

    // Generate token
    const token = generateToken(user.user_id, user.email, role.name);

    res.status(201).json({
        success: true,
        data: {
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            token
        }
    });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await userRepository.findOne({
        where: { email },
        relations: ['role']
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.email_verified) {
        return res.status(401).json({ message: "Please verify your email first" });
    }

    if (!user.is_active) {
        return res.status(401).json({ message: "Your account has been deactivated" });
    }

    // Update last login
    user.last_login = new Date();
    await userRepository.save(user);

    const token = generateToken(user.user_id, user.email, user.role.name);

    res.json({
        success: true,
        data: {
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            token
        }
    });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    const user = await userRepository.findOne({
        where: { email_verification_token: token }
    });

    if (!user) {
        return res.status(400).json({ message: "Invalid verification token" });
    }

    user.email_verified = true;
    user.email_verification_token = undefined;
    await userRepository.save(user);

    res.json({
        success: true,
        message: "Email verified successfully"
    });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.password_reset_token = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    user.password_reset_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await userRepository.save(user);

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
        to: email,
        subject: "Password Reset Request",
        text: `To reset your password, click: ${resetUrl}`
    });

    res.json({
        success: true,
        message: "Password reset link sent to email"
    });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await userRepository.findOne({
        where: {
            password_reset_token: hashedToken,
            password_reset_expires: MoreThanOrEqual(new Date())
        }
    });

    if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.password_reset_token = undefined;
    user.password_reset_expires = undefined;

    await userRepository.save(user);

    res.json({
        success: true,
        message: "Password reset successful"
    });
});

export const changePassword = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    const user = await userRepository.findOne({
        where: { user_id: req.user.user_id }
    });

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await userRepository.save(user);

    res.json({
        success: true,
        message: "Password changed successfully"
    });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    // Clear auth cookie if using cookie-based auth
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.json({
        success: true,
        message: "Logged out successfully"
    });
});
