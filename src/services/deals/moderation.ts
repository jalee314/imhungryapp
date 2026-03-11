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
    const PROFANITY_ERROR =
      'Just because you\'re hungry doesn\'t mean you can use offensive language. Please edit your post to remove it.';

    // Check title and description in parallel — they are independent
    const hasDescription = Boolean(description && description.trim());
    const checks = [
      supabase.functions.invoke('catch-profanity', { body: { text: title } }),
      ...(hasDescription
        ? [supabase.functions.invoke('catch-profanity', { body: { text: description } })]
        : []),
    ];

    const results = await Promise.all(checks);

    const [titleResult, descResult] = results;

    // If edge function errors, allow the content (fail-open)
    if (!titleResult.error && !titleResult.data?.isClean) {
      return { success: false, error: PROFANITY_ERROR };
    }

    if (descResult && !descResult.error && !descResult.data?.isClean) {
      return { success: false, error: PROFANITY_ERROR };
    }

    return { success: true };
  } catch (error) {
    return { success: true };
  }
};
