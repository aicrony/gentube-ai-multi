// services/socialMedia/twitterService.ts
import axios from 'axios';

interface TwitterPostParams {
  text: string;
  imageUrl?: string;
  bearerToken: string;
  apiKey: string;
  apiKeySecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

/**
 * Posts content to Twitter (X) using Twitter API v2
 * Uses OAuth 1.0a for authentication
 */
export const postToTwitter = async ({
  text,
  imageUrl,
  bearerToken,
  apiKey,
  apiKeySecret,
  accessToken,
  accessTokenSecret
}: TwitterPostParams): Promise<{
  success: boolean;
  tweetId?: string;
  error?: string;
}> => {
  try {
    // Twitter API v2 endpoint
    const url = 'https://api.twitter.com/2/tweets';
    let mediaId;

    // If we have an image, upload it first
    if (imageUrl) {
      // Step 1: Initialize upload
      const mediaUrl = 'https://upload.twitter.com/1.1/media/upload.json';

      // For production, you would first download the image, then upload as form data
      // This is simplified for the example
      const mediaResponse = await axios.post(
        mediaUrl,
        { media_data: imageUrl }, // In production: read file & convert to base64
        {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      mediaId = mediaResponse.data.media_id_string;
    }

    // Step 2: Post the tweet
    const tweetData: { text: string; media?: { media_ids: string[] } } = {
      text: text.substring(0, 280) // Twitter has a 280 character limit
    };

    if (mediaId) {
      tweetData.media = {
        media_ids: [mediaId]
      };
    }

    const response = await axios.post(url, tweetData, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      tweetId: response.data.data.id
    };
  } catch (error: any) {
    console.error('Twitter API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to post to Twitter'
    };
  }
};
