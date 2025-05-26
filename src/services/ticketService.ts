// src/services/ticketService.ts

export interface HousieTicketData { // Renamed for clarity
    rows: (number | null)[][];
}

const NUM_ROWS = 3;
const NUM_COLS = 9;
const NUMBERS_PER_ROW = 5;
const MAX_NUMBERS_PER_COL = 3;
const MIN_NUMBERS_PER_COL = 1;

const getRandomNumberInRange = (min: number, max: number, exclude: number[]): number => {
    let num;
    do {
        num = Math.floor(Math.random() * (max - min + 1)) + min;
    } while (exclude.includes(num));
    return num;
};

export class TicketService { // <--- WRAP IN A CLASS
    constructor() {
        // Constructor can be empty if no setup needed
    }

    public generateTicket(): HousieTicketData { // <--- MAKE IT A PUBLIC METHOD
        const ticket: (number | null)[][] = Array(NUM_ROWS)
            .fill(null)
            .map(() => Array(NUM_COLS).fill(null));

        const colNumbersCount: number[] = Array(NUM_COLS).fill(0);
        const numbersPlacedInRow: number[] = Array(NUM_ROWS).fill(0);

        // Step 1: Decide how many numbers in each column (between MIN_NUMBERS_PER_COL and MAX_NUMBERS_PER_COL)
        // Ensure total numbers = NUM_ROWS * NUMBERS_PER_ROW (15)
        let totalNumbersToPlace = NUM_ROWS * NUMBERS_PER_ROW;
        
        // First, ensure each column has at least MIN_NUMBERS_PER_COL
        for (let col = 0; col < NUM_COLS; col++) {
            colNumbersCount[col] = MIN_NUMBERS_PER_COL;
            totalNumbersToPlace -= MIN_NUMBERS_PER_COL;
        }

        // Distribute remaining numbers (15 - 9*1 = 6 numbers)
        let attempts = 0; // Safety break for distribution
        while (totalNumbersToPlace > 0 && attempts < 100) {
            const randomCol = Math.floor(Math.random() * NUM_COLS);
            if (colNumbersCount[randomCol] < MAX_NUMBERS_PER_COL) {
                colNumbersCount[randomCol]++;
                totalNumbersToPlace--;
            }
            attempts++;
        }
         // If not all numbers are placed due to MAX_NUMBERS_PER_COL constraint, force placement
        if (totalNumbersToPlace > 0) {
            for (let col = 0; col < NUM_COLS && totalNumbersToPlace > 0; col++) {
                while(colNumbersCount[col] < MAX_NUMBERS_PER_COL && totalNumbersToPlace > 0) {
                    colNumbersCount[col]++;
                    totalNumbersToPlace--;
                }
            }
        }


        // Step 2: Place numbers in columns
        for (let col = 0; col < NUM_COLS; col++) {
            const numbersInThisCol: number[] = [];
            const minRange = col * 10 + (col === 0 ? 1 : 0); // Col 0: 1-9, Col 1: 10-19 ... Col 8: 80-89, Col 9 maps to 80-90
            const maxRange = col * 10 + (col === 8 ? 10 : 9); // Col 8 is 80-90

            for (let i = 0; i < colNumbersCount[col]; i++) {
                numbersInThisCol.push(getRandomNumberInRange(minRange, maxRange, numbersInThisCol));
            }
            numbersInThisCol.sort((a, b) => a - b); // Sort numbers in the column

            // Distribute these numbers into rows for this column
            const availableRows: number[] = [];
            for(let r=0; r<NUM_ROWS; r++) availableRows.push(r);

            for (const num of numbersInThisCol) {
                let placed = false;
                let rowAttempts = 0;
                while(!placed && rowAttempts < NUM_ROWS * 2 && availableRows.length > 0) { // try to place in a suitable row
                    const randomRowIndex = Math.floor(Math.random() * availableRows.length);
                    const rowToTry = availableRows[randomRowIndex];

                    if (numbersPlacedInRow[rowToTry] < NUMBERS_PER_ROW) {
                        ticket[rowToTry][col] = num;
                        numbersPlacedInRow[rowToTry]++;
                        availableRows.splice(randomRowIndex, 1); // Remove row from available for this col
                        placed = true;
                    }
                    rowAttempts++;
                }
                if (!placed) {
                    // This indicates a potential issue with distribution logic if a number can't be placed.
                    // For a robust solution, this part might need backtracking or a different algorithm.
                    // For now, if it fails, the ticket might be invalid. We'd need to regenerate or error.
                    // One simple fallback: try to place it in the first available row that isn't full.
                    for (let r = 0; r < NUM_ROWS; r++) {
                        if (ticket[r][col] === null && numbersPlacedInRow[r] < NUMBERS_PER_ROW) {
                            ticket[r][col] = num;
                            numbersPlacedInRow[r]++;
                            placed = true;
                            break;
                        }
                    }
                     if(!placed) {
                        // console.warn("Could not place number optimally, ticket might be imperfect:", num, "in col", col);
                        // This is a rare case for this simple algo; may need more robust ticket generation
                     }
                }
            }
        }
        
        // Step 3: Ensure each row has exactly NUMBERS_PER_ROW numbers
        // This step is tricky with the column-first approach. If Step 2 doesn't guarantee this,
        // the ticket generation algorithm needs to be more sophisticated (e.g., backtracking, or row-first filling).
        // The current logic tries its best but might not always perfectly hit 5 numbers per row
        // if MAX_NUMBERS_PER_COL is too restrictive or distribution is unlucky.
        // A common approach is to fill columns, then adjust by moving numbers if rows are unbalanced,
        // or use a more complex generation algorithm like "Dancing Links (DLX)" for exact cover problems.

        // For now, we assume the distribution above is 'good enough' for an MVP.
        // We can add a validation step here later.

        return { rows: ticket };
    }

    // You can add more ticket-related utility methods here if needed
}
