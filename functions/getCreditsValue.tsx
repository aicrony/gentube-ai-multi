export function getCreditsValue(purchaseTotal: number = 0) {
  let purchasedCredits: number = 0;

  if (purchaseTotal === 700) {
    purchasedCredits = 500;
  } else if (purchaseTotal === 1400) {
    purchasedCredits = 1000;
  } else if (purchaseTotal === 2100) {
    purchasedCredits = 1500;
  } else if (purchaseTotal === 4200) {
    purchasedCredits = 3000;
  } else if (purchaseTotal === 14000) {
    purchasedCredits = 10000;
  } else {
    purchasedCredits = Math.round(purchaseTotal * 0.71428571);
  }

  return purchasedCredits;
}
