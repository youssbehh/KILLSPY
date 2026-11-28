import React, { useEffect, useState } from 'react';
import AlertModal from '@/components/AlertModal';
import { useT } from '@/src/i18n';

/** Seconds before "I accept" unlocks: the notice has to be on screen long enough to be read. */
export const CONSENT_DELAY_SECS = 5;

interface ConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onRefuse: () => void;
}

/**
 * Privacy notice (RGPD). Shown before an account or a guest profile is created;
 * the server refuses both without the explicit acceptance it leads to.
 */
export const ConsentModal: React.FC<ConsentModalProps> = ({ visible, onAccept, onRefuse }) => {
  const t = useT();
  const [countdown, setCountdown] = useState(CONSENT_DELAY_SECS);

  useEffect(() => {
    if (visible) setCountdown(CONSENT_DELAY_SECS);
  }, [visible]);

  useEffect(() => {
    if (!visible || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [visible, countdown]);

  const locked = countdown > 0;

  return (
    <AlertModal
      visible={visible}
      text1={t('rgpdIntro')}
      text2={t('rgpdData')}
      text3={t('rgpdUsage')}
      error1Button={locked ? `${countdown}…` : t('iAccept')}
      onPressError1={() => {
        if (!locked) onAccept();
      }}
      disabledError1={locked}
      button1={t('iRefuse')}
      onPress1={onRefuse}
    />
  );
};
