// src/routes/gameRoutes.ts
import { Router } from 'express';
import {
    createGameHandler,
    getGameByIdHandler,
    getUpcomingGamesHandler,
    getLiveGamesHandler,
    startGameHandler,
    callNextNumberHandler,
    finishGameHandler,
    buyTicketHandler,
    claimWinHandler,
    getUserTicketsForGameHandler // <--- IMPORT THIS NEW HANDLER
} from '../controllers/gameController'; 

const router = Router();

// --- Game Management Routes ---
router.post('/', createGameHandler);
router.get('/upcoming', getUpcomingGamesHandler);
router.get('/live', getLiveGamesHandler);
router.get('/:id', getGameByIdHandler); 
router.post('/:id/start', startGameHandler);
router.post('/:id/call-number', callNextNumberHandler);
router.post('/:id/finish', finishGameHandler);

// --- Ticket & Claim Routes ---
router.post('/:gameId/tickets', buyTicketHandler); 
router.post('/claims', claimWinHandler); 

// --- NEW ROUTE for fetching user's tickets for a game ---
// Example: GET /api/v1/games/9/my-tickets?userId=106
router.get('/:gameId/my-tickets', getUserTicketsForGameHandler); // <--- ADD THIS LINE

export default router;
