import { NextRequest, NextResponse } from 'next/server';
import { Datastore } from '@google-cloud/datastore';
import { google_app_creds } from '@/interfaces/googleCredentials';

const datastore = new Datastore({
  projectId: google_app_creds.projectId,
  credentials: google_app_creds
});

const USER_GROUP_KIND = 'UserGroup';
const NAMESPACE = 'GenTube';

export interface UserGroup {
  id?: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  color?: string; // Optional color for UI organization
  assetCount?: number; // Computed field for display
}

// GET - Fetch user groups
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('Fetching groups for user:', userId);

    const query = datastore
      .createQuery(NAMESPACE, USER_GROUP_KIND)
      .filter('userId', '=', userId);

    const [groups] = await datastore.runQuery(query);

    const userGroups: UserGroup[] = groups
      .map((group: any) => ({
        id: group[datastore.KEY].id?.toString() || group[datastore.KEY].name,
        name: group.name,
        description: group.description,
        userId: group.userId,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        color: group.color,
        assetCount: 0 // Will be populated by separate query if needed
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort newest first

    console.log(`Found ${userGroups.length} groups for user ${userId}`);

    return NextResponse.json({
      success: true,
      groups: userGroups
    });

  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, userId, color } = body;

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'name and userId are required' },
        { status: 400 }
      );
    }

    // Check if group name already exists for this user
    const existingQuery = datastore
      .createQuery(NAMESPACE, USER_GROUP_KIND)
      .filter('userId', '=', userId)
      .filter('name', '=', name)
      .limit(1);

    const [existingGroups] = await datastore.runQuery(existingQuery);

    if (existingGroups.length > 0) {
      return NextResponse.json(
        { error: 'Group name already exists' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const groupKey = datastore.key({
      namespace: NAMESPACE,
      path: [USER_GROUP_KIND]
    });

    const groupData = {
      name: name.trim(),
      description: description?.trim() || '',
      userId,
      createdAt: now,
      updatedAt: now,
      color: color || '#3B82F6' // Default blue color
    };

    await datastore.save({
      key: groupKey,
      data: groupData
    });

    const newGroup: UserGroup = {
      id: groupKey.id?.toString(),
      ...groupData,
      assetCount: 0
    };

    console.log('Created new group:', newGroup);

    return NextResponse.json({
      success: true,
      group: newGroup
    });

  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update group
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, name, description, userId, color } = body;

    if (!groupId || !userId) {
      return NextResponse.json(
        { error: 'groupId and userId are required' },
        { status: 400 }
      );
    }

    const groupKey = datastore.key({
      namespace: NAMESPACE,
      path: [USER_GROUP_KIND, datastore.int(Number(groupId))]
    });

    const transaction = datastore.transaction();

    try {
      await transaction.run();
      const [group] = await transaction.get(groupKey);

      if (!group) {
        await transaction.rollback();
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      // Verify ownership
      if (group.userId !== userId) {
        await transaction.rollback();
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Check if new name conflicts with existing groups (if name is being changed)
      if (name && name !== group.name) {
        const existingQuery = datastore
          .createQuery(NAMESPACE, USER_GROUP_KIND)
          .filter('userId', '=', userId)
          .filter('name', '=', name)
          .limit(1);

        const [existingGroups] = await datastore.runQuery(existingQuery);

        if (existingGroups.length > 0) {
          await transaction.rollback();
          return NextResponse.json(
            { error: 'Group name already exists' },
            { status: 409 }
          );
        }
      }

      const updatedData = {
        ...group,
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(color && { color }),
        updatedAt: new Date().toISOString()
      };

      transaction.save({
        key: groupKey,
        data: updatedData
      });

      await transaction.commit();

      const updatedGroup: UserGroup = {
        id: groupId,
        name: updatedData.name,
        description: updatedData.description,
        userId: updatedData.userId,
        createdAt: updatedData.createdAt,
        updatedAt: updatedData.updatedAt,
        color: updatedData.color,
        assetCount: 0 // Will be computed separately if needed
      };

      console.log('Updated group:', updatedGroup);

      return NextResponse.json({
        success: true,
        group: updatedGroup
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete group
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');
    const userId = url.searchParams.get('userId');

    if (!groupId || !userId) {
      return NextResponse.json(
        { error: 'groupId and userId are required' },
        { status: 400 }
      );
    }

    const groupKey = datastore.key({
      namespace: NAMESPACE,
      path: [USER_GROUP_KIND, datastore.int(Number(groupId))]
    });

    const transaction = datastore.transaction();

    try {
      await transaction.run();
      const [group] = await transaction.get(groupKey);

      if (!group) {
        await transaction.rollback();
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      // Verify ownership
      if (group.userId !== userId) {
        await transaction.rollback();
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Delete the group
      transaction.delete(groupKey);

      // TODO: Also delete all AssetGroupMembership entities for this group
      // This will be handled in the asset-group relationship API

      await transaction.commit();

      console.log(`Deleted group ${groupId} for user ${userId}`);

      return NextResponse.json({
        success: true,
        message: 'Group deleted successfully'
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}