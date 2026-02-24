import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';

import { BRAND, GRAY, STATIC, SPACING, BORDER_WIDTH, SEMANTIC } from '../../../ui/alf';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';

interface AdminHeaderProps {
  title: string;
  showBack?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  rightColor?: string;
  onRightPress?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  showBack = false,
  rightIcon,
  rightColor = SEMANTIC.error,
  onRightPress,
}) => {
  const navigation = useNavigation();

  return (
    <Box
      row
      justify="space-between"
      px="lg"
      py="lg"
      bg={STATIC.white}
      borderWidth={BORDER_WIDTH.thin}
      borderColor={GRAY[300]}
      style={{ borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0 }}
    >
      {showBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Ionicons name="arrow-back" size={24} color={STATIC.black} />
        </TouchableOpacity>
      ) : (
        <Box w={40} />
      )}
      <Text size="lg" weight="bold" color={STATIC.black}>{title}</Text>
      {rightIcon && onRightPress ? (
        <TouchableOpacity onPress={onRightPress} style={{ width: 40, alignItems: 'flex-end' }}>
          <Ionicons name={rightIcon} size={24} color={rightColor} />
        </TouchableOpacity>
      ) : (
        <Box w={40} />
      )}
    </Box>
  );
};

export default AdminHeader;
