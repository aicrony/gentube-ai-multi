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
      }
    ];
  }
};
