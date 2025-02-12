import * as React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import '@testing-library/jest-native/extend-expect';
import QuitButton from '../QuitButton';
import { motTraduit } from '@/components/translationHelper';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    replace: mockReplace,
  },
}));

jest.mock('@/components/translationHelper', () => ({
  motTraduit: jest.fn((langIndex, id) => `traduit-${id}`),
}));

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({
    langIndex: 0,
  }),
}));

jest.spyOn(Alert, 'alert');

type AlertButton = {
  text: string;
  style?: string;
  onPress?: () => void;
};

describe('QuitButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le bouton avec le symbole ✕', () => {
    const { getByText } = render(<QuitButton />);
    expect(getByText('✕')).toBeTruthy();
  });

  it('affiche une alerte de confirmation lors du clic', () => {
    const { getByText } = render(<QuitButton />);
    fireEvent.press(getByText('✕'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'traduit-44',
      'traduit-45',
      [
        {
          text: 'traduit-35',
          style: 'cancel',
        },
        {
          text: 'traduit-39',
          style: 'destructive',
          onPress: expect.any(Function),
        },
      ],
      { cancelable: true }
    );
  });

  it('crée un snapshot du bouton QuitButton', () => {
    const tree = render(<QuitButton />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
