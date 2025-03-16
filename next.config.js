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
  experimental: {
    serverComponentsExternalPackages: ['@google-cloud/datastore', '@google-cloud/storage']
  }
};
