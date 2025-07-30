import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Docker deployment configuration
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Server external packages (moved from experimental)
  serverExternalPackages: ['sharp'],

  // Webpack optimizations
  webpack: (webpackConfig, { buildId, dev, isServer, defaultLoaders, nextRuntime }) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    // Bundle analyzer support
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      webpackConfig.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer ? 'server-bundle-analyzer.html' : 'client-bundle-analyzer.html',
        })
      )
    }

    // Optimize bundle splitting
    if (!isServer) {
      webpackConfig.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Large libraries get their own chunks  
          react: {
            name: 'react',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            priority: 40,
          },
          payload: {
            name: 'payload',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]@payloadcms[\\/]/,
            priority: 30,
          },
        },
      }
    }

    // Tree shaking optimization
    if (!dev) {
      webpackConfig.optimization.usedExports = true
      webpackConfig.optimization.sideEffects = false
    }

    return webpackConfig
  },
  
  // Image optimization configuration
  images: {
    // Supported image formats for optimization (WebP preferred, AVIF for even better compression)
    formats: ['image/avif', 'image/webp'],
    
    // Device sizes for responsive images (commonly used breakpoints)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Image sizes for smaller elements
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Quality settings (higher = better quality but larger size)
    qualities: [25, 50, 75, 90],
    
    // Cache optimized images for 31 days (reduces revalidations and costs)
    minimumCacheTTL: 2678400,
    
    // Remote patterns for external image sources
    remotePatterns: [
      // Google Books API covers
      {
        protocol: 'https',
        hostname: 'books.google.com',
        port: '',
        pathname: '/books/**',
        search: '',
      },
      {
        protocol: 'http',
        hostname: 'books.google.com',
        port: '',
        pathname: '/books/**',
        search: '',
      },
      // Cloudflare R2 storage (if using external media storage)
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
        search: '',
      },
      // Payload CMS media uploads (local or external)
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3000',
        pathname: '/media/**',
        search: '',
      },
    ],
    
    // Security settings for SVG (if needed)
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    contentDispositionType: 'attachment',
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
