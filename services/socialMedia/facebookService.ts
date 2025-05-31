// services/socialMedia/facebookService.ts
import axios from 'axios';

interface FacebookPostParams {
  message: string;
  imageUrl?: string;
  accessToken: string;
  pageId?: string;
}

/**
 * Posts content to a Facebook page or user timeline
 * Requires Facebook Graph API permissions: pages_manage_posts, publish_pages (for page posting)
 * or publish_to_groups (for personal timeline)
 */
export const postToFacebook = async ({
  message,
  imageUrl,
  accessToken,
  pageId
}: FacebookPostParams): Promise<{
  success: boolean;
  postId?: string;
  error?: string;
}> => {
  try {
    const targetId = pageId || 'me'; // Post to page if pageId is provided, otherwise post to user's timeline
    const apiVersion = 'v17.0'; // Use the appropriate Graph API version

    // For images, use the photos endpoint
    if (imageUrl) {
      // Determine if this is a remote URL or a local image path
      // For remote URLs, we can directly use the url parameter
      // For local paths, we would need to read the file and upload it as form data
      if (imageUrl.startsWith('http')) {
        const url = `https://graph.facebook.com/${apiVersion}/${targetId}/photos`;
        const response = await axios.post(url, {
          url: imageUrl, // External image URL
          message: message,
          access_token: accessToken,
          published: true
        });

        return {
          success: true,
          postId: response.data.id
        };
      } else {
        // For local files in production, use FormData to upload the file
        // This is just a placeholder - in a real implementation, you'd read the file
        // from the filesystem and attach it to the request
        return {
          success: false,
          error: 'Local file uploads not yet implemented for Facebook'
        };
      }
    } else {
      // Text-only post to feed
      const feedUrl = `https://graph.facebook.com/${apiVersion}/${targetId}/feed`;
      const response = await axios.post(feedUrl, {
        message: message,
        access_token: accessToken
      });

      return {
        success: true,
        postId: response.data.id
      };
    }
  } catch (error: any) {
    // Check for token expiration or other auth errors
    const errorCode = error.response?.data?.error?.code;
    const errorType = error.response?.data?.error?.type;

    if (
      errorCode === 190 || // Invalid OAuth token
      errorType === 'OAuthException' ||
      error.response?.status === 401
    ) {
      return {
        success: false,
        error:
          'Your Facebook authorization has expired. Please reconnect your account.'
      };
    }

    console.error('Facebook API error:', error.response?.data || error.message);
    return {
      success: false,
      error:
        error.response?.data?.error?.message || 'Failed to post to Facebook'
    };
  }
};
