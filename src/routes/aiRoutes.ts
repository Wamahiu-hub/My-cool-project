import expesss from 'express';
import { assistantAI } from '../controllers/chatController';
import { protect } from '../middlewares/auth/protect';
import { generateLearningPath } from '../controllers/pathController';

const router = expesss.Router();

router.post('/chat',assistantAI,)
router.get('/path/:userId',protect,generateLearningPath )
router.post('/findPath',protect,generateLearningPath)


export default router;