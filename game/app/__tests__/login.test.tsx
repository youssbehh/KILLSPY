import React from 'react';
import { act, screen, userEvent } from '@testing-library/react-native';

jest.mock('expo-router', () => require('@/src/test/routerMock').routerMock);
jest.mock('@/src/api/auth', () => ({
  ping: jest.fn(async () => true),
  login: jest.fn(),
  signup: jest.fn(async () => ({ id: 2, username: 'Nova' })),
  loginGuest: jest.fn(async () => ({
    user: { id: 9, username: 'Guest1', mmr: 0, money: 0, xp: 0, level: 1, emailVerified: false, guest: true },
    token: 'access',
    refreshToken: 'refresh',
  })),
}));

import * as authApi from '@/src/api/auth';
import { renderWithProviders } from '@/src/test/render';
import { useAuthStore } from '@/src/stores/authStore';
import { CONSENT_DELAY_SECS } from '@/src/components/ks/ConsentModal';
import LoginFormScreen from '../index';

const api = authApi as jest.Mocked<typeof authApi>;

/** Waits out the reading delay of the privacy notice. */
const readNotice = async () => {
  for (let i = 0; i < CONSENT_DELAY_SECS; i++) {
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
  }
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: false });
});
afterEach(() => jest.useRealTimers());

const setup = async () => {
  await renderWithProviders(<LoginFormScreen />);
  return userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
};

describe('écran de connexion', () => {
  it("jouer en invité demande d'abord le consentement, et ne crée rien en cas de refus", async () => {
    const user = await setup();
    await user.press(screen.getByRole('button', { name: "JOUER EN TANT QU'INVITÉ" }));
    expect(screen.getByRole('button', { name: 'Je refuse' })).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Je refuse' }));
    expect(api.loginGuest).not.toHaveBeenCalled();
  });

  it('une fois le texte accepté, la partie invité démarre', async () => {
    const user = await setup();
    await user.press(screen.getByRole('button', { name: "JOUER EN TANT QU'INVITÉ" }));
    await readNotice();
    await user.press(screen.getByRole('button', { name: "J'accepte" }));

    expect(api.loginGuest).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user?.guest).toBe(true);
  });

  it("l'inscription est refusée tant que les conditions ne sont pas acceptées, puis envoie le consentement", async () => {
    const user = await setup();
    await user.press(screen.getByRole('button', { name: 'Créer un compte' }));
    await user.type(screen.getByLabelText("Nom d'utilisateur"), 'Nova');
    await user.type(screen.getByLabelText('Email'), 'nova@test.io');
    const [password, confirmation] = screen.getAllByLabelText(/Mot de passe|Confirmation du mot de passe/);
    await user.type(password, 'Aa1@strong');
    await user.type(confirmation, 'Aa1@strong');

    await user.press(screen.getByRole('button', { name: "S'INSCRIRE" }));
    expect(screen.getByText(/Tu dois accepter les conditions/)).toBeOnTheScreen();
    expect(api.signup).not.toHaveBeenCalled();

    await user.press(screen.getByRole('checkbox', { name: "J'accepte les conditions générales" }));
    await readNotice();
    await user.press(screen.getByRole('button', { name: "J'accepte" }));
    expect(screen.getByRole('checkbox', { name: "J'accepte les conditions générales" })).toBeChecked();

    await user.press(screen.getByRole('button', { name: "S'INSCRIRE" }));
    expect(api.signup).toHaveBeenCalledTimes(1);
    expect(api.signup.mock.calls[0][0]).toEqual({
      username: 'Nova',
      email: 'nova@test.io',
      passwordCrea: 'Aa1@strong',
      acceptTerms: true,
    });
  });
});
