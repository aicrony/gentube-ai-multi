import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const filename = searchParams.get('filename');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Fetch the file from the external URL
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to fetch file: ${response.status}` 
      }, { status: response.status });
    }

    // Get the file content as buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine content type from the original response or infer from URL extension
    let contentType = response.headers.get('content-type');
    
    if (!contentType) {
      // Try to infer content type from file extension
      try {
        const urlPath = new URL(url).pathname.toLowerCase();
        if (urlPath.endsWith('.png')) {
          contentType = 'image/png';
        } else if (urlPath.endsWith('.jpg') || urlPath.endsWith('.jpeg')) {
          contentType = 'image/jpeg';
        } else if (urlPath.endsWith('.gif')) {
          contentType = 'image/gif';
        } else if (urlPath.endsWith('.webp')) {
          contentType = 'image/webp';
        } else if (urlPath.endsWith('.svg')) {
          contentType = 'image/svg+xml';
        } else if (urlPath.endsWith('.bmp')) {
          contentType = 'image/bmp';
        } else if (urlPath.endsWith('.ico')) {
          contentType = 'image/x-icon';
        } else {
          contentType = 'image/jpeg'; // Default fallback
        }
      } catch (error) {
        contentType = 'image/jpeg'; // Default fallback if URL parsing fails
      }
    }

    // Create response with proper headers to force download
    const downloadResponse = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename || 'download'}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });

    return downloadResponse;
  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json({ 
      error: 'Failed to download file' 
    }, { status: 500 });
  }
}