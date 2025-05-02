export function getCreditsValue(purchaseTotal: number = 0) {
  let purchasedCredits: number = 0;

  if (purchaseTotal === 700) {
    purchasedCredits = 400;
  } else if (purchaseTotal === 1900) {
    purchasedCredits = 1000;
  } else if (purchaseTotal === 4900) {
    purchasedCredits = 3000;
  } else if (purchaseTotal === 1000) {
    purchasedCredits = 500;
  } else if (purchaseTotal === 3000) {
    purchasedCredits = 1500;
  } else if (purchaseTotal === 6000) {
    purchasedCredits = 3000;
  } else {
    purchasedCredits = Math.round(purchaseTotal * 0.5);
  }

  return purchasedCredits;
}
