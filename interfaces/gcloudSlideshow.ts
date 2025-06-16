export interface SlideshowAsset {
  url: string; // URL to the asset (simplified)
  type: string; // Type of asset (img, vid)
}

export interface SlideshowSettings {
  interval: number; // Slideshow interval in ms
  direction: 'forward' | 'backward';
  infiniteLoop: boolean;
}

export interface GcloudSlideshow {
  id?: string | number; // Datastore assigned ID
  slideshowId: string; // Unique identifier for URL sharing
  userId: string; // User who created the slideshow
  assets: SlideshowAsset[]; // Simplified asset data for the slideshow
  assetIds?: string[]; // Legacy: Array of asset IDs (for backward compatibility)
  title?: string; // Optional title for the slideshow
  creationDate: string; // Creation timestamp
  settings?: SlideshowSettings; // Optional settings
}
