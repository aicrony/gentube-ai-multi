export function getSubscriptionTier(): {
  initialCredits: number;
} {
  let initialCredits: number = 0;

  initialCredits = 100; // Free tier limit

  return {
    initialCredits
  };
}
