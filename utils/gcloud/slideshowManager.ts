import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';
import {
  GcloudSlideshow,
  SlideshowAsset,
  SlideshowSettings
} from '@/interfaces/gcloudSlideshow';
import { v4 as uuidv4 } from 'uuid';
import { getUserAssets } from './userAssets';

require('dotenv').config();

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const SLIDESHOW_KIND = 'Slideshow';
const NAMESPACE = 'GenTube';

/**
 * Fetches simplified asset data from the UserActivity datastore
 */
async function fetchAssetData(
  userId: string,
  userIp: string,
  assetIds: string[]
): Promise<SlideshowAsset[]> {
  try {
    // Get all assets for the user
    const allAssets = await getUserAssets(userId, userIp, 100, 0);

    if (!allAssets) {
      return [];
    }

    // Filter to only include assets with IDs in the assetIds array and simplify the data
    const assets = allAssets
      .filter((asset) => asset.id && assetIds.includes(asset.id))
      .map((asset) => ({
        url: asset.CreatedAssetUrl,
        type: asset.AssetType === 'vid' ? 'vid' : 'img'
      }));

    console.log(`Fetched ${assets.length} assets for slideshow`);
    return assets;
  } catch (error) {
    console.error('Error fetching asset data:', error);
    return [];
  }
}

/**
 * Creates a new slideshow record in Datastore
 */
export async function createSlideshow(
  userId: string,
  assetIds: string[],
  title?: string,
  settings?: SlideshowSettings,
  userIp: string = 'none'
): Promise<{
  success: boolean;
  slideshowId?: string;
  error?: string;
  assets?: SlideshowAsset[];
}> {
  // Generate a unique ID for the slideshow
  const slideshowId = uuidv4().replace(/-/g, '').substring(0, 12);

  try {
    // Get full asset data
    const assets = await fetchAssetData(userId, userIp, assetIds);

    if (assets.length === 0) {
      return {
        success: false,
        error: 'Failed to fetch asset data'
      };
    }

    const taskKey = datastore.key({
      namespace: NAMESPACE,
      path: [SLIDESHOW_KIND]
    });

    const entity = {
      key: taskKey,
      data: [
        { name: 'slideshowId', value: slideshowId },
        { name: 'userId', value: userId },
        { name: 'assets', value: assets },
        { name: 'title', value: title || 'My Slideshow' },
        { name: 'creationDate', value: new Date().toISOString() },
        {
          name: 'settings',
          value: settings || {
            interval: 5000,
            direction: 'forward',
            infiniteLoop: false
          }
        }
      ]
    };

    await datastore.save(entity);
    console.log(`Created slideshow with ID: ${slideshowId}`);

    return {
      success: true,
      slideshowId,
      assets
    };
  } catch (error) {
    console.error('Error creating slideshow:', error);
    return {
      success: false,
      error: 'Failed to create slideshow'
    };
  }
}

/**
 * Retrieves a slideshow by its unique ID
 */
export async function getSlideshow(
  slideshowId: string
): Promise<{ success: boolean; slideshow?: GcloudSlideshow; error?: string }> {
  const query = datastore
    .createQuery(NAMESPACE, SLIDESHOW_KIND)
    .filter('slideshowId', '=', slideshowId);

  try {
    const [results] = await datastore.runQuery(query);

    if (results.length === 0) {
      return {
        success: false,
        error: 'Slideshow not found'
      };
    }

    const slideshow = results[0];

    // Check if we have stored asset data, if not, fall back to assetIds
    let assets: SlideshowAsset[] = slideshow.assets || [];

    // If we don't have asset data but do have assetIds, create stub assets
    if (
      assets.length === 0 &&
      slideshow.assetIds &&
      slideshow.assetIds.length > 0
    ) {
      assets = slideshow.assetIds.map((id: string) => ({
        id,
        createdAssetUrl: '', // This will need to be filled in by the client
        assetType: 'unknown'
      }));
    }

    return {
      success: true,
      slideshow: {
        id: slideshow[datastore.KEY].id,
        slideshowId: slideshow.slideshowId,
        userId: slideshow.userId,
        assetIds: slideshow.assetIds || [],
        assets: assets,
        title: slideshow.title || 'My Slideshow',
        creationDate: slideshow.creationDate,
        settings: slideshow.settings || {
          interval: 5000,
          direction: 'forward',
          infiniteLoop: false
        }
      }
    };
  } catch (error) {
    console.error('Error retrieving slideshow:', error);
    return {
      success: false,
      error: 'Failed to retrieve slideshow'
    };
  }
}

/**
 * Gets all slideshows created by a user
 */
export async function getUserSlideshows(
  userId: string
): Promise<{
  success: boolean;
  slideshows?: GcloudSlideshow[];
  error?: string;
}> {
  const query = datastore
    .createQuery(NAMESPACE, SLIDESHOW_KIND)
    .filter('userId', '=', userId)
    .order('creationDate', { descending: true });

  try {
    const [results] = await datastore.runQuery(query);

    if (results.length === 0) {
      return {
        success: true,
        slideshows: []
      };
    }

    const slideshows = results.map((slideshow: any) => {
      // Check if we have stored asset data, if not, fall back to assetIds
      let assets: SlideshowAsset[] = slideshow.assets || [];

      // If we don't have asset data but do have assetIds, create stub assets
      if (
        assets.length === 0 &&
        slideshow.assetIds &&
        slideshow.assetIds.length > 0
      ) {
        assets = slideshow.assetIds.map((id: string) => ({
          id,
          createdAssetUrl: '', // This will need to be filled in by the client
          assetType: 'unknown'
        }));
      }

      return {
        id: slideshow[datastore.KEY].id,
        slideshowId: slideshow.slideshowId,
        userId: slideshow.userId,
        assetIds: slideshow.assetIds || [],
        assets: assets,
        title: slideshow.title || 'My Slideshow',
        creationDate: slideshow.creationDate,
        settings: slideshow.settings || {
          interval: 5000,
          direction: 'forward',
          infiniteLoop: false
        }
      };
    });

    return {
      success: true,
      slideshows
    };
  } catch (error) {
    console.error('Error retrieving user slideshows:', error);
    return {
      success: false,
      error: 'Failed to retrieve slideshows'
    };
  }
}
