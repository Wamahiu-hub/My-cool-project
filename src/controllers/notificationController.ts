import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Notification } from "../entities/Notification";
import { User } from "../entities/User";
import asyncHandler from "../middlewares/asyncHandler";
import "../types/express"; // Ensure the extended Request type is loaded
// The extended Request type includes the user property

const notificationRepository = AppDataSource.getRepository(Notification);
const userRepository = AppDataSource.getRepository(User);

export const createNotification = asyncHandler(async (req: Request, res: Response) => {
    const { recipient_id, type, message, related_job_id, related_interview_id, priority, action_url } = req.body;

    const recipient = await userRepository.findOne({
        where: { user_id: recipient_id }
    });

    if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
    }

    const notification = notificationRepository.create({
        recipient,
        type,
        message,
        related_job: related_job_id ? { job_id: related_job_id } : undefined,
        related_interview: related_interview_id ? { interview_id: related_interview_id } : undefined,
        priority,
        action_url
    });

    await notificationRepository.save(notification);

    res.status(201).json({
        success: true,
        data: notification
    });
});

export const getUserNotifications = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 10, offset = 0, unread_only = false } = req.query;

    let queryBuilder = notificationRepository.createQueryBuilder("notification")
        .leftJoinAndSelect("notification.recipient", "recipient")
        .leftJoinAndSelect("notification.related_job", "job")
        .leftJoinAndSelect("notification.related_interview", "interview")
        .where("recipient.user_id = :userId", { userId: req.user.id })
        .andWhere("notification.is_active = :isActive", { isActive: true });

    if (unread_only === 'true') {
        queryBuilder.andWhere("notification.is_read = :isRead", { isRead: false });
    }

    const notifications = await queryBuilder
        .orderBy("notification.created_at", "DESC")
        .skip(Number(offset))
        .take(Number(limit))
        .getMany();

    const total = await queryBuilder.getCount();

    res.json({
        success: true,
        count: notifications.length,
        total,
        data: notifications
    });
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const notification = await notificationRepository.findOne({
        where: { notification_id: parseInt(id) },
        relations: ['recipient']
    });

    if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.recipient.user_id !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this notification" });
    }

    notification.is_read = true;
    await notificationRepository.save(notification);

    res.json({
        success: true,
        data: notification
    });
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
    await notificationRepository
        .createQueryBuilder()
        .update()
        .set({ is_read: true })
        .where("recipient.user_id = :userId", { userId: req.user.id })
        .andWhere("is_read = :isRead", { isRead: false })
        .execute();

    res.json({
        success: true,
        message: "All notifications marked as read"
    });
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const notification = await notificationRepository.findOne({
        where: { notification_id: parseInt(id) },
        relations: ['recipient']
    });

    if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.recipient.user_id !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this notification" });
    }

    // Soft delete
    notification.is_active = false;
    await notificationRepository.save(notification);

    res.json({
        success: true,
        data: {}
    });
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationRepository.count({
        where: {
            recipient: { user_id: req.user.id },
            is_read: false,
            is_active: true
        }
    });

    res.json({
        success: true,
        data: { count }
    });
});