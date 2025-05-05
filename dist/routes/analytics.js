import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { getAnalyticsSummary, getSessionAnalytics, getConversationQualityMetrics, analyzeFollowUpPatterns, analyzeUserRetention, getTopSessionTopics, analyzeConversationWindows } from '../utils/analytics.js';
// Create router
const router = express.Router();
// Helper to add analytics routes while avoiding TypeScript issues
const addRoute = (path, handler) => {
    router.get(path, handler);
};
/**
 * @route GET /api/v1/analytics/summary
 * @description Get overall analytics summary
 * @query days - Number of days to analyze (default: 7)
 */
addRoute('/summary', (req, res) => {
    const days = req.query.days ? parseInt(req.query.days) : 7;
    getAnalyticsSummary(days)
        .then(summary => {
        if (!summary) {
            return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                status: 'Error',
                message: 'Analytics service is not available'
            });
        }
        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: summary
        });
    })
        .catch(error => {
        console.error('Analytics summary error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Error',
            message: 'Failed to retrieve analytics summary'
        });
    });
});
/**
 * @route GET /api/v1/analytics/session/:sessionId
 * @description Get analytics for a specific session
 * @param sessionId - The ID of the session to analyze
 */
addRoute('/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            status: 'Error',
            message: 'Session ID is required'
        });
    }
    getSessionAnalytics(sessionId)
        .then(sessionAnalytics => {
        if (!sessionAnalytics) {
            return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                status: 'Error',
                message: 'Analytics service is not available'
            });
        }
        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: sessionAnalytics
        });
    })
        .catch(error => {
        console.error('Session analytics error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Error',
            message: 'Failed to retrieve session analytics'
        });
    });
});
/**
 * @route GET /api/v1/analytics/conversation-quality
 * @description Get conversation quality metrics
 * @query days - Number of days to analyze (default: 7)
 */
addRoute('/conversation-quality', (req, res) => {
    const days = req.query.days ? parseInt(req.query.days) : 7;
    getConversationQualityMetrics(days)
        .then(metrics => {
        if (!metrics) {
            return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                status: 'Error',
                message: 'Analytics service is not available'
            });
        }
        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: metrics
        });
    })
        .catch(error => {
        console.error('Conversation quality metrics error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Error',
            message: 'Failed to retrieve conversation quality metrics'
        });
    });
});
/**
 * @route GET /api/v1/analytics/follow-up-patterns
 * @description Get follow-up question patterns
 * @query limit - Maximum number of sessions to analyze (default: 100)
 */
addRoute('/follow-up-patterns', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    analyzeFollowUpPatterns(limit)
        .then(patterns => {
        if (!patterns) {
            return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                status: 'Error',
                message: 'Analytics service is not available'
            });
        }
        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: patterns
        });
    })
        .catch(error => {
        console.error('Follow-up patterns error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Error',
            message: 'Failed to retrieve follow-up patterns'
        });
    });
});
/**
 * @route GET /api/v1/analytics/user-retention
 * @description Get user retention data
 * @query days - Number of days to analyze (default: 30)
 */
addRoute('/user-retention', (req, res) => {
    const days = req.query.days ? parseInt(req.query.days) : 30;
    analyzeUserRetention(days)
        .then(retention => {
        if (!retention) {
            return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                status: 'Error',
                message: 'Analytics service is not available'
            });
        }
        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: retention
        });
    })
        .catch(error => {
        console.error('User retention error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Error',
            message: 'Failed to retrieve user retention data'
        });
    });
});
/**
 * @route GET /api/v1/analytics/top-topics
 * @description Get the most common topics by session interactions
 * @query days - Number of days to analyze (default: 30)
 * @query limit - Maximum number of topics to return (default: 10)
 */
addRoute('/top-topics', (req, res) => {
    const days = req.query.days ? parseInt(req.query.days) : 30;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    getTopSessionTopics(days, limit)
        .then(topics => {
        if (!topics) {
            return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                status: 'Error',
                message: 'Analytics service is not available'
            });
        }
        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: topics
        });
    })
        .catch(error => {
        console.error('Top topics error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Error',
            message: 'Failed to retrieve top topics'
        });
    });
});
/**
 * @route GET /api/v1/analytics/conversation-windows
 * @description Get analysis of conversation window effectiveness
 * @query days - Number of days to analyze (default: 30)
 */
addRoute('/conversation-windows', (req, res) => {
    const days = req.query.days ? parseInt(req.query.days) : 30;
    analyzeConversationWindows(days)
        .then(analysis => {
        if (!analysis) {
            return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                status: 'Error',
                message: 'Analytics service is not available'
            });
        }
        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: analysis
        });
    })
        .catch(error => {
        console.error('Conversation windows analysis error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Error',
            message: 'Failed to analyze conversation windows'
        });
    });
});
/**
 * @route GET /api/v1/analytics/session/:sessionId/recommended-window
 * @description Get recommended window size for a specific session
 * @param sessionId - The ID of the session to analyze
 */
addRoute('/session/:sessionId/recommended-window', (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            status: 'Error',
            message: 'Session ID is required'
        });
    }
    // First get session analytics
    getSessionAnalytics(sessionId)
        .then(sessionAnalytics => {
        if (!sessionAnalytics) {
            return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                status: 'Error',
                message: 'Analytics service is not available'
            });
        }
        // Calculate recommended window size based on session complexity
        const interactionCount = sessionAnalytics.interactionCount || 0;
        let recommendedWindowSize = 5; // Default
        if (interactionCount <= 3) {
            recommendedWindowSize = 3; // Small window for short conversations
        }
        else if (interactionCount <= 7) {
            recommendedWindowSize = 5; // Medium window
        }
        else if (interactionCount <= 15) {
            recommendedWindowSize = 8; // Larger window
        }
        else {
            recommendedWindowSize = 10; // Maximum window
        }
        // Check if any interactions needed human assistance
        const needsMoreContext = sessionAnalytics.hasHumanAssistance || false;
        if (needsMoreContext && recommendedWindowSize < 10) {
            // If human assistance was needed, consider providing more context
            recommendedWindowSize += 2;
        }
        // Cap at reasonable maximum
        recommendedWindowSize = Math.min(recommendedWindowSize, 10);
        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: {
                sessionId,
                interactionCount,
                recommendedWindowSize,
                recommendation: `Based on this session's complexity and history, we recommend a context window of ${recommendedWindowSize} messages.`
            }
        });
    })
        .catch(error => {
        console.error('Session window recommendation error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Error',
            message: 'Failed to generate window size recommendation'
        });
    });
});
export default router;
