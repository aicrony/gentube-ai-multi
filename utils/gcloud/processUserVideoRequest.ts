import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { normalizeIp, localIpConfig } from '@/utils/ipUtils';
import callVideoApi from '@/services/generateFalVideo';
import { saveUserActivity } from '@/utils/gcloud/saveUserActivity';
require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const kind = 'UserCredits';
const namespace = 'GenTube';
const defaultCredits = process.env.FREE_CREDITS_VALUE;

export async function processUserVideoRequest(
  userId: string | string[] | undefined,
  userIp: string | string[],
  videoPrompt: string | undefined,
  imageUrl: string | undefined,
  duration?: string | undefined,
  aspectRatio?: string | undefined,
  loop?: string | undefined,
  motion?: string | undefined
): Promise<{
  result: string;
  credits: number;
  error?: boolean;
  statusCode?: number;
}> {
  const localizedIpAddress = localIpConfig(userIp);
  const normalizedIpAddress = normalizeIp(localIpConfig(userIp));
  let userResponse = {
    result: '',
    credits: -1000,
    error: false,
    statusCode: 200
  };
  type VideoApiResult = {
    error?: {
      code: number;
      message: string;
    };
    url?: string;
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
    '+++++++++++++++++++++++++++++ Get User Credits - processUserVideoRequest.ts +++++++++++++++++++++++++++++'
  );
  console.log('User ID: ' + userId);
  console.log('User IP: ' + userIp);

  // return response;

  if (userResponse.credits === -1000) {
    // const initialCredits = 10;
    // console.log('Set Initial Credits: ', initialCredits);
    // await updateUserCredits(userId, userIp, initialCredits);
    userResponse.result = 'CreateAccount';
  }

  console.log('Check credit count: ', userResponse.credits);

  if (userResponse.credits <= 0) {
    console.log('Credit limit exceeded - User has 0 or negative credits');
    userResponse.result = 'LimitExceeded';
    userResponse.error = true;
    userResponse.statusCode = 429; // Too Many Requests
    return userResponse;
  }

  if (userResponse.result == 'CreateAccount') {
    userResponse.error = true;
    return userResponse;
  }

  // Calculate the credit cost before making any API calls
  let creditCost = 100;
  if (duration == '10') {
    creditCost = 100;
  } else if (duration == '5') {
    creditCost = 50;
  } else {
    creditCost = 500;
  }

  // Check if user has enough credits for this specific operation
  if (userResponse.credits < creditCost) {
    console.log(
      `Credit limit exceeded - User has ${userResponse.credits} credits but needs ${creditCost}`
    );
    userResponse.result = 'LimitExceeded';
    userResponse.error = true;
    userResponse.statusCode = 429; // Too Many Requests
    return userResponse;
  }

  let videoResult;
  let requestId;
  try {
    let result: string | VideoApiResult;
    if (process.env.TEST_MODE && process.env.TEST_MODE === 'true') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      userResponse.result =
        'https://storage.googleapis.com/gen-video-storage/9f6c23a0-d623-4b5c-8cc8-3b35013576f3-fake.mp4';
      userResponse.error = false;
    } else {
      // Pass all the parameters to callVideoApi
      const loopParam = loop === 'true';

      // Validate inputs before passing to callVideoApi
      if (!videoPrompt) {
        throw new Error('Video prompt is required');
      }

      // If imageUrl is undefined but expected, provide a fallback value
      const validatedImageUrl = imageUrl || 'none';

      videoResult = (await callVideoApi(
        validatedImageUrl,
        videoPrompt,
        loopParam,
        duration,
        aspectRatio,
        motion
      )) as any;
      // Check for queued webhook response and save it
      if (videoResult) {
        console.log('*****************************');
        console.log('Video result:', videoResult);
        console.log('*****************************');
        if (videoResult.webhook) {
          const webhook = videoResult.webhook;
          console.log('Webhook: ', webhook);

          // First check for response.request_id structure
          if (videoResult.response && videoResult.response.request_id) {
            requestId = videoResult.response.request_id;
          }
          // Check if result itself is the response with a request_id
          else if (videoResult.request_id) {
            requestId = videoResult.request_id;
          }
          // For other response structures, try to extract request_id
          else if (typeof videoResult === 'object') {
            // Try to find request_id in any nested object
            const findRequestId = (obj: any): string => {
              if (!obj || typeof obj !== 'object') return '';

              // Direct property check
              if (obj.request_id) return obj.request_id;

              // Check in response property
              if (obj.response && obj.response.request_id)
                return obj.response.request_id;

              // Check other common patterns
              if (obj.data && obj.data.request_id) return obj.data.request_id;

              // Recursively check nested properties
              for (const key in obj) {
                if (typeof obj[key] === 'object') {
                  const found = findRequestId(obj[key]);
                  if (found) return found;
                }
              }

              return '';
            };

            requestId = findRequestId(videoResult);
          }

          // Final fallback if nothing found
          if (!requestId) {
            requestId = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            console.log('Generated fallback request ID:', requestId);
          }

          console.log('Request ID:', requestId);
        } else {
          // Create a deterministic but unique ID if no webhook structure
          requestId = `no-webhook-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          console.log('No webhook found, generated request ID:', requestId);
        }
      } else {
        console.log('No video result returned from API call');
        // Create a fallback ID for tracking purposes
        requestId = `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        console.log('Generated fallback request ID:', requestId);
      }
      // userResponse.result =
      //   videoResult && videoResult.url ? videoResult.url : '';
    }

    // We already calculated the credit cost above, so we don't need to do it again here

    // console.log('****** IMAGE RESULT: ********');
    // console.log(JSON.stringify(userResponse.result));
    // if (userResponse.result === '') {
    //   userResponse.error = true;
    //   userResponse.result = 'Error. Please refine your prompt.';
    // }

    // Update user credits
    userResponse.credits && userResponse.credits > 0
      ? (userResponse.credits -= creditCost)
      : 0;
    console.log('UPDATED User Credits: ', userResponse.credits);
    await updateUserCredits(
      userId,
      normalizeIp(localIpConfig(userIp)),
      userResponse.credits
    );

    // Ensure we have a request ID
    if (!requestId || requestId.trim() === '') {
      console.log('Warning: Empty request ID, generating fallback ID');
      requestId = `missing-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }

    console.log('Saving activity with requestId:', requestId);

    const activityResponse = await saveUserActivity({
      id: undefined,
      AssetSource: imageUrl,
      AssetType: 'que',
      CountedAssetPreviousState: creditCost,
      CountedAssetState: userResponse.credits,
      CreatedAssetUrl: requestId, // Should be populated at this point
      DateTime: new Date().toISOString(),
      Prompt: videoPrompt ? videoPrompt : '',
      SubscriptionTier: 0 /**/,
      UserId: userId,
      UserIp: localizedIpAddress
    });

    console.log('Activity saved with ID:', activityResponse);

    console.log('Video Data saved: ', activityResponse);

    userResponse.error = false;
    userResponse.result = 'InQueue';
    return userResponse;
  } catch (error) {
    if (error instanceof Error) {
      // res.status(500).json({ error: error.message });
      userResponse.error = true;
      userResponse.result = error.message;
      return userResponse;
    } else {
      // res.status(500).json({ error: 'An unknown error occurred' });
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
    '+++++++++++++++++++++++++++++ Update User Credits - processUserVideoRequest.ts +++++++++++++++++++++++++++++'
  );
  const normalizedIpAddress = normalizeIp(localIpConfig(userIp));
  console.log('UserId: ', userId);
  console.log('UserIp: ', userIp);
  console.log('NormalizedIpAddress: ', normalizedIpAddress);

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
      UserIp: normalizedIpAddress,
      Credits: credits
    }
  };

  await datastore.save(entity);
}
