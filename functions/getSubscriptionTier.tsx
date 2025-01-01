export function getSubscriptionTier(
  productName: string | string[] | undefined,
  subscriptionStatus: string | string[] | undefined
): {
  monthlySubscriber: boolean;
  subscriptionTier: number;
  maxRequestsPerMonth: number;
} {
  let monthlySubscriber: boolean = false;
  let subscriptionTier: number = 0;
  let maxRequestsPerMonth: number = 0;

  if (productName === '"Image Creator"' && subscriptionStatus === '"active"') {
    maxRequestsPerMonth = 200; // Subscription limit - count monthly
    monthlySubscriber = true;
    subscriptionTier = 1;
  } else if (
    productName === '"Video Creator"' &&
    subscriptionStatus === '"active"'
  ) {
    maxRequestsPerMonth = 200; // Subscription limit - count monthly
    monthlySubscriber = true;
    subscriptionTier = 2;
  } else if (
    productName === '"HQ Video Creator"' &&
    subscriptionStatus === '"active"'
  ) {
    maxRequestsPerMonth = 220; // Subscription limit - count monthly
    monthlySubscriber = true;
    subscriptionTier = 3;
  } else {
    subscriptionTier = 0;
  }

  return {
    monthlySubscriber,
    subscriptionTier,
    maxRequestsPerMonth
  };
}
