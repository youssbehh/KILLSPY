import React from 'react';
import { act, screen, userEvent } from '@testing-library/react-native';
import { renderWithProviders as render } from '@/src/test/render';

jest.mock('expo-router', () => require('@/src/test/routerMock').routerMock);

import { router } from '@/src/test/routerMock';
import { useAuthStore, AuthUser } from '@/src/stores/authStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { useGameStore } from '@/src/stores/gameStore';
import { VerifyEmailBanner } from '../VerifyEmailBanner';
import { ThemeRestartBanner } from '../ThemeRestartBanner';
import { ConsentModal, CONSENT_DELAY_SECS } from '../ConsentModal';
import { StepSlider } from '../StepSlider';

const player = (patch: Partial<AuthUser> = {}): AuthUser => ({
  id: 1,
  username: 'Viper',
  mmr: 0,
  money: 0,
  xp: 0,
  level: 1,
  emailVerified: false,
  guest: false,
  ...patch,
});

beforeEach(() => {
  router.push.mockClear();
  useAuthStore.setState({ user: player(), isAuthenticated: true });
  useGameStore.getState().reset();
});

describe('bandeau « adresse à vérifier »', () => {
  it("n'apparaît pas quand le serveur ne demande rien", async () => {
    await render(<VerifyEmailBanner />);
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('mène aux paramètres du compte quand la vérification est requise', async () => {
    useAuthStore.setState({ user: player({ verificationRequired: true }) });
    await render(<VerifyEmailBanner />);
    await userEvent.setup().press(screen.getByRole('button', { name: /vérifier mon adresse/i }));
    expect(router.push).toHaveBeenCalledWith('/settings');
  });
});

describe('bandeau « redémarrer pour appliquer le thème »', () => {
  it('propose de redémarrer, se range sur « Plus tard »', async () => {
    useThemeStore.setState({ equippedId: 'technologieAvancee', restartPending: true });
    await render(<ThemeRestartBanner />);
    expect(screen.getByText(/TECHNOLOGIE AVANCÉE/)).toBeOnTheScreen();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Plus tard' }));
    expect(screen.queryByText(/TECHNOLOGIE AVANCÉE/)).not.toBeOnTheScreen();
  });

  it('ne dérange pas pendant une partie', async () => {
    useThemeStore.setState({ equippedId: 'technologieAvancee', restartPending: true });
    useGameStore.setState({ matchStatus: 'playing' });
    await render(<ThemeRestartBanner />);
    expect(screen.queryByText(/TECHNOLOGIE AVANCÉE/)).not.toBeOnTheScreen();
  });
});

describe('consentement RGPD', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("« J'accepte » ne se débloque qu'après le délai de lecture", async () => {
    const onAccept = jest.fn();
    const onRefuse = jest.fn();
    await render(<ConsentModal visible onAccept={onAccept} onRefuse={onRefuse} />);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.press(screen.getByRole('button', { name: `${CONSENT_DELAY_SECS}…` }));
    expect(onAccept).not.toHaveBeenCalled();

    for (let i = 0; i < CONSENT_DELAY_SECS; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    await user.press(screen.getByRole('button', { name: "J'accepte" }));
    expect(onAccept).toHaveBeenCalledTimes(1);

    await user.press(screen.getByRole('button', { name: 'Je refuse' }));
    expect(onRefuse).toHaveBeenCalledTimes(1);
  });
});

describe('curseur de volume', () => {
  it('se règle au lecteur d\x27écran par incréments', async () => {
    const onChange = jest.fn();
    await render(<StepSlider value={5} onValueChange={onChange} accessibilityLabel="Musique" />);
    const slider = screen.getByRole('adjustable', { name: 'Musique' });
    expect(slider).toHaveAccessibilityValue({ min: 0, max: 10, now: 5 });

    await act(async () => {
      slider.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
    });
    expect(onChange).toHaveBeenLastCalledWith(6);
    await act(async () => {
      slider.props.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } });
    });
    expect(onChange).toHaveBeenLastCalledWith(4);
  });
});
