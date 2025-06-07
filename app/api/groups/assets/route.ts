import { NextRequest, NextResponse } from 'next/server';
import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

export const dynamic = 'force-dynamic';

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const ASSET_GROUP_MEMBERSHIP_KIND = 'AssetGroupMembership';
const USER_ACTIVITY_KIND = 'UserActivity';
const USER_GROUP_KIND = 'UserGroup';
const NAMESPACE = 'GenTube';

export interface AssetGroupMembership {
  id?: string;
  assetId: string;
  groupId: string;
  userId: string;
  createdAt: string;
  order?: number;
}

// GET - Fetch assets in a group or groups for an asset
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');
    const assetId = url.searchParams.get('assetId');
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!groupId && !assetId) {
      return NextResponse.json(
        { error: 'Either groupId or assetId is required' },
        { status: 400 }
      );
    }

    let query = datastore
      .createQuery(NAMESPACE, ASSET_GROUP_MEMBERSHIP_KIND)
      .filter('userId', '=', userId);

    if (groupId) {
      // Get assets in a specific group
      query = query.filter('groupId', '=', groupId);
      console.log(`Fetching assets for group ${groupId} and user ${userId}`);
    } else if (assetId) {
      // Get groups for a specific asset
      query = query.filter('assetId', '=', assetId);
      console.log(`Fetching groups for asset ${assetId} and user ${userId}`);
    }

    const [memberships] = await datastore.runQuery(query);
    console.log(`Found ${memberships.length} memberships`);
    
    if (memberships.length > 0) {
      console.log('Sample membership:', JSON.stringify(memberships[0], null, 2));
    }

    const result = memberships.map((membership: any) => ({
      id:
        membership[datastore.KEY].id?.toString() ||
        membership[datastore.KEY].name,
      assetId: membership.assetId,
      groupId: membership.groupId,
      userId: membership.userId,
      createdAt: membership.createdAt,
      order: membership.order
    }));

    if (groupId) {
      // Return asset IDs for the group, ordered by the order field
      // Sort the results by the order field if present
      const sortedResult = result.sort((a, b) => {
        // If order exists on both, sort by order
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // If order only exists on one, put the one with order first
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        // Default to sorting by createdAt
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      const responseAssetIds = sortedResult.map((m) => m.assetId);
      console.log(`Returning ${responseAssetIds.length} asset IDs for group ${groupId}`);
      console.log('Asset IDs:', responseAssetIds);
      
      return NextResponse.json({
        success: true,
        assetIds: responseAssetIds,
        memberships: sortedResult
      });
    } else {
      // Return group IDs for the asset
      return NextResponse.json({
        success: true,
        groupIds: result.map((m) => m.groupId),
        memberships: result
      });
    }
  } catch (error) {
    console.error('Error fetching asset-group relationships:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add asset(s) to group(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetIds, groupIds, userId } = body;

    if (!assetIds || !groupIds || !userId) {
      return NextResponse.json(
        { error: 'assetIds, groupIds, and userId are required' },
        { status: 400 }
      );
    }

    const assetIdArray = Array.isArray(assetIds) ? assetIds : [assetIds];
    const groupIdArray = Array.isArray(groupIds) ? groupIds : [groupIds];

    // Verify that all assets belong to the user
    const assetKeys = assetIdArray.map((assetId: string) =>
      datastore.key({
        namespace: NAMESPACE,
        path: [USER_ACTIVITY_KIND, datastore.int(Number(assetId))]
      })
    );

    const [assets] = await datastore.get(assetKeys);

    for (const asset of assets) {
      if (!asset || asset.UserId !== userId) {
        return NextResponse.json(
          { error: 'One or more assets not found or unauthorized' },
          { status: 403 }
        );
      }
    }

    // Verify that all groups belong to the user
    const groupKeys = groupIdArray.map((groupId: string) =>
      datastore.key({
        namespace: NAMESPACE,
        path: [USER_GROUP_KIND, datastore.int(Number(groupId))]
      })
    );

    const [groups] = await datastore.get(groupKeys);

    for (const group of groups) {
      if (!group || group.userId !== userId) {
        return NextResponse.json(
          { error: 'One or more groups not found or unauthorized' },
          { status: 403 }
        );
      }
    }

    const transaction = datastore.transaction();
    const now = new Date().toISOString();
    const membershipsToCreate: any[] = [];
    const createdMemberships: AssetGroupMembership[] = [];

    try {
      await transaction.run();

      // Check for existing memberships to avoid duplicates
      for (const assetId of assetIdArray) {
        for (const groupId of groupIdArray) {
          const existingQuery = datastore
            .createQuery(NAMESPACE, ASSET_GROUP_MEMBERSHIP_KIND)
            .filter('assetId', '=', assetId)
            .filter('groupId', '=', groupId)
            .filter('userId', '=', userId)
            .limit(1);

          const [existingMemberships] = await datastore.runQuery(existingQuery);

          if (existingMemberships.length === 0) {
            const membershipKey = datastore.key({
              namespace: NAMESPACE,
              path: [ASSET_GROUP_MEMBERSHIP_KIND]
            });

            const membershipData = {
              assetId,
              groupId,
              userId,
              createdAt: now
            };

            membershipsToCreate.push({
              key: membershipKey,
              data: membershipData
            });

            createdMemberships.push({
              id: membershipKey.id?.toString(),
              ...membershipData
            });
          }
        }
      }

      if (membershipsToCreate.length > 0) {
        transaction.save(membershipsToCreate);
        await transaction.commit();

        console.log(
          `Created ${membershipsToCreate.length} asset-group memberships`
        );
      } else {
        await transaction.rollback();
        console.log('No new memberships to create (all already exist)');
      }

      return NextResponse.json({
        success: true,
        created: membershipsToCreate.length,
        memberships: createdMemberships
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error adding assets to groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove asset(s) from group(s)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetIds, groupIds, userId } = body;

    if (!assetIds || !groupIds || !userId) {
      return NextResponse.json(
        { error: 'assetIds, groupIds, and userId are required' },
        { status: 400 }
      );
    }

    const assetIdArray = Array.isArray(assetIds) ? assetIds : [assetIds];
    const groupIdArray = Array.isArray(groupIds) ? groupIds : [groupIds];

    const transaction = datastore.transaction();
    const keysToDelete: any[] = [];

    try {
      await transaction.run();

      // Find existing memberships to delete
      for (const assetId of assetIdArray) {
        for (const groupId of groupIdArray) {
          const membershipQuery = datastore
            .createQuery(NAMESPACE, ASSET_GROUP_MEMBERSHIP_KIND)
            .filter('assetId', '=', assetId)
            .filter('groupId', '=', groupId)
            .filter('userId', '=', userId);

          const [memberships] = await datastore.runQuery(membershipQuery);

          for (const membership of memberships) {
            keysToDelete.push(membership[datastore.KEY]);
          }
        }
      }

      if (keysToDelete.length > 0) {
        transaction.delete(keysToDelete);
        await transaction.commit();

        console.log(`Deleted ${keysToDelete.length} asset-group memberships`);
      } else {
        await transaction.rollback();
        console.log('No memberships found to delete');
      }

      return NextResponse.json({
        success: true,
        deleted: keysToDelete.length
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error removing assets from groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
