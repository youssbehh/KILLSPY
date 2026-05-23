process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16
  ? process.env.JWT_SECRET
  : 'test-jwt-secret-32-characters-min-aaaaaaaa';
process.env.PORT = process.env.PORT || '4001';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
