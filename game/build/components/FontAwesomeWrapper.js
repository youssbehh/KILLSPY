import React from 'react';
import { Platform } from 'react-native';
import { FontAwesomeIcon as WebIcon } from '@fortawesome/react-fontawesome';
import { FontAwesomeIcon as NativeIcon } from '@fortawesome/react-native-fontawesome';
export const FontAwesomeWrapper = ({ icon, color, size }) => {
    if (Platform.OS === 'web') {
        return <WebIcon icon={icon} color={color} size={((size === null || size === void 0 ? void 0 : size.toString()) || 'lg')}/>;
    }
    return <NativeIcon icon={icon} color={color} size={typeof size === 'string' ? 30 : size}/>;
};
