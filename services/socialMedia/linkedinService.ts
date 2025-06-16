// services/socialMedia/linkedinService.ts
import axios from 'axios';

interface LinkedInPostParams {
  text: string;
  imageUrl?: string;
  accessToken: string;
  organizationId?: string;
}

/**
 * Posts content to LinkedIn
 * Requires LinkedIn API and OAuth 2.0 permissions
 * Requires: w_member_social or w_organization_social scopes
 */
export const postToLinkedIn = async ({
  text,
  imageUrl,
  accessToken,
  organizationId
}: LinkedInPostParams): Promise<{
  success: boolean;
  postId?: string;
  error?: string;
}> => {
  try {
    // LinkedIn API endpoints
    const baseUrl = 'https://api.linkedin.com/v2';
    const authorId = organizationId
      ? `urn:li:organization:${organizationId}`
      : 'urn:li:person:{person_id}';

    // Prepare the base post content
    const postContent: {
      author: string;
      lifecycleState: string;
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: string };
          shareMediaCategory: string;
          media?: Array<{
            status: string;
            description: { text: string };
            media: string;
          }>;
        };
      };
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': string;
      };
    } = {
      author: authorId,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text
          },
          shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    // If we have an image, upload it first
    if (imageUrl) {
      // Step 1: Register the image for upload
      const registerResponse = await axios.post(
        `${baseUrl}/assets?action=registerUpload`,
        {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: authorId,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }
            ]
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const uploadUrl =
        registerResponse.data.value.uploadMechanism[
          'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
        ].uploadUrl;
      const asset = registerResponse.data.value.asset;

      // Step 2: Upload the image
      // In a real implementation, you would fetch the image and upload it as binary data
      await axios.put(uploadUrl, imageUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'image/jpeg'
        }
      });

      // Add the image to the post content
      postContent.specificContent[
        'com.linkedin.ugc.ShareContent'
      ].shareMediaCategory = 'IMAGE';
      // Initialize media array if it doesn't exist
      postContent.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          description: {
            text: text.substring(0, 200) // LinkedIn has a character limit for media descriptions
          },
          media: asset
        }
      ];
    }

    // Step 3: Create the post
    const postResponse = await axios.post(`${baseUrl}/ugcPosts`, postContent, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    return {
      success: true,
      postId: postResponse.data.id
    };
  } catch (error: any) {
    console.error('LinkedIn API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to post to LinkedIn'
    };
  }
};
