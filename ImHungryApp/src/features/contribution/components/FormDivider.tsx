/**
 * FormDivider - Thin divider line for forms
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Box } from '../../../components/atoms';

export const FormDivider: React.FC = () => {
  return (
    <Box 
      height={StyleSheet.hairlineWidth} 
      backgroundColor="border" 
      marginVertical="s1"
      style={{ backgroundColor: '#C1C1C1' }}
    />
  );
};
