import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppRegistry } from 'react-native';
import { motTraduit } from '@/components/translationHelper';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { faCaretUp } from '@fortawesome/free-solid-svg-icons';

const element = () => (
    <View>
      <FontAwesomeIcon icon={faCaretDown} />
      <FontAwesomeIcon icon={faCaretUp} />
    </View>
);

interface SecuriteParamProps {
    title: string;
    children: React.ReactNode;
}
const SecuriteParam: React.FC<SecuriteParamProps> = ({ title, children }) => {
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
const SecuriteContainer = () => {
    const [langIndex, setLangIndex] = useState(0);
 return (
   <View>
     <SecuriteParam title={motTraduit(langIndex, 21)}>
       <Text>Contenu de l'élément 1</Text>
     </SecuriteParam>
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

export default SecuriteContainer;

AppRegistry.registerComponent('KILLSPY', () => element);