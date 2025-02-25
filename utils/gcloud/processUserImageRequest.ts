import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { normalizeIp, localIpConfig } from '@/utils/ipUtils';
import callImageApi from '@/services/generateImage';
import { serialize } from 'cookie';
import { saveUserActivity } from '@/utils/gcloud/saveUserActivity';
require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const kind = 'UserCredits';
const namespace = 'GenTube';
const defaultCredits = 110;

export async function processUserImageRequest(
  userId: string | string[] | undefined,
  userIp: string | string[],
  imagePrompt: string | undefined
): Promise<{ result: string; credits: number }> {
  const normalizedIpAddress = normalizeIp(localIpConfig(userIp));
  let query;
  let userResponse = { result: '', credits: -1000, error: false };
  type ImageApiResult = {
    error?: {
      code: number;
      message: string;
    };
    url?: string;
  };
  if (userId != undefined && userId.length > 0) {
    console.log('Query 1');
    query = datastore
      .createQuery(namespace, kind)
      .filter('UserId', '=', userId)
      .limit(1);
  } else if (
    normalizedIpAddress != undefined &&
    normalizedIpAddress.length > 0 &&
    (userId == undefined || userId.length == 0)
  ) {
    console.log('Query 2');
    query = datastore
      .createQuery(namespace, kind)
      .filter('UserIp', '=', normalizedIpAddress)
      .limit(1);
  } else if (
    userId != undefined &&
    userId.length > 0 &&
    normalizedIpAddress != undefined &&
    normalizedIpAddress.length > 0
  ) {
    console.log('Query 3');
    query = datastore
      .createQuery(namespace, kind)
      .filter('UserId', '=', userId)
      .filter('UserIp', '=', normalizedIpAddress)
      .limit(1);
  } else {
    console.log('Invalid userId and normalizedIpAddress');
    return userResponse;
  }

  const [userData] = await datastore.runQuery(query);
  userResponse.credits = userData.length > 0 ? userData[0].Credits : null;
  console.log('getUserCredits response: ', userResponse.credits);

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

  let imageResult;
  try {
    let creditCost = 100;
    let result: string | ImageApiResult;
    if (process.env.TEST_MODE && process.env.TEST_MODE === 'true') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      userResponse.result =
        'https://storage.googleapis.com/gen-image-storage/9f6c23a0-d623-4b5c-8cc8-3b35013576f3.png';
    } else {
      imageResult = (await callImageApi('none', imagePrompt)) as ImageApiResult;
      userResponse.result =
        imageResult && imageResult.url ? imageResult.url : '';
    }
    creditCost = 4;
    console.log('****** IMAGE RESULT: ********');
    console.log(JSON.stringify(userResponse.result));
    if (userResponse.result === '') {
      userResponse.error = true;
      userResponse.result = 'Error. Please refine your prompt.';
    }

    // Update user credits
    userResponse.credits && userResponse.credits > 0
      ? (userResponse.credits -= creditCost)
      : 0;
    console.log('UPDATED User Credits: ', userResponse.credits);
    await updateUserCredits(userId, userIp, userResponse.credits);

    // Data save
    const activityResponse = await saveUserActivity({
      id: undefined,
      AssetSource: '',
      AssetType: 'img',
      CountedAssetPreviousState: creditCost,
      CountedAssetState: userResponse.credits,
      CreatedAssetUrl: userResponse.result,
      DateTime: new Date().toISOString(),
      Prompt: imagePrompt ? imagePrompt : '',
      SubscriptionTier: 0 /**/,
      UserId: userId,
      UserIp: userIp
    });

    console.log('Image Data saved: ', activityResponse);
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
    '+++++++++++++++++++++++++++++ Update User Credits +++++++++++++++++++++++++++++'
  );
  console.log('UserId: ', userId);
  console.log('UserIp: ', userIp);
  const normalizedIpAddress = normalizeIp(localIpConfig(userIp));
  console.log('NormalizedIpAddress: ', normalizedIpAddress);

  const keyValue = [kind, userId ? userId : normalizedIpAddress];
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
