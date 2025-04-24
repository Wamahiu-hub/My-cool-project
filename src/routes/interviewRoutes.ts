import express from 'express';
import { protect } from '../middlewares/auth/protect';
import {
    scheduleInterview,
    getScheduledInterviews,
    getJobseekerInterviews,
    deleteOldInterviews,
    updateInterview,
} from '../controllers/interviewController';

const router = express.Router();

// Route to schedule an interview
router.post('/schedule', protect, scheduleInterview);

// Route to get all interviews scheduled by the recruiter
router.get('/recruiter', protect, getScheduledInterviews);

// Route to get all interviews for the jobseeker
router.get('/jobseeker', protect, getJobseekerInterviews);

// Route to delete old interviews
router.delete('/deleteOld', protect, deleteOldInterviews);

// Route to update an interview
router.patch('/update/:interviewId', protect, updateInterview);

export default router;