import { supabase } from '../../lib/supabase';

export interface ProfileFormUpdate {
  fullName: string;
  username: string;
  email: string;
  city: string;
}

export const getCurrentUserId = async (): Promise<string> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user?.id) throw new Error('User not authenticated');
  return user.id;
};

export const updateCurrentUserProfile = async (form: ProfileFormUpdate): Promise<void> => {
  const userId = await getCurrentUserId();
  const nameParts = form.fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Update auth metadata and email
  const { error: authError } = await supabase.auth.updateUser({
    email: form.email,
    data: {
      first_name: firstName,
      last_name: lastName,
      full_name: form.fullName,
      username: form.username,
      location_city: form.city,
    },
  });
  if (authError) throw authError;

  // Update user table
  const { error: userError } = await supabase
    .from('user')
    .update({
      first_name: firstName,
      last_name: lastName,
      display_name: form.username,
      email: form.email,
      location_city: form.city,
    })
    .eq('user_id', userId);
  if (userError) throw userError;
};

export const fetchUserCuisines = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_cuisine_preference')
    .select('cuisine:cuisine_id ( cuisine_name )')
    .eq('user_id', userId);
  if (error) throw error;
  return (data || [])
    .map((item: any) => item.cuisine?.cuisine_name)
    .filter(Boolean);
};

export const fetchCurrentUserCuisines = async (): Promise<string[]> => {
  const userId = await getCurrentUserId();
  return fetchUserCuisines(userId);
};

export const saveUserCuisines = async (userId: string, cuisines: string[]): Promise<void> => {
  const { error: deleteError } = await supabase
    .from('user_cuisine_preference')
    .delete()
    .eq('user_id', userId);
  if (deleteError) throw deleteError;

  if (!cuisines.length) return;

  const { data: cuisineData, error: cuisineError } = await supabase
    .from('cuisine')
    .select('cuisine_id, cuisine_name')
    .in('cuisine_name', cuisines);
  if (cuisineError) throw cuisineError;

  const preferences = (cuisineData || []).map((c: any) => ({ user_id: userId, cuisine_id: c.cuisine_id }));
  const { error: insertError } = await supabase
    .from('user_cuisine_preference')
    .insert(preferences);
  if (insertError) throw insertError;
};
