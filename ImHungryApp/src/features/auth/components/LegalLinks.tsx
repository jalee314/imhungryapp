/**
 * LegalLinks - Terms and Privacy links for auth screens
 */

import React from 'react';
import { TouchableOpacity, Linking } from 'react-native';
import { Box, Text } from '../../../components/atoms';

interface LegalLinksProps {
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
}

export const LegalLinks: React.FC<LegalLinksProps> = ({ 
  onTermsPress, 
  onPrivacyPress 
}) => {
  const handleTerms = () => {
    if (onTermsPress) {
      onTermsPress();
    } else {
      // Default: open terms URL
      Linking.openURL('https://example.com/terms');
    }
  };

  const handlePrivacy = () => {
    if (onPrivacyPress) {
      onPrivacyPress();
    } else {
      // Default: open privacy URL
      Linking.openURL('https://example.com/privacy');
    }
  };

  return (
    <Box alignItems="center" paddingTop="s4">
      <Text variant="caption" color="textMuted" textAlign="center">
        By continuing, you agree to our{' '}
      </Text>
      <Box flexDirection="row" justifyContent="center" flexWrap="wrap">
        <TouchableOpacity onPress={handleTerms}>
          <Text variant="caption" color="primary" style={{ textDecorationLine: 'underline' }}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <Text variant="caption" color="textMuted"> and </Text>
        <TouchableOpacity onPress={handlePrivacy}>
          <Text variant="caption" color="primary" style={{ textDecorationLine: 'underline' }}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </Box>
    </Box>
  );
};
