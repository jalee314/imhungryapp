import { supabase } from '../../lib/supabase';
import { Deal } from '../components/DealCard';

export const feedService = {
  // Fetch deals with uploader user information
  async getDealsWithUsers(): Promise<Deal[]> {
    try {
      const { data, error } = await supabase
        .from('deal_instance')
        .select(`
          deal_id,
          deal_template!inner(
            title,
            description,
            image_url,
            user_id,
            restaurant!inner(
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        return [];
      }

      // Transform the data to match your Deal interface
      const deals: Deal[] = data.map((deal: any) => ({
        id: deal.deal_id.toString(),
        title: deal.deal_template.title,
        restaurant: deal.deal_template.restaurant.name,
        details: deal.deal_template.description || '',
        image: deal.deal_template.image_url || require('../../img/albert.webp'),
        votes: 0, // You'll need to fetch this separately
        isUpvoted: false,
        isDownvoted: false,
        isFavorited: false,
        timeAgo: '1h ago', // You'll need to calculate this
        author: 'User', // You'll need to fetch the user's display name
        milesAway: '2mi', // You'll need to calculate this
        uploaderUserId: deal.deal_template.user_id, // This is the key field!
      }));

      return deals;
    } catch (error) {
      return [];
    }
  },

  // Fetch a single deal with user information
  async getDealWithUser(dealId: string): Promise<Deal | null> {
    try {
      const { data, error } = await supabase
        .from('deal_instance')
        .select(`
          deal_id,
          deal_template!inner(
            title,
            description,
            image_url,
            user_id,
            restaurant!inner(
              name
            )
          )
        `)
        .eq('deal_id', dealId)
        .single();

      if (error) {
        return null;
      }

      return {
        id: data.deal_id.toString(),
        title: data.deal_template.title,
        restaurant: data.deal_template.restaurant.name,
        details: data.deal_template.description || '',
        image: data.deal_template.image_url || require('../../img/albert.webp'),
        votes: 0,
        isUpvoted: false,
        isDownvoted: false,
        isFavorited: false,
        timeAgo: '1h ago',
        author: 'User',
        milesAway: '2mi',
        uploaderUserId: data.deal_template.user_id,
      };
    } catch (error) {
      return null;
    }
  }
};
