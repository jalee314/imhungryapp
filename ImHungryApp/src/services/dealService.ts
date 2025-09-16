import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { toByteArray } from 'base64-js';

// Get current user ID from Supabase auth
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Upload image to Supabase storage
const uploadDealImage = async (imageUri: string): Promise<string | null> => {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User not authenticated:', authError);
      return null;
    }
    
    console.log('Authenticated user:', user.id);

    const fileExt = imageUri.split('.').pop() || 'jpg';
    const fileName = `deal_${Date.now()}.${fileExt}`;
    
    console.log('Uploading file:', fileName);

    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const byteArray = toByteArray(base64);
    
    const { data, error } = await supabase.storage
      .from('deal-images') // Changed from 'deals' to 'deal-images'
      .upload(`public/${fileName}`, byteArray.buffer, {
        contentType: `image/${fileExt}`,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase storage error:', error.message);
      console.error('Error details:', error);
      return null;
    } else if (data) {
      console.log('Upload successful:', data.path);
      return data.path;
    }
    
    return null;
  } catch (error) {
    console.error('Error uploading deal image:', error);
    return null;
  }
};

// Helper function to safely parse and format dates
const parseDate = (dateString: string | null): string | null => {
  if (!dateString || dateString === 'Unknown') {
    return null;
  }

  try {
    // Handle different date formats
    let date: Date;
    
    // If it's already an ISO string
    if (dateString.includes('T') || dateString.includes('Z')) {
      date = new Date(dateString);
    }
    // If it's a date string like "2024-12-25" or "12/25/2024"
    else {
      date = new Date(dateString);
    }

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', dateString);
      return null;
    }

    return date.toISOString();
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return null;
  }
};

// Interface for creating a deal
export interface CreateDealData {
  title: string;
  description: string;
  imageUri: string | null;
  expirationDate: string | null;
  restaurantId: string;
  categoryId: string | null;
  cuisineId: string | null;
  isAnonymous: boolean;
}

// Create deal template and instance
export const createDeal = async (dealData: CreateDealData): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Creating deal with data:', {
      ...dealData,
      imageUri: dealData.imageUri ? 'Present' : 'None'
    });

    // Get current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'No authenticated user found' };
    }

    // Upload image if provided
    let imageUrl: string | null = null;
    if (dealData.imageUri) {
      imageUrl = await uploadDealImage(dealData.imageUri);
      if (!imageUrl) {
        return { success: false, error: 'Failed to upload image' };
      }
    }

    // Get restaurant's brand_id
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurant')
      .select('brand_id')
      .eq('restaurant_id', dealData.restaurantId)
      .single();

    if (restaurantError) {
      console.error('Error fetching restaurant:', restaurantError);
      return { success: false, error: 'Failed to fetch restaurant information' };
    }

    // Prepare deal template data
    const dealTemplateData = {
      brand_id: restaurant.brand_id,
      user_id: dealData.isAnonymous ? null : userId,
      title: dealData.title,
      description: dealData.description || null,
      image_url: imageUrl,
      category_id: dealData.categoryId,
      cuisine_id: dealData.cuisineId,
    };

    console.log('Inserting deal template:', dealTemplateData);

    // Insert deal template
    const { data: templateData, error: templateError } = await supabase
      .from('deal_template')
      .insert(dealTemplateData)
      .select('template_id')
      .single();

    if (templateError) {
      console.error('Error creating deal template:', templateError);
      return { success: false, error: 'Failed to create deal template' };
    }

    // Parse and validate the expiration date
    const parsedEndDate = parseDate(dealData.expirationDate);
    
    console.log('Parsed dates:', {
      original: dealData.expirationDate,
      parsed: parsedEndDate
    });

    // The database trigger will automatically create the deal_instance
    // But we can also create it manually to ensure it exists
    const dealInstanceData = {
      restaurant_id: dealData.restaurantId,
      template_id: templateData.template_id,
      start_date: new Date().toISOString(),
      end_date: parsedEndDate,
    };

    console.log('Inserting deal instance:', dealInstanceData);

    const { error: instanceError } = await supabase
      .from('deal_instance')
      .insert(dealInstanceData);

    if (instanceError) {
      console.error('Error creating deal instance:', instanceError);
      // Don't return error here as the trigger might have already created it
      console.log('Deal instance might have been created by trigger');
    }

    console.log('Deal created successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error creating deal:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};
