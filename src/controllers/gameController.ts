// src/controllers/gameController.ts
import { Request, Response, NextFunction } from 'express';
import { GameService, CreateGameDTO, GameStatus } from '../services/gameService';
import pool from '../config/db'; 
import { Server as SocketIOServer } from 'socket.io';

const gameService = new GameService();

// Helper to get io from request, with type assertion
const getIoFromReq = (req: Request): SocketIOServer | undefined => {
    // It's possible io is not set if middleware order is wrong or server didn't set it
    // So, allow it to be undefined and check before use.
    const ioInstance = (req as any).io as SocketIOServer;
    if (!ioInstance) {
        // console.warn("Socket.IO instance (req.io) not found in gameController for this request.");
    }
    return ioInstance;
};

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
};

export const createGameHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const gameData: CreateGameDTO = req.body;
    if (!gameData.scheduled_at || !gameData.ticket_price) {
        return res.status(400).json({ success: false, message: 'Missing required fields: scheduled_at, ticket_price' });
    }
    const game = await gameService.createGame(gameData);
    
    const io = getIoFromReq(req);
    if (io) {
        io.emit('new_game_scheduled', game);
        io.emit('game_list_updated'); 
        console.log(`Socket event 'new_game_scheduled' for game ${game.id} and 'game_list_updated' emitted`);
    }
    res.status(201).json(game);
});

export const getGameByIdHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const gameId = parseInt(req.params.id, 10);
    if (isNaN(gameId)) {
        return res.status(400).json({ success: false, message: 'Invalid game ID format' });
    }
    const game = await gameService.getGameById(gameId);
    if (!game) {
        return res.status(404).json({ success: false, message: 'Game not found' });
    }
    res.status(200).json(game);
});

export const getUpcomingGamesHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const games = await gameService.getUpcomingGames();
    res.status(200).json(games);
});

export const getLiveGamesHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const games = await gameService.getLiveGames();
    res.status(200).json(games);
});

// **** NEW HANDLER ****
export const getUserTicketsForGameHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const gameId = parseInt(req.params.gameId, 10);
    const userIdStr = req.query.userId as string; 
    
    if (isNaN(gameId)) {
        return res.status(400).json({ success: false, message: 'Invalid game ID format in path' });
    }
    if (!userIdStr || isNaN(parseInt(userIdStr, 10))) {
        return res.status(400).json({ success: false, message: 'Missing or invalid userId query parameter' });
    }
    const userId = parseInt(userIdStr, 10);

    // No try-catch needed here, asyncHandler handles it
    const tickets = await gameService.getUserTicketsForGame(gameId, userId);
    res.status(200).json(tickets); // Will be an array, possibly empty
});
// **** END NEW HANDLER ****

export const startGameHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const gameId = parseInt(req.params.id, 10);
    if (isNaN(gameId)) {
        return res.status(400).json({ success: false, message: 'Invalid game ID format' });
    }
    const game = await gameService.startGame(gameId);

    if (game && game.status === GameStatus.LIVE) {
        const io = getIoFromReq(req);
        if (io) {
            const gameRoom = `game-${game.id}`;
            io.to(gameRoom).emit('game_started', { gameId: game.id, status: game.status, message: `Game ${game.id} is now LIVE!` });
            io.emit('game_list_updated');
            console.log(`Socket event 'game_started' emitted for room ${gameRoom}`);
        }
    }
    res.status(200).json({ success: true, message: `Game ${gameId} started successfully`, game });
});

export const callNextNumberHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const gameId = parseInt(req.params.id, 10);
    if (isNaN(gameId)) {
        return res.status(400).json({ success: false, message: 'Invalid game ID format' });
    }
    const result = await gameService.callNextNumber(gameId);
    // gameService.callNextNumber now throws errors for critical issues like game not found/not live
    // It returns { game, calledNumber: null } if all numbers are called.

    const io = getIoFromReq(req);
    if (io && result) { // Ensure result is not null (though service should throw before returning null for this specific return type)
        const gameRoom = `game-${result.game.id}`;
        io.to(gameRoom).emit('number_called', {
            gameId: result.game.id,
            calledNumber: result.calledNumber,
            numbersCalled: result.game.numbers_called,
            gameStatus: result.game.status
        });
        console.log(`Socket event 'number_called' emitted for room ${gameRoom} with number ${result.calledNumber}`);

        if (result.calledNumber === null || (result.game.numbers_called && result.game.numbers_called.length >= 90) ) {
            io.to(gameRoom).emit('all_numbers_called', { gameId: result.game.id });
            console.log(`Socket event 'all_numbers_called' emitted for room ${gameRoom}`);
        }
    }
    res.status(200).json(result); 
});

