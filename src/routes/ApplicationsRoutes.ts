
import express from 'express';
import { protect } from '../middlewares/auth/protect';
import {
    applyForJob,
    revokeJobApplication,
    getAllJobApplications,
    getJobApplicationsForRecruiter,
} from '../controllers/jobApplicationController';

const router = express.Router();

// Route to apply for a job
router.post('/apply/:jobId', protect, applyForJob);

// Route to revoke a job application
router.delete('/revoke/:applicationId', protect, revokeJobApplication);

// Route to get all job applications for a user (jobseeker)
router.get('/myApplications', protect, getAllJobApplications);

// Route to get all job applications for a recruiter
router.get('/recruiterApplications', protect, getJobApplicationsForRecruiter);

export default router;