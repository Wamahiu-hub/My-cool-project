import { Interviews } from "../entities/Interviews";
import { JobApplication } from "../entities/JobApplication";
import asyncHandler from "../middlewares/asyncHandler";
import { Response } from "express";
import { UserRequest } from "../utils/types/userTypes";

// Schedule an interview for a jobseeker
export const scheduleInterview = asyncHandler(async (req: UserRequest, res: Response) => {
    const { applicationId, scheduled_at, location, notes } = req.body;


    // Find the job application
    const application = await JobApplication.findOne({
        where: { application_id: applicationId },
        relations: ["job", "job.recruiter"],
    });

    if (!application) {
        return res.status(404).json({ message: "Job application not found" });
    }

    // Ensure the recruiter owns the job
    if (!req.user || application.job.recruiter.user_id !== Number(req.user.user_id)) {
        return res.status(403).json({ message: "Not authorized to schedule interviews for this job" });
    }

    // Create a new interview
    const interview = Interviews.create({
        application,
        scheduled_at,
        location,
        notes,
        status: "scheduled",
    });

    // Save the interview to the database
    await interview.save();

    return res.status(201).json({
        success: true,
        message: "Interview scheduled successfully",
        data: {
            interview_id: interview.interview_id,
            scheduled_at: interview.scheduled_at,
            location: interview.location,
            notes: interview.notes,
            status: interview.status,
        },
    });
});



export const getScheduledInterviews = asyncHandler(async (req: UserRequest, res: Response) => {
    // Fetch all interviews for jobs posted by the recruiter
    if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    const interviews = await Interviews.find({
        where: { application: { job: { recruiter: { user_id: Number(req.user.user_id) } } } },
        relations: ["application", "application.job", "application.applicant"],
    });

    if (!interviews || interviews.length === 0) {
        return res.status(404).json({ message: "No interviews found" });
    }

    const formattedInterviews = interviews.map((interview) => ({
        interview_id: interview.interview_id,
        job_title: interview.application.job.title,
        applicant_name: interview.application.applicant.name,
        scheduled_at: interview.scheduled_at,
        location: interview.location,
        status: interview.status,
    }));

    return res.status(200).json({
        success: true,
        data: formattedInterviews,
    });
});





export const getJobseekerInterviews = asyncHandler(async (req: UserRequest, res: Response) => {
    // Ensure the user is authenticated
    if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    // Fetch all interviews for the jobseeker
    const interviews = await Interviews.find({
        where: { application: { applicant: { user_id: Number(req.user.user_id) } } },
        relations: ["application", "application.job"],
    });

    if (!interviews || interviews.length === 0) {
        return res.status(404).json({ message: "No interviews found" });
    }

    const formattedInterviews = interviews.map((interview) => ({
        interview_id: interview.interview_id,
        job_title: interview.application.job.title,
        scheduled_at: interview.scheduled_at,
        location: interview.location,
        status: interview.status,
    }));

    return res.status(200).json({
        success: true,
        data: formattedInterviews,
    });
});


export const deleteOldInterviews = asyncHandler(async (req: UserRequest, res: Response) => {
    // Calculate the date one week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Delete interviews older than one week
    const result = await Interviews.createQueryBuilder()
        .delete()
        .where("scheduled_at < :oneWeekAgo", { oneWeekAgo })
        .execute();

    return res.status(200).json({
        success: true,
        message: `${result.affected} old interviews deleted successfully`,
    });
});

export const updateInterview = asyncHandler(async (req: UserRequest, res: Response) => {
    const { interviewId } = req.params;
    const { scheduled_at, location, notes, status } = req.body;


    // Find the interview
    const interview = await Interviews.findOne({
        where: { interview_id: Number(interviewId) },
        relations: ["application", "application.job", "application.job.recruiter"],
    });

    if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
    }

    // Ensure the recruiter owns the job associated with the interview
    if (!req.user || interview.application.job.recruiter.user_id !== Number(req.user.user_id)) {
        return res.status(403).json({ message: "Not authorized to update this interview" });
    }

    // Update the interview details
    if (scheduled_at) interview.scheduled_at = scheduled_at;
    if (location) interview.location = location;
    if (notes) interview.notes = notes;
    if (status) interview.status = status;

    // Save the updated interview to the database
    await interview.save();

    return res.status(200).json({
        success: true,
        message: "Interview updated successfully",
        data: {
            interview_id: interview.interview_id,
            scheduled_at: interview.scheduled_at,
            location: interview.location,
            notes: interview.notes,
            status: interview.status,
        },
    });
});