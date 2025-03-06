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
const defaultCredits = 20;

export async function processUserVideoRequest(
  userId: string | string[] | undefined,
  userIp: string | string[],
  videoPrompt: string | undefined,
  imageUrl: string | undefined,
  duration?: string | undefined,
  aspectRatio?: string | undefined,
  loop?: string | undefined,
  motion?: string | undefined
): Promise<{ result: string; credits: number }> {
  const localizedIpAddress = localIpConfig(userIp);
  const normalizedIpAddress = normalizeIp(localIpConfig(userIp));
  let userResponse = { result: '', credits: -1000, error: false };
  type VideoApiResult = {
    error?: {
      code: number;
      message: string;
    };
    url?: string;
  };

  // Determine the key to use for lookup
  let lookupKey;
  if (userId && userId !== 'none') {
    console.log('Key lookup by UserId');
    lookupKey = datastore.key({
      namespace,
      path: [kind, `${[kind, userId]}`]
    });
  } else if (
    normalizedIpAddress != undefined &&
    normalizedIpAddress.length > 0
  ) {
    console.log('Key lookup by IP');
    lookupKey = datastore.key({
      namespace,
      path: [kind, `${[kind, normalizedIpAddress]}`]
    });
  } else {
    console.log('Invalid userId and normalizedIpAddress');
    return userResponse;
  }

  // Fetch user data directly by key
  try {
    const [userEntity] = await datastore.get(lookupKey);
    userResponse.credits = userEntity ? userEntity.Credits : defaultCredits;
    console.log('getUserCredits response: ', userResponse.credits);
  } catch (error) {
    console.log('Error fetching user data: ', error);
    userResponse.credits = defaultCredits;
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

  if (userResponse.credits && userResponse.credits <= 0) {
    // console.log('Credit limit exceeded');
    // res.status(429).json({
    //   error: 'Credit limit exceeded. Purchase credits on the PRICING page.'
    // });
    // return;
    userResponse.result = 'LimitExceeded';
  }

  if (userResponse.result == 'CreateAccount') {
    userResponse.error = true;
    return userResponse;
  } else if (userResponse.result == 'LimitExceeded') {
    userResponse.error = true;
    return userResponse;
  }

  let videoResult;
  let requestId;
  try {
    let creditCost = 100;
    let result: string | VideoApiResult;
    if (process.env.TEST_MODE && process.env.TEST_MODE === 'true') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      userResponse.result =
        'https://storage.googleapis.com/gen-video-storage/9f6c23a0-d623-4b5c-8cc8-3b35013576f3-fake.mp4';
      userResponse.error = false;
    } else {
      videoResult = (await callVideoApi(imageUrl, videoPrompt)) as any;
      // Check for queued webhook response and save it
      if (videoResult) {
        console.log(videoResult);
        if (videoResult.webhook) {
          const webhook = videoResult.webhook;
          console.log('Webhook: ', webhook);
          requestId = videoResult.response.request_id;
          // Continue here
        } else {
          requestId = '';
        }
      }
      // userResponse.result =
      //   videoResult && videoResult.url ? videoResult.url : '';
    }
    creditCost = 50;
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

    const activityResponse = await saveUserActivity({
      id: undefined,
      AssetSource: imageUrl,
      AssetType: 'que',
      CountedAssetPreviousState: creditCost,
      CountedAssetState: userResponse.credits,
      CreatedAssetUrl: requestId,
      DateTime: new Date().toISOString(),
      Prompt: videoPrompt ? videoPrompt : '',
      SubscriptionTier: 0 /**/,
      UserId: userId,
      UserIp: localizedIpAddress
    });

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

  const keyValue = [
    kind,
    userId && userId !== 'none' ? userId : normalizedIpAddress
  ];
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
