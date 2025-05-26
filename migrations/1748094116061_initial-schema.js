/* eslint-disable camelcase */

exports.shorthands = undefined;

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
    // --- UUID Extension ---
    // pgm.createExtension('uuid-ossp', { ifNotExists: true }); // If you prefer UUIDs for IDs

    // --- Updated At Trigger Function ---
    pgm.sql(`
        CREATE OR REPLACE FUNCTION trigger_set_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    // --- Users Table ---
    pgm.createTable('users', {
        id: 'id', // serial primary key
        fid: { type: 'bigint', unique: true, notNull: false }, // Nullable initially
        wallet_address: { type: 'varchar(42)', unique: true, notNull: false }, // Nullable initially
        username: { type: 'varchar(255)', notNull: false },
        created_at: {
            type: 'timestamp with time zone', // More precise timestamp
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updated_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    pgm.sql(`
        CREATE TRIGGER set_timestamp_users
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp();
    `);

    // --- Games Table ---
    pgm.createTable('games', {
        id: 'id',
        scheduled_at: { type: 'timestamp with time zone', notNull: true },
        status: { type: 'varchar(20)', notNull: true, default: 'scheduled' }, // 'scheduled', 'live', 'finished', 'cancelled'
        ticket_price: { type: 'decimal(36, 18)', notNull: true }, // To handle large numbers like DEGEN (18 decimals)
        token_currency: { type: 'varchar(10)', notNull: true, default: 'DEGEN' },
        rake_percentage: { type: 'decimal(5, 2)', notNull: true, default: 10.00 }, // e.g., 10.00 for 10%
        prize_pool: { type: 'decimal(36, 18)', notNull: true, default: 0 },
        numbers_called: { type: 'jsonb', default: '[]' }, // Array of called numbers
        created_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updated_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    pgm.sql(`
        CREATE TRIGGER set_timestamp_games
        BEFORE UPDATE ON games
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp();
    `);
    // Index on status for faster querying of live/scheduled games
    pgm.createIndex('games', 'status');


    // --- Tickets Table ---
    pgm.createTable('tickets', {
        id: 'id',
        user_id: { 
            type: 'integer', 
            notNull: true,
            references: '"users"(id)', // Ensure "users" is quoted if it's a reserved word or contains special chars
            onDelete: 'CASCADE' 
        },
        game_id: { 
            type: 'integer', 
            notNull: true,
            references: '"games"(id)', 
            onDelete: 'CASCADE' 
        },
        ticket_data: { type: 'jsonb', notNull: true }, // e.g., {"rows": [[1,15,22..], [..], [..]]}
        is_winner: { type: 'boolean', default: false },
        winning_pattern: { type: 'varchar(50)', notNull: false }, // 'line1', 'line2', 'full_house', 'early_five' etc.
        purchased_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        // No updated_at here as tickets are usually immutable after purchase
    });
    // Indexes for faster lookups
    pgm.createIndex('tickets', 'user_id');
    pgm.createIndex('tickets', 'game_id');


    // --- Winnings Table ---
    pgm.createTable('winnings', {
        id: 'id',
        user_id: { 
            type: 'integer', 
            notNull: true,
            references: '"users"(id)', 
            onDelete: 'SET NULL' // Or 'CASCADE' if a user deletion should remove winnings
        },
        game_id: { 
            type: 'integer', 
            notNull: true,
            references: '"games"(id)', 
            onDelete: 'CASCADE' 
        },
        ticket_id: { 
            type: 'integer', 
            notNull: true, // Or false if a win isn't tied to one ticket (e.g. jackpot)
            references: '"tickets"(id)',
            onDelete: 'CASCADE' // If ticket is deleted, this winning record makes less sense
        },
        amount_won: { type: 'decimal(36, 18)', notNull: true },
        token_currency: { type: 'varchar(10)', notNull: true, default: 'DEGEN' },
        pattern: { type: 'varchar(50)', notNull: true },
        claimed_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        payout_tx_hash: { type: 'varchar(66)', notNull: false }, // For blockchain transaction hash
        payout_status: { type: 'varchar(20)', notNull: true, default: 'pending' } // 'pending', 'paid', 'failed'
        // No updated_at here, record is fairly static after creation
    });
    // Indexes
    pgm.createIndex('winnings', 'user_id');
    pgm.createIndex('winnings', 'game_id');
};


/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
    // Drop tables in reverse order of creation due to foreign key constraints
    pgm.dropTable('winnings');
    pgm.dropTable('tickets');
    pgm.dropTable('games'); // Triggers will be dropped with tables
    pgm.dropTable('users');

    // Drop the trigger function
    pgm.sql('DROP FUNCTION IF EXISTS trigger_set_timestamp() CASCADE;');

    // pgm.dropExtension('uuid-ossp', { ifExists: true }); // If you used UUIDs
};
