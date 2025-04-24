import { NextRequest, NextResponse } from 'next/server';
import generateFalImageToImage from '@/services/generateFalImageToImage';
import { saveUserActivity } from '@/utils/gcloud/saveUserActivity';
import { getUserCredits } from '@/utils/gcloud/getUserCredits';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get request data
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || '';
    const userIp = request.headers.get('x-forwarded-for') || '';
    const {
      product_image_url,
      background_image_url,
      scene_description,
      placement_type,
      manual_placement_selection
    } = body;

    // Validate required fields
    if (!product_image_url || !background_image_url || !scene_description) {
      return NextResponse.json(
        {
          error: true,
          result:
            'Missing required parameters: product_image_url, background_image_url, or scene_description'
        },
        { status: 400 }
      );
    }

    // Get user credits
    const userCredits = await getUserCredits(userId, userIp);

    // Check if user has enough credits (10 for product image)
    if (userCredits && userCredits < 10) {
      return NextResponse.json(
        {
          error: true,
          result: 'LimitExceeded',
          credits: userCredits
        },
        { status: 200 }
      );
    }

    // Generate product image using Fal.ai
    const productImageResult = await generateFalImageToImage({
      image_url: product_image_url,
      ref_image_url: background_image_url,
      scene_description: scene_description,
      optimize_description: true,
      num_results: 1,
      fast: true,
      placement_type: placement_type || 'manual_placement',
      shot_size: [1000, 1000],
      manual_placement_selection: manual_placement_selection || 'bottom_center'
    });

    console.log('ProductImageResult: ' + JSON.stringify(productImageResult));

    // Save user activity
    await saveUserActivity({
      id: undefined,
      AssetSource: product_image_url,
      AssetType: 'que',
      CountedAssetPreviousState: userCredits || 0,
      CountedAssetState: typeof userCredits == 'number' ? userCredits - 10 : 0,
      CreatedAssetUrl: productImageResult.response.request_id || 'InQueue',
      DateTime: new Date().toISOString(),
      Prompt: scene_description,
      SubscriptionTier: 0,
      UserId: userId,
      UserIp: userIp
    });

    // Return the result
    return NextResponse.json({
      error: false,
      result: productImageResult.response.response_url || 'InQueue',
      credits: typeof userCredits == 'number' ? userCredits - 10 : 0
    });
  } catch (error) {
    console.error('Product image generation error:', error);
    return NextResponse.json(
      {
        error: true,
        result: 'An error occurred while generating the product image'
      },
      { status: 500 }
    );
  }
}
