import { v4 as uuidv4 } from 'uuid';
/**
 * Simple in-memory session manager for chat history
 * In a production environment, consider using MongoDB or Redis for persistence
 */
class SessionManager {
    constructor() {
        this.sessions = {};
        this.maxSessionAge = 1000 * 60 * 60 * 24; // 24 hours
    }
    /**
     * Gets a session by ID or creates a new one
     */
    getOrCreateSession(sessionId) {
        // Generate a new ID if none provided
        const id = sessionId || uuidv4();
        // Create new session if it doesn't exist or has expired
        if (!this.sessions[id] || this.isSessionExpired(id)) {
            this.sessions[id] = {
                history: [],
                lastUpdated: new Date()
            };
        }
        else {
            // Update the last activity time
            this.sessions[id].lastUpdated = new Date();
        }
        return {
            sessionId: id,
            history: this.sessions[id].history
        };
    }
    /**
     * Adds a message to a session's history
     */
    addMessage(sessionId, message) {
        const session = this.getOrCreateSession(sessionId);
        this.sessions[sessionId].history.push(message);
        this.sessions[sessionId].lastUpdated = new Date();
    }
    /**
     * Checks if a session has expired
     */
    isSessionExpired(sessionId) {
        if (!this.sessions[sessionId])
            return true;
        const lastUpdated = this.sessions[sessionId].lastUpdated;
        const now = new Date();
        return now.getTime() - lastUpdated.getTime() > this.maxSessionAge;
    }
    /**
     * Cleans up expired sessions (call this periodically)
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        Object.keys(this.sessions).forEach(sessionId => {
            if (this.isSessionExpired(sessionId)) {
                delete this.sessions[sessionId];
            }
        });
    }
    /**
     * Gets the formatted chat history for context window
     * Limited to the last N messages to avoid token limits
     */
    getFormattedHistory(sessionId, maxMessages = 10) {
        const session = this.getOrCreateSession(sessionId);
        const history = session.history;
        // Get the last N messages from history
        return history.slice(-maxMessages);
    }
}
// Export a singleton instance
export const sessionManager = new SessionManager();
// Setup cleanup interval (every hour)
setInterval(() => {
    sessionManager.cleanupExpiredSessions();
}, 1000 * 60 * 60);