export const finishGameHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const gameId = parseInt(req.params.id, 10);
    if (isNaN(gameId)) {
        return res.status(400).json({ success: false, message: 'Invalid game ID format' });
    }
    const game = await gameService.finishGame(gameId);

    if (game && game.status === GameStatus.FINISHED) {
        const io = getIoFromReq(req);
        if (io) {
            const gameRoom = `game-${game.id}`;
            io.to(gameRoom).emit('game_finished', { gameId: game.id, status: game.status, message: `Game ${game.id} has FINISHED!` });
            io.emit('game_list_updated');
            console.log(`Socket event 'game_finished' emitted for room ${gameRoom}`);
        }
    }
    res.status(200).json({ success: true, message: `Game ${gameId} finished successfully`, game });
});

export const buyTicketHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const gameId = parseInt(req.params.gameId, 10);
    const { userId } = req.body;

    if (isNaN(gameId) || userId === undefined || typeof userId !== 'string' && typeof userId !== 'number') {
        return res.status(400).json({ success: false, message: 'Invalid game ID or missing/invalid userId' });
    }
    const numericUserId = parseInt(userId.toString(), 10);
    if (isNaN(numericUserId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId format' });
    }

    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [numericUserId]);
    if (userCheck.rows.length === 0) {
        await pool.query('INSERT INTO users (id, username) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
            [numericUserId, `testuser_${numericUserId}`]);
        console.log(`Created/Ensured dummy user ${numericUserId} for testing buyTicketHandler.`);
    }

    const ticket = await gameService.buyTicketForGame(gameId, numericUserId);

    const updatedGame = await gameService.getGameById(gameId);
    if (updatedGame) {
        const io = getIoFromReq(req);
        if (io) {
            const gameRoom = `game-${gameId}`;
            io.to(gameRoom).emit('prize_pool_updated', {
                gameId: gameId,
                newPrizePool: updatedGame.prize_pool,
                ticketsSold: updatedGame.tickets_sold
            });
            io.emit('game_list_updated');
            console.log(`Socket event 'prize_pool_updated' emitted for room ${gameRoom}`);
        }
    }
    res.status(201).json(ticket);
});

export const claimWinHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { gameId, ticketId, userId, pattern } = req.body;

    const requiredFields = { gameId, ticketId, userId, pattern };
    for (const [key, value] of Object.entries(requiredFields)) {
        if (value === undefined || value === null || value === '') {
            return res.status(400).json({ success: false, message: `Missing required field: ${key}` });
        }
    }

    const numericGameId = parseInt(gameId, 10);
    const numericTicketId = parseInt(ticketId, 10);
    const numericUserId = parseInt(userId, 10);
    const patternKey = pattern.toString();

    if (isNaN(numericGameId) || isNaN(numericTicketId) || isNaN(numericUserId)) {
        return res.status(400).json({ success: false, message: 'Invalid ID format for gameId, ticketId, or userId' });
    }

    const claimResult = await gameService.processWinClaim(
        numericGameId,
        numericUserId,
        numericTicketId,
        patternKey
    );

    if (claimResult.success) {
        const io = getIoFromReq(req);
        if (io) {
            const gameRoom = `game-${numericGameId}`;
            io.to(gameRoom).emit('winner_announced', {
                gameId: numericGameId,
                userId: numericUserId,
                ticketId: numericTicketId,
                pattern: claimResult.pattern,
                prizeAmount: claimResult.prizeAmount
            });
            console.log(`Socket event 'winner_announced' emitted for room ${gameRoom}`);
        }
        
        res.status(200).json({
            success: true, 
            message: claimResult.message,
            pattern: claimResult.pattern,
            prizeAmount: claimResult.prizeAmount
        });
    } else {
        const statusCode = claimResult.error ? 500 : 400;
        res.status(statusCode).json({
            success: false, 
            message: claimResult.message
        });
    }
});
