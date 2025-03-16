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
  }
};
