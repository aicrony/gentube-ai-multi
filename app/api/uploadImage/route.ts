import { NextRequest, NextResponse } from 'next/server';
import { fileTypeFromBuffer } from 'file-type';
import heicConvert from 'heic-convert';
import { uploadImageToGCSFromBase64 } from '@/utils/gcloud/uploadImage';
import { saveUserActivity } from '@/utils/gcloud/saveUserActivity';

// App Router route configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout
export const runtime = 'nodejs';

// Note: Request body size limits are now configured in next.config.js

export async function POST(request: NextRequest) {
  try {
    // Get userId from headers instead of body for security
    const userId = request.headers.get('x-user-id');
    const userIp = request.headers.get('x-forwarded-for') || 'unknown';

    const body = await request.json();
    const { image } = body;

    // Require both userId and userIp
    if (!userId || userId === 'none') {
      return NextResponse.json(
        { error: 'User ID is required. Please sign in for free credits.' },
        { status: 430 } // Custom status code for sign-in required
      );
    }

    if (!userIp || userIp === 'unknown') {
      return NextResponse.json(
        { error: 'User IP is required' },
        { status: 400 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    let imageBuffer = Buffer.from(image, 'base64');
    const fileType = await fileTypeFromBuffer(imageBuffer);

    if (!fileType) {
      return NextResponse.json(
        { error: 'File type could not be determined' },
        { status: 400 }
      );
    }

    if (fileType.ext === 'heic') {
      // Convert HEIC to PNG
      const outputBuffer = await heicConvert({
        buffer: imageBuffer, // the HEIC file buffer
        format: 'PNG', // output format
        quality: 1 // quality of the output image, between 0 and 1
      });
      imageBuffer = outputBuffer;
    }

    console.log('fileType:', fileType.ext);

    const base64Image = imageBuffer.toString('base64');
    const imageUrl = await uploadImageToGCSFromBase64(
      process.env.GCLOUD_TEMP_PUBLIC_BUCKET_NAME,
      base64Image
    );

    // Save user activity
    await saveUserActivity({
      id: undefined,
      AssetSource: '',
      AssetType: 'upl',
      CountedAssetPreviousState: 0,
      CountedAssetState: 0,
      CreatedAssetUrl: imageUrl,
      DateTime: new Date().toISOString(),
      Prompt: '',
      SubscriptionTier: 0,
      UserId: userId,
      UserIp: userIp
    });

    return NextResponse.json({ url: imageUrl, fileType: fileType.ext });
  } catch (error) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: 'An error occurred while uploading the image' },
      { status: 500 }
    );
  }
}
