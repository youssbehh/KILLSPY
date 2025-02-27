import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from '@rneui/themed';

interface AlertModalProps {
    visible: boolean;
    text1: string; // Message à afficher dans le modal
    text2?: string;
    text3?: string;
    button1: string; // Titre du premier bouton
    onPress1: () => void; // Fonction à appeler pour le premier bouton
    button1Style?: object;
    disabled1?: boolean;
    button2?: string; // Titre du deuxième bouton (optionnel)
    onPress2?: () => void; // Fonction à appeler pour le deuxième bouton (optionnel)
    button2Style?: object;
    error1Button?: string;
    onPressError1?: () => void;
    buttonError1Style?: object;
    disabledError1?: boolean;
}

const AlertModal: React.FC<AlertModalProps> = ({
    visible,
    text1,
    text2,
    text3,
    button1,
    onPress1,
    button1Style,
    disabled1,
    button2,
    onPress2,
    button2Style,
    error1Button,
    onPressError1,
    buttonError1Style,
    disabledError1
}) => {
    return (
        <Modal visible={visible} transparent>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>{text1}</Text>
                    {text2 && (
                        <Text style={styles.titleopt}>{text2}</Text>
                    )}
                    {text3 && (
                        <Text style={styles.titleopt}>{text3}</Text>
                    )}
                    {error1Button && onPressError1 && (
                        <Button color='error' style={[styles.button, buttonError1Style]} onPress={disabledError1 ? () => {} :onPressError1} disabled={disabledError1}>{error1Button}</Button>
                    )}
                        <Button style={[styles.button, button1Style]} onPress={disabled1 ? () => {} : onPress1} disabled={disabled1}>{button1}</Button>
                    {button2 && onPress2 && (
                        <Button style={[styles.button, button2Style]} onPress={onPress2}>{button2}</Button>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        width: 300,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
    },
    title: {
        padding: 5,
        fontSize: 18,
        fontWeight: 'bold',
    },
    titleopt: {
        padding: 5,
        fontSize: 18,
    },
    button: {
        padding: 10,
    },
    closeButton: {
        padding: 10,
        backgroundColor: 'gray',
        borderRadius: 5,
        marginTop: 10,
    },
});

export default AlertModal;