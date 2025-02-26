import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppRegistry } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';

import { FontAwesomeWrapper } from '@/components/FontAwesomeWrapper';
import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';

const element = () => (
    <View>
      <FontAwesomeWrapper icon={faCaretDown} />
      <FontAwesomeWrapper icon={faCaretUp} />
    </View>
);

interface DiversParamProps {
    title: string;
    children: React.ReactNode;
}
   const DiversParam: React.FC<DiversParamProps> = ({ title, children }) => {
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
const DiversContainer = () => {
    const { langIndex } = useLanguageStore();
 return (
   <View>
     <DiversParam title={motTraduit(langIndex, 22)}>
      <Text style={styles.title}>{motTraduit(langIndex, 69)}</Text>
     </DiversParam>
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
});

export default DiversContainer;

AppRegistry.registerComponent('KILLSPY', () => element);