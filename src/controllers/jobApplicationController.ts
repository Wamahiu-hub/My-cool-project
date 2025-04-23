import { Response } from "express";
import { AppDataSource } from "../config/data-source";
import { JobApplication } from "../entities/JobApplication";
import { Job } from "../entities/Job";
import { User } from "../entities/User";
import { RequestWithUser, MulterRequest, FileWithPath } from "../utils/types/customTypes";
import asyncHandler from "../middlewares/asyncHandler";

const applicationRepository = AppDataSource.getRepository(JobApplication);
const jobRepository = AppDataSource.getRepository(Job);
const userRepository = AppDataSource.getRepository(User);

export const applyForJob = asyncHandler(async (req: MulterRequest, res: Response) => {
    const { cover_letter, additional_comments, answers_to_questions } = req.body;
    const { jobId } = req.params;

    const applicant = await userRepository.findOne({
        where: { user_id: req.user.user_id }
    });

    const job = await jobRepository.findOne({
        where: { job_id: parseInt(jobId) },
        relations: ['recruiter']
    });

    if (!applicant || !job) {
        return res.status(404).json({
            message: !applicant ? "Applicant not found" : "Job not found"
        });
    }

    // Check if already applied
    const existingApplication = await applicationRepository.findOne({
        where: {
            applicant: { user_id: req.user.user_id },
            job: { job_id: parseInt(jobId) }
        }
    });

    if (existingApplication) {
        return res.status(400).json({ message: "Already applied for this job" });
    }

    // Handle file uploads
    const cv_url = req.files?.['cv']?.[0]?.path;
    const additional_documents = req.files?.['documents']?.map((doc: FileWithPath) => doc.path);

    const application = applicationRepository.create({
        applicant,
        job,
        cover_letter,
        cv_url,
        additional_documents,
        additional_comments,
        answers_to_questions,
        status: 'pending',
        application_date: new Date()
    });

    await applicationRepository.save(application);

    // Update job applications count
    job.applications_count = (job.applications_count || 0) + 1;
    await jobRepository.save(job);

    res.status(201).json({
        success: true,
        data: application
    });
});

export const getApplicationById = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const application = await applicationRepository.findOne({
        where: { application_id: parseInt(req.params.id) },
        relations: ['applicant', 'job', 'job.recruiter']
    });

    if (!application) {
        return res.status(404).json({ message: "Application not found" });
    }

    // Check if user is authorized (applicant or job recruiter)
    if (application.applicant.user_id !== req.user.user_id &&
        application.job.recruiter.user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Not authorized to view this application" });
    }

    res.json({
        success: true,
        data: application
    });
});

export const updateApplicationStatus = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { status, feedback } = req.body;
    
    const application = await applicationRepository.findOne({
        where: { application_id: parseInt(req.params.id) },
        relations: ['job', 'job.recruiter']
    });

    if (!application) {
        return res.status(404).json({ message: "Application not found" });
    }

    // Check if user is the job recruiter
    if (application.job.recruiter.user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Not authorized to update this application" });
    }

    application.status = status;
    application.feedback = feedback;
    application.status_updated_at = new Date();
    application.status_updated_by = {
        user_id: req.user.user_id.toString(),
        name: req.user.full_name
    };

    await applicationRepository.save(application);

    res.json({
        success: true,
        data: application
    });
});

export const withdrawApplication = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const application = await applicationRepository.findOne({
        where: { application_id: parseInt(req.params.id) },
        relations: ['applicant']
    });

    if (!application) {
        return res.status(404).json({ message: "Application not found" });
    }

    // Check if user is the applicant
    if (application.applicant.user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Not authorized to withdraw this application" });
    }

    application.status = 'withdrawn';
    application.status_updated_at = new Date();
    await applicationRepository.save(application);

    res.json({
        success: true,
        data: application
    });
});

export const getUserApplications = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const applications = await applicationRepository.find({
        where: {
            applicant: { user_id: req.user.user_id }
        },
        relations: ['job', 'job.recruiter'],
        order: { application_date: 'DESC' }
    });

    res.json({
        success: true,
        count: applications.length,
        data: applications
    });
});

export const getJobApplications = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { jobId } = req.params;
    const { status, sort_by = 'application_date', order = 'DESC' } = req.query;

    const job = await jobRepository.findOne({
        where: { job_id: parseInt(jobId) },
        relations: ['recruiter']
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    // Check if user is the job recruiter
    if (job.recruiter.user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Not authorized to view these applications" });
    }

    let queryBuilder = applicationRepository.createQueryBuilder("application")
        .leftJoinAndSelect("application.applicant", "applicant")
        .leftJoinAndSelect("application.job", "job")
        .where("job.job_id = :jobId", { jobId });

    if (status) {
        queryBuilder.andWhere("application.status = :status", { status });
    }

    queryBuilder.orderBy(`application.${sort_by}`, order as 'ASC' | 'DESC');

    const applications = await queryBuilder.getMany();

    res.json({
        success: true,
        count: applications.length,
        data: applications
    });
});