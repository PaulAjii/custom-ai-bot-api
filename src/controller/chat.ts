import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { graph } from '../api/index.js';
import { sessionManager } from '../utils/sessionManager.js';
import { logInteraction } from '../utils/analytics.js';
import { identifyQuestionCategory, evaluateContextRelevance } from '../utils/categoryUtils.js';

export const chatController = async (req: Request, res: Response) => {
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
		
		// Extract token usage if available from the LLM output
		// Access it safely through the result object
		const tokenUsage = (result as any).llmOutput?.tokenUsage || {
			promptTokens: 0,
			completionTokens: 0,
			totalTokens: 0
		};
		
		// Log interaction for analytics (silently)
		const userAgent = req.headers['user-agent'];
		const ipAddress = req.ip || req.socket.remoteAddress;
		
		logInteraction(
			session.sessionId,
			prompt,
			result.finalAnswer || result.answer,
			result.context || [],
			responseTime,
			result.needsHumanAssistance || false,
			result.category || 'General',
			result.contextRelevance || 0,
			{ userAgent, ipAddress }
		).catch(err => {
			// Only log analytics errors
			console.error('Analytics error:', err)
		});

		// Return the response with token usage stats
		res.status(StatusCodes.OK).json({
			status: 'Success',
			message: result.finalAnswer || result.answer,
			sessionId: session.sessionId,
			metadata: {
				sessionActive: true,
				needsHumanAssistance: result.needsHumanAssistance || false,
				responseTime: responseTime,
				category: result.category || 'General',
				contextRelevance: result.contextRelevance || 0,
				tokenUsage: tokenUsage
			}
		});
	} catch (error) {
		// Keep error logging
		console.error('Chat error:', error);
		
		// Prepare a user-friendly error message based on error type
		let errorMessage = 'An error occurred processing your request';
		
		if (error instanceof Error) {
			// For MongoDB errors, provide a more specific message
			if (error.name === 'MongoServerError' || error.message.includes('MongoDB')) {
				errorMessage = 'Our knowledge database is currently experiencing issues. Please try again shortly.';
			} else if (error.message.includes('token') || error.message.includes('index')) {
				errorMessage = 'There was an issue retrieving relevant information. Please try a different question.';
			} else {
				errorMessage = error.message;
			}
		}
		
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			status: 'Error',
			message: errorMessage
		});
	}
};
