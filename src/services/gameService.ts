// src/services/gameService.ts
import pool from '../config/db';
import { TicketService, HousieTicketData } from './ticketService'; // Make sure HousieTicketData is exported

// --- Type Definitions ---
export enum GameStatus {
    SCHEDULED = 'scheduled',
    LIVE = 'live',
    FINISHED = 'finished',
    CANCELLED = 'cancelled',
}

export interface Game {
    id: number;
    scheduled_at: Date;
    status: GameStatus;
    ticket_price: string; 
    token_currency: string;
    rake_percentage: string; 
    prize_pool: string;      
    numbers_called: number[]; 
    created_at: Date;
    updated_at: Date;
}

export interface CreateGameDTO {
    scheduled_at: string | Date; 
    ticket_price: number | string;
    token_currency?: string;
    rake_percentage?: number | string;
}

export interface FullGameData extends Game {
    tickets_sold: number;
}

export interface TicketRecord {
    id: number;
    user_id: number;
    game_id: number;
    ticket_data: HousieTicketData; 
    is_winner: boolean;
    winning_pattern: string | null;
    purchased_at: Date;
}

// --- Winning Patterns Configuration ---
export const WINNING_PATTERNS_CONFIG: {
    [key: string]: { prizePercentage: number; maxWinners: number; displayName: string; numbersRequired?: number }
} = {
    EARLY_FIVE: { prizePercentage: 0.05, maxWinners: 5, displayName: 'Early Five', numbersRequired: 5 },
    TOP_LINE:   { prizePercentage: 0.10, maxWinners: 3, displayName: 'Top Line' },
    MIDDLE_LINE:{ prizePercentage: 0.10, maxWinners: 3, displayName: 'Middle Line' },
    BOTTOM_LINE:{ prizePercentage: 0.10, maxWinners: 3, displayName: 'Bottom Line' },
    FULL_HOUSE: { prizePercentage: 0.40, maxWinners: 1, displayName: 'Full House' },
};

// --- GameService Class ---
export class GameService {
    private ticketService: TicketService;

    constructor() {
        this.ticketService = new TicketService();
    }

    private parseGames(rows: any[]): Game[] {
        return rows.map(row => {
            const game = { ...row } as Game; 
            if (game.numbers_called && typeof game.numbers_called === 'string') {
                try { game.numbers_called = JSON.parse(game.numbers_called); } 
                catch (e) { console.error(`Failed to parse numbers_called for game ID ${game.id}:`, e); game.numbers_called = []; }
            } else if (!Array.isArray(game.numbers_called)) {
                 game.numbers_called = []; 
            }
            return game;
        });
    }

    private parseSingleGame(row: any): Game | null {
        if (!row) return null;
        const games = this.parseGames([row]);
        return games.length > 0 ? games[0] : null;
    }

    async createGame(gameData: CreateGameDTO): Promise<Game> {
        const { scheduled_at, ticket_price, token_currency = 'DEGEN', rake_percentage = 10.00 } = gameData;
        const query = `
            INSERT INTO games (scheduled_at, ticket_price, token_currency, rake_percentage, status, prize_pool, numbers_called)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`;
        const values = [scheduled_at, ticket_price.toString(), token_currency, rake_percentage.toString(), GameStatus.SCHEDULED, '0', '[]'];
        try {
            const result = await pool.query(query, values);
            const newGame = this.parseSingleGame(result.rows[0]);
            if (newGame) return newGame;
            throw new Error('Game creation failed, no rows returned or parsing failed.');
        } catch (error) { console.error('Error creating game:', error); throw error; }
    }

