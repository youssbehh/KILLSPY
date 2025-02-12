import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import LoginFormScreen from '../../app/index';
import { motTraduit } from '@/components/translationHelper';

// Mock de useRouter
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// Mock de la traduction
jest.mock('@/components/translationHelper', () => ({
  motTraduit: jest.fn((langIndex, id) => `traduit-${id}`),
}));

// Mock du store de langue
jest.mock('../../store/languageStore', () => ({
  useLanguageStore: () => ({
    langIndex: 0,
  }),
}));

describe('LoginFormScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le titre KILLSPY', () => {
    const { getByText } = render(<LoginFormScreen />);
    expect(getByText('KILLSPY')).toBeTruthy();
  });

  it('affiche le texte traduit avec motTraduit', () => {
    const { getByText } = render(<LoginFormScreen />);
    expect(getByText('traduit-50')).toBeTruthy();
    expect(motTraduit).toHaveBeenCalledWith(0, 50);
  });

  it('navigue vers la page gamechoice lorsqu’on appuie sur le texte', () => {
    const { getByText } = render(<LoginFormScreen />);
    fireEvent.press(getByText('traduit-50'));

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/gamechoice');
  });

  it('crée un snapshot du composant LoginFormScreen', () => {
    const tree = render(<LoginFormScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
