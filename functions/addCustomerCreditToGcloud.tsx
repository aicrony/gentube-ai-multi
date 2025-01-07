import { Datastore } from '@google-cloud/datastore';
import { getCreditsValue } from '@/functions/getCreditsValue';
import { google_app_creds } from '@/interfaces/googleCredentials';
require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.project_id,
  credentials: google_app_creds
});

const USER_CREDITS_KIND = 'UserCredits';
const NAMESPACE = 'GenTube';

const addCustomerCreditToGcloud = async (uuid: string, amount: number) => {
  // Calculate purchased credits
  const purchasedCredits = getCreditsValue(amount);

  // Check if the customer exists in the UserCredits kind
  const userCreditsKey = datastore.key({
    namespace: NAMESPACE,
    path: [USER_CREDITS_KIND, uuid]
  });

  const [userCreditsEntity] = await datastore.get(userCreditsKey);

  if (userCreditsEntity) {
    // Customer exists, update the credits
    userCreditsEntity.Credits += purchasedCredits;
    await datastore.save({
      key: userCreditsKey,
      data: userCreditsEntity
    });
    console.log(`Updated credits for user [${uuid}]`);
  } else {
    // Customer does not exist, create a new entry
    const newUserCreditsEntity = {
      key: userCreditsKey,
      data: {
        Credits: purchasedCredits
      }
    };
    await datastore.save(newUserCreditsEntity);
    console.log(`Created new credits entry for user [${uuid}]`);
  }
  return uuid;
};

export { addCustomerCreditToGcloud };
