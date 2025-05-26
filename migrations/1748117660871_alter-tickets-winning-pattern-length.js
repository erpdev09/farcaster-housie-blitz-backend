/* eslint-disable camelcase */
exports.shorthands = undefined;

/** @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm */
exports.up = pgm => {
    pgm.alterColumn('tickets', 'winning_pattern', {
        type: 'VARCHAR(255)', // Increase length
    });
};

/** @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm */
exports.down = pgm => {
    pgm.alterColumn('tickets', 'winning_pattern', {
        type: 'VARCHAR(50)', // Revert if needed
    });
};
