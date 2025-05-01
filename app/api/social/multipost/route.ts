import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/utils/auth/session";

// Multi-platform post handler
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the authenticated user session
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      platforms, 
      message, 
      imageUrl,
      title,        // For Pinterest
      description,  // For Pinterest
      link          // For Pinterest
    } = body;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'At least one platform must be selected' },
        { status: 400 }
      );
    }

    if (!message && !imageUrl) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Either message or image URL is required' },
        { status: 400 }
      );
    }

    // Process each platform asynchronously
    const postPromises = platforms.map(async (platform) => {
      try {
        const endpoint = `/api/social/${platform}`;
        
        let postData: any = {};
        
        // Customize data based on platform
        switch (platform) {
          case 'facebook':
            postData = { message, imageUrl };
            break;
          case 'instagram':
            postData = { caption: message, imageUrl };
            break;
          case 'twitter':
            postData = { text: message, imageUrl };
            break;
          case 'linkedin':
            postData = { text: message, imageUrl };
            break;
          case 'pinterest':
            postData = { 
              title: title || message.substring(0, 100), 
              description: description || message, 
              imageUrl, 
              link 
            };
            break;
          case 'tiktok':
            postData = { text: message, imageUrl };
            break;
          default:
            return {
              platform,
              success: false,
              error: 'Unsupported platform'
            };
        }
        
        // Make internal API call to platform-specific endpoint
        const response = await fetch(new URL(endpoint, request.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Pass through auth cookies for server-side requests
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify(postData)
        });
        
        const result = await response.json();
        
        return {
          platform,
          success: result.success,
          postId: result.postId || result.tweetId || result.pinId,
          error: result.error
        };
      } catch (error: any) {
        console.error(`Error posting to ${platform}:`, error);
        return {
          platform,
          success: false,
          error: error.message || `Failed to post to ${platform}`
        };
      }
    });
    
    // Wait for all posts to complete
    const results = await Promise.all(postPromises);
    
    // Check if any posts were successful
    const anySuccess = results.some(result => result.success);
    
    return NextResponse.json({
      success: anySuccess,
      results
    });
  } catch (error: any) {
    console.error('Error in multipost:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}