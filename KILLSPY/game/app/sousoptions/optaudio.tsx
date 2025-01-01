import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppRegistry, Pressable } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';
import { Slider } from '@rneui/themed';
import { FontAwesomeWrapper } from '@/components/FontAwesomeWrapper';
import { faCaretDown, faCaretUp, faVolumeHigh, faVolumeLow, faVolumeOff, faVolumeXmark } from '@fortawesome/free-solid-svg-icons';

const element = () => (
    <View>
      <FontAwesomeWrapper icon={faCaretDown} />
      <FontAwesomeWrapper icon={faCaretUp} />
      <FontAwesomeWrapper icon={faVolumeHigh} />
      <FontAwesomeWrapper icon={faVolumeLow} />
      <FontAwesomeWrapper icon={faVolumeOff} />
      <FontAwesomeWrapper icon={faVolumeXmark} />
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
          <FontAwesomeWrapper icon={isOpen ? faCaretUp : faCaretDown} />
        </TouchableOpacity>
        {isOpen && <View style={styles.content}>{children}</View>}
      </View>
    );
};

const AudioContainer = () => {
    const { langIndex } = useLanguageStore();
    const [bgmVolume, setBgmVolume] = useState(10);
    const [sfxVolume, setSfxVolume] = useState(10);
    const [lastBgmVolume, setLastBgmVolume] = useState(10);
    const [lastSfxVolume, setLastSfxVolume] = useState(10);

    const getVolumeIcon = (volume: number) => {
        if (volume === 0) return faVolumeXmark;
        if (volume <= 3) return faVolumeOff;
        if (volume <= 7) return faVolumeLow;
        return faVolumeHigh;
    };

    const setBgmSfxVolume = (choice: string) => {
        if (choice === 'bgm') {
            if (bgmVolume === 0) {
                setBgmVolume(lastBgmVolume);
            } else {
                setLastBgmVolume(bgmVolume);
                setBgmVolume(0);
            }
        } else if (choice === 'sfx') {
            if (sfxVolume === 0) {
                setSfxVolume(lastSfxVolume);
            } else {
                setLastSfxVolume(sfxVolume);
                setSfxVolume(0);
            }
        }
    };

    const handleBgmSliderChange = (value: number) => {
        setBgmVolume(value);
        if (value !== 0) setLastBgmVolume(value);
    };

    const handleSfxSliderChange = (value: number) => {
        setSfxVolume(value);
        if (value !== 0) setLastSfxVolume(value);
    };

    return (
        <View>
            <AudioParam title={motTraduit(langIndex, 19)}>
                <View style={styles.volumeContainer}>
                    <Pressable onPress={() => setBgmSfxVolume('bgm')}>
                        <FontAwesomeWrapper icon={getVolumeIcon(bgmVolume)} />
                    </Pressable>                   
                    <Text>{motTraduit(langIndex, 23)} : {bgmVolume}</Text>
                </View>
                <Slider
                    value={bgmVolume}
                    onValueChange={handleBgmSliderChange}
                    minimumValue={0}
                    maximumValue={10}
                    step={1}
                    allowTouchTrack
                    minimumTrackTintColor="#007AFF"
                    maximumTrackTintColor="#DDDDDD"
                    thumbTintColor="#007AFF"
                    style={styles.slider}
                    thumbProps={{
                        children: (
                            <View style={styles.thumbContainer}>
                                <FontAwesomeWrapper 
                                    icon={getVolumeIcon(bgmVolume)} 
                                    color="black"
                                />
                            </View>
                        ),
                    }}
                />
                <View style={styles.volumeContainer}>
                    <Pressable onPress={() => setBgmSfxVolume('sfx')}>
                        <FontAwesomeWrapper icon={getVolumeIcon(sfxVolume)} />
                    </Pressable>
                    <Text>{motTraduit(langIndex, 24)} : {sfxVolume}</Text>
                </View>
                <Slider
                    value={sfxVolume}
                    onValueChange={handleSfxSliderChange}
                    minimumValue={0}
                    maximumValue={10}
                    step={1}
                    allowTouchTrack
                    minimumTrackTintColor="#007AFF"
                    maximumTrackTintColor="#DDDDDD"
                    thumbTintColor="#007AFF"
                    style={styles.slider}
                    thumbProps={{
                        children: (
                            <View style={styles.thumbContainer}>
                                <FontAwesomeWrapper 
                                    icon={getVolumeIcon(sfxVolume)} 
                                    color="black"
                                />
                            </View>
                        ),
                    }}
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
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
},
thumbContainer: {
    borderRadius: 10,
    padding:10,
},
});

export default AudioContainer;

AppRegistry.registerComponent('KILLSPY', () => element);