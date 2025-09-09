import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../../../lib/supabase';

interface ProfilePageProps {
  route?: {
    params?: {
      email?: string;
    };
  };
}

const ProfilePage: React.FC<ProfilePageProps> = ({ route }) => {
  const email = route?.params?.email;
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!email) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('user')
        .select('display_name')
        .eq('email', email)
        .single();

      if (error) {
        setDisplayName(null);
      } else {
        setDisplayName(data?.display_name ?? null);
      }
      setLoading(false);
    };
    fetchDisplayName();
  }, [email]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FFA05C" />
      ) : (
        <Text style={styles.title}>
          {displayName
            ? `${displayName}, you are logged in`
            : 'User not found, you are logged in'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    margin: 16,
  },
});

export default ProfilePage;