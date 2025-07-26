/** @type {import('next').NextConfig} */
import createBundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // إعدادات Netlify
  trailingSlash: true,
  output: 'export',
  // تحسينات الأداء
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // تحسين Tree Shaking
    esmExternals: 'loose',
    // تحسين التحميل
    optimizeCss: false, // تعطيل مؤقتاً لتجنب مشاكل critters
  },
  // تحسين تجربة التطوير
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.next/**'],
      }
    }
    
    // تحسين حجم الحزمة
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      }
      
      // تحسين Tree Shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        innerGraph: true,
      }
    }
    
    // إزالة console.log في الإنتاج
    if (!dev) {
      // تعطيل terser-webpack-plugin مؤقتاً لتجنب مشاكل التوافق
      // config.optimization.minimizer.push(
      //   new TerserPlugin({
      //     terserOptions: {
      //       compress: {
      //         drop_console: true,
      //         drop_debugger: true,
      //       },
      //     },
      //   })
      // )
    }
    
    // تحسين الأداء - تقسيم الحزم بشكل أفضل
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // المكتبات الأساسية
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          
          // Radix UI - فصل منفصل
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix-ui',
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          
          // Firebase - فصل منفصل
          firebase: {
            test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
            name: 'firebase',
            chunks: 'all',
            priority: 30,
            enforce: true,
          },
          
          // Recharts - فصل منفصل
          recharts: {
            test: /[\\/]node_modules[\\/]recharts[\\/]/,
            name: 'recharts',
            chunks: 'all',
            priority: 40,
            enforce: true,
          },
          
          // Lucide React - فصل منفصل
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'lucide',
            chunks: 'all',
            priority: 50,
            enforce: true,
          },
          
          // React Hook Form - فصل منفصل
          reactHookForm: {
            test: /[\\/]node_modules[\\/]react-hook-form[\\/]/,
            name: 'react-hook-form',
            chunks: 'all',
            priority: 60,
            enforce: true,
          },
          
          // المكونات المشتركة
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
            priority: 5,
          },
        },
      },
    }
    
    return config
  },
  // إعدادات Netlify
  trailingSlash: true,
  // تحسين الأداء
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // تحسين التحميل
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // إعدادات البيئة
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com',
  },
  // تحسين التحديثات المباشرة
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig);
