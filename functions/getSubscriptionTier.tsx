export function getSubscriptionTier(): {
  initialCredits: number;
} {
  let initialCredits: number = 0;

  initialCredits = 1; // Free tier limit

  return {
    initialCredits
  };
}
