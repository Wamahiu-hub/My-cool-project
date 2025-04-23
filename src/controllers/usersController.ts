import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { RequestWithUser, FileWithPath } from "../utils/types/customTypes";
import asyncHandler from "../middlewares/asyncHandler";
import { MoreThan, Like } from "typeorm";
import { MulterRequest } from "../utils/types/customTypes";

const userRepository = AppDataSource.getRepository(User);
const roleRepository = AppDataSource.getRepository(Role);

export const getCurrentUser = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const user = await userRepository.findOne({
        where: { user_id: req.user.user_id },
        relations: ['role']
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json({
        success: true,
        data: user
    });
});

export const updateProfile = asyncHandler(async (req: MulterRequest, res: Response) => {
    const {
        full_name, mobile_number, skills, experience_years,
        address, city, state, country, postal_code,
        current_position, current_company, linkedin_url,
        portfolio_url, certifications, education, bio,
        preferred_language, preferences
    } = req.body;

    const user = await userRepository.findOne({
        where: { user_id: (req as RequestWithUser).user.user_id }
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Handle profile image upload if provided
    if (req.file) {
        user.profile_image = (req.file as FileWithPath).path;
    }

    // Update user fields
    Object.assign(user, {
        full_name,
        mobile_number,
        skills,
        experience_years,
        address,
        city,
        state,
        country,
        postal_code,
        current_position,
        current_company,
        linkedin_url,
        portfolio_url,
        certifications,
        education,
        bio,
        preferred_language,
        preferences
    });

    await userRepository.save(user);

    res.json({
        success: true,
        data: user
    });
});

export const uploadCV = asyncHandler(async (req: MulterRequest, res: Response) => {
    const user = await userRepository.findOne({
        where: { user_id: (req as RequestWithUser).user.user_id }
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (!req.file) {
        return res.status(400).json({ message: "Please upload a CV" });
    }

    user.cv_url = (req.file as FileWithPath).path;
    await userRepository.save(user);

    res.json({
        success: true,
        data: {
            cv_url: user.cv_url
        }
    });
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 10,
        role,
        search,
        status,
        sort_by = 'created_at',
        order = 'DESC'
    } = req.query;

    let queryBuilder = userRepository.createQueryBuilder("user")
        .leftJoinAndSelect("user.role", "role");

    if (role) {
        queryBuilder.andWhere("role.name = :role", { role });
    }

    if (search) {
        queryBuilder.andWhere(
            "(user.full_name ILIKE :search OR user.email ILIKE :search)",
            { search: `%${search}%` }
        );
    }

    if (status) {
        queryBuilder.andWhere("user.account_status = :status", { status });
    }

    // Add sorting
    queryBuilder.orderBy(`user.${sort_by}`, order as 'ASC' | 'DESC');

    // Add pagination
    const skip = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(skip).take(Number(limit));

    const [users, total] = await queryBuilder.getManyAndCount();

    res.json({
        success: true,
        data: users,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
        }
    });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await userRepository.findOne({
        where: { user_id: parseInt(req.params.id) },
        relations: ['role']
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json({
        success: true,
        data: user
    });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { role_name, account_status, is_active, ...updateData } = req.body;

    let user = await userRepository.findOne({
        where: { user_id: parseInt(req.params.id) },
        relations: ['role']
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Update role if provided
    if (role_name) {
        const newRole = await roleRepository.findOne({ where: { name: role_name } });
        if (!newRole) {
            return res.status(400).json({ message: "Invalid role specified" });
        }
        user.role = newRole;
    }

    // Update other fields
    Object.assign(user, updateData);

    if (typeof is_active === 'boolean') {
        user.is_active = is_active;
    }

    if (account_status) {
        user.account_status = account_status;
    }

    await userRepository.save(user);

    res.json({
        success: true,
        data: user
    });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await userRepository.findOne({
        where: { user_id: parseInt(req.params.id) }
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Soft delete
    user.is_active = false;
    await userRepository.save(user);

    res.json({
        success: true,
        data: {}
    });
});

export const updateNotificationSettings = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { notification_settings } = req.body;

    const user = await userRepository.findOne({
        where: { user_id: req.user.user_id }
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (!user.preferences) {
        user.preferences = {};
    }

    user.preferences.notification_settings = notification_settings;
    await userRepository.save(user);

    res.json({
        success: true,
        data: user.preferences.notification_settings
    });
});

export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const totalUsers = await userRepository.count();
    const activeUsers = await userRepository.count({ where: { is_active: true } });
    const recentUsers = await userRepository.count({
        where: {
            created_at: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        }
    });

    const roleStats = await roleRepository
        .createQueryBuilder("role")
        .leftJoin("role.users", "user")
        .select("role.name", "role")
        .addSelect("COUNT(user.user_id)", "count")
        .groupBy("role.name")
        .getRawMany();

    res.json({
        success: true,
        data: {
            total_users: totalUsers,
            active_users: activeUsers,
            recent_users: recentUsers,
            role_distribution: roleStats
        }
    });
});