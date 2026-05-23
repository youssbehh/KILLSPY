import { render } from '@testing-library/react-native';
import { Text, View } from '../Themed';
import { themes } from '@/src/theme/themes';
import { useThemeStore } from '@/src/stores/themeStore';

describe('Text Component', () => {
  it('utilise la couleur de texte du thème actif', () => {
    useThemeStore.setState({ themeId: 'futurUrbain' });
    const { getByText } = render(<Text>Test</Text>);

    const textElement = getByText('Test');
    expect(textElement.props.style[0].color).toBe(themes.futurUrbain.colors.text);
  });

  it('change de couleur quand le thème change', () => {
    useThemeStore.setState({ themeId: 'infiltrationNaturelle' });
    const { getByText } = render(<Text>Test</Text>);

    const textElement = getByText('Test');
    expect(textElement.props.style[0].color).toBe(themes.infiltrationNaturelle.colors.text);
  });

  it('crée un snapshot du composant Text', () => {
    useThemeStore.setState({ themeId: 'futurUrbain' });
    const tree = render(<Text>Snapshot Test</Text>).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

describe('View Component', () => {
  it('utilise la couleur de fond du thème actif', () => {
    useThemeStore.setState({ themeId: 'mystereNocturne' });
    const { getByTestId } = render(<View testID="view" />);

    const viewElement = getByTestId('view');
    expect(viewElement.props.style[0].backgroundColor).toBe(themes.mystereNocturne.colors.background);
  });

  it('crée un snapshot du composant View', () => {
    useThemeStore.setState({ themeId: 'futurUrbain' });
    const tree = render(
      <View>
        <Text>Inside View</Text>
      </View>,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
