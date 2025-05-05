import { Router } from 'express';
import { chatController } from '../controller/chat.js';
import { sessionManager } from '../utils/sessionManager.js';
import { StatusCodes } from 'http-status-codes';
const router = Router();
// Helper to add routes while avoiding TypeScript issues
const addRoute = (path, handler, method = 'post') => {
    if (method === 'get') {
        router.get(path, handler);
    }
    else {
        router.post(path, handler);
    }
};
// Main chat endpoint
addRoute('/', async (req, res) => {
    await chatController(req, res);
});
/**
 * @route POST /api/v1/chat/config/window-size
 * @description Sets the default conversation window size for all new sessions
 * @body windowSize - Number of messages to keep in context window
 */
addRoute('/config/window-size', (req, res) => {
    const { windowSize } = req.body;
    if (!windowSize || typeof windowSize !== 'number' || windowSize <= 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            status: 'Error',
            message: 'Valid windowSize is required (must be a positive number)'
        });
    }
    sessionManager.setDefaultWindowSize(windowSize);
    res.status(StatusCodes.OK).json({
        status: 'Success',
        message: `Default conversation window size set to ${windowSize} messages`,
        data: { windowSize }
    });
});
export default router;
