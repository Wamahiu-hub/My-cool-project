import { Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Interview } from "../entities/Interview";
import { JobApplication } from "../entities/JobApplication";
import { User } from "../entities/User";
import { RequestWithUser } from "../utils/types/customTypes";
import asyncHandler from "../middlewares/asyncHandler";
import { sendEmail } from "../utils/helpers/emailService";

const interviewRepository = AppDataSource.getRepository(Interview);
const applicationRepository = AppDataSource.getRepository(JobApplication);
const userRepository = AppDataSource.getRepository(User);

export const scheduleInterview = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { applicationId } = req.params;
    const { 
        interview_date, 
        interview_type,
        location,
        meeting_link,
        interview_round,
        interviewers,
        duration_minutes,
        special_instructions
    } = req.body;

    const application = await applicationRepository.findOne({
        where: { application_id: parseInt(applicationId) },
        relations: ['job', 'job.recruiter', 'applicant']
    });

    if (!application) {
        return res.status(404).json({ message: "Application not found" });
    }

    // Check if user is the job recruiter
    if (application.job.recruiter.user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Not authorized to schedule interviews" });
    }

    const interviewer = await userRepository.findOne({
        where: { user_id: req.user.user_id }
    });

    if (!interviewer) {
        return res.status(404).json({ message: "Interviewer not found" });
    }

    const interview = interviewRepository.create({
        application,
        interviewer,
        interview_date: new Date(interview_date),
        interview_type,
        location,
        meeting_link,
        interview_round,
        status: 'scheduled'
    });

    await interviewRepository.save(interview);

    // Send email notifications
    await sendEmail({
        to: application.applicant.email,
        subject: `Interview Scheduled - ${application.job.title}`,
        text: `Your interview has been scheduled for ${interview_date}. ${
            interview_type === 'online' ? `Meeting link: ${meeting_link}` : `Location: ${location}`
        }`
    });

    res.status(201).json({
        success: true,
        data: interview
    });
});

export const updateInterviewStatus = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { status, feedback, notes } = req.body;
    
    const interview = await interviewRepository.findOne({
        where: { interview_id: parseInt(req.params.id) },
        relations: ['interviewer']
    });

    if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
    }

    // Check if user is the interviewer
    if (interview.interviewer.user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Not authorized to update this interview" });
    }

    interview.status = status;
    interview.notes = notes;
    interview.updated_at = new Date();

    await interviewRepository.save(interview);

    res.json({
        success: true,
        data: interview
    });
});

export const getInterviewById = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const interview = await interviewRepository.findOne({
        where: { interview_id: parseInt(req.params.id) },
        relations: ['application', 'application.applicant', 'application.job', 'interviewer']
    });

    if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
    }

    // Check authorization
    if (interview.interviewer.user_id !== req.user.user_id &&
        interview.application.applicant.user_id !== req.user.user_id &&
        interview.application.job.recruiter.user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Not authorized to view this interview" });
    }

    res.json({
        success: true,
        data: interview
    });
});

export const getRecruiterInterviews = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const interviews = await interviewRepository
        .createQueryBuilder("interview")
        .leftJoinAndSelect("interview.application", "application")
        .leftJoinAndSelect("application.job", "job")
        .leftJoinAndSelect("job.recruiter", "recruiter")
        .leftJoinAndSelect("application.applicant", "applicant")
        .where('job.recruiter.user_id = :recruiterId', { recruiterId: req.user.user_id })
        .orderBy('interview.interview_date', 'DESC')
        .getMany();

    res.json({
        success: true,
        count: interviews.length,
        data: interviews
    });
});

export const getApplicantInterviews = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const interviews = await interviewRepository
        .createQueryBuilder("interview")
        .leftJoinAndSelect("interview.application", "application")
        .leftJoinAndSelect("application.job", "job")
        .leftJoinAndSelect("job.recruiter", "recruiter")
        .where('application.applicant.user_id = :applicantId', { applicantId: req.user.user_id })
        .orderBy('interview.interview_date', 'DESC')
        .getMany();

    res.json({
        success: true,
        count: interviews.length,
        data: interviews
    });
});