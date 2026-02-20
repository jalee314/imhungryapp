import React from 'react';
import { ActivityIndicator, SafeAreaView } from 'react-native';

import { BRAND, GRAY } from '../../../ui/alf';
import { Box } from '../../../ui/primitives/Box';

const adminLoadingScreenStyle = { flex: 1, backgroundColor: GRAY[100] };

const AdminLoadingState: React.FC = () => (
  <SafeAreaView style={adminLoadingScreenStyle}>
    <Box flex={1} center>
      <ActivityIndicator size="large" color={BRAND.accent} />
    </Box>
  </SafeAreaView>
);

export default AdminLoadingState;
