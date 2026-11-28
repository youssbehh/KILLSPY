import React from 'react';
import { act, screen, userEvent } from '@testing-library/react-native';

jest.mock('@/src/api/account', () => ({
  upgradeGuest: jest.fn(async () => ({
    user: { id: 9, username: 'Nova', mmr: 0, money: 0, xp: 0, level: 1, emailVerified: false, guest: false },
    token: 'access',
    refreshToken: 'refresh',
  })),
}));

import * as accountApi from '@/src/api/account';
import { renderWithProviders } from '@/src/test/render';
import { CONSENT_DELAY_SECS } from '@/src/components/ks/ConsentModal';
import { GuestUpgradeForm } from '../GuestUpgradeForm';

const api = accountApi as jest.Mocked<typeof accountApi>;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

it("un invité ne devient un compte qu'après avoir accepté la politique de confidentialité", async () => {
  const onDone = jest.fn();
  await renderWithProviders(<GuestUpgradeForm onDone={onDone} />);
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  await user.type(screen.getByLabelText('Pseudo'), 'Nova');
  await user.type(screen.getByLabelText('E-mail'), 'nova@test.io');
  await user.type(screen.getByLabelText('Mot de passe'), 'Aa1@strong');
  await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'Aa1@strong');

  await user.press(screen.getByRole('button', { name: /créer mon compte/i }));
  expect(screen.getByText(/Tu dois accepter les conditions/)).toBeOnTheScreen();
  expect(api.upgradeGuest).not.toHaveBeenCalled();

  await user.press(screen.getByRole('checkbox', { name: "J'accepte les conditions générales" }));
  for (let i = 0; i < CONSENT_DELAY_SECS; i++) {
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
  }
  await user.press(screen.getByRole('button', { name: "J'accepte" }));
  await user.press(screen.getByRole('button', { name: /créer mon compte/i }));

  expect(api.upgradeGuest.mock.calls[0][0]).toEqual({
    username: 'Nova',
    email: 'nova@test.io',
    passwordCrea: 'Aa1@strong',
    acceptTerms: true,
  });
  expect(onDone).toHaveBeenCalled();
});
