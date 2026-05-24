import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';
import { FontAwesomeWrapper } from '@/components/FontAwesomeWrapper';
import { faCaretDown, faCaretUp, faCheck, faPalette } from '@fortawesome/free-solid-svg-icons';
import { useBotStore } from '@/src/stores/botStore';
import { BotDifficulty } from '@/src/game/botAI';

interface DiversParamProps {
  title: string;
  children: React.ReactNode;
}

const DiversParam: React.FC<DiversParamProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setIsOpen(!isOpen)} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <FontAwesomeWrapper icon={isOpen ? faCaretUp : faCaretDown} />
      </TouchableOpacity>
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const BOT_DIFFICULTIES: { id: BotDifficulty; label: string; description: string }[] = [
  { id: 'easy', label: 'Facile', description: "Bot aléatoire — pour s'entraîner." },
  { id: 'medium', label: 'Moyen', description: 'Bot qui mémorise vos patterns.' },
  { id: 'hard', label: 'Difficile', description: 'Bot prédictif — il anticipe.' },
];

const DiversContainer = () => {
  const { langIndex } = useLanguageStore();
  const botDifficulty = useBotStore((s) => s.difficulty);
  const setBotDifficulty = useBotStore((s) => s.setDifficulty);

  return (
    <View>
      <DiversParam title={motTraduit(langIndex, 22)}>
        <View style={styles.themeHeader}>
          <FontAwesomeWrapper icon={faPalette} />
          <Text style={styles.themeHeaderText}>Thème graphique</Text>
        </View>
        <Text style={styles.hint}>
          Les thèmes sont des cosmétiques. Achète-les dans la boutique et équipe-les depuis ton inventaire.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.themeHeaderText}>Difficulté du bot</Text>
        {BOT_DIFFICULTIES.map((d) => (
          <Pressable
            key={d.id}
            onPress={() => setBotDifficulty(d.id)}
            style={[styles.diffRow, botDifficulty === d.id && styles.diffActive]}
          >
            <View style={styles.diffTexts}>
              <Text style={styles.diffLabel}>{d.label}</Text>
              <Text style={styles.diffDesc}>{d.description}</Text>
            </View>
            {botDifficulty === d.id ? <FontAwesomeWrapper icon={faCheck} /> : null}
          </Pressable>
        ))}
      </DiversParam>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#f1f1f1' },
  title: { fontSize: 16 },
  content: { padding: 10, backgroundColor: '#fff' },
  themeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  themeHeaderText: { fontSize: 14, fontWeight: '600' },
  hint: { fontSize: 12, color: '#666', fontStyle: 'italic', marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 16 },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  diffActive: { borderColor: '#007AFF', backgroundColor: '#f0f7ff' },
  diffTexts: { flex: 1 },
  diffLabel: { fontSize: 14, fontWeight: '600' },
  diffDesc: { fontSize: 12, color: '#666' },
});

export default DiversContainer;
