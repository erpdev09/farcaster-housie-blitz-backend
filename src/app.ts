// src/app.ts (backend: farcaster-housie-blitz)

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors'; // Import the cors middleware
import { Server as SocketIOServer } from 'socket.io'; // For type annotation if needed
import gameRoutes from './routes/gameRoutes'; // Your game API routes

const app: Application = express();

// --- Global Middleware ---

// 1. Enable CORS for all origins and common methods.
// This should be one of the first middleware applied.
app.use(cors());

// 2. Middleware to parse JSON request bodies
app.use(express.json());

// 3. Middleware to make Socket.IO instance (set in server.ts) available on request objects
app.use((req: Request, res: Response, next: NextFunction) => {
    const ioInstance = req.app.get('socketio') as SocketIOServer;
    // It's okay if ioInstance is undefined for routes that don't need it.
    // Controllers that use req.io should handle the case where it might be undefined,
    // or we ensure server.ts always sets it.
    (req as any).io = ioInstance; 
    next();
});


// --- Application Routes ---

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).send('OK - Backend is healthy');
});

// Mount the game API routes
app.use('/api/v1/games', gameRoutes);


// --- Error Handling Middleware (Place these last) ---

// Handle 404 for routes not found - this runs if no prior route matched
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ 
        message: `Not Found - The requested resource path '${req.originalUrl}' does not exist.` 
    });
});

// Global error handler - catches errors passed by next(err)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Global Unhandled Error in Express:", err.message);
    if (err.stack) {
        console.error(err.stack);
    }
    
    const isProduction = process.env.NODE_ENV === 'production';
    const statusCode = err.status || 500;
    
    res.status(statusCode).json({
        message: err.message || 'An unexpected error occurred on the server.',
        // Only include stack in development for debugging purposes
        stack: isProduction ? undefined : err.stack 
    });
});

export default app;
