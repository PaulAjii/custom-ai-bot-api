import express from 'express';
import { StatusCodes } from 'http-status-codes';
import 'dotenv/config';
import chatRouter from './routes/chat.js';
import { initAnalytics } from './utils/analytics.js';
// Catch unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:');
    console.error('- Reason:', reason);
    // Don't exit the process, just log the error
});
// Create Express application
const app = express();
const port = process.env.PORT || 3000;
// Middleware
app.use(express.json());
// Request logging middleware - only log errors, not normal requests
app.use((req, res, next) => {
    // Remove console log for normal requests
    next();
});
// Base route
app.get('/', (req, res) => {
    res.status(StatusCodes.OK).json({
        status: 'Success',
        message: 'Welcome to the Express Chatbot API',
        version: '1.0.0',
    });
});
// API routes
app.use('/api/v1/chat', chatRouter);
// 404 handler
app.use((req, res) => {
    res.status(StatusCodes.NOT_FOUND).json({
        status: 'Error',
        message: 'Endpoint not found'
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('Express error handler caught:', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'Error',
        message: 'An unexpected error occurred'
    });
});
// Simple direct startup (no async)
// Start server
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    // Initialize analytics but don't await it and don't log the result
    initAnalytics().catch(err => console.error('Analytics initialization error:', err));
});
// Handle graceful shutdown
const gracefulShutdown = () => {
    console.log('Shutting down server...');
    server.close(() => {
        process.exit(0);
    });
    // Force close after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};
// Set up signal handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
