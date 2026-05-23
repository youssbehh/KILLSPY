import { Text as DefaultText, View as DefaultView } from 'react-native';
import { useTheme } from '@/src/stores/themeStore';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const theme = useTheme();
  const color = theme.statusBar === 'dark' ? (lightColor ?? theme.colors.text) : (darkColor ?? theme.colors.text);
  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const theme = useTheme();
  const backgroundColor = theme.statusBar === 'dark'
    ? (lightColor ?? theme.colors.background)
    : (darkColor ?? theme.colors.background);
  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
