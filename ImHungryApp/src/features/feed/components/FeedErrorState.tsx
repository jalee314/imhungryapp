/**
 * FeedErrorState - Error state display for Feed screen
 */

import React from 'react';
import { Box, Text, Button } from '../../../components/atoms';

interface FeedErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const FeedErrorState: React.FC<FeedErrorStateProps> = ({ error, onRetry }) => {
  return (
    <Box 
      flex={1} 
      justifyContent="center" 
      alignItems="center" 
      paddingVertical="s6"
    >
      <Text 
        variant="body" 
        color="textSecondary" 
        textAlign="center" 
        marginBottom="s4"
      >
        {error}
      </Text>
      <Button 
        label="Retry" 
        onPress={onRetry} 
        variant="primary"
      />
    </Box>
  );
};
