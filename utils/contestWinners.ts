interface ContestWinner {
  id: string;
  month: string;
  year: number;
  title: string;
  message: string;
}

/**
 * Map of contest winner IDs to their metadata
 * Used to determine if a specific image is a contest winner
 */
export const contestWinners: Record<string, ContestWinner> = {
  // June 2025 winner
  '5195468044763136': {
    id: '5195468044763136',
    month: 'June',
    year: 2025,
    title: 'June 2025 Contest Winner',
    message: 'This image won the June 2025 creation contest.'
  }
  // Add additional contest winners as needed
};

/**
 * Checks if an asset ID is a contest winner
 * @param id The asset ID to check
 * @returns The winner metadata if it's a winner, null otherwise
 */
export function isContestWinner(id: string): ContestWinner | null {
  return contestWinners[id] || null;
}