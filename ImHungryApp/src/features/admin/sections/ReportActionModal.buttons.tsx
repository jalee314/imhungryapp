import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import {
  STATIC,
  OPACITY,
} from '../../../ui/alf';
import { Text } from '../../../ui/primitives/Text';

import { styles } from './ReportActionModal.styles';

export interface ActionButtonProps {
  label: string;
  bg: string;
  borderColor: string;
  textColor: string;
  loading: boolean;
  loaderColor: string;
  disabled: boolean;
  onPress: () => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  bg,
  borderColor,
  textColor,
  loading,
  loaderColor,
  disabled,
  onPress,
}) => {
  const stateStyle = {
    borderColor,
    backgroundColor: bg,
    opacity: disabled ? OPACITY.disabled : OPACITY.full,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.actionButtonBase, stateStyle]}
    >
      {loading ? (
        <ActivityIndicator color={loaderColor} />
      ) : (
        <Text size="sm" weight="semibold" color={textColor}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

export interface EnforcementButtonProps {
  icon: React.ReactNode;
  label: string;
  bg: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EnforcementButton: React.FC<EnforcementButtonProps> = ({
  icon,
  label,
  bg,
  loading,
  disabled,
  onPress,
  style: extraStyle,
}) => {
  const stateStyle = {
    backgroundColor: bg,
    opacity: disabled ? OPACITY.disabled : OPACITY.full,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.enforcementButtonBase, stateStyle, extraStyle]}
    >
      {loading ? (
        <ActivityIndicator color={STATIC.white} />
      ) : (
        <>
          {icon}
          <Text size="sm" weight="semibold" color={STATIC.white}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
