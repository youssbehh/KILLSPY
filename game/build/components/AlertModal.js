import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
const AlertModal = ({ visible, text1, text2, button1, onPress1, button1Style, disabled1, button2, onPress2, }) => {
    return (<Modal visible={visible} transparent>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>{text1}</Text>
                    {text2 && (<Text style={styles.titleopt}>{text2}</Text>)}
                    <TouchableOpacity style={[styles.button, button1Style]} onPress={disabled1 ? () => { } : onPress1} disabled={disabled1}>
                        <Text style={styles.buttonText}>{button1}</Text>
                    </TouchableOpacity>
                    {button2 && onPress2 && (<TouchableOpacity style={styles.button} onPress={onPress2}>
                            <Text style={styles.buttonText}>{button2}</Text>
                        </TouchableOpacity>)}
                </View>
            </View>
        </Modal>);
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
        backgroundColor: '#007bff',
        borderRadius: 5,
        marginVertical: 5,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
    },
    closeButton: {
        padding: 10,
        backgroundColor: 'gray',
        borderRadius: 5,
        marginTop: 10,
    },
});
export default AlertModal;