    async getGameById(gameId: number): Promise<FullGameData | null> {
        const gameQuery = 'SELECT * FROM games WHERE id = $1';
        const ticketsCountQuery = 'SELECT COUNT(*) AS tickets_sold FROM tickets WHERE game_id = $1';
        try {
            const gameResult = await pool.query(gameQuery, [gameId]);
            const gameData = this.parseSingleGame(gameResult.rows[0]);
            if (!gameData) return null;
            const ticketsCountResult = await pool.query(ticketsCountQuery, [gameId]);
            const ticketsSold = parseInt(ticketsCountResult.rows[0].tickets_sold, 10);
            return { ...gameData, tickets_sold: ticketsSold };
        } catch (error) { console.error(`Error fetching game ${gameId}:`, error); throw error; }
    }

    async getUpcomingGames(): Promise<Game[]> {
        const query = 'SELECT * FROM games WHERE status = $1 ORDER BY scheduled_at ASC';
        try { const result = await pool.query(query, [GameStatus.SCHEDULED]); return this.parseGames(result.rows); } 
        catch (error) { console.error('Error fetching upcoming games:', error); throw error; }
    }
    
    async getLiveGames(): Promise<Game[]> {
        const query = 'SELECT * FROM games WHERE status = $1 ORDER BY created_at DESC';
        try { const result = await pool.query(query, [GameStatus.LIVE]); return this.parseGames(result.rows); } 
        catch (error) { console.error('Error fetching live games:', error); throw error; }
    }

    async startGame(gameId: number): Promise<Game | null> {
        const query = `UPDATE games SET status = $1, updated_at = NOW() WHERE id = $2 AND status = $3 RETURNING *;`;
        try {
            const result = await pool.query(query, [GameStatus.LIVE, gameId, GameStatus.SCHEDULED]);
            const startedGame = this.parseSingleGame(result.rows[0]);
            if (startedGame) return startedGame;
            const currentGame = await this.getGameById(gameId);
            if (!currentGame) throw new Error(`Game with ID ${gameId} not found.`);
            if (currentGame.status !== GameStatus.SCHEDULED) throw new Error(`Game ${gameId} cannot be started, status is ${currentGame.status}.`);
            return null; 
        } catch (error) { console.error(`Error starting game ${gameId}:`, error); throw error; }
    }

    async callNextNumber(gameId: number): Promise<{ game: Game, calledNumber: number | null } | null> {
        const gameData = await this.getGameById(gameId); 
        if (!gameData) throw new Error(`Game with ID ${gameId} not found when trying to call number.`);
        if (gameData.status !== GameStatus.LIVE) throw new Error(`Cannot call number for game ${gameId}: Game is not live. Current status: ${gameData.status}`);
        let currentNumbersCalled = Array.isArray(gameData.numbers_called) ? gameData.numbers_called : [];
        if (currentNumbersCalled.length >= 90) { console.log(`All numbers called for game ${gameId}.`); return { game: gameData, calledNumber: null }; }
        let newNumber, attempts = 0; 
        do { newNumber = Math.floor(Math.random() * 90) + 1; attempts++; if (attempts > 200) throw new Error(`Failed to find a unique number after ${attempts} attempts for game ${gameId}.`); } 
        while (currentNumbersCalled.includes(newNumber));
        const updatedNumbersCalled = [...currentNumbersCalled, newNumber];
        const updateQuery = `UPDATE games SET numbers_called = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`;
        try {
            const result = await pool.query(updateQuery, [JSON.stringify(updatedNumbersCalled), gameId]);
            const updatedGame = this.parseSingleGame(result.rows[0]);
            if (updatedGame) return { game: updatedGame, calledNumber: newNumber };
            throw new Error(`Failed to update game ${gameId} after calling number.`);
        } catch (error) { console.error(`Error calling next number for game ${gameId}:`, error); throw error; }
    }

    async finishGame(gameId: number): Promise<Game | null> {
        const query = `UPDATE games SET status = $1, updated_at = NOW() WHERE id = $2 AND status = $3 RETURNING *;`;
        try {
            const result = await pool.query(query, [GameStatus.FINISHED, gameId, GameStatus.LIVE]);
            const finishedGame = this.parseSingleGame(result.rows[0]);
            if (finishedGame) { console.log(`Game ${gameId} finished.`); return finishedGame; }
            const currentGame = await this.getGameById(gameId);
            if (!currentGame) throw new Error(`Game with ID ${gameId} not found when trying to finish.`);
            if (currentGame.status === GameStatus.FINISHED) { console.warn(`Game ${gameId} is already finished.`); return currentGame; }
            throw new Error(`Could not finish game ${gameId}, ensure it is LIVE. Current status: ${currentGame.status}.`);
        } catch (error) { console.error(`Error finishing game ${gameId}:`, error); throw error; }
    }

