import { GoogleGenerativeAI } from '@google/generative-ai';
import asyncHandler from '../middlewares/asyncHandler';
import { Response } from 'express';
import { UserRequest } from '../utils/types/userTypes';
import { Job } from '../entities/Job';
import { JobApplication } from '../entities/JobApplication';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { Interviews } from '../entities/Interviews';

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error("GOOGLE_GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Define allowed entities and their relations
const ALLOWED_ENTITIES = {
  Job: {
    relations: ['recruiter', 'applications', 'applications.applicant'],
    columns: ['job_id', 'title', 'company', 'description', 'required_skills', 'posted_date', 'is_active']
  },
  JobApplication: {
    relations: ['job', 'applicant', 'interviews'],
    columns: ['application_id', 'cover_letter', 'applied_at', 'status']
  },
  User: {
    relations: ['role', 'posted_jobs', 'applications'],
    columns: ['user_id', 'name', 'email', 'phone_number', 'skills', 'created_at', 'updated_at', 'is_active']
  },
  Role: {
    relations: ['users'],
    columns: ['role_id', 'role_name']
  },
  Interviews: {
    relations: ['application', 'application.job', 'application.applicant'],
    columns: ['interview_id', 'scheduled_at', 'location', 'status']
  }
};

// Common greetings and chat patterns
const CHAT_PATTERNS = [
  { pattern: /^(hi|hello|hey|greetings)\b/i, response: "Hello! How can I assist you with job or application information today?" },
  { pattern: /how are you/i, response: "I'm just a database assistant, but I'm functioning well! How can I help you with job or application data?" },
  { pattern: /thank|thanks/i, response: "You're welcome! Let me know if you need any other information about jobs or applications." },
  { pattern: /bye|goodbye/i, response: "Goodbye! Feel free to ask if you need more information about jobs or applications later." },
  { pattern: /what can you do/i, response: "I can provide information about jobs, applications, users, and interviews. Ask me anything about these topics!" }
];

export const assistantAI = asyncHandler(async (req: UserRequest, res: Response) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({
      success: false,
      message: "Question is required",
      data: null
    });
  }

  // First check if it's a basic chat message
  const chatResponse = handleBasicChat(question);
  if (chatResponse) {
    return res.status(200).json({
      success: true,
      message: chatResponse,
      data: null
    });
  }

  // First check if we can handle this with a direct database query
  const dbResponse = await tryDatabaseQuery(question);
  if (dbResponse) {
    return res.status(200).json(dbResponse);
  }

  // If not a direct query, use AI but with strict limitations
  const prompt = `
  You are a friendly but professional database assistant with these capabilities:
  1. Basic chat and greetings
  2. Read-only access to job, application, user, and interview data

  When responding:
  - For general chat, be polite and professional
  - For data queries, only provide information that exists in the database
  - Never suggest modifications or actions
  - Format all responses as valid JSON with this structure:
    {
      "success": boolean,
      "message": string,
      "data": any
    }

  If asked to perform any action (create, update, delete), respond with:
  {
    "success": false,
    "message": "I can only provide read-only access to the database",
    "data": null
  }

  Current question: ${question}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse the response
    let cleanedResponse = text.replace(/```json|```/g, '').trim();
    let jsonResponse


    try {
      jsonResponse = JSON.parse(cleanedResponse);
    } catch (e) {
      // If parsing fails but it's a simple chat response, wrap it
      if (isLikelyChatResponse(cleanedResponse)) {
        jsonResponse = {
          success: true,
          message: cleanedResponse,
          data: null
        };
      } else {
        throw new Error("Invalid response format");
      }
    }

    // Additional validation
    if (jsonResponse.success && containsModificationRequest(question)) {
      jsonResponse = {
        success: false,
        message: "I can only provide read-only access to the database",
        data: null
      };
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

// Helper function to handle basic chat
function handleBasicChat(question: string): string | null {
  const lowerQuestion = question.toLowerCase().trim();
  for (const { pattern, response } of CHAT_PATTERNS) {
    if (pattern.test(lowerQuestion)) {
      return response;
    }
  }
  return null;
}

// Helper function to detect modification requests
function containsModificationRequest(text: string): boolean {
  const modificationKeywords = [
    'create', 'update', 'delete', 'remove', 'add',
    'change', 'modify', 'edit', 'insert', 'alter'
  ];
  return modificationKeywords.some(keyword =>
    text.toLowerCase().includes(keyword)
  );
}

function isLikelyChatResponse(text: string): boolean {
  return !text.includes('{') && !text.includes('}') &&
    !text.match(/\b(job|application|user|interview)\b/i);
}

// Helper function to attempt direct database queries
async function tryDatabaseQuery(question: string): Promise<any> {
  // Match common query patterns
  const queryPatterns = [
    {
      pattern: /(list|show|get) (all|)jobs/i,
      handler: async () => {
        const jobs = await Job.find({ relations: ALLOWED_ENTITIES.Job.relations });
        return {
          success: true,
          message: "Jobs retrieved successfully",
          data: jobs.map(job => filterEntity(job, 'Job'))
        };
      }
    },
    {
      pattern: /(list|show|get) applications (for|of) job (\d+)/i,
      handler: async (match: RegExpMatchArray) => {
        const jobId = parseInt(match[3]);
        const applications = await JobApplication.find({
          where: { job: { job_id: jobId } },
          relations: ALLOWED_ENTITIES.JobApplication.relations
        });
        return {
          success: true,
          message: `Applications for job ${jobId} retrieved successfully`,
          data: applications.map(app => filterEntity(app, 'JobApplication'))
        };
      }
    },
    {
      pattern: /(get|show) user (\d+)/i,
      handler: async (match: RegExpMatchArray) => {
        const userId = parseInt(match[2]);
        const user = await User.findOne({
          where: { user_id: userId },
          relations: ALLOWED_ENTITIES.User.relations
        });
        if (!user) {
          return {
            success: false,
            message: `User ${userId} not found`,
            data: null
          };
        }
        return {
          success: true,
          message: "User retrieved successfully",
          data: filterEntity(user, 'User')
        };
      }
    },
    // Add more query patterns as needed
  ];

  for (const { pattern, handler } of queryPatterns) {
    const match = question.match(pattern);
    if (match) {
      return await handler(match);
    }
  }

  return null;
}

// Helper function to filter entity properties based on allowed columns
function filterEntity(entity: any, entityType: keyof typeof ALLOWED_ENTITIES): any {
  const allowed = ALLOWED_ENTITIES[entityType];
  const filtered: any = {};

  // Filter direct columns
  allowed.columns.forEach(column => {
    if (entity.hasOwnProperty(column)) {
      filtered[column] = entity[column];
    }
  });

  // Handle relations
  Object.keys(entity).forEach(key => {
    if (allowed.relations.includes(key)) {
      if (Array.isArray(entity[key])) {
        filtered[key] = entity[key].map((item: any) =>
          filterEntity(item, getEntityType(key) as any));
      } else if (entity[key] !== null && typeof entity[key] === 'object') {
        filtered[key] = filterEntity(entity[key], getEntityType(key));
      }
    }
  });

  return filtered;
}

// Helper function to get entity type from relation name
function getEntityType(relationName: string): keyof typeof ALLOWED_ENTITIES {
  if (relationName === 'recruiter' || relationName === 'applicant') return 'User';
  if (relationName === 'job') return 'Job';
  if (relationName === 'role') return 'Role';
  if (relationName === 'applications') return 'JobApplication';
  if (relationName === 'interviews') return 'Interviews';
  return 'User'; // default fallback
}