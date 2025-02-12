import { render } from '@testing-library/react-native';
import { Text, View, useThemeColor } from '../Themed'; 
import Colors from '@/constants/Colors';

// Mock de useColorScheme
jest.mock('../useColorScheme', () => ({
  useColorScheme: jest.fn(),
}));

import { useColorScheme } from '../useColorScheme';

describe('useThemeColor', () => {
  it('utilise la couleur du thème clair si définie', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');
    const color = useThemeColor({ light: 'red', dark: 'blue' }, 'text');
    
    expect(color).toBe('red');
  });

  it('utilise la couleur du thème sombre si définie', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');
    const color = useThemeColor({ light: 'red', dark: 'blue' }, 'text');
    
    expect(color).toBe('blue');
  });

  it('utilise la couleur par défaut si aucune couleur n’est spécifiée', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');
    const color = useThemeColor({}, 'text');
    
    expect(color).toBe(Colors.light.text);
  });
});

describe('Text Component', () => {
  it('rend le texte avec la bonne couleur', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');
    const { getByText } = render(<Text>Test</Text>);
    
    const textElement = getByText('Test');
    expect(textElement.props.style[0].color).toBe(Colors.light.text);
  });

  it('crée un snapshot du composant Text', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');
    const tree = render(<Text>Snapshot Test</Text>).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

describe('View Component', () => {
  it('rend la vue avec la bonne couleur de fond', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');
    const { getByTestId } = render(<View testID="view" />);
    
    const viewElement = getByTestId('view');
    expect(viewElement.props.style[0].backgroundColor).toBe(Colors.dark.background);
  });

  it('crée un snapshot du composant View', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');
    const tree = render(
      <View>
        <Text>Inside View</Text>
      </View>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
