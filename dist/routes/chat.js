import { Router } from 'express';
import { chatController } from '../controller/chat.js';
const router = Router();
router.post('/', async (req, res) => {
    await chatController(req, res);
});
export default router;
