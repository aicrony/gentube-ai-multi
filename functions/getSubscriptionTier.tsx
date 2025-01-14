export function getSubscriptionTier(): {
  initialCredits: number;
} {
  let initialCredits: number = 0;

  initialCredits = 120; // Free tier limit

  return {
    initialCredits
  };
}
