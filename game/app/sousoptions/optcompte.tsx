import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppRegistry } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';

import { FontAwesomeWrapper } from '@/components/FontAwesomeWrapper';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { faCaretUp } from '@fortawesome/free-solid-svg-icons';
import { Input } from '@rneui/themed';

const element = () => (
    <View>
      <FontAwesomeWrapper icon={faCaretDown} />
      <FontAwesomeWrapper icon={faCaretUp} />
    </View>
);

interface CompteParamProps {
    title: string;
    children: React.ReactNode;
}
   const CompteParam: React.FC<CompteParamProps> = ({ title, children }) => {
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
  const CompteContainer = () => {
    const { langIndex, setLanguage } = useLanguageStore();

    const handleLanguageChange = async (value: number) => {
       await setLanguage(value);
    };

    return (
        <View>
            <CompteParam title={motTraduit(langIndex, 20)}>
                <Text>{motTraduit(langIndex, 46)} :</Text>
                <Text>{motTraduit(langIndex, 25)} :</Text>
                <View style={styles.radioContainer}>
                    <TouchableOpacity 
                        style={styles.radioOption} 
                        onPress={() => handleLanguageChange(0)}
                    >
                        <View style={[styles.radio, langIndex === 0 && styles.radioSelected]} />
                        <Text>{motTraduit(langIndex, 26)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.radioOption} 
                        onPress={() => handleLanguageChange(1)}
                    >
                        <View style={[styles.radio, langIndex === 1 && styles.radioSelected]} />
                        <Text>{motTraduit(langIndex, 27)}</Text>
                    </TouchableOpacity>
                </View>
            </CompteParam>
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
 radioContainer: {
  marginTop: 10,
},
radioOption: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 8,
},
radio: {
  height: 20,
  width: 20,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: '#000',
  marginRight: 10,
},
radioSelected: {
  backgroundColor: '#000',
},
});

export default CompteContainer;

AppRegistry.registerComponent('KILLSPY', () => element);