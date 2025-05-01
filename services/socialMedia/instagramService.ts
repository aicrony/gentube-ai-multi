// services/socialMedia/instagramService.ts
import axios from 'axios';

interface InstagramPostParams {
  caption: string;
  imageUrl: string; // Instagram requires image or video
  accessToken: string;
  instagramAccountId: string;
}

/**
 * Posts content to Instagram
 * Requires Facebook Graph API and Instagram Business Account permissions
 * Requires: instagram_basic, instagram_content_publish, and pages_read_engagement permissions
 */
export const postToInstagram = async ({
  caption,
  imageUrl,
  accessToken,
  instagramAccountId
}: InstagramPostParams): Promise<{ success: boolean; postId?: string; error?: string }> => {
  try {
    const apiVersion = 'v17.0';
    
    // Step 1: Create a media container (Instagram API requires a two-step process)
    const containerUrl = `https://graph.facebook.com/${apiVersion}/${instagramAccountId}/media`;
    const containerResponse = await axios.post(containerUrl, {
      image_url: imageUrl,
      caption: caption,
      access_token: accessToken
    });
    
    const creationId = containerResponse.data.id;
    
    // Step 2: Publish the media container
    const publishUrl = `https://graph.facebook.com/${apiVersion}/${instagramAccountId}/media_publish`;
    const publishResponse = await axios.post(publishUrl, {
      creation_id: creationId,
      access_token: accessToken
    });
    
    return {
      success: true,
      postId: publishResponse.data.id
    };
  } catch (error: any) {
    console.error('Instagram API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || 'Failed to post to Instagram'
    };
  }
};