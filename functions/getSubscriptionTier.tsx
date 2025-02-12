export function getSubscriptionTier(): {
  initialCredits: number;
} {
  let initialCredits: number = 0;

  initialCredits = 10; // Free tier limit

  return {
    initialCredits
  };
}
