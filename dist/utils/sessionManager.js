import { v4 as uuidv4 } from 'uuid';
/**
 * Simple in-memory session manager for chat history
 * In a production environment, consider using MongoDB or Redis for persistence
 */
class SessionManager {
    constructor() {
        this.sessions = {};
        this.maxSessionAge = 1000 * 60 * 60 * 24; // 24 hours
        this.defaultWindowSize = 10; // Default window size
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
                lastUpdated: new Date(),
                conversationWindowSize: this.defaultWindowSize
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
        // Add timestamp if not provided
        if (!message.timestamp) {
            message.timestamp = new Date();
        }
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
     * Limited to the configured window size (or default)
     */
    getFormattedHistory(sessionId, overrideWindowSize) {
        const session = this.getOrCreateSession(sessionId);
        const history = session.history;
        // Determine window size to use
        const windowSize = overrideWindowSize ||
            this.sessions[sessionId].conversationWindowSize ||
            this.defaultWindowSize;
        // Get the last N messages from history
        return history.slice(-windowSize);
    }
    /**
     * Sets the conversation window size for a specific session
     */
    setConversationWindowSize(sessionId, windowSize) {
        if (this.sessions[sessionId]) {
            this.sessions[sessionId].conversationWindowSize = windowSize;
        }
    }
    /**
     * Gets the conversation window size for a specific session
     */
    getConversationWindowSize(sessionId) {
        return this.sessions[sessionId]?.conversationWindowSize || this.defaultWindowSize;
    }
    /**
     * Sets the default conversation window size for new sessions
     */
    setDefaultWindowSize(size) {
        if (size > 0) {
            this.defaultWindowSize = size;
        }
    }
    /**
     * Gets the full chat history for a session (without window limitations)
     */
    getFullHistory(sessionId) {
        const session = this.getOrCreateSession(sessionId);
        return [...session.history]; // Return a copy to avoid external mutation
    }
}
// Export a singleton instance
export const sessionManager = new SessionManager();
// Setup cleanup interval (every hour)
setInterval(() => {
    sessionManager.cleanupExpiredSessions();
}, 1000 * 60 * 60);
