import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import { normalizeIp, localIpConfig } from '@/utils/ipUtils';
import generateFalImageEdit from '@/services/generateFalImageEdit';
import { saveUserActivity } from '@/utils/gcloud/saveUserActivity';
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
  editPrompt: string | undefined,
  imageUrl: string | undefined
): Promise<{
  result: string;
  credits: number;
  error?: boolean;
  statusCode?: number;
  editedImageId?: string;
}> {
  const localizedIpAddress = localIpConfig(userIp);
  const normalizedIpAddress = normalizeIp(localIpConfig(userIp));
  let userResponse = {
    result: '',
    credits: -1000,
    error: false,
    statusCode: 200,
    editedImageId: undefined as string | undefined
  };

  type ImageEditApiResult = {
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
    '+++++++++++++++++++++++++++++ Get User Credits - processUserImageEditRequest.ts +++++++++++++++++++++++++++++'
  );
  console.log('User ID: ' + userId);
  console.log('User IP: ' + userIp);

  if (userResponse.credits === -1000) {
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

  // Calculate the credit cost for image editing
  const creditCost = 6; // Image editing cost

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

  // Deduct credits BEFORE processing the image edit
  // This ensures credits are always deducted regardless of the processing path
  const originalCredits = userResponse.credits;
  userResponse.credits = userResponse.credits > 0 ? userResponse.credits - creditCost : 0;
  console.log('Credits before edit:', originalCredits);
  console.log('Credits after edit:', userResponse.credits);
  console.log('Credit cost:', creditCost);
  
  // Update user credits in database immediately
  await updateUserCredits(
    userId,
    normalizeIp(localIpConfig(userIp)),
    userResponse.credits
  );
  console.log('User credits updated in database');

  let imageEditResult;
  let requestId;
  try {
    if (process.env.TEST_MODE && process.env.TEST_MODE === 'true') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      userResponse.result =
        'https://storage.googleapis.com/gen-image-storage/test-edited-image.jpg';
      userResponse.error = false;
    } else {
      // Validate inputs before passing to callImageEditApi
      if (!editPrompt) {
        throw new Error('Edit prompt is required');
      }

      if (!imageUrl) {
        throw new Error('Image URL is required');
      }

      imageEditResult = (await generateFalImageEdit(
        imageUrl,
        editPrompt
      )) as any;

      // Check for completed or queued webhook response and save it
      if (imageEditResult) {
        console.log('*****************************');
        console.log('Image edit result:', imageEditResult);
        console.log('*****************************');

        let isCompleted = false;
        let completedImageUrl = '';

        // Check if the result is already completed
        if (
          imageEditResult.response &&
          imageEditResult.response.status === 'COMPLETED' &&
          imageEditResult.response.url
        ) {
          isCompleted = true;
          completedImageUrl = imageEditResult.response.url;
          console.log(
            'Image edit completed immediately with URL:',
            completedImageUrl
          );
        }

        if (imageEditResult.webhook) {
          const webhook = imageEditResult.webhook;
          console.log('Webhook: ', webhook);

          // First check for response.request_id structure
          if (imageEditResult.response && imageEditResult.response.request_id) {
            requestId = imageEditResult.response.request_id;
          }
          // Check if result itself is the response with a request_id
          else if (imageEditResult.request_id) {
            requestId = imageEditResult.request_id;
          }
          // For other response structures, try to extract request_id
          else if (typeof imageEditResult === 'object') {
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

            requestId = findRequestId(imageEditResult);
          }

          // Final fallback if nothing found
          if (!requestId) {
            requestId = `manual-edit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            console.log('Generated fallback request ID:', requestId);
          }

          console.log('Request ID:', requestId);

          // If the image is already completed, we need to handle it differently
          if (isCompleted) {
            // Save the completed image edit using data integrity logic
            console.log('Saving completed image edit result immediately with data integrity');
            console.log('Original image URL (AssetSource):', imageUrl);
            console.log('New edited image URL:', completedImageUrl);

            // First, save a queue record that will be marked as processed
            const queueActivityResponse = await saveUserActivity({
              id: undefined,
              AssetSource: imageUrl,
              AssetType: 'que', // Queue record that will be marked as processed
              CountedAssetPreviousState: originalCredits,
              CountedAssetState: userResponse.credits,
              CreatedAssetUrl: requestId, // Use requestId for queue record
              DateTime: new Date().toISOString(),
              Prompt: editPrompt ? editPrompt : '',
              SubscriptionTier: 0,
              UserId: userId,
              UserIp: localizedIpAddress
            });

            // Then save the actual completed edited image as a new record
            const completedActivityResponse = await saveUserActivity({
              id: undefined,
              AssetSource: imageUrl, // Keep reference to original image
              AssetType: 'img', // Mark as completed image
              CountedAssetPreviousState: originalCredits,
              CountedAssetState: userResponse.credits,
              CreatedAssetUrl: completedImageUrl, // New edited image URL
              DateTime: new Date().toISOString(), // New timestamp for edited image
              Prompt: editPrompt ? editPrompt : '', // Keep the edit prompt
              SubscriptionTier: 0, // Start with default gallery setting
              UserId: userId,
              UserIp: localizedIpAddress
            });

            // Mark the queue record as processed (requires direct datastore access)
            try {
              const queueKey = datastore.key({
                namespace: 'GenTube',
                path: ['UserActivity', datastore.int(Number(queueActivityResponse))]
              });
              
              const transaction = datastore.transaction();
              await transaction.run();
              const [queueActivity] = await transaction.get(queueKey);
              
              if (queueActivity) {
                queueActivity.AssetType = 'processed'; // Mark as processed
                transaction.save({
                  key: queueKey,
                  data: queueActivity
                });
                await transaction.commit();
                console.log('Queue record marked as processed for immediate completion');
              } else {
                await transaction.rollback();
              }
            } catch (error) {
              console.error('Error marking queue record as processed:', error);
            }

            console.log(
              'Completed image edit saved with ID:',
              completedActivityResponse
            );
            userResponse.result = 'Completed';
            userResponse.editedImageId = completedActivityResponse; // Return the saved activity ID
            return userResponse;
          }
        } else {
          // Create a deterministic but unique ID if no webhook structure
          requestId = `no-webhook-edit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          console.log('No webhook found, generated request ID:', requestId);
        }
      } else {
        console.log('No image edit result returned from API call');
        // Create a fallback ID for tracking purposes
        requestId = `fallback-edit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        console.log('Generated fallback request ID:', requestId);
      }
    }

    // Credits have already been deducted and updated at the beginning
    // No need to update again here

    // Ensure we have a request ID
    if (!requestId || requestId.trim() === '') {
      console.log('Warning: Empty request ID, generating fallback ID');
      requestId = `missing-edit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }

    console.log('Saving activity with requestId:', requestId);

    const activityResponse = await saveUserActivity({
      id: undefined,
      AssetSource: imageUrl,
      AssetType: 'que',
      CountedAssetPreviousState: originalCredits,
      CountedAssetState: userResponse.credits,
      CreatedAssetUrl: requestId, // Should be populated at this point
      DateTime: new Date().toISOString(),
      Prompt: editPrompt ? editPrompt : '',
      SubscriptionTier: 0,
      UserId: userId,
      UserIp: localizedIpAddress
    });

    console.log('Activity saved with ID:', activityResponse);
    console.log('Image Edit Data saved: ', activityResponse);

    userResponse.error = false;
    userResponse.result = 'InQueue';
    return userResponse;
  } catch (error) {
    // If there's an error, refund the credits since the edit failed
    console.log('Error occurred during image edit, refunding credits');
    userResponse.credits = originalCredits; // Restore original credits
    
    // Update user credits in database to refund
    await updateUserCredits(
      userId,
      normalizeIp(localIpConfig(userIp)),
      userResponse.credits
    );
    console.log('Credits refunded due to error');
    
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
