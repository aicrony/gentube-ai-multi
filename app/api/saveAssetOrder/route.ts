import { NextRequest, NextResponse } from 'next/server';
import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, orderedAssetIds } = body;

    if (!userId || !orderedAssetIds || !Array.isArray(orderedAssetIds)) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId and orderedAssetIds array' },
        { status: 400 }
      );
    }

    if (orderedAssetIds.length === 0) {
      return NextResponse.json(
        { error: 'orderedAssetIds array cannot be empty' },
        { status: 400 }
      );
    }

    console.log('Saving asset order for user:', userId);
    console.log('Ordered asset IDs:', orderedAssetIds);

    // Get all assets to verify they belong to the user
    const assetKeys = orderedAssetIds.map((id: string) =>
      datastore.key({
        namespace: 'GenTube',
        path: ['UserActivity', datastore.int(Number(id))]
      })
    );

    const [assets] = await datastore.get(assetKeys);

    if (!assets || assets.length !== orderedAssetIds.length) {
      return NextResponse.json(
        { error: 'Some assets not found or invalid' },
        { status: 404 }
      );
    }

    // Verify all assets belong to the user
    const unauthorizedAssets = assets.filter(asset => asset.UserId !== userId);
    if (unauthorizedAssets.length > 0) {
      return NextResponse.json(
        { error: 'Unauthorized: Some assets do not belong to this user' },
        { status: 403 }
      );
    }

    // Calculate new DateTime values to preserve the order
    // Use current time as base, then subtract intervals for subsequent items
    // This ensures the first item is newest (highest DateTime) for DESC sorting
    const baseTime = Date.now();
    const hourInterval = 60 * 60 * 1000; // 1 hour in milliseconds for safe spacing

    const transaction = datastore.transaction();
    await transaction.run();

    try {
      // Update each asset with its new DateTime based on position in ordered array
      for (let index = 0; index < orderedAssetIds.length; index++) {
        const assetId = orderedAssetIds[index];
        const newDateTime = new Date(baseTime - index * hourInterval);
        
        const key = datastore.key({
          namespace: 'GenTube',
          path: ['UserActivity', datastore.int(Number(assetId))]
        });

        const [asset] = await transaction.get(key);
        if (asset) {
          asset.DateTime = newDateTime.toISOString();
          transaction.save({
            key,
            data: asset
          });
          
          console.log(`Updated asset ${assetId} to position ${index} with DateTime ${newDateTime.toISOString()}`);
        }
      }

      await transaction.commit();
      console.log('Successfully saved new asset order to database');

      return NextResponse.json({
        success: true,
        message: `Successfully updated order for ${orderedAssetIds.length} assets`,
        updatedAssets: orderedAssetIds.length
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error saving asset order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}