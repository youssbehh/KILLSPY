import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';
import { PrimaryButton } from '@/src/components/ks/PrimaryButton';
import { SecondaryButton } from '@/src/components/ks/SecondaryButton';
import { DangerButton } from '@/src/components/ks/DangerButton';

interface AlertModalProps {
  visible: boolean;
  /** Title, then up to two paragraphs. */
  text1: string;
  text2?: string;
  text3?: string;
  /** Main button. */
  button1: string;
  onPress1: () => void;
  button1Style?: StyleProp<ViewStyle>;
  disabled1?: boolean;
  /** Optional secondary button. */
  button2?: string;
  onPress2?: () => void;
  button2Style?: StyleProp<ViewStyle>;
  /** Optional red button, shown first (destructive or binding choice). */
  error1Button?: string;
  onPressError1?: () => void;
  buttonError1Style?: StyleProp<ViewStyle>;
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
  disabledError1,
}) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
    <View style={styles.overlay}>
      <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <Text style={styles.title} accessibilityRole="header">{text1}</Text>
          {!!text2 && <Text style={styles.paragraph}>{text2}</Text>}
          {!!text3 && <Text style={styles.paragraph}>{text3}</Text>}
        </ScrollView>
        <View style={styles.actions}>
          {!!error1Button && onPressError1 && (
            <DangerButton
              label={error1Button}
              onPress={onPressError1}
              disabled={disabledError1}
              style={buttonError1Style}
            />
          )}
          {error1Button ? (
            <SecondaryButton label={button1} onPress={onPress1} disabled={disabled1} style={button1Style} />
          ) : (
            <PrimaryButton label={button1} onPress={onPress1} disabled={disabled1} size="medium" style={button1Style} />
          )}
          {!!button2 && onPress2 && (
            <SecondaryButton label={button2} onPress={onPress2} style={button2Style} />
          )}
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    backgroundColor: KS.surface,
    borderWidth: 1,
    borderColor: KS.hair,
    padding: 20,
    gap: 16,
  },
  body: { flexGrow: 0 },
  bodyContent: { gap: 10 },
  title: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleMd,
    letterSpacing: 1,
  },
  paragraph: {
    color: KS.inkDim,
    fontFamily: TYPO.ui,
    fontSize: SIZES.body,
    lineHeight: SIZES.body * 1.4,
  },
  actions: { gap: 10 },
});

export default AlertModal;
