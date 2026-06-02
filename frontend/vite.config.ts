import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import { imagetools } from 'vite-imagetools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8081'
  const isProduction = mode === 'production'

  return {
    // 资源基础路径 - 使用绝对路径确保子路由下资源加载正确
    base: '/',
    plugins: [
      vue({
        // 启用模板编译优化
        template: {
          compilerOptions: {
            // 跳过不必要的类型检查
            hoistStatic: true,
            // 启用静态提升
            cacheHandlers: true
          }
        }
      }),
      imagetools(),
      AutoImport({
        imports: [
          'vue',
          {
            'naive-ui': [
              'useDialog',
              'useMessage',
              'useNotification',
              'useLoadingBar'
            ]
          },
          {
            '@/composables/useAppDialog': [
              'useAppDialog'
            ]
          }
        ],
        dts: 'src/auto-imports.d.ts',
        // 生产环境移除console
        eslintrc: {
          enabled: true
        }
      }),
      Components({
        resolvers: [NaiveUiResolver()],
        dts: 'src/components.d.ts',
        // 按需引入组件
        deep: true,
        dirs: ['src/components']
      })
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/variables.scss" as *;\n@use "@/styles/mixins.scss" as *;\n`
        }
      },
      // 开发环境启用sourcemap，生产环境禁用
      devSourcemap: !isProduction
    },
    server: {
      allowedHosts: true,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true
        }
      },
      // 优化开发服务器性能
      hmr: {
        overlay: false
      }
    },
    assetsInclude: ['**/*.mp4', '**/*.webm', '**/*.ogg'],
    build: {
      chunkSizeWarningLimit: 500,
      // 启用CSS代码分割
      cssCodeSplit: true,
      // 启用sourcemap（仅开发环境）
      sourcemap: !isProduction,
      // 压缩选项 - 临时禁用压缩以定位 TDZ 问题
      minify: false,
      // minify: 'terser',
      // terserOptions: {
      //   compress: {
      //     // 生产环境移除console和debugger
      //     drop_console: isProduction,
      //     drop_debugger: isProduction
      //   },
      //   mangle: {
      //     // 禁用变量名压缩以避免 TDZ 错误
      //     // 参考: https://github.com/terser/terser/issues/943
      //     safari10: true,
      //     keep_classnames: true,
      //     keep_fnames: true
      //   }
      // } as any,
      rollupOptions: {
        output: {
          // 暂时禁用 manualChunks 来避免循环依赖问题
          // 稍后可以按需重新启用
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 只分割大型库
              if (id.includes('naive-ui')) {
                return 'naive-ui'
              }
              if (id.includes('echarts')) {
                return 'echarts'
              }
            }
            // 将 store 相关代码打包到独立的 chunk，避免循环依赖
            if (id.includes('/store/')) {
              return 'store'
            }
          },
          // 优化资源文件名 - 不添加 assets/ 前缀，因为部署目录已存在
          chunkFileNames: '[name]-[hash].js',
          entryFileNames: '[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name || ''
            if (info.endsWith('.css')) {
              return '[name]-[hash][extname]'
            }
            if (info.endsWith('.mp4') || info.endsWith('.webm') || info.endsWith('.ogg')) {
              return '[name]-[hash][extname]'
            }
            if (info.endsWith('.png') || info.endsWith('.jpg') || info.endsWith('.jpeg') || info.endsWith('.gif') || info.endsWith('.svg') || info.endsWith('.webp')) {
              return '[name]-[hash][extname]'
            }
            return '[name]-[hash][extname]'
          }
        }
      },
      // 报告压缩后的大小
      reportCompressedSize: false,
      // 启用并行构建
      target: 'esnext'
    },
    // 优化依赖预构建
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'naive-ui',
        'axios'
      ],
      exclude: []
    },
    // 实验性功能
    experimental: {
      // 渲染优化：保持资源路径不变
      renderBuiltUrl(filename) {
        return filename
      }
    }
  }
})
