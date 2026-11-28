import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';

jest.mock('expo-router', () => require('@/src/test/routerMock').routerMock);
jest.mock('../../hooks/useLeaderboard', () => ({ useLeaderboard: () => ({ data: [] }) }));
jest.mock('../../hooks/useMessages', () => ({ useInbox: () => ({ data: [] }) }));
jest.mock('../../hooks/useDailyMissions', () => ({
  useDailyMissions: () => ({ data: [], isLoading: false }),
  useClaimMission: () => ({ mutate: jest.fn() }),
}));

import { router } from '@/src/test/routerMock';
import { renderWithProviders } from '@/src/test/render';
import { AuthUser, useAuthStore } from '@/src/stores/authStore';
import { HomeScreen } from '../HomeScreen';
import { EndMatchScreen } from '../EndMatchScreen';

const player = (patch: Partial<AuthUser> = {}): AuthUser => ({
  id: 1,
  username: 'Viper',
  mmr: 640,
  money: 500,
  xp: 900,
  level: 4,
  emailVerified: true,
  guest: false,
  ...patch,
});

beforeEach(() => {
  router.push.mockClear();
});

describe('accueil', () => {
  it('lance une partie rapide', async () => {
    useAuthStore.setState({ user: player(), isAuthenticated: true });
    await renderWithProviders(<HomeScreen />);
    await userEvent.setup().press(screen.getByText('DÉPLOIEMENT'));
    expect(router.push).toHaveBeenCalledWith('/play/partieRapide');
  });

  it('ouvre le classé à un compte vérifié', async () => {
    useAuthStore.setState({ user: player(), isAuthenticated: true });
    await renderWithProviders(<HomeScreen />);
    const ranked = screen.getByRole('button', { name: 'Opérations classées' });
    expect(ranked).toBeEnabled();
    await userEvent.setup().press(ranked);
    expect(router.push).toHaveBeenCalledWith({ pathname: '/play/partieRapide', params: { mode: 'ranked' } });
  });

  it("verrouille le classé tant que l'adresse n'est pas vérifiée, et dit pourquoi", async () => {
    useAuthStore.setState({ user: player({ emailVerified: false, verificationRequired: true }), isAuthenticated: true });
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByRole('button', { name: 'Opérations classées' })).toBeDisabled();
    expect(screen.getByText('ADRESSE E-MAIL À VÉRIFIER')).toBeOnTheScreen();
  });

  it('réserve le classé aux comptes (invité)', async () => {
    useAuthStore.setState({ user: player({ guest: true }), isAuthenticated: true });
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByRole('button', { name: 'Opérations classées' })).toBeDisabled();
    expect(screen.getByText('COMPTE REQUIS')).toBeOnTheScreen();
  });
});

describe('fin de partie', () => {
  beforeEach(() => useAuthStore.setState({ user: player(), isAuthenticated: true }));

  it('annonce la victoire et les gains, propose revanche et retour', async () => {
    const onRematch = jest.fn();
    const onHome = jest.fn();
    await renderWithProviders(
      <EndMatchScreen
        outcome="won"
        mode="pvp_ranked"
        rewards={{ mmrDelta: 25, moneyDelta: 50, xpDelta: 75 }}
        rounds={6}
        livesLeft={2}
        onRematch={onRematch}
        onHome={onHome}
      />,
    );
    expect(screen.getByText('MISSION ACCOMPLIE')).toBeOnTheScreen();
    expect(screen.getByText(/\+25/)).toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'REVANCHE' }));
    await user.press(screen.getByRole('button', { name: 'ACCUEIL' }));
    expect(onRematch).toHaveBeenCalledTimes(1);
    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it("annonce la défaite sans rien créditer à l'entraînement", async () => {
    await renderWithProviders(<EndMatchScreen outcome="lost" mode="pve" rewards={null} rounds={4} livesLeft={0} />);
    expect(screen.getByText('MISSION ÉCHOUÉE')).toBeOnTheScreen();
    expect(screen.queryByText(/\+25/)).not.toBeOnTheScreen();
  });
});
