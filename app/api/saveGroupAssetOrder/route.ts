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
    const { userId, groupId, orderedAssetIds } = body;

    if (!userId || !groupId || !orderedAssetIds || !Array.isArray(orderedAssetIds)) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, groupId, and orderedAssetIds array' },
        { status: 400 }
      );
    }

    if (orderedAssetIds.length === 0) {
      return NextResponse.json(
        { error: 'orderedAssetIds array cannot be empty' },
        { status: 400 }
      );
    }

    console.log('Saving group-specific asset order');
    console.log('User:', userId);
    console.log('Group:', groupId);
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

    // Instead of updating DateTime, we'll update the order field in AssetGroupMembership
    // This allows for group-specific ordering without affecting global order
    const transaction = datastore.transaction();
    await transaction.run();

    try {
      // Find all existing group memberships
      const membershipQuery = datastore
        .createQuery('GenTube', 'AssetGroupMembership')
        .filter('groupId', '=', groupId)
        .filter('userId', '=', userId);

      const [existingMemberships] = await datastore.runQuery(membershipQuery);
      
      // Create a map of asset ID to membership entity
      const membershipMap = {};
      existingMemberships.forEach(membership => {
        membershipMap[membership.assetId] = {
          key: membership[datastore.KEY],
          data: membership
        };
      });
      
      // Update each membership with its new order based on position in ordered array
      for (let index = 0; index < orderedAssetIds.length; index++) {
        const assetId = orderedAssetIds[index];
        const orderValue = index + 1; // Start from 1 for easier human readability
        
        if (membershipMap[assetId]) {
          // Update existing membership
          const membership = membershipMap[assetId].data;
          membership.order = orderValue;
          
          transaction.save({
            key: membershipMap[assetId].key,
            data: membership
          });
          
          console.log(`Updated asset ${assetId} to position ${orderValue} in group ${groupId}`);
        } else {
          // Create new membership if it doesn't exist
          const membershipKey = datastore.key(['GenTube', 'AssetGroupMembership']);
          
          const newMembership = {
            assetId,
            groupId,
            userId,
            createdAt: new Date().toISOString(),
            order: orderValue
          };
          
          transaction.save({
            key: membershipKey,
            data: newMembership
          });
          
          console.log(`Created new membership for asset ${assetId} at position ${orderValue} in group ${groupId}`);
        }
      }

      await transaction.commit();
      console.log('Successfully saved new group-specific asset order to database');

      return NextResponse.json({
        success: true,
        message: `Successfully updated order for ${orderedAssetIds.length} assets in group ${groupId}`,
        groupId,
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