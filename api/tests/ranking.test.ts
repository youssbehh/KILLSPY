import {
  mmrToRank,
  nextRank,
  progressToNext,
  computeMmrDelta,
  applyMmrDelta,
  RANK_TIERS,
} from '../src/game/ranking';

describe('mmrToRank', () => {
  it('0 MMR → Bronze', () => {
    expect(mmrToRank(0).id).toBe('bronze');
  });

  it('150 MMR → Bronze (just below silver)', () => {
    expect(mmrToRank(150).id).toBe('bronze');
  });

  it('200 MMR → Argent', () => {
    expect(mmrToRank(200).id).toBe('silver');
  });

  it('2500 MMR → Maître Espion (top tier)', () => {
    expect(mmrToRank(2500).id).toBe('master');
  });
});

describe('nextRank', () => {
  it('returns silver when current is bronze', () => {
    expect(nextRank(0)?.id).toBe('silver');
  });

  it('returns null at master tier', () => {
    expect(nextRank(3000)).toBeNull();
  });
});

describe('progressToNext', () => {
  it('100/200 between bronze and silver → 50%', () => {
    expect(progressToNext(100)).toBeCloseTo(0.5);
  });

  it('master tier returns 1', () => {
    expect(progressToNext(3000)).toBe(1);
  });
});

describe('computeMmrDelta', () => {
  it('PvE never changes MMR (any outcome)', () => {
    expect(computeMmrDelta('won', 'pve')).toBe(0);
    expect(computeMmrDelta('lost', 'pve')).toBe(0);
    expect(computeMmrDelta('draw', 'pve')).toBe(0);
  });

  it('PvP quick never changes MMR (any outcome)', () => {
    expect(computeMmrDelta('won', 'pvp_quick')).toBe(0);
    expect(computeMmrDelta('lost', 'pvp_quick')).toBe(0);
    expect(computeMmrDelta('draw', 'pvp_quick')).toBe(0);
  });

  it('PvP ranked win gives MMR', () => {
    expect(computeMmrDelta('won', 'pvp_ranked')).toBeGreaterThan(0);
  });

  it('PvP ranked loss removes MMR', () => {
    expect(computeMmrDelta('lost', 'pvp_ranked')).toBeLessThan(0);
  });

  it('PvP ranked draw is positive but small', () => {
    const draw = computeMmrDelta('draw', 'pvp_ranked');
    const win = computeMmrDelta('won', 'pvp_ranked');
    expect(draw).toBeGreaterThan(0);
    expect(draw).toBeLessThan(win);
  });
});

describe('applyMmrDelta', () => {
  it('cannot go below 0', () => {
    expect(applyMmrDelta(5, -100)).toBe(0);
  });

  it('adds normally', () => {
    expect(applyMmrDelta(100, 25)).toBe(125);
  });
});

describe('RANK_TIERS', () => {
  it('are sorted by minMmr ascending', () => {
    for (let i = 1; i < RANK_TIERS.length; i++) {
      expect(RANK_TIERS[i].minMmr).toBeGreaterThan(RANK_TIERS[i - 1].minMmr);
    }
  });
});
