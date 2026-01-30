const path = require('path');

const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    qualities: [100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/7.x/avataaars/svg',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias['@/components'] = path.join(__dirname, 'components');
    config.resolve.alias['@/actions'] = path.join(__dirname, 'actions');
    config.resolve.alias['@/hooks'] = path.join(__dirname, 'hooks');
    config.resolve.alias['@/languages'] = path.join(__dirname, 'languages');
    config.resolve.alias['@/lib'] = path.join(__dirname, 'lib');
    config.resolve.alias['@/types'] = path.join(__dirname, 'types');
    config.resolve.alias['@/contexts'] = path.join(__dirname, 'contexts');
    config.resolve.alias['@/firebase'] = path.join(__dirname, 'firebase.ts');
    config.resolve.alias['@/firebase-admin'] = path.join(__dirname, 'firebase-admin.ts');
    
    return config;
  },
};

module.exports = nextConfig;