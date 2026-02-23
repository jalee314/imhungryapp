import React from 'react';
import { ActivityIndicator, SafeAreaView } from 'react-native';

import { BRAND, GRAY } from '../../../ui/alf';
import { Box } from '../../../ui/primitives/Box';

const AdminLoadingState: React.FC = () => (
  <SafeAreaView style={{ flex: 1, backgroundColor: GRAY[100] }}>
    <Box flex={1} center>
      <ActivityIndicator size="large" color={BRAND.accent} />
    </Box>
  </SafeAreaView>
);

export default AdminLoadingState;
