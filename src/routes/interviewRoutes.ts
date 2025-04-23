import { Router } from "express";
import {
  scheduleInterview,
  updateInterviewStatus,
  getInterviewById,
  getRecruiterInterviews,
  getApplicantInterviews,
} from "../controllers/interviewController";

const router = Router();

// 1️⃣ Schedule a new interview (recruiter only)
router.post("/:applicationId", scheduleInterview);

// 2️⃣ Update an existing interview’s status/notes
router.patch("/:id/status", updateInterviewStatus);

// 3️⃣ Fetch one interview by ID
router.get("/:id", getInterviewById);

// 4️⃣ List all interviews for which the current user is the recruiter
router.get("/recruiter", getRecruiterInterviews);

// 5️⃣ List all interviews for which the current user is the applicant
router.get("/applicant", getApplicantInterviews);

export default router;
