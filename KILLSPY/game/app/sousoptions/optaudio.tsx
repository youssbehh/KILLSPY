import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppRegistry } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { Slider } from '@rneui/themed';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';

const element = () => (
    <View>
      <FontAwesomeIcon icon={faCaretDown} />
      <FontAwesomeIcon icon={faCaretUp} />
    </View>
);

interface AudioParamProps {
    title: string;
    children: React.ReactNode;
}
const AudioParam: React.FC<AudioParamProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleAccordion = () => {
      setIsOpen(!isOpen);
    };
     return (
      <View style={styles.container}>
        <TouchableOpacity onPress={toggleAccordion} style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <FontAwesomeIcon icon={isOpen ? faCaretUp : faCaretDown} />
        </TouchableOpacity>
        {isOpen && <View style={styles.content}>{children}</View>}
      </View>
    );
};
const AudioContainer = () => {
    const [langIndex, setLangIndex] = useState(0);
    const [bgmVolume, setBgmVolume] = useState(10);
    const [sfxVolume, setSfxVolume] = useState(10);

 return (
   <View>
     <AudioParam title={motTraduit(langIndex, 19)}>
        <Text>{motTraduit(langIndex, 23)} : {bgmVolume}</Text>
            <Slider
                value={bgmVolume}
                onValueChange={setBgmVolume}
                minimumValue={0}
                maximumValue={10}
                step={1}
                minimumTrackTintColor="#3f3f3f"
                maximumTrackTintColor="#b3b3b3"
                style={styles.slider}
            />
            <Text>{motTraduit(langIndex, 24)} : {sfxVolume}</Text>
            <Slider
                value={sfxVolume}
                onValueChange={setSfxVolume}
                minimumValue={0}
                maximumValue={10}
                step={1}
                minimumTrackTintColor="#3f3f3f"
                maximumTrackTintColor="#b3b3b3"
                style={styles.slider}
            />
     </AudioParam>
   </View>
 );
};

const styles = StyleSheet.create({
 container: {
   marginBottom: 10,
   borderWidth: 1,
   borderColor: '#ccc',
   borderRadius: 5,
 },
 header: {
    flexDirection: 'row',
   justifyContent: 'space-between',
   padding: 10,
   backgroundColor: '#f1f1f1',
 },
 title: {
   fontSize: 16,
 },
 content: {
   padding: 10,
   backgroundColor: '#fff',
 },
 slider: {
    width: '100%',
    height: 40,
  },
});

export default AudioContainer;

AppRegistry.registerComponent('KILLSPY', () => element);