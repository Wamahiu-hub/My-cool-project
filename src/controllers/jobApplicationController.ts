 import { Request, Response } from "express";
import asyncHandler from "../middlewares/asyncHandler";
import { UserRequest } from "../utils/types/userTypes";
import { Job } from "../entities/Job";
import { JobApplication } from "../entities/JobApplication";



// job application for jobseekers and revoking the application before the application deadline

export const applyForJob = asyncHandler(async (req: UserRequest, res: Response) => {
    // Get the job ID from the request params
    const { jobId } = req.params;

    // Get the user ID from the authenticated user
    const userId = req.user?.user_id;

    if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if the job exists
    const job = await Job.findOne({ where: { job_id: Number(jobId) } });

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    // Check if the user has already applied for the job
    const existingApplication = await JobApplication.findOne({
        where: { job: { job_id: Number(jobId) }, applicant: { user_id: Number(userId) } },
    });

    if (existingApplication) {
        return res.status(400).json({ message: "You have already applied for this job" });
    }

    // Create a new job application
    const jobApplication = JobApplication.create({
        job: { job_id: job.job_id },
        applicant: { user_id: Number(userId) },
        applied_at: new Date(),
        status: "pending",
    });

    // Save the job application to the database
    await jobApplication.save();

    return res.status(201).json({
        success: true,
        message: "Job application submitted successfully",
        data: {
            application_id: jobApplication.application_id,
            job_id: job.job_id,
            title: job.title,
            company: job.company,
            description: job.description,
            required_skills: job.required_skills,
            applied_at: jobApplication.applied_at,
            status: jobApplication.status,
        },
    });
});
//revoking the application before the application deadline

export const revokeJobApplication = asyncHandler(async (req: UserRequest, res: Response) => {
    // Get the job application ID from the request params
    const { applicationId } = req.params;

    // Get the user ID from the authenticated user
    const userId = req.user?.user_id;

    if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    // Find the job application
    const jobApplication = await JobApplication.findOne({
        where: { application_id: Number(applicationId) },
        relations: ["job", "applicant"],
    });

    if (!jobApplication) {
        return res.status(404).json({ message: "Job application not found" });
    }

    // Check if the application belongs to the authenticated user
    if (jobApplication.applicant.user_id !== Number(userId)) {
        return res.status(403).json({ message: "Not authorized to revoke this application" });
    }

    // Check if the job is still active
    if (!jobApplication.job.is_active) {
        return res.status(400).json({ message: "Cannot revoke application for an inactive job" });
    }

    // Revoke the application by removing it from the database
    await jobApplication.remove();

    return res.status(200).json({
        success: true,
        message: "Job application revoked successfully",
    });
});

// Get all job applications for a user(jobseeker)
export const getAllJobApplications = asyncHandler(async (req: UserRequest, res: Response) => {
    // Get the user ID from the authenticated user
    const userId = req.user?.user_id;

    if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    // Fetch all job applications for the authenticated user
    const jobApplications = await JobApplication.find({
        where: { applicant: { user_id: Number(userId) } },
        relations: ["job", "job.recruiter"],
    });

    if (!jobApplications || jobApplications.length === 0) {
        return res.status(404).json({ message: "No job applications found" });
    }

    // Format the response
    const formattedApplications = jobApplications.map((application) => ({
        application_id: application.application_id,
        job: {
            job_id: application.job.job_id,
            title: application.job.title,
            company: application.job.company,
            description: application.job.description,
            required_skills: application.job.required_skills,
            recruiter: {
                user_id: application.job.recruiter.user_id,
                name: application.job.recruiter.name,
                email: application.job.recruiter.email,
            },
        },
        applied_at: application.applied_at,
        status: application.status,
    }));

    return res.status(200).json({
        success: true,
        data: formattedApplications,
    });
});

// Get all job applications for a recruiter who has posted the job
export const getJobApplicationsForRecruiter = asyncHandler(async (req: UserRequest, res: Response) => {
    // Get the recruiter ID from the authenticated user
    const recruiterId = req.user?.user_id;

    if (!recruiterId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure the user is a recruiter
    if (!req.user || req.user.role_name !== "recruiter") {
        return res.status(403).json({ message: "Not authorized to view job applications" });
    }

    // Fetch all jobs posted by the recruiter
    const jobs = await Job.find({
        where: { recruiter: { user_id: Number(recruiterId) } },
        relations: ["applications", "applications.applicant"],
    });

    if (!jobs || jobs.length === 0) {
        return res.status(404).json({ message: "No jobs found for this recruiter" });
    }

    // Format the response to include job applications for each job
    const jobApplications = jobs.map((job) => ({
        job_id: job.job_id,
        title: job.title,
        company: job.company,
        applications: job.applications.map((application) => ({
            application_id: application.application_id,
            applicant: {
                user_id: application.applicant.user_id,
                name: application.applicant.name,
                email: application.applicant.email,
                phone_number: application.applicant.phone_number,
                cv: application.applicant.cv,
            },
            applied_at: application.applied_at,
            status: application.status,
        })),
    }));

    return res.status(200).json({
        success: true,
        data: jobApplications,
    });
});

