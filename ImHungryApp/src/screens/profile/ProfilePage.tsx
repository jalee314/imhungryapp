import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../../../lib/supabase';

interface ProfilePageProps {
  route?: {
    params?: {
      email?: string;
    };
  };
}

interface UserProfile {
  display_name: string | null;
  profile_photo: string | null;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ route }) => {
  const email = route?.params?.email;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!email) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const { data, error } = await supabase
        .from('user') // Assuming your table is named 'user'
        .select('display_name, profile_photo')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else if (data) {
        setProfile(data);
        // If a profile photo path exists, get its public URL
        if (data.profile_photo) {
          const { data: urlData } = supabase.storage
            .from('avatars') // Your storage bucket name
            .getPublicUrl(data.profile_photo);
          
          setPhotoUrl(urlData.publicUrl);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [email]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FFA05C" />
      ) : (
        <>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <Text style={styles.title}>
            {profile?.display_name
              ? `${profile.display_name}, you are logged in`
              : 'Welcome! You are logged in.'}
          </Text>
        </>
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
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFA05C',
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
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