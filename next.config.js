module.exports = {
  // Add caching headers for images and videos
  async headers() {
    return [
      {
        // Add cache control headers for image files
        source: '/:path*.(jpg|jpeg|png|gif|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      {
        // Add cache control headers for video files
        source: '/:path*.(mp4|webm|ogg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      {
        // Add cache control headers for service worker
        source: '/slideshow-service-worker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // Add cache control headers for manifest
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
  // Enable image optimization
  images: {
    domains: ['storage.googleapis.com'],
    minimumCacheTTL: 86400, // 24 hours
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/'
      },
      {
        source: '/image-url-to-video',
        destination: '/'
      },
      {
        source: '/text-to-video',
        destination: '/'
      },
      {
        source: '/upload-to-video',
        destination: '/'
      },
      {
        source: '/admin',
        destination: '/'
      }
    ];
  },
  api: {
    // Configure the body parser for API routes
    bodyParser: {
      sizeLimit: '12mb'
    },
    // Enable response compression
    responseLimit: false
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@google-cloud/datastore',
      '@google-cloud/storage'
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs', 'child_process' and other node modules on the client
      config.resolve.fallback = {
        fs: false,
        child_process: false,
        net: false,
        tls: false,
        dns: false,
        os: false,
        path: false
      };
    }
    return config;
  }
};