    async buyTicketForGame(gameId: number, userId: number): Promise<TicketRecord> {
        const game = await this.getGameById(gameId);
        if (!game) throw new Error(`Game with ID ${gameId} not found for ticket purchase.`);
        if (game.status !== GameStatus.SCHEDULED) throw new Error(`Cannot buy ticket for game ${gameId}. Game not scheduled (current: ${game.status}).`);
        const housieTicketData = this.ticketService.generateTicket();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const ticketQuery = `INSERT INTO tickets (user_id, game_id, ticket_data) VALUES ($1, $2, $3) RETURNING *;`;
            const ticketResult = await client.query(ticketQuery, [userId, gameId, JSON.stringify(housieTicketData)]);
            const ticketPriceNum = parseFloat(game.ticket_price);
            const rakePercentageNum = parseFloat(game.rake_percentage);
            if (rakePercentageNum < 0 || rakePercentageNum > 100) throw new Error('Invalid rake percentage.');
            const rakeAmount = (ticketPriceNum * rakePercentageNum) / 100.0;
            const netContribution = ticketPriceNum - rakeAmount;
            if (netContribution < 0) throw new Error('Net contribution to prize pool is negative.');
            const currentGamePrizePoolQuery = 'SELECT prize_pool FROM games WHERE id = $1 FOR UPDATE';
            const currentPrizePoolResult = await client.query(currentGamePrizePoolQuery, [gameId]);
            const currentPrizePoolNum = parseFloat(currentPrizePoolResult.rows[0].prize_pool);
            const newPrizePool = currentPrizePoolNum + netContribution;
            await client.query('UPDATE games SET prize_pool = $1, updated_at = NOW() WHERE id = $2', [newPrizePool.toFixed(18), gameId]);
            await client.query('COMMIT');
            const createdTicket = ticketResult.rows[0] as TicketRecord;
            if (createdTicket.ticket_data && typeof createdTicket.ticket_data === 'string') {
                try { createdTicket.ticket_data = JSON.parse(createdTicket.ticket_data as any); } 
                catch (e) { console.error("Failed to parse ticket_data on buyTicket:", e); createdTicket.ticket_data = { rows: [] }; }
            } else if (!createdTicket.ticket_data || !Array.isArray((createdTicket.ticket_data as any).rows)) {
                createdTicket.ticket_data = { rows: [] };
            }
            return createdTicket;
        } catch (error) { await client.query('ROLLBACK'); console.error(`Error buying ticket for game ${gameId}, user ${userId}:`, error); throw error; } 
        finally { client.release(); }
    }

    // **** NEW METHOD ****
    async getUserTicketsForGame(gameId: number, userId: number): Promise<TicketRecord[]> {
        const query = `
            SELECT id, user_id, game_id, ticket_data, is_winner, winning_pattern, purchased_at 
            FROM tickets 
            WHERE game_id = $1 AND user_id = $2
            ORDER BY purchased_at DESC; 
        `;
        try {
            const result = await pool.query(query, [gameId, userId]);
            return result.rows.map(row => {
                const ticket = { ...row } as TicketRecord;
                if (ticket.ticket_data && typeof ticket.ticket_data === 'string') {
                    try { ticket.ticket_data = JSON.parse(ticket.ticket_data); } 
                    catch (e) { console.error(`Failed to parse ticket_data for ticket ID ${ticket.id}:`, e); ticket.ticket_data = { rows: [] }; }
                } else if (!ticket.ticket_data || !Array.isArray((ticket.ticket_data as any).rows)) {
                    ticket.ticket_data = { rows: [] };
                }
                return ticket;
            });
        } catch (error) {
            console.error(`Error fetching tickets for user ${userId} in game ${gameId}:`, error);
            throw error;
        }
    }
    // **** END NEW METHOD ****

    private internalCheckPattern(ticketDataRows: (number | null)[][], calledNumbers: number[], patternKey: string): boolean {
        if (!ticketDataRows || !Array.isArray(ticketDataRows) || ticketDataRows.length !== 3) { console.warn('Invalid ticketDataRows structure in internalCheckPattern:', ticketDataRows); return false; }
        const allNumbersOnTicket: number[] = ticketDataRows.flat().filter(num => num !== null && typeof num === 'number') as number[];
        switch (patternKey.toUpperCase()) {
            case 'EARLY_FIVE':
                const earlyFiveConfig = WINNING_PATTERNS_CONFIG.EARLY_FIVE;
                if (!earlyFiveConfig || typeof earlyFiveConfig.numbersRequired !== 'number') { console.warn("EARLY_FIVE config missing"); return false; }
                let countCalledOnTicket = 0;
                for (const num of allNumbersOnTicket) if (calledNumbers.includes(num)) countCalledOnTicket++;
                return countCalledOnTicket >= earlyFiveConfig.numbersRequired;
            case 'TOP_LINE':
                if (ticketDataRows.length < 1 || !Array.isArray(ticketDataRows[0])) return false;
                const topLineNumbers = ticketDataRows[0].filter(num => num !== null && typeof num === 'number') as number[];
                return topLineNumbers.length > 0 && topLineNumbers.every(num => calledNumbers.includes(num));
            case 'MIDDLE_LINE':
                if (ticketDataRows.length < 2 || !Array.isArray(ticketDataRows[1])) return false;
                const middleLineNumbers = ticketDataRows[1].filter(num => num !== null && typeof num === 'number') as number[];
                return middleLineNumbers.length > 0 && middleLineNumbers.every(num => calledNumbers.includes(num));
            case 'BOTTOM_LINE':
                if (ticketDataRows.length < 3 || !Array.isArray(ticketDataRows[2])) return false;
                const bottomLineNumbers = ticketDataRows[2].filter(num => num !== null && typeof num === 'number') as number[];
                return bottomLineNumbers.length > 0 && bottomLineNumbers.every(num => calledNumbers.includes(num));
            case 'FULL_HOUSE':
                return allNumbersOnTicket.length > 0 && allNumbersOnTicket.every(num => calledNumbers.includes(num));
            default: console.warn(`Unknown pattern key in internalCheckPattern: ${patternKey}`); return false;
        }
    }

    async processWinClaim(gameId: number, userId: number, ticketId: number, patternKey: string ): Promise<{ success: boolean; message: string; pattern?: string; prizeAmount?: string; error?: boolean }> {
        const client = await pool.connect();
        const upperPatternKey = patternKey.toUpperCase(); 
        try {
            await client.query('BEGIN');
            const gameResult = await client.query('SELECT * FROM games WHERE id = $1 FOR UPDATE', [gameId]);
            const dbGame = this.parseSingleGame(gameResult.rows[0]);
            if (!dbGame) throw new Error('Game not found for win claim.');
            if (dbGame.status !== GameStatus.LIVE) throw new Error(`Game ${gameId} not live. Status: ${dbGame.status}. Cannot claim.`);
            const ticketResult = await client.query('SELECT * FROM tickets WHERE id = $1 AND user_id = $2 AND game_id = $3', [ticketId, userId, gameId]);
            if (ticketResult.rows.length === 0) throw new Error(`Ticket ${ticketId} not found for user ${userId} in game ${gameId}.`);
            const ticket = ticketResult.rows[0] as TicketRecord;
            if (typeof ticket.ticket_data === 'string') { try { ticket.ticket_data = JSON.parse(ticket.ticket_data as any); } catch (e) { throw new Error('Corrupted ticket data.');}}
            if (!ticket.ticket_data || !Array.isArray(ticket.ticket_data.rows)) throw new Error(`Invalid ticket data for ticket ${ticketId}.`);
            const ticketDataRows = ticket.ticket_data.rows;
            if (!this.internalCheckPattern(ticketDataRows, dbGame.numbers_called, upperPatternKey)) return { success: false, message: `Pattern '${WINNING_PATTERNS_CONFIG[upperPatternKey]?.displayName || upperPatternKey}' not met on ticket ${ticketId}.`, error: false };
            const patternConfig = WINNING_PATTERNS_CONFIG[upperPatternKey];
            if (!patternConfig) throw new Error(`Invalid pattern key config: ${upperPatternKey}`);
            const existingClaimsResult = await client.query('SELECT COUNT(*) as count FROM winnings WHERE game_id = $1 AND pattern = $2', [gameId, upperPatternKey]);
            const claimCount = parseInt(existingClaimsResult.rows[0].count, 10);
            if (patternConfig.maxWinners > 0 && claimCount >= patternConfig.maxWinners) return { success: false, message: `Pattern '${patternConfig.displayName}' already claimed by max ${patternConfig.maxWinners} winner(s).`, error: false };
            const alreadyWonThisPatternByTicketResult = await client.query('SELECT 1 FROM winnings WHERE ticket_id = $1 AND pattern = $2 LIMIT 1', [ticketId, upperPatternKey]);
            if (alreadyWonThisPatternByTicketResult.rows.length > 0) return { success: false, message: `Ticket ${ticketId} already claimed '${patternConfig.displayName}'.`, error: false };
            const gamePrizePoolNum = parseFloat(dbGame.prize_pool);
            let prizeForThisPatternType = gamePrizePoolNum * patternConfig.prizePercentage;
            let actualPrizeForThisWinner = prizeForThisPatternType;
            if (patternConfig.maxWinners > 0) actualPrizeForThisWinner = prizeForThisPatternType / patternConfig.maxWinners;
            if (actualPrizeForThisWinner < 0) throw new Error('Negative prize calculation.');
            if (gamePrizePoolNum === 0 && actualPrizeForThisWinner !== 0) actualPrizeForThisWinner = 0;
            const prizeAmountStr = actualPrizeForThisWinner.toFixed(18);
            await client.query(`INSERT INTO winnings (user_id, game_id, ticket_id, amount_won, token_currency, pattern, payout_status) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [userId, gameId, ticketId, prizeAmountStr, dbGame.token_currency, upperPatternKey, 'pending']);
            let newWinningPatternString = upperPatternKey;
            if (ticket.winning_pattern) { const existingPatterns = ticket.winning_pattern.split(','); if (!existingPatterns.includes(upperPatternKey)) newWinningPatternString = `${ticket.winning_pattern},${upperPatternKey}`; else newWinningPatternString = ticket.winning_pattern; }
            await client.query('UPDATE tickets SET is_winner = TRUE, winning_pattern = $1 WHERE id = $2', [newWinningPatternString, ticketId]);
            await client.query('COMMIT');
            console.log(`Win claim processed: game ${gameId}, user ${userId}, ticket ${ticketId}, pattern ${upperPatternKey}.`);
            return { success: true, message: `Congratulations! You won '${patternConfig.displayName}'! Prize: ${parseFloat(prizeAmountStr).toFixed(4)} ${dbGame.token_currency}.`, pattern: upperPatternKey, prizeAmount: prizeAmountStr };
        } catch (error: any) { 
            if (client) { try { await client.query('ROLLBACK'); } catch (rbError) { console.error("Error during ROLLBACK:", rbError); }}
            console.error(`Error in processWinClaim for game ${gameId}, user ${userId}, ticket ${ticketId}, pattern ${upperPatternKey}:`, error);
            return { success: false, message: error.message || 'Server error processing win claim.', error: true };
        } finally { if (client) client.release(); }
    }
}
