const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    // This is optional if you want to use remark/rehype plugins
    remarkPlugins: [],
    rehypePlugins: []
  }
});

module.exports = withMDX({
  // Add caching headers for images and videos
  async headers() {
    return [
      {
        // Add cache control headers for image files
        source: '/:path*.(jpg|jpeg|png|gif|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate'
          }
        ]
      },
      {
        // Add cache control headers for video files
        source: '/:path*.(mp4|webm|ogg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate'
          }
        ]
      }
    ];
  },
  // Enable image optimization
  images: {
    domains: ['storage.googleapis.com'],
    minimumCacheTTL: 86400 // 24 hours
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
  // API configuration moved to server options in Next.js 14+
  serverRuntimeConfig: {
    // Will only be available on the server side
    bodySizeLimit: '12mb'
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@google-cloud/datastore',
      '@google-cloud/storage'
    ]
  },
  // Configure pageExtensions to include md and mdx
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],

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
});
