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
    const { userId, assetId, targetIndex, allAssetIds } = body;

    if (!userId || !assetId || targetIndex === undefined || !allAssetIds) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('Reordering asset:', {
      userId,
      assetId,
      targetIndex,
      allAssetIds
    });

    // Get all assets to calculate new datetime
    const assetKeys = allAssetIds.map((id: string) =>
      datastore.key({
        namespace: 'GenTube',
        path: ['UserActivity', datastore.int(Number(id))]
      })
    );

    const [assets] = await datastore.get(assetKeys);

    if (!assets || assets.length === 0) {
      return NextResponse.json({ error: 'No assets found' }, { status: 404 });
    }

    // Sort assets by order if available, otherwise fallback to DateTime
    const sortedAssets = assets
      .filter((asset) => asset)
      .sort((a, b) => {
        // If both assets have order field, use it for sorting
        // IMPORTANT: We're using ascending order - lower values come first
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order; // Lower order value first in the UI
        }
        // If only one has order, prioritize the one with order
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        // Fallback to DateTime if order is not available
        return new Date(b.DateTime).getTime() - new Date(a.DateTime).getTime();
      });

    console.log(
      'Sorted assets:',
      sortedAssets.map((a) => ({
        id: a[datastore.KEY].id,
        DateTime: a.DateTime
      }))
    );

    // Find the asset being moved
    const movedAsset = sortedAssets.find(
      (asset) => asset[datastore.KEY].id.toString() === assetId.toString()
    );

    if (!movedAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Calculate new order value based on target position
    // IMPORTANT: Lower order values (e.g., 0, 10, 20) appear FIRST in the UI (ascending order)
    let newOrder: number;

    if (targetIndex === 0) {
      // Moving to the top (first position)
      // For top position, we need a value smaller than the current smallest order
      const firstAsset = sortedAssets[0];
      newOrder = firstAsset.order !== undefined ? firstAsset.order - 10 : 0;
    } else if (targetIndex >= sortedAssets.length - 1) {
      // Moving to the bottom (last position)
      // For bottom position, we need a value larger than the current largest order
      const lastAsset = sortedAssets[sortedAssets.length - 1];
      newOrder = lastAsset.order !== undefined ? lastAsset.order + 10 : sortedAssets.length * 10;
    } else {
      // Moving between two assets
      const beforeAsset = sortedAssets[targetIndex - 1];
      const afterAsset = sortedAssets[targetIndex];

      // If both assets have order, calculate the midpoint
      if (beforeAsset.order !== undefined && afterAsset.order !== undefined) {
        // Calculate midpoint between the two order values
        newOrder = beforeAsset.order + Math.floor((afterAsset.order - beforeAsset.order) / 2);

        // If the difference is too small, we need to redistribute order values
        if (Math.abs(afterAsset.order - beforeAsset.order) <= 1) {
          console.log('Order difference too small, redistributing order values');

          // Redistribute order values for all assets
          const redistributedAssets = await redistributeOrderValues(
            sortedAssets,
            assetId,
            targetIndex
          );

          // Update all assets with new order values
          const transaction = datastore.transaction();
          await transaction.run();

          try {
            for (const asset of redistributedAssets) {
              const key = datastore.key({
                namespace: 'GenTube',
                path: ['UserActivity', datastore.int(Number(asset.id))]
              });

              const [existingAsset] = await transaction.get(key);
              if (existingAsset) {
                existingAsset.order = asset.newOrder;
                transaction.save({
                  key,
                  data: existingAsset
                });
              }
            }

            await transaction.commit();
            console.log('Successfully redistributed order values for all assets');

            return NextResponse.json({
              success: true,
              message: 'Assets reordered with redistributed order values'
            });
          } catch (error) {
            await transaction.rollback();
            throw error;
          }
        }
      } else {
        // If order values are not available, create a new sequence
        // Use position-based ordering (target index * 10 for even spacing)
        newOrder = targetIndex * 10;
      }
    }

    // Update the single asset with new DateTime
    const transaction = datastore.transaction();
    const assetKey = datastore.key({
      namespace: 'GenTube',
      path: ['UserActivity', datastore.int(Number(assetId))]
    });

    try {
      await transaction.run();
      const [asset] = await transaction.get(assetKey);

      if (!asset) {
        await transaction.rollback();
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }

      // Verify the asset belongs to the user
      if (asset.UserId !== userId) {
        await transaction.rollback();
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Set the new order value
      asset.order = newOrder;
      
      // Keep DateTime for backward compatibility
      asset.DateTime = asset.DateTime || new Date().toISOString();

      transaction.save({
        key: assetKey,
        data: asset
      });

      await transaction.commit();

      console.log(
        `Successfully updated asset ${assetId} order to:`,
        newOrder
      );
      console.log('Order mapping direction: Lower order values (e.g., 0, 10, 20) appear FIRST in the UI');

      return NextResponse.json({
        success: true,
        newOrder: newOrder
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error reordering assets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to redistribute order values evenly
async function redistributeOrderValues(
  sortedAssets: any[],
  movedAssetId: string,
  targetIndex: number
): Promise<Array<{ id: string; newOrder: number }>> {
  // Remove the moved asset from current position
  const filteredAssets = sortedAssets.filter(
    (asset) => asset[datastore.KEY].id.toString() !== movedAssetId.toString()
  );

  // Find the moved asset
  const movedAsset = sortedAssets.find(
    (asset) => asset[datastore.KEY].id.toString() === movedAssetId.toString()
  );

  if (!movedAsset) {
    throw new Error('Moved asset not found');
  }

  // Insert moved asset at target position
  filteredAssets.splice(targetIndex, 0, movedAsset);

  // Create new order values with 10-unit intervals for even spacing
  // This provides plenty of space for future inserts
  const orderInterval = 10;

  return filteredAssets.map((asset, index) => ({
    id: asset[datastore.KEY].id.toString(),
    newOrder: index * orderInterval
  }));
}
}
