import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface LoadingOverlayProps {
  isLoading: boolean; // Définir le type de isLoading
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading }) => {
  if (!isLoading) return null; // Ne rien afficher si isLoading est faux

  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Assombrit l'arrière-plan
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Assurez-vous que l'overlay est au-dessus des autres éléments
  },
});

export default LoadingOverlay;