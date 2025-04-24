import express from 'express';
import { protect } from '../middlewares/auth/protect';
import { updateUserProfile, getAllUsers, deleteUser } from '../controllers/usersController';

const router = express.Router();

// Route to update a user's profile
router.patch('/updateUser/:userId', protect, updateUserProfile);

// Route to get all users (admin only)
router.get('/allUsers', protect, getAllUsers);

// Route to delete a user (admin only)
router.delete('/deleteUser/:userId', protect, deleteUser);

export default router;