import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginFormScreen from '../../app/index';
import { motTraduit } from '@/components/translationHelper';

// Mock de useRouter
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
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
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue('some value');
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('some value');
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

  it('crée un snapshot du composant LoginFormScreen', () => {
    const tree = render(<LoginFormScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
