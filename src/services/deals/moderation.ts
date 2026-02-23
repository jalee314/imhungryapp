/**
 * @file Deal content moderation
 * Content moderation utilities for deal creation and updates
 */

import { supabase } from '../../../lib/supabase';

/**
 * Check deal content (title and description) for profanity
 * Uses Supabase Edge Function for profanity detection
 */
export const checkDealContentForProfanity = async (
  title: string,
  description?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: titleData, error: titleError } = await supabase.functions.invoke('catch-profanity', {
      body: { text: title }
    });

    if (titleError) {
      return { success: true };
    }

    if (!titleData?.isClean) {
      return {
        success: false,
        error: 'Just because you\'re hungry doesn\'t mean you can use offensive language. Please edit your post to remove it.'
      };
    }

    if (description && description.trim()) {
      const { data: descData, error: descError } = await supabase.functions.invoke('catch-profanity', {
        body: { text: description }
      });

      if (descError) {
        return { success: true };
      }

      if (!descData?.isClean) {
        return {
          success: false,
          error: 'Just because you\'re hungry doesn\'t mean you can use offensive language. Please edit your post to remove it.'
        };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: true };
  }
};
