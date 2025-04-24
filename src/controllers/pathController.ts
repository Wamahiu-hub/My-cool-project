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

interface LearningPath {
  dreamJob: {
    title: string;
    description: string;
    requiredSkills: string[];
    averageSalaryRange: string;
    growthProspects: string;
  };
  skillGaps: string[];
  learningPath: {
    resources: {
      type: 'book' | 'course' | 'tutorial' | 'other';
      title: string;
      authorProvider: string;
      link: string;
      estimatedDuration: string;
    }[];
    timeline: {
      shortTerm: string[];
      mediumTerm: string[];
      longTerm: string[];
    };
    milestones: string[];
  };
  recommendedActions: string[];
}

export const generateLearningPath = asyncHandler(async (req: UserRequest, res: Response) => {
  const { userId } = req.body;

  // Validate request
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
      data: null
    });
  }

  try {
    // Get user from database
    const user = await User.findOne({
      where: { user_id: userId },
      relations: ['role']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null
      });
    }

    if (!user.skills || user.skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User skills not found. Please update your skills profile first.",
        data: null
      });
    }

    // Generate AI prompt
    const prompt = `
      You are a career development assistant. Create a detailed learning path and dream job profile in JSON format based on:

      USER PROFILE:
      - Skills: ${user.skills.join(', ')}
      - Current Role: ${user.role?.role_name || 'Not specified'}
      - Experience Level: ${user.skills.length > 5 ? 'Intermediate' : 'Beginner'}

      REQUIREMENTS:
      1. Dream Job Profile:
         - Title
         - Description
         - Required skills (match with user's existing skills)
         - Salary range (realistic for their level)
         - Growth prospects

      2. Skill Gap Analysis:
         - Missing skills needed
         - Priority level for each

      3. Learning Path:
         - Resources (3-5 items):
           * Books (include ISBN if possible)
           * Online courses (with platforms)
           * Tutorials
           * Certifications
         - Timeline (3 months, 6 months, 1 year goals)
         - Key milestones

      4. Recommended Actions:
         - Networking opportunities
         - Projects to build
         - Communities to join

      OUTPUT FORMAT:
      Return ONLY a well-formatted JSON object that follows this structure:
      {
        "dreamJob": {
          "title": string,
          "description": string,
          "requiredSkills": string[],
          "averageSalaryRange": string,
          "growthProspects": string
        },
        "skillGaps": string[],
        "learningPath": {
          "resources": Array<{
            "type": "book"|"course"|"tutorial"|"certification",
            "title": string,
            "authorProvider": string,
            "link": string,
            "estimatedDuration": string
          }>,
          "timeline": {
            "shortTerm": string[],
            "mediumTerm": string[],
            "longTerm": string[]
          },
          "milestones": string[]
        },
        "recommendedActions": string[]
      }

      Important:
      - Only return the raw JSON without any markdown formatting
      - Ensure all links are valid URLs
      - Keep descriptions concise but actionable
    `;

    // Get AI response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // Clean and validate response
    const cleanedResponse = generatedText.replace(/```json|```/g, '').trim();
    let parsedResponse: LearningPath;

    try {
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to process learning path",
        data: null
      });
    }

    // Validate response structure
    if (!parsedResponse.dreamJob || !parsedResponse.learningPath) {
      return res.status(500).json({
        success: false,
        message: "Invalid learning path format generated",
        data: null
      });
    }

    // Save to database
    user.path = cleanedResponse;
    await user.save();

    // Return response
    return res.status(200).json({
      success: true,
      message: "Learning path generated and saved successfully",
      data: parsedResponse
    });

  } catch (error) {
    console.error("Error in generateLearningPath:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while generating learning path",
      data: null
    });
  }
});

// Additional endpoint to get saved learning path
export const getLearningPath = asyncHandler(async (req: UserRequest, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
      data: null
    });
  }

  try {
    const user = await User.findOne({
      where: { user_id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null
      });
    }

    if (!user.path) {
      return res.status(404).json({
        success: false,
        message: "No learning path found for this user",
        data: null
      });
    }

    const learningPath = JSON.parse(user.path) as LearningPath;
    return res.status(200).json({
      success: true,
      message: "Learning path retrieved successfully",
      data: learningPath
    });

  } catch (error) {
    console.error("Error in getLearningPath:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving learning path",
      data: null
    });
  }
});