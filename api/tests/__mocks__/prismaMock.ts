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
  friends: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  gameHistory: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  cosmeticItem: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  userCosmetic: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  equippedCosmetic: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  shopOffer: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(async (ops: any) => {
    if (typeof ops === 'function') return ops({});
    return Promise.all(ops as any[]);
  }),
});

export type PrismaMock = ReturnType<typeof createPrismaMock>;

const defaultTransactionImpl = async (ops: any) => {
  if (typeof ops === 'function') return ops({});
  return Promise.all(ops as any[]);
};

/**
 * Reset every jest mock function on the prisma mock (model methods + $transaction),
 * then restore the default $transaction implementation so services that use it
 * keep working without each test having to re-set it.
 */
export const resetPrismaMock = (mock: PrismaMock) => {
  for (const value of Object.values(mock)) {
    if (typeof value === 'function' && (value as jest.Mock).mockReset) {
      (value as jest.Mock).mockReset();
    } else if (value && typeof value === 'object') {
      for (const fn of Object.values(value)) {
        if (typeof fn === 'function' && (fn as jest.Mock).mockReset) {
          (fn as jest.Mock).mockReset();
        }
      }
    }
  }
  (mock.$transaction as jest.Mock).mockImplementation(defaultTransactionImpl);
};
