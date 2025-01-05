export function getSubscriptionTier(
  productName: string | string[] | undefined,
  subscriptionStatus: string | string[] | undefined
): {
  currentSubscriber: boolean;
  subscriptionTier: number;
  initialCredits: number;
} {
  let currentSubscriber: boolean = false;
  let subscriptionTier: number = 0;
  let initialCredits: number = 0;

  if (productName === '"Image Creator"' && subscriptionStatus === '"active"') {
    initialCredits = 500; // Subscription limit - count monthly
    currentSubscriber = true;
    subscriptionTier = 1;
  } else if (
    productName === '"Video Creator"' &&
    subscriptionStatus === '"active"'
  ) {
    initialCredits = 1000; // Subscription limit - count monthly
    currentSubscriber = true;
    subscriptionTier = 2;
  } else if (
    productName === '"HQ Video Creator"' &&
    subscriptionStatus === '"active"'
  ) {
    initialCredits = 1500; // Subscription limit - count monthly
    currentSubscriber = true;
    subscriptionTier = 3;
  } else {
    initialCredits = 50; // Free tier limit
    currentSubscriber = false;
    subscriptionTier = 0;
  }

  return {
    currentSubscriber,
    subscriptionTier,
    initialCredits
  };
}
