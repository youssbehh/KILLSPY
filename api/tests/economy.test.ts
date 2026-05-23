import { computeMoneyReward, SIGNUP_BONUS } from '../src/game/economy';

describe('computeMoneyReward', () => {
  it('PvE gives no money (any outcome)', () => {
    expect(computeMoneyReward('won', 'pve')).toBe(0);
    expect(computeMoneyReward('lost', 'pve')).toBe(0);
    expect(computeMoneyReward('draw', 'pve')).toBe(0);
  });

  it('PvP quick has small rewards even on loss', () => {
    expect(computeMoneyReward('won', 'pvp_quick')).toBeGreaterThan(0);
    expect(computeMoneyReward('lost', 'pvp_quick')).toBeGreaterThan(0);
    expect(computeMoneyReward('won', 'pvp_quick'))
      .toBeGreaterThan(computeMoneyReward('lost', 'pvp_quick'));
  });

  it('PvP ranked has bigger rewards than quick', () => {
    expect(computeMoneyReward('won', 'pvp_ranked'))
      .toBeGreaterThan(computeMoneyReward('won', 'pvp_quick'));
    expect(computeMoneyReward('lost', 'pvp_ranked'))
      .toBeGreaterThan(computeMoneyReward('lost', 'pvp_quick'));
  });

  it('SIGNUP_BONUS is positive', () => {
    expect(SIGNUP_BONUS).toBeGreaterThan(0);
  });
});
