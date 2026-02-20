import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { GRAY, STATIC, BORDER_WIDTH, SEMANTIC } from '../../../ui/alf';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';

interface AdminHeaderProps {
  title: string;
  showBack?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  rightColor?: string;
  onRightPress?: () => void;
}

const adminHeaderBorderStyle = { borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0 };
const adminHeaderBackButtonStyle = { width: 40 };
const adminHeaderRightButtonStyle = { width: 40, alignItems: 'flex-end' as const };

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
      style={adminHeaderBorderStyle}
    >
      {showBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={adminHeaderBackButtonStyle}>
          <Ionicons name="arrow-back" size={24} color={STATIC.black} />
        </TouchableOpacity>
      ) : (
        <Box w={40} />
      )}
      <Text size="lg" weight="bold" color={STATIC.black}>{title}</Text>
      {rightIcon && onRightPress ? (
        <TouchableOpacity onPress={onRightPress} style={adminHeaderRightButtonStyle}>
          <Ionicons name={rightIcon} size={24} color={rightColor} />
        </TouchableOpacity>
      ) : (
        <Box w={40} />
      )}
    </Box>
  );
};

export default AdminHeader;
