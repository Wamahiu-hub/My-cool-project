import { Response } from "express";
import { AppDataSource } from "../config/data-source";
import { SkillAssessment } from "../entities/SkillAssessment";
import { JobApplication } from "../entities/JobApplication";
import { User } from "../entities/User";
import { RequestWithUser } from "../utils/types/customTypes";
import asyncHandler from "../middlewares/asyncHandler";

const assessmentRepository = AppDataSource.getRepository(SkillAssessment);
const applicationRepository = AppDataSource.getRepository(JobApplication);
const userRepository = AppDataSource.getRepository(User);

export const createAssessment = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { applicationId } = req.params;
    const { 
        test_type,
        questions,
        time_limit_minutes,
        passing_score,
        instructions,
        skills_tested,
        difficulty_level
    } = req.body;

    const application = await applicationRepository.findOne({
        where: { application_id: parseInt(applicationId) },
        relations: ['job', 'job.recruiter']
    });

    if (!application) {
        return res.status(404).json({ message: "Application not found" });
    }

    // Check if user is the job recruiter
    if (application.job.recruiter.user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Not authorized to create assessments" });
    }

    const assessment = assessmentRepository.create({
        application,
        test_type,
        questions,
        time_limit_minutes,
        passing_score,
        instructions,
        skills_tested,
        difficulty_level,
        status: 'pending',
        created_by: req.user.user_id
    });

    await assessmentRepository.save(assessment);

    res.status(201).json({
        success: true,
        data: assessment
    });
});

export const submitAssessment = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { assessmentId } = req.params;
    const { answers, time_taken } = req.body;

    const assessment = await assessmentRepository.findOne({
        where: { assessment_id: parseInt(assessmentId) },
        relations: ['application', 'application.applicant']
    });

    if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
    }

    // Check if user is the applicant
    if (!assessment.application || assessment.application.applicant.user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Not authorized to submit this assessment" });
    }

    if (assessment.status !== 'pending') {
        return res.status(400).json({ message: "Assessment already submitted or expired" });
    }

    // Calculate score based on answers
    const score = calculateScore(assessment.questions, answers);
    const passed = score >= assessment.passing_score;

    assessment.answers = answers;
    assessment.score = score;
    assessment.time_taken = time_taken;
    assessment.status = 'completed';
    assessment.passed = passed;
    assessment.completed_at = new Date();

    await assessmentRepository.save(assessment);

    res.json({
        success: true,
        data: {
            assessment_id: assessment.assessment_id,
            score,
            passed,
            completion_time: time_taken
        }
    });
});

export const getAssessmentById = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const assessment = await assessmentRepository.findOne({
        where: { assessment_id: parseInt(req.params.id) },
        relations: ['application', 'application.applicant', 'application.job', 'application.job.recruiter']
    });

    if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
    }

    // Check if user is authorized (applicant or recruiter)
    if (!assessment.application || 
        assessment.application.applicant.user_id !== req.user.user_id &&
        assessment.application.job.recruiter.user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Not authorized to view this assessment" });
    }

    res.json({
        success: true,
        data: assessment
    });
});

export const getApplicationAssessments = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { applicationId } = req.params;

    const application = await applicationRepository.findOne({
        where: { application_id: parseInt(applicationId) },
        relations: ['applicant', 'job', 'job.recruiter']
    });

    if (!application) {
        return res.status(404).json({ message: "Application not found" });
    }

    // Check if user is authorized (applicant or recruiter)
    if (application.applicant.user_id !== req.user.user_id &&
        application.job.recruiter.user_id !== req.user.user_id) {
        return res.status(403).json({ message: "Not authorized to view these assessments" });
    }

    const assessments = await assessmentRepository.find({
        where: { application: { application_id: parseInt(applicationId) } }
    });

    res.json({
        success: true,
        count: assessments.length,
        data: assessments
    });
});

// Helper function to calculate assessment score
function calculateScore(questions: any[], answers: any[]): number {
    let totalQuestions = questions.length;
    let correctAnswers = 0;

    questions.forEach((question, index) => {
        const userAnswer = answers[index];
        
        if (question.type === 'multiple_choice') {
            if (question.correct_answer === userAnswer) {
                correctAnswers++;
            }
        } else if (question.type === 'coding') {
            // For coding questions, we might have a more complex scoring logic
            // This is a simplified version
            const score = evaluateCodingAnswer(question, userAnswer);
            correctAnswers += score;
        }
    });

    return (correctAnswers / totalQuestions) * 100;
}

// Helper function to evaluate coding answers
function evaluateCodingAnswer(question: any, answer: string): number {
    // This would be a more complex function in reality
    // It might run tests, check syntax, etc.
    // For now, we'll just do a basic check
    if (question.test_cases) {
        let passedTests = 0;
        question.test_cases.forEach((testCase: any) => {
            try {
                // Here we would actually run the code against test cases
                // This is just a placeholder
                if (answer.includes(testCase.expected_output)) {
                    passedTests++;
                }
            } catch (error) {
                // Handle evaluation errors
            }
        });
        return passedTests / question.test_cases.length;
    }
    return 0;
}