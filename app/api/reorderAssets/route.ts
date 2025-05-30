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

    console.log('Reordering asset:', { userId, assetId, targetIndex, allAssetIds });

    // Get all assets to calculate new datetime
    const assetKeys = allAssetIds.map((id: string) =>
      datastore.key({
        namespace: 'GenTube',
        path: ['UserActivity', datastore.int(Number(id))]
      })
    );

    const [assets] = await datastore.get(assetKeys);
    
    if (!assets || assets.length === 0) {
      return NextResponse.json(
        { error: 'No assets found' },
        { status: 404 }
      );
    }

    // Sort assets by current DateTime to get proper ordering
    const sortedAssets = assets
      .filter(asset => asset && asset.DateTime)
      .sort((a, b) => new Date(b.DateTime).getTime() - new Date(a.DateTime).getTime());

    console.log('Sorted assets:', sortedAssets.map(a => ({ 
      id: a[datastore.KEY].id, 
      DateTime: a.DateTime 
    })));

    // Find the asset being moved
    const movedAsset = sortedAssets.find(asset => 
      asset[datastore.KEY].id.toString() === assetId.toString()
    );

    if (!movedAsset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Calculate new DateTime based on target position
    let newDateTime: Date;
    
    if (targetIndex === 0) {
      // Moving to the top (newest)
      const newestAsset = sortedAssets[0];
      const newestTime = new Date(newestAsset.DateTime).getTime();
      newDateTime = new Date(newestTime + 60000); // Add 1 minute to be newest
    } else if (targetIndex >= sortedAssets.length - 1) {
      // Moving to the bottom (oldest)
      const oldestAsset = sortedAssets[sortedAssets.length - 1];
      const oldestTime = new Date(oldestAsset.DateTime).getTime();
      newDateTime = new Date(oldestTime - 60000); // Subtract 1 minute to be oldest
    } else {
      // Moving between two assets
      const beforeAsset = sortedAssets[targetIndex - 1];
      const afterAsset = sortedAssets[targetIndex];
      
      const beforeTime = new Date(beforeAsset.DateTime).getTime();
      const afterTime = new Date(afterAsset.DateTime).getTime();
      
      // Calculate midpoint
      const midpoint = beforeTime + ((afterTime - beforeTime) / 2);
      
      // If the difference is too small (less than 1 second), we need to redistribute
      if (Math.abs(beforeTime - afterTime) < 2000) {
        console.log('DateTime difference too small, redistributing timestamps');
        
        // Redistribute timestamps for all assets
        const redistributedAssets = await redistributeTimestamps(sortedAssets, assetId, targetIndex);
        
        // Update all assets with new timestamps
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
              existingAsset.DateTime = asset.newDateTime;
              transaction.save({
                key,
                data: existingAsset
              });
            }
          }
          
          await transaction.commit();
          console.log('Successfully redistributed timestamps for all assets');
          
          return NextResponse.json({ 
            success: true, 
            message: 'Assets reordered with redistributed timestamps' 
          });
        } catch (error) {
          await transaction.rollback();
          throw error;
        }
      } else {
        newDateTime = new Date(midpoint);
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
        return NextResponse.json(
          { error: 'Asset not found' },
          { status: 404 }
        );
      }

      // Verify the asset belongs to the user
      if (asset.UserId !== userId) {
        await transaction.rollback();
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      asset.DateTime = newDateTime.toISOString();
      
      transaction.save({
        key: assetKey,
        data: asset
      });

      await transaction.commit();
      
      console.log(`Successfully updated asset ${assetId} DateTime to:`, newDateTime.toISOString());

      return NextResponse.json({ 
        success: true, 
        newDateTime: newDateTime.toISOString() 
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

// Helper function to redistribute timestamps evenly
async function redistributeTimestamps(
  sortedAssets: any[], 
  movedAssetId: string, 
  targetIndex: number
): Promise<Array<{ id: string; newDateTime: string }>> {
  // Remove the moved asset from current position
  const filteredAssets = sortedAssets.filter(asset => 
    asset[datastore.KEY].id.toString() !== movedAssetId.toString()
  );
  
  // Find the moved asset
  const movedAsset = sortedAssets.find(asset => 
    asset[datastore.KEY].id.toString() === movedAssetId.toString()
  );
  
  if (!movedAsset) {
    throw new Error('Moved asset not found');
  }
  
  // Insert moved asset at target position
  filteredAssets.splice(targetIndex, 0, movedAsset);
  
  // Create new timestamps with 1-hour intervals starting from now
  const now = Date.now();
  const hourInterval = 60 * 60 * 1000; // 1 hour in milliseconds
  
  return filteredAssets.map((asset, index) => ({
    id: asset[datastore.KEY].id.toString(),
    newDateTime: new Date(now - (index * hourInterval)).toISOString()
  }));
}