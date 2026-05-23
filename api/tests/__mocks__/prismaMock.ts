export const createPrismaMock = () => ({
  users: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  session: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  roles: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  leaderboard: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  friends: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
});

export type PrismaMock = ReturnType<typeof createPrismaMock>;
