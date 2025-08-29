import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) => {
  try {
    // Get the asset URL from the query parameters
    const { searchParams } = new URL(request.url);
    const assetUrl = searchParams.get('url');
    
    if (!assetUrl) {
      return NextResponse.json({ error: 'Asset URL is required' }, { status: 400 });
    }

    console.log(`Attempting to download asset from: ${assetUrl}`);

    // Fetch the asset
    const response = await fetch(assetUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch asset: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch asset: ${response.status} ${response.statusText}` }, 
        { status: response.status }
      );
    }

    // Get the content type and set the appropriate filename extension
    const contentType = response.headers.get('content-type') || '';
    let extension = '.jpg'; // Default to jpg
    
    if (contentType.includes('video')) {
      extension = '.mp4';
    } else if (contentType.includes('image/png')) {
      extension = '.png';
    } else if (contentType.includes('image/gif')) {
      extension = '.gif';
    }

    // Get the asset as a blob
    const blob = await response.blob();
    
    // Return the asset with appropriate headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename=asset${extension}`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error downloading asset:', error);
    return NextResponse.json(
      { error: 'Failed to download asset', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
};