const url = process.env.RECETTE_DATABASE_URL;
if (!url) {
  throw new Error('RECETTE_DATABASE_URL is required: a disposable Postgres database (every user in it is deleted).');
}
// Guard rail: the suite deletes data, so it only ever runs against a local database.
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  throw new Error('RECETTE_DATABASE_URL must point at localhost.');
}
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = url;
process.env.DIRECT_URL = url;
process.env.JWT_SECRET = 'recette-jwt-secret-32-characters-min-aaaa';
process.env.PORT = '4099';
delete process.env.SMTP_HOST;
