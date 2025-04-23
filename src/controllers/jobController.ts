import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Job } from "../entities/Job";
import { User } from "../entities/User";
import { RequestWithUser } from "../utils/types/customTypes";
import asyncHandler from "../middlewares/asyncHandler";
import { Not, IsNull } from "typeorm";

const jobRepository = AppDataSource.getRepository(Job);
const userRepository = AppDataSource.getRepository(User);

export const createJob = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { title, company, location, description, requirements, industry, type, salary_range_start, 
        salary_range_end, benefits, required_skills, preferred_skills, experience_level, 
        education_requirement, remote_work_allowed, location_details } = req.body;
    
    const recruiter = await userRepository.findOne({ where: { user_id: req.user.user_id } });
    if (!recruiter) {
        return res.status(404).json({ message: "Recruiter not found" });
    }

    const job = jobRepository.create({
        title,
        company,
        location,
        description,
        requirements,
        industry,
        employment_type: type,
        salary_range_start,
        salary_range_end,
        benefits,
        required_skills,
        preferred_skills,
        experience_level,
        education_requirement,
        remote_work_allowed,
        location_details,
        recruiter,
        is_active: true,
        views_count: 0,
        applications_count: 0
    });

    await jobRepository.save(job);
    res.status(201).json({
        success: true,
        data: job
    });
});

export const getAllJobs = asyncHandler(async (req: Request, res: Response) => {
    const jobs = await jobRepository.find({
        where: { is_active: true },
        relations: ['recruiter']
    });
    
    res.json({
        success: true,
        count: jobs.length,
        data: jobs
    });
});

export const getJobById = asyncHandler(async (req: Request, res: Response) => {
    const job = await jobRepository.findOne({
        where: { job_id: parseInt(req.params.id), is_active: true },
        relations: ['recruiter']
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    // Increment view count
    job.views_count += 1;
    await jobRepository.save(job);

    res.json({
        success: true,
        data: job
    });
});

export const updateJob = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const job = await jobRepository.findOne({
        where: { job_id: parseInt(req.params.id) },
        relations: ['recruiter']
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    // Check if the user is the recruiter who posted the job
    if (job.recruiter.user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Not authorized to update this job" });
    }

    Object.assign(job, req.body);
    await jobRepository.save(job);

    res.json({
        success: true,
        data: job
    });
});

export const deleteJob = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const job = await jobRepository.findOne({
        where: { job_id: parseInt(req.params.id) },
        relations: ['recruiter']
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    // Check if the user is the recruiter who posted the job
    if (job.recruiter.user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Not authorized to delete this job" });
    }

    // Soft delete by setting is_active to false
    job.is_active = false;
    await jobRepository.save(job);

    res.json({
        success: true,
        data: {}
    });
});

export const getRecruiterJobs = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const jobs = await jobRepository.find({
        where: { recruiter: { user_id: req.user.user_id }, is_active: true },
        relations: ['recruiter']
    });

    res.json({
        success: true,
        count: jobs.length,
        data: jobs
    });
});

export const searchJobs = asyncHandler(async (req: Request, res: Response) => {
    const { query, location, type, remote, salary_min, salary_max } = req.query;
    
    let queryBuilder = jobRepository.createQueryBuilder("job")
        .leftJoinAndSelect("job.recruiter", "recruiter")
        .where("job.is_active = :isActive", { isActive: true });

    if (query) {
        queryBuilder.andWhere(
            "(job.title ILIKE :query OR job.description ILIKE :query OR job.company ILIKE :query)",
            { query: `%${query}%` }
        );
    }

    if (location) {
        queryBuilder.andWhere("job.location ILIKE :location", { location: `%${location}%` });
    }

    if (type) {
        queryBuilder.andWhere("job.employment_type = :type", { type });
    }

    if (remote) {
        queryBuilder.andWhere("job.remote_work_allowed = :remote", { remote: remote === 'true' });
    }

    if (salary_min) {
        queryBuilder.andWhere("job.salary_range_start >= :salary_min", { salary_min });
    }

    if (salary_max) {
        queryBuilder.andWhere("job.salary_range_end <= :salary_max", { salary_max });
    }

    const jobs = await queryBuilder.getMany();

    res.json({
        success: true,
        count: jobs.length,
        data: jobs
    });
});