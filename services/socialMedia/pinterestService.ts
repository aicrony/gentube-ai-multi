// services/socialMedia/pinterestService.ts
import axios from 'axios';

interface PinterestPostParams {
  title: string;
  description: string;
  imageUrl: string; // Pinterest requires an image
  link?: string;
  accessToken: string;
  boardId: string;
}

/**
 * Posts a pin to Pinterest
 * Requires Pinterest API and OAuth 2.0 permissions
 * Requires: pins:write, boards:read scopes
 */
export const postToPinterest = async ({
  title,
  description,
  imageUrl,
  link,
  accessToken,
  boardId
}: PinterestPostParams): Promise<{
  success: boolean;
  pinId?: string;
  error?: string;
}> => {
  try {
    // Pinterest API v5 endpoint
    const url = 'https://api.pinterest.com/v5/pins';

    // Prepare pin data
    const pinData = {
      board_id: boardId,
      title: title,
      description: description,
      media_source: {
        source_type: 'image_url',
        url: imageUrl
      },
      alt_text: title, // For accessibility
      link: link // Optional link when clicked
    };

    const response = await axios.post(url, pinData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      pinId: response.data.id
    };
  } catch (error: any) {
    console.error(
      'Pinterest API error:',
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to post to Pinterest'
    };
  }
};
