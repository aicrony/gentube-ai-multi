module.exports = {
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
      sizeLimit: '5mb'
    },
    // Enable response compression
    responseLimit: false
  },
  experimental: {
    serverComponentsExternalPackages: ['@google-cloud/datastore', '@google-cloud/storage']
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
