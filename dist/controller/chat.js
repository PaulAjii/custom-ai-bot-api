import { StatusCodes } from 'http-status-codes';
import { graph } from '../api/index.js';
import { sessionManager } from '../utils/sessionManager.js';
import { logInteraction } from '../utils/analytics.js';
export const chatController = async (req, res) => {
    try {
        const { prompt, sessionId } = req.body;
        // Validate input
        if (!prompt) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'Error',
                message: 'Prompt is required',
            });
        }
        // Track start time for analytics
        const startTime = Date.now();
        // Get or create session for conversation history
        const session = sessionManager.getOrCreateSession(sessionId);
        // Get conversation history
        const history = sessionManager.getFormattedHistory(session.sessionId);
        // Invoke the enhanced conversational graph
        const result = await graph.invoke({
            question: prompt,
            history: history,
            sessionId: session.sessionId
        });
        // Calculate response time for analytics
        const responseTime = Date.now() - startTime;
        // Add the new interaction to conversation history
        sessionManager.addMessage(session.sessionId, {
            role: 'human',
            content: prompt
        });
        sessionManager.addMessage(session.sessionId, {
            role: 'assistant',
            content: result.finalAnswer || result.answer
        });
        // Log interaction for analytics
        // Get request information for analytics
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.socket.remoteAddress;
        logInteraction(session.sessionId, prompt, result.finalAnswer || result.answer, result.context || [], responseTime, result.needsHumanAssistance || false, result.category || 'General', result.contextRelevance || 0, { userAgent, ipAddress }).catch(err => console.error('Analytics error:', err));
        // Return the response
        res.status(StatusCodes.OK).json({
            status: 'Success',
            message: result.finalAnswer || result.answer,
            sessionId: session.sessionId,
            // Include additional metadata for client if needed
            metadata: {
                sessionActive: true,
                needsHumanAssistance: result.needsHumanAssistance || false
            }
        });
    }
    catch (error) {
        console.error('Chat error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Error',
            message: error instanceof Error
                ? error.message
                : 'An error occurred processing your request',
        });
    }
};
