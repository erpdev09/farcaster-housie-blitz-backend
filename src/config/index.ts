import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

export const PORT = process.env.PORT || 3001;
export const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("FATAL ERROR: DATABASE_URL is not defined in .env file. Please check your .env file.");
    process.exit(1);
}
