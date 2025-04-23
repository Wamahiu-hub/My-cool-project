import { Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Analytics } from "../entities/Analytics";
import { Job } from "../entities/Job";
import { JobApplication } from "../entities/JobApplication";
import { User } from "../entities/User";
import { Interview } from "../entities/Interview";
import { RequestWithUser } from "../utils/types/customTypes";
import asyncHandler from "../middlewares/asyncHandler";
import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";

const analyticsRepository = AppDataSource.getRepository(Analytics);
const jobRepository = AppDataSource.getRepository(Job);
const applicationRepository = AppDataSource.getRepository(JobApplication);
const userRepository = AppDataSource.getRepository(User);
const interviewRepository = AppDataSource.getRepository(Interview);

export const getDashboardStats = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { timeframe = '30d' } = req.query;
    
    let startDate = new Date();
    switch(timeframe) {
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        case '1y':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        default:
            startDate.setDate(startDate.getDate() - 30);
    }

    const stats = await analyticsRepository.findOne({
        where: {
            user_id: req.user.user_id, // Ensure this matches the property in the Analytics entity
            date: Between(startDate, new Date())
        }
    });

    const activeJobs = await jobRepository.count({
        where: {
            recruiter: { user_id: req.user.user_id },
            is_active: true
        }
    });

    const totalApplications = await applicationRepository
        .createQueryBuilder("application")
        .where("application.job.recruiter.user_id = :userId", { userId: req.user.user_id })
        .andWhere("application.created_at >= :startDate", { startDate })
        .getCount();

    const upcomingInterviews = await interviewRepository.count({
        where: {
            interview_date: MoreThanOrEqual(new Date()),
            application: {
                job: {
                    recruiter: { user_id: req.user.user_id }
                }
            }
        }
    });

    res.json({
        success: true,
        data: {
            overview: {
                active_jobs: activeJobs,
                total_applications: totalApplications,
                upcoming_interviews: upcomingInterviews
            },
            detailed_stats: stats || {}
        }
    });
});

export const getJobStats = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { jobId } = req.params;
    const { timeframe = '30d' } = req.query;

    const job = await jobRepository.findOne({
        where: { job_id: parseInt(jobId), recruiter: { user_id: req.user.user_id } }
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found or unauthorized" });
    }

    let startDate = new Date();
    switch(timeframe) {
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        case 'all':
            startDate = new Date(0); // Beginning of time
            break;
        default:
            startDate.setDate(startDate.getDate() - 30);
    }

    const applications = await applicationRepository
        .createQueryBuilder("application")
        .where("application.job.job_id = :jobId", { jobId })
        .andWhere("application.created_at >= :startDate", { startDate })
        .getMany();

    const applicationsByStatus = applications.reduce((acc: any, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {});

    res.json({
        success: true,
        data: {
            views: job.views_count,
            total_applications: applications.length,
            applications_by_status: applicationsByStatus,
            conversion_rate: job.views_count ? 
                (applications.length / job.views_count * 100).toFixed(2) + '%' : '0%'
        }
    });
});

export const getRecruiterStats = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { timeframe = '30d' } = req.query;

    let startDate = new Date();
    switch(timeframe) {
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        case '1y':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        default:
            startDate.setDate(startDate.getDate() - 30);
    }

    const postedJobs = await jobRepository
        .createQueryBuilder("job")
        .where("job.recruiter.user_id = :userId", { userId: req.user.user_id })
        .andWhere("job.created_at >= :startDate", { startDate })
        .getMany();

    const applications = await applicationRepository
        .createQueryBuilder("application")
        .where("application.job.recruiter.user_id = :userId", { userId: req.user.user_id })
        .andWhere("application.created_at >= :startDate", { startDate })
        .leftJoinAndSelect("application.job", "job")
        .getMany();

    const interviews = await interviewRepository.find({
        where: {
            application: {
                job: {
                    recruiter: { user_id: req.user.user_id }
                }
            },
            created_at: MoreThanOrEqual(startDate)
        },
        relations: ['application', 'application.job']
    });

    const stats = {
        jobs: {
            total: postedJobs.length,
            active: postedJobs.filter(job => job.is_active).length,
            views_total: postedJobs.reduce((sum, job) => sum + job.views_count, 0)
        },
        applications: {
            total: applications.length,
            by_status: applications.reduce((acc: any, app) => {
                acc[app.status] = (acc[app.status] || 0) + 1;
                return acc;
            }, {}),
            conversion_rate: applications.length / 
                postedJobs.reduce((sum, job) => sum + job.views_count, 0) * 100
        },
        interviews: {
            total: interviews.length,
            completed: interviews.filter(i => i.status === 'completed').length,
            scheduled: interviews.filter(i => i.status === 'scheduled').length,
            cancelled: interviews.filter(i => i.status === 'cancelled').length
        }
    };

    res.json({
        success: true,
        data: stats
    });
});

export const getApplicationStats = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { timeframe = '30d' } = req.query;

    let startDate = new Date();
    switch(timeframe) {
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        case '1y':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        default:
            startDate.setDate(startDate.getDate() - 30);
    }

    const applications = await applicationRepository
        .createQueryBuilder("application")
        .where("application.applicant.user_id = :userId", { userId: req.user.user_id })
        .andWhere("application.created_at >= :startDate", { startDate })
        .leftJoinAndSelect("application.job", "job")
        .getMany();

    const interviews = await interviewRepository.find({
        where: {
            application: {
                applicant: { user_id: req.user.user_id }
            },
            created_at: MoreThanOrEqual(startDate)
        },
        relations: ['application']
    });

    const stats = {
        applications: {
            total: applications.length,
            by_status: applications.reduce((acc: any, app) => {
                acc[app.status] = (acc[app.status] || 0) + 1;
                return acc;
            }, {})
        },
        interviews: {
            total: interviews.length,
            completed: interviews.filter(i => i.status === 'completed').length,
            scheduled: interviews.filter(i => i.status === 'scheduled').length,
            success_rate: interviews.filter(i => i.status === 'completed' && i.feedback?.result === 'passed').length / 
                interviews.filter(i => i.status === 'completed').length * 100
        }
    };

    res.json({
        success: true,
        data: stats
    });
});