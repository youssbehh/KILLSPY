import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform } from 'react-native';
export function ExternalLink(props) {
    return (<Link target="_blank" {...props} 
    // @ts-ignore
    href={props.href} onPress={(e) => {
            if (Platform.OS !== 'web') {
                // Prevent the default behavior of linking to the default browser on native.
                e.preventDefault();
                // Open the link in an in-app browser.
                WebBrowser.openBrowserAsync(props.href);
            }
        }}/>);
}
