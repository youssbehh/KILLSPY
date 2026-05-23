import jwt from 'jsonwebtoken';
import { createPrismaMock, PrismaMock } from './__mocks__/prismaMock';

const prismaMock: PrismaMock = createPrismaMock();
// shop.service uses tx callbacks — make $transaction call the cb with the mock itself.
(prismaMock.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
  if (typeof cb === 'function') return cb(prismaMock);
  return Promise.all(cb);
});

jest.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));

import request from 'supertest';
import { app } from '../src/app';
import { JWT_SECRET } from '../src/secrets';

const token = (userId: number) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });

const fakeUser = (overrides: any = {}) => ({
  ID_User: 1,
  Username: 'agent007',
  Email: 'a@b.io',
  Password: 'hash',
  MMR: 100,
  Money: 500,
  isGuest: false,
  archived: false,
  deletionDate: null,
  CreatedAt: new Date(),
  ...overrides,
});

const fakeOffer = (overrides: any = {}) => ({
  id: 1,
  itemId: 10,
  price: 100,
  validUntil: new Date(Date.now() + 86400_000),
  position: 0,
  active: true,
  item: {
    id: 10,
    type: 'avatar',
    name: 'Sniper masqué',
    imageUrl: 'http://example.com/img.png',
    basePrice: 100,
    rarity: 'uncommon',
    available: true,
    createdAt: new Date(),
  },
  ...overrides,
});

beforeEach(() => {
  [
    prismaMock.users,
    prismaMock.cosmeticItem,
    prismaMock.userCosmetic,
    prismaMock.equippedCosmetic,
    prismaMock.shopOffer,
  ].forEach((m) => Object.values(m).forEach((fn) => (fn as jest.Mock).mockReset()));
  (prismaMock.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
    if (typeof cb === 'function') return cb(prismaMock);
    return Promise.all(cb);
  });
});

describe('GET /api/shop', () => {
  it('lists active offers with alreadyOwned flag', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser());
    prismaMock.shopOffer.findMany.mockResolvedValue([fakeOffer()]);
    prismaMock.userCosmetic.findMany.mockResolvedValue([{ itemId: 10 }]);

    const res = await request(app).get('/api/shop').set('Authorization', token(1));

    expect(res.status).toBe(200);
    expect(res.body.offers).toHaveLength(1);
    expect(res.body.offers[0].alreadyOwned).toBe(true);
    expect(res.body.offers[0].rarity).toBe('uncommon');
  });
});

describe('POST /api/shop/purchase/:offerId', () => {
  it('rejects without token', async () => {
    const res = await request(app).post('/api/shop/purchase/1');
    expect(res.status).toBe(401);
  });

  it('rejects when offer is expired', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser());
    prismaMock.shopOffer.findUnique.mockResolvedValue(
      fakeOffer({ validUntil: new Date(Date.now() - 1000) }),
    );

    const res = await request(app).post('/api/shop/purchase/1').set('Authorization', token(1));
    expect(res.status).toBe(400);
  });

  it('rejects when balance is insufficient', async () => {
    prismaMock.users.findUnique
      .mockResolvedValueOnce(fakeUser({ Money: 500 })) // authMiddleware
      .mockResolvedValueOnce(fakeUser({ Money: 50 })); // service inside tx
    prismaMock.shopOffer.findUnique.mockResolvedValue(fakeOffer({ price: 100 }));
    prismaMock.userCosmetic.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/api/shop/purchase/1').set('Authorization', token(1));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insuffisant/i);
  });

  it('rejects guests', async () => {
    prismaMock.users.findUnique
      .mockResolvedValueOnce(fakeUser({ isGuest: true }))
      .mockResolvedValueOnce(fakeUser({ isGuest: true }));
    prismaMock.shopOffer.findUnique.mockResolvedValue(fakeOffer());

    const res = await request(app).post('/api/shop/purchase/1').set('Authorization', token(1));
    expect(res.status).toBe(403);
  });

  it('rejects if already owned', async () => {
    prismaMock.users.findUnique
      .mockResolvedValueOnce(fakeUser())
      .mockResolvedValueOnce(fakeUser());
    prismaMock.shopOffer.findUnique.mockResolvedValue(fakeOffer());
    prismaMock.userCosmetic.findUnique.mockResolvedValue({ id: 1 });

    const res = await request(app).post('/api/shop/purchase/1').set('Authorization', token(1));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/possédez d/i);
  });

  it('completes a valid purchase and decrements balance', async () => {
    prismaMock.users.findUnique
      .mockResolvedValueOnce(fakeUser({ Money: 500 }))
      .mockResolvedValueOnce(fakeUser({ Money: 500 }));
    prismaMock.shopOffer.findUnique.mockResolvedValue(fakeOffer({ price: 100 }));
    prismaMock.userCosmetic.findUnique.mockResolvedValue(null);
    prismaMock.userCosmetic.create.mockResolvedValue({ id: 99 });
    prismaMock.users.update.mockResolvedValue({});

    const res = await request(app).post('/api/shop/purchase/1').set('Authorization', token(1));

    expect(res.status).toBe(201);
    expect(res.body.result.moneyAfter).toBe(400);
    expect(prismaMock.users.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { Money: 400 } }),
    );
  });
});

describe('POST /api/inventory/equip', () => {
  it('equips an owned item', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser());
    prismaMock.userCosmetic.findUnique.mockResolvedValue({
      id: 1, userId: 1, itemId: 10,
      item: { id: 10, type: 'avatar', name: 'Sniper masqué', imageUrl: 'x', rarity: 'uncommon' },
    });
    prismaMock.equippedCosmetic.upsert.mockResolvedValue({});

    const res = await request(app)
      .post('/api/inventory/equip')
      .set('Authorization', token(1))
      .send({ itemId: 10 });

    expect(res.status).toBe(200);
    expect(res.body.equipped.type).toBe('avatar');
    expect(prismaMock.equippedCosmetic.upsert).toHaveBeenCalled();
  });

  it('rejects equipping an item user does not own', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser());
    prismaMock.userCosmetic.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/inventory/equip')
      .set('Authorization', token(1))
      .send({ itemId: 999 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/poss/i);
  });
});
