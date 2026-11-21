// End-to-end acceptance suite: real Postgres, real HTTP and socket servers.
// Needs RECETTE_DATABASE_URL pointing at a disposable database (it is wiped).
module.exports = {
  ...require('./jest.config'),
  testMatch: ['<rootDir>/tests/recette/**/*.e2e.ts'],
  setupFiles: ['<rootDir>/tests/recette/env.ts'],
  testTimeout: 60000,
};
