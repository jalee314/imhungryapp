import { supabase } from '../../lib/supabase';
import { Deal } from '#/components/cards/DealCard';

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
            ),
            user!inner(
              display_name,
              profile_photo_metadata_id,
              image_metadata!profile_photo_metadata_id(
                variants
              )
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching deals with users:', error);
        return [];
      }

      // Transform the data to match your Deal interface
      const deals: Deal[] = data.map((deal: any) => {
        const user = deal.deal_template.user;
        const variants = user?.image_metadata?.variants as any;
        const photoUrl = variants?.thumbnail || null;

        return {
          id: deal.deal_id.toString(),
          title: deal.deal_template.title,
          restaurant: deal.deal_template.restaurant.name,
          details: deal.deal_template.description || '',
          image: deal.deal_template.image_url || require('../../img/default-rest.png'),
          votes: 0, // You'll need to fetch this separately
          isUpvoted: false,
          isDownvoted: false,
          isFavorited: false,
          timeAgo: '1h ago', // You'll need to calculate this
          author: user?.display_name || 'Anonymous',
          milesAway: '2mi', // You'll need to calculate this
          uploaderUserId: deal.deal_template.user_id, // This is the key field!
          userProfilePhoto: photoUrl,
          userDisplayName: user?.display_name || 'Anonymous',
        };
      });

      return deals;
    } catch (error) {
      console.error('Error in getDealsWithUsers:', error);
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
            ),
            user!inner(
              display_name,
              profile_photo_metadata_id,
              image_metadata!profile_photo_metadata_id(
                variants
              )
            )
          )
        `)
        .eq('deal_id', dealId)
        .single();

      if (error) {
        console.error('Error fetching deal with user:', error);
        return null;
      }

      const user = data.deal_template.user;
      const variants = user?.image_metadata?.variants as any;
      const photoUrl = variants?.thumbnail || null;

      return {
        id: data.deal_id.toString(),
        title: data.deal_template.title,
        restaurant: data.deal_template.restaurant.name,
        details: data.deal_template.description || '',
        image: data.deal_template.image_url || require('../../img/default-rest.png'),
        votes: 0,
        isUpvoted: false,
        isDownvoted: false,
        isFavorited: false,
        timeAgo: '1h ago',
        author: user?.display_name || 'Anonymous',
        milesAway: '2mi',
        uploaderUserId: data.deal_template.user_id,
        userProfilePhoto: photoUrl,
        userDisplayName: user?.display_name || 'Anonymous',
      };
    } catch (error) {
      console.error('Error in getDealWithUser:', error);
      return null;
    }
  }
};
