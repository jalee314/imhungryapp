/**
 * DealFormRow - Reusable row component for deal creation/edit forms
 */

import React from 'react';
import { TouchableOpacity, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Box, Text } from '../../../components/atoms';
import { colors, spacing } from '../../../lib/theme';

interface DealFormRowProps {
  icon: string;
  iconFamily?: 'ionicons' | 'material-community';
  label: string;
  subLabel?: string;
  onPress?: () => void;
  showChevron?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  disabled?: boolean;
}

export const DealFormRow: React.FC<DealFormRowProps> = ({
  icon,
  iconFamily = 'ionicons',
  label,
  subLabel,
  onPress,
  showChevron = true,
  switchValue,
  onSwitchChange,
  disabled = false,
}) => {
  const IconComponent = iconFamily === 'material-community' ? MaterialCommunityIcons : Ionicons;
  
  const content = (
    <Box
      flexDirection="row"
      alignItems="center"
      paddingHorizontal="s4"
      paddingVertical="s1"
      minHeight={38}
      gap="s4"
    >
      <IconComponent name={icon as any} size={20} color="#606060" />
      <Box flex={1} justifyContent="center">
        <Text variant="bodySmall">{label}</Text>
        {subLabel && (
          <Text variant="caption" color="textMuted" marginTop="s0" numberOfLines={1}>
            {subLabel}
          </Text>
        )}
      </Box>
      {onSwitchChange !== undefined && switchValue !== undefined ? (
        <Switch
          trackColor={{ false: "#D2D5DA", true: colors.primary }}
          thumbColor="#FFFFFF"
          onValueChange={onSwitchChange}
          value={switchValue}
          disabled={disabled}
        />
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={12} color={colors.text} />
      ) : null}
    </Box>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};
