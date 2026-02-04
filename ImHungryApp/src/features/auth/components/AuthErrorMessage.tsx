/**
 * AuthErrorMessage - Error message display for auth screens
 */

import React from 'react';
import { Box, Text } from '../../../components/atoms';

interface AuthErrorMessageProps {
  message: string | null;
}

export const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <Box
      backgroundColor="error"
      paddingVertical="s3"
      paddingHorizontal="s4"
      borderRadius="md"
      marginBottom="s3"
      style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)' }}
    >
      <Text variant="bodySmall" color="error" textAlign="center">
        {message}
      </Text>
    </Box>
  );
};
