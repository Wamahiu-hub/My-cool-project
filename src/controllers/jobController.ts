import { Response, NextFunction } from "express";
import asyncHandler from "../middlewares/asyncHandler";
import { UserRequest } from "../utils/types/userTypes";
import { Job } from "../entities/Job"; // Import the Job entity
import { GoogleGenerativeAI, } from '@google/generative-ai'



// Function to post a job
export const postJob = asyncHandler(async (req: UserRequest, res: Response, next: NextFunction) => {
    const { title, company, description, skills_required } = req.body;

    // Check if user is a recruiter
    if (!req.user || req.user.role_name !== 'Recruiters') {
        return res.status(403).json({ message: "Not authorized to post jobs" });
    }

    // Create new job
    const job = Job.create({
        title,
        company,
        description,
        required_skills: skills_required,
        recruiter: { user_id: Number(req.user.user_id) },
        is_active: true,
        posted_date: new Date()
    });

    // Save job to database
    await job.save();

    return res.status(201).json({
        success: true,
        message: "Job posted successfully",
        data: {
            job_id: job.job_id,
            title: job.title,
            company: job.company,
            description: job.description,
            required_skills: job.required_skills,
            recruiter: {
                user_id: req.user.user_id,
                name: req.user.name,
                email: req.user.email
            },
            posted_date: job.posted_date,
            is_active: job.is_active
        }
    });
});

// fuction to get my jobs

export const getMyJobs = asyncHandler(
    async (req: UserRequest, res: Response, next: NextFunction) => {

        if (!req.user || req.user.role_name !== 'Recruiters') {
            return res.status(403).json({ message: "Not authorized to view jobs" });
        }

        const jobs = await Job.find({
            where: { recruiter: { user_id: Number(req.user.user_id) } },
            order: { posted_date: "DESC" },
        })

        res.status(200).json({ success: true, data: jobs });
    }
)


// update job function
export const updateJob = asyncHandler(async (req: UserRequest, res: Response) => {

    const jobId = Number(req.params.jobId);

    console.log(jobId)

    if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job ID" });
    }


    if (!req.user || req.user.role_name !== 'Recruiters') {
        return res.status(403).json({ message: "Not authorized to update jobs" });
    }

    const job = await Job.findOne({
        where: {
            job_id: jobId,
            recruiter: { user_id: Number(req.user?.user_id) }
        }
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found or unauthorized" });
    }

    const { title, description, company, required_skills, is_active } = req.body;

    if (title) job.title = title;
    if (description) job.description = description;
    if (company) job.company = company;
    if (required_skills) job.required_skills = required_skills;
    if (typeof is_active === "boolean") job.is_active = is_active;

    await job.save();

    res.status(200).json({
        success: true,
        message: "Job updated successfully",
        data: job
    });
});


// delete job function
export const deleteJob = asyncHandler(async (req: UserRequest, res: Response) => {
    const jobId = Number(req.params.jobId);

    console.log(jobId)

    if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job ID" });
    }

    if (!req.user || req.user.role_name !== 'Recruiters') {
        return res.status(403).json({ message: "Not authorized to delete jobs" });
    }

    const job = await Job.findOne({
        where: {
            job_id: jobId,
            recruiter: { user_id: Number(req.user?.user_id) }
        }
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found or unauthorized" });
    }

    await job.remove();

    res.status(200).json({
        success: true,
        message: "Job deleted successfully"
    });
});

// get alljobs for all users and matched with gemine api key using gemine api and google gerneratvie ai to get match %  based on users skill and cv uploaded  to the jobs description and required skills for that job

// AI

if (!process.env.GOOGLE_GEMINI_API_KEY) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const getAllJobs = asyncHandler(async (req: UserRequest, res: Response) => {

    const jobs = await Job.find({ relations: ["recruiter"] });

    if (!jobs || jobs.length === 0) {
        return res.status(404).json({ message: "No jobs found" });
    }

    const userSkills = (req.user?.skills ?? []).join(", ");

    const userCV = req.user?.cv;

    const jobMatches = await Promise.all(
        jobs.map(async (job) => {
            const jobDescription = `${job.description}. Required Skills: ${job.required_skills.join(", ")}`;

            const prompt = `
                You are an AI assistant helping to match job seekers with job opportunities.
                Match the user's skills and CV to the job description and required skills.
                
                User Skills: ${userSkills}
                User CV: ${userCV}
                
                Job Description: ${jobDescription}
                
                Respond with only the match percentage (number only, e.g., 72).
            `;

            let matchPercentage = 0;

            try {
                const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
                const responseText = result.response.text();
                matchPercentage = parseFloat(responseText.match(/\d+/)?.[0] || "0");
            } catch (error) {
                console.error("Error generating match percentage:", error);
            }

            return {
                job_id: job.job_id,
                title: job.title,
                company: job.company,
                description: job.description,
                required_skills: job.required_skills,
                recruiter: {
                    user_id: job.recruiter.user_id,
                    name: job.recruiter.name,
                    email: job.recruiter.email,
                },
                posted_date: job.posted_date,
                is_active: job.is_active,
                match_percentage: matchPercentage,
            };
        })
    );

    return res.status(200).json({
        success: true,
        data: jobMatches,
    });
});
