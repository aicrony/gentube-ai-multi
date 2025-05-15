import { NextRequest, NextResponse } from 'next/server';
import { addAssetToGallery, removeAssetFromGallery } from '@/utils/gcloud/galleryManager';

export async function POST(request: NextRequest) {
  try {
    const { userId, assetId, action } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    // Action should be 'add' or 'remove'
    if (action !== 'add' && action !== 'remove') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "add" or "remove"' },
        { status: 400 }
      );
    }

    console.log(`Gallery toggle request: ${action} asset ${assetId} by user ${userId}`);
    
    let result;
    try {
      if (action === 'add') {
        result = await addAssetToGallery(userId, assetId);
      } else {
        result = await removeAssetFromGallery(userId, assetId);
      }
    } catch (functionError) {
      console.error('Gallery toggle function error:', functionError);
      return NextResponse.json(
        { 
          error: 'Gallery operation failed', 
          details: functionError.message
        },
        { status: 500 }
      );
    }
    
    if (!result) {
      return NextResponse.json(
        { 
          error: 'Failed to update gallery status',
          action: action,
          assetId: assetId,
          details: 'Operation failed - entity may not exist or user may not have permission'
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      action: action,
      assetId: assetId,
      message: action === 'add' 
        ? 'Asset successfully added to gallery' 
        : 'Asset successfully removed from gallery'
    });
  } catch (error) {
    console.error('Failed to toggle gallery status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to toggle gallery status',
        details: error.message || 'Unknown error' 
      },
      { status: 500 }
    );
  }
}