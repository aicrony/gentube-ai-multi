# API Migration Plan - Pages API to App Router API

## Overview

This document outlines the plan to migrate API routes from `/pages/api/` to `/app/api/` for improved security and compatibility with Next.js App Router.

## Migration Pattern

For each API route, follow these steps:

1. Create a directory in `/app/api/` with the same name as the API endpoint
2. Create a `route.ts` file inside that directory
3. Convert the handler function to use Next.js App Router conventions:
   - Change from `NextApiRequest/NextApiResponse` to `NextRequest/NextResponse`
   - Replace `req.query` with `request.nextUrl.searchParams`
   - Replace `res.status().json()` with `NextResponse.json()`
   - Add parameter validation as needed
4. Test the new API endpoint
5. Update any client components that use the API (if necessary)

## Migration Status

| API Route              | Status      | Notes                                                  |
| ---------------------- | ----------- | ------------------------------------------------------ |
| getUserCredits         | ✅ Complete | Added parameter validation                             |
| getUserAssets          | ✅ Complete | Added parameter validation                             |
| deleteUserAsset        | ✅ Complete | Added error handling for request body parsing          |
| creditsync             | ✅ Complete | Improved error handling                                |
| newuser                | ✅ Complete | Improved error handling                                |
| falimageresult         | ✅ Complete | Added robust error handling                            |
| falvideoresult         | ✅ Complete | Added robust error handling                            |
| image                  | ✅ Complete | Added parameter validation and improved error messages |
| video                  | ✅ Complete | Added parameter validation and improved error messages |
| getImages              | ✅ Complete | Simplified implementation                              |
| getGallery             | ✅ Complete | Simplified implementation                              |
| setUserAssetsToggleOn  | ✅ Complete | Added parameter validation                             |
| setUserAssetsToggleOff | ✅ Complete | Added parameter validation                             |
| getPublicAssets        | ✅ Complete | Simplified implementation                              |
| getGalleryAssets       | ✅ Complete | Simplified implementation                              |
| getUserAssetsToggle    | ✅ Complete | Added parameter validation                             |
| uploadImage            | ✅ Complete | Enhanced error handling and validation                 |

## Testing Strategy

- Test each API route individually after migration
- Ensure all parameters are properly validated
- Test with both authenticated and unauthenticated requests
- Verify error handling works as expected

## Post-Migration Steps

Now that all APIs are migrated:

1. Test all APIs in the `/app/api` directory
2. Once testing confirms everything works as expected:
   - Remove the `/pages/api` directory or keep it temporarily with deprecation notices
   - Update any documentation to reflect the new API structure

## Benefits of App Router API

- Improved security model with built-in CSRF protection
- Better route handling with more flexible patterns
- Enhanced error handling with structured responses
- Type-safe parameter handling
- Better compatibility with modern Next.js features
- Improved performance through Next.js optimizations
