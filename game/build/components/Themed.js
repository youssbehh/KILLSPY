/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { Text as DefaultText, View as DefaultView } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
export function useThemeColor(props, colorName) {
    var _a;
    const theme = (_a = useColorScheme()) !== null && _a !== void 0 ? _a : 'light';
    const colorFromProps = props[theme];
    if (colorFromProps) {
        return colorFromProps;
    }
    else {
        return Colors[theme][colorName];
    }
}
export function Text(props) {
    const { style, lightColor, darkColor } = props, otherProps = __rest(props, ["style", "lightColor", "darkColor"]);
    const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
    return <DefaultText style={[{ color }, style]} {...otherProps}/>;
}
export function View(props) {
    const { style, lightColor, darkColor } = props, otherProps = __rest(props, ["style", "lightColor", "darkColor"]);
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
    return <DefaultView style={[{ backgroundColor }, style]} {...otherProps}/>;
}
