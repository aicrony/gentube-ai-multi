import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { normalizeIp, localIpConfig } from '@/utils/ipUtils';
import callImageApi from '@/services/generateFalImage';
import { saveUserActivity } from '@/utils/gcloud/saveUserActivity';
require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const kind = 'UserCredits';
const namespace = 'GenTube';
const defaultCredits = process.env.NEXT_PUBLIC_FREE_CREDITS_VALUE;

export async function processUserImageRequest(
  userId: string | string[] | undefined,
  userIp: string | string[],
  imagePrompt: string | undefined
): Promise<{ result: string; credits: number }> {
  const localizedIpAddress = localIpConfig(userIp);
  const normalizedIpAddress = normalizeIp(localIpConfig(userIp));
  let userResponse = {
    result: '',
    credits: -1000,
    error: false,
    statusCode: 200
  };
  type ImageApiResult = {
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
    userResponse.credits = parseInt(
      process.env.NEXT_PUBLIC_FREE_CREDITS_VALUE || '0',
      10
    );
  }

  console.log(
    '+++++++++++++++++++++++++++++ Get User Credits - processUserImageRequest.ts +++++++++++++++++++++++++++++'
  );
  console.log('User ID: ' + userId);
  console.log('User IP: ' + userIp);

  // return response;

  if (userResponse.credits === -1000) {
    userResponse.result = 'CreateAccount';
  }

  console.log('Check credit count: ', userResponse.credits);

  if (userResponse.credits && userResponse.credits <= 0) {
    userResponse.result = 'LimitExceeded';
  }

  if (userResponse.result == 'CreateAccount') {
    userResponse.error = true;
    return userResponse;
  } else if (userResponse.result == 'LimitExceeded') {
    userResponse.error = true;
    return userResponse;
  }

  // Define credit cost at the beginning
  const creditCost = 6;
  
  // Check if user has enough credits BEFORE making any API calls
  if (userResponse.credits <= 0 || userResponse.credits < creditCost) {
    console.log(`Credit limit exceeded - User has ${userResponse.credits} credits but needs ${creditCost}`);
    userResponse.result = 'LimitExceeded';
    userResponse.error = true;
    userResponse.statusCode = 429; // Too Many Requests
    return userResponse;
  }
  
  // Deduct credits BEFORE making the API call
  const previousCredits = userResponse.credits;
  userResponse.credits -= creditCost;
  console.log('Deducting credits at beginning of request. Previous:', previousCredits, 'New:', userResponse.credits);
  
  // Update user credits in database IMMEDIATELY
  await updateUserCredits(
    userId,
    normalizeIp(localIpConfig(userIp)),
    userResponse.credits
  );
  
  let imageResult;
  let requestId;
  try {
    let result: string | ImageApiResult;
    if (process.env.TEST_MODE && process.env.TEST_MODE === 'true') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      userResponse.result =
        'https://storage.googleapis.com/gen-image-storage/9f6c23a0-d623-4b5c-8cc8-3b35013576f3.png';
    } else {
      imageResult = (await callImageApi('none', imagePrompt)) as any;
      // Check for queued webhook response and save it
      if (imageResult) {
        console.log(imageResult);
        if (imageResult.webhook) {
          const webhook = imageResult.webhook;
          console.log('Webhook: ', webhook);
          requestId = imageResult.response.request_id;
          // Continue here
        } else {
          requestId = '';
        }
      }
      // userResponse.result =
      //   imageResult && imageResult.url ? imageResult.url : '';
    }
    
    // Credits have already been deducted and updated at the beginning
    console.log('Credits were already deducted at the beginning of the request');

    // Data save
    const activityResponse = await saveUserActivity({
      id: undefined,
      AssetSource: '',
      AssetType: 'que',
      CountedAssetPreviousState: previousCredits,
      CountedAssetState: userResponse.credits,
      CreatedAssetUrl: requestId,
      DateTime: new Date().toISOString(),
      Prompt: imagePrompt ? imagePrompt : '',
      SubscriptionTier: 0 /**/,
      UserId: userId,
      UserIp: localizedIpAddress
    });

    console.log('Image Data saved: ', activityResponse);

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
    '+++++++++++++++++++++++++++++ Update User Credits - processUserImageRequest.ts +++++++++++++++++++++++++++++'
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

export async function aggregateUserCredits(
  userId: string | string[] | undefined,
  userIp: string | string[] | undefined,
  credits: number
): Promise<void> {
  if (userId == undefined) {
    return;
  } else if (userId && userId.length > 0) {
    const query = datastore
      .createQuery(namespace, kind)
      .filter('UserId', '=', userId)
      .limit(1);
    const [existingCredits] = await datastore.runQuery(query);
    const currentCredits =
      existingCredits.length > 0 ? existingCredits[0].Credits : 0;
    const newCredits = currentCredits + credits;
    await updateUserCredits(userId, '-', newCredits);
  }
}

export async function newUserCredits(
  userId: string | string[] | undefined
): Promise<void> {
  if (userId == undefined) {
    return;
  } else if (userId && userId.length == 36) {
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
        Credits: defaultCredits
      }
    };
    const response = await datastore.save(entity);
    console.log('New User Credits response: ', JSON.stringify(response));
  }
}
