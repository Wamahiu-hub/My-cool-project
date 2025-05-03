import { GoogleGenerativeAI } from '@google/generative-ai';
import asyncHandler from '../middlewares/asyncHandler';
import { Response } from 'express';
import { UserRequest } from '../utils/types/userTypes';
import { User } from '../entities/User';

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error("GOOGLE_GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


export const assistantAI = asyncHandler(async (req: UserRequest, res: Response) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({
      success: false,
      message: "Question is required",
      data: null
    });
  }


  const dataInfo = await (async () => {
    const users = await User.find({
      relations: [
        "role",
        "posted_jobs",
        "posted_jobs.applications",
        "posted_jobs.applications.applicant",
        "posted_jobs.applications.interviews",
        "applications",
        "applications.job",
        "applications.interviews"
      ]
    });

    return {
      users: users.map(user => ({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role?.role_name,
        skills: user.skills,
        cv: user.cv,
        posted_jobs: user.posted_jobs?.map(job => ({
          job_id: job.job_id,
          title: job.title,
          company: job.company,
          required_skills: job.required_skills,
          applications: job.applications?.map(app => ({
            application_id: app.application_id,
            applicant: app.applicant?.name,
            status: app.status,
            interviews: app.interviews?.map(interview => ({
              interview_id: interview.interview_id,
              scheduled_at: interview.scheduled_at,
              location: interview.location,
              status: interview.status,
            }))
          }))
        })),
        applications: user.applications?.map(app => ({
          application_id: app.application_id,
          job_title: app.job?.title,
          status: app.status,
          interviews: app.interviews?.map(interview => ({
            interview_id: interview.interview_id,
            scheduled_at: interview.scheduled_at,
            location: interview.location,
            status: interview.status,
          }))
        }))
      }))
    };
  })();

  // If not a direct query, use AI but with strict limitations
  const prompt = `
  You are a professional HR database assistant with read-only access. the ifomation is from ${JSON.stringify(dataInfo, null, 2)} Your capabilities are: 

1. Answer general HR-related questions


Response Requirements:
1. For greetings: Simple friendly response (e.g., "Welcome to HR Assistant! How can I help?")
2. For data requests:
    - Only use data EXACTLY as it exists in the structure above
    - NEVER infer or calculate values
    - If data doesn't exist, respond with "No matching records found"
    3. For modification requests: "I only have read-only access to HR data"
    4. Always respond with VALID JSON using this structure:
    {
      "success": boolean,
      "message": string,
      "data": any | null
    }

    Examples:
    User: "Show job applications for John Doe"
    Response: 
    {
      "success": true,
      "message": "Found 3 applications",
      "data": [...] // EXACT array from applications
    }

    User: "Create new job"
    Response:
    {
      "success": false,
      "message": "I only have read-only access to HR data",
      "data": null
    }

    Current Query: ${question}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse the response

    const cleanedResponse = text.replace(/```json|```/g, '').trim();
    const jsonResponse = JSON.parse(cleanedResponse);


    // Handle empty data case
    if (jsonResponse.success && !jsonResponse.data) {
      return res.status(404).json({
        success: false,
        message: "No matching data found",
        data: null
      });
    }

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Error generating AI response:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
      data: null
    });
  }
});

