import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { normalizeIp, localIpConfig } from '@/utils/ipUtils';
import { saveUserActivity } from '@/utils/gcloud/saveUserActivity';
import generateFalImageEdit from '@/services/generateFalImageEdit';
require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const kind = 'UserCredits';
const namespace = 'GenTube';
const defaultCredits = process.env.FREE_CREDITS_VALUE;

export async function processUserImageEditRequest(
  userId: string | string[] | undefined,
  userIp: string | string[],
  editPrompt: string,
  imageUrl: string
): Promise<{
  result: string;
  credits: number;
  error: boolean;
  statusCode: number;
}> {
  const localizedIpAddress = localIpConfig(userIp);
  const normalizedIpAddress = normalizeIp(localIpConfig(userIp));
  let userResponse = {
    result: '',
    credits: -1000,
    error: false,
    statusCode: 200
  };

  // Determine the key to use for lookup - now requiring userId
  let lookupKey;
  if (userId && userId !== 'none') {
    console.log('Key lookup by UserId');
    lookupKey = datastore.key({
      namespace,
      path: [kind, `${[kind, userId]}`]
    });
  } else {
    console.log('Invalid userId - user must be signed in');
    userResponse.result = 'Please sign in for free credits.';
    userResponse.statusCode = 430;
    userResponse.error = true;
    return userResponse;
  }

  // Fetch user data directly by key
  try {
    const [userEntity] = await datastore.get(lookupKey);
    userResponse.credits = userEntity ? userEntity.Credits : defaultCredits;
    console.log('getUserCredits response: ', userResponse.credits);
  } catch (error) {
    console.log('Error fetching user data: ', error);
    userResponse.credits = parseInt(process.env.FREE_CREDITS_VALUE || '0', 10);
  }

  console.log(
    '+++++++++++++++++++++++++++++ Get User Credits - processUserImageEditRequest.ts +++++++++++++++++++++++++++++'
  );
  console.log('User ID: ' + userId);
  console.log('User IP: ' + userIp);

  if (userResponse.credits === -1000) {
    userResponse.result = 'CreateAccount';
  }

  console.log('Check credit count: ', userResponse.credits);

  // Check if user has enough credits for image editing (costs 10 credits)
  if (userResponse.credits === undefined || userResponse.credits < 10) {
    userResponse.result = 'LimitExceeded';
  }

  if (userResponse.result == 'CreateAccount') {
    userResponse.error = true;
    return userResponse;
  } else if (userResponse.result == 'LimitExceeded') {
    userResponse.error = true;
    return userResponse;
  }

  let imageResult;
  let requestId;
  // Initialize these variables at the top level of the function
  let isCompletedImmediately = false;
  let completedImageUrl = '';

  try {
    let creditCost = 10; // Image editing costs more than regular image generation

    if (process.env.TEST_MODE && process.env.TEST_MODE === 'true') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      userResponse.result =
        'https://storage.googleapis.com/gen-image-storage/9f6c23a0-d623-4b5c-8cc8-3b35013576f3.png';
    } else {
      // Variables already initialized above

      // Call the image edit service using Kontext API
      imageResult = (await generateFalImageEdit(imageUrl, editPrompt)) as any;

      // Check response from the image edit service
      if (imageResult) {
        console.log('Image edit result:', imageResult);

        // Get the request ID from the response
        if (imageResult.response && imageResult.response.request_id) {
          requestId = imageResult.response.request_id;
          console.log('Using request ID for image edit:', requestId);

          // Check if we have a completed result already
          if (
            imageResult.response.status === 'COMPLETED' &&
            imageResult.response.url
          ) {
            isCompletedImmediately = true;
            completedImageUrl = imageResult.response.url;
            console.log(
              'Received completed image immediately:',
              completedImageUrl
            );
          }
        } else {
          // Fallback if no request ID is provided
          requestId = `fallback-${Date.now()}`;
          console.log('Using fallback request ID:', requestId);
        }
      }
    }

    // We should never reach this code if credits are insufficient
    // But as an extra safety check, only deduct credits if sufficient
    if (userResponse.credits !== undefined && userResponse.credits >= creditCost) {
      userResponse.credits -= creditCost;
    } else {
      // This is a safety fallback - we should have already returned with an error
      userResponse.result = 'LimitExceeded';
      userResponse.error = true;
      return userResponse;
    }
    console.log('UPDATED User Credits: ', userResponse.credits);
    await updateUserCredits(
      userId,
      normalizeIp(localIpConfig(userIp)),
      userResponse.credits
    );

    // Data save - if we have a completed result, save it directly
    const activityResponse = await saveUserActivity({
      id: undefined,
      AssetSource: imageUrl, // Store the original image URL as the source
      AssetType: isCompletedImmediately ? 'img' : 'que', // Use 'img' if completed, otherwise 'que'
      CountedAssetPreviousState: creditCost,
      CountedAssetState: userResponse.credits,
      CreatedAssetUrl: isCompletedImmediately ? completedImageUrl : requestId, // Use the image URL if completed
      DateTime: new Date().toISOString(),
      Prompt: editPrompt ? editPrompt : '',
      SubscriptionTier: 0,
      UserId: userId,
      UserIp: localizedIpAddress
    });

    console.log('Image Edit Data saved: ', activityResponse);

    userResponse.error = false;

    // Return different result based on whether we got a completed image immediately
    if (isCompletedImmediately && completedImageUrl) {
      userResponse.result = completedImageUrl; // Return the image URL directly
      console.log('Returning completed image URL directly:', completedImageUrl);
    } else {
      userResponse.result = 'InQueue';
      console.log('Image edit request queued for processing');
    }

    return userResponse;
  } catch (error) {
    if (error instanceof Error) {
      userResponse.error = true;
      userResponse.result = error.message;
      return userResponse;
    } else {
      userResponse.error = true;
      userResponse.result = 'An unknown error occurred';
      return userResponse;
    }
  }
}

export async function updateUserCredits(
  userId: string | string[] | undefined,
  userIp: string | string[],
  credits: number
): Promise<void> {
  console.log(
    '+++++++++++++++++++++++++++++ Update User Credits - processUserImageEditRequest.ts +++++++++++++++++++++++++++++'
  );
  console.log('UserId: ', userId);
  console.log('UserIp: ', userIp);
  const localizedIpAddress = localIpConfig(userIp);
  console.log('NormalizedIpAddress: ', localizedIpAddress);

  // Only allow userId-based lookups
  if (!userId || userId === 'none') {
    console.log('Cannot update credits: User ID is required');
    return;
  }

  const keyValue = [kind, userId];
  console.log('KeyValue: ', keyValue);
  const key = datastore.key({
    namespace,
    path: [kind, `${keyValue}`]
  });

  const entity = {
    key,
    data: {
      UserId: userId,
      UserIp: localizedIpAddress,
      Credits: credits
    }
  };

  await datastore.save(entity);
}
