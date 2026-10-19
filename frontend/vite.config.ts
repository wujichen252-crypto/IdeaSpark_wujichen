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

  // CDN 基础路径（生产构建时给静态资源加前缀，开发/无配置时回退原始路径）
  // 阿里云 bucket 绑定自定义域名后，此处填 //你的CDN域名（用协议相对 URL，让浏览器自动匹配主站 http/https）
  const cdnBaseRaw = (env.VITE_CDN_BASE || '').trim().replace(/\/$/, '')
  // https://cdn.example.com 或 http://cdn.example.com → //cdn.example.com
  // 协议相对 URL：浏览器会自动用和当前页面一致的协议加载资源
  const cdnBase = cdnBaseRaw.replace(/^https?:/, '')

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
          // 仅注入 mixins（@mixin/@keyframes 不产生 CSS 输出，可安全复用）；
      // 设计令牌（:root/html/body/::selection 等带实际输出的 CSS）改由 main.ts 全局只引一次，
      // 避免 additionalData 把令牌重复打进每个组件 chunk。
      additionalData: `@use "@/styles/mixins.scss" as *;\n`
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
      // 压缩选项 - 恢复 terser 压缩（以 safari10/keep_classnames/keep_fnames 规避历史 TDZ 问题）
      minify: 'terser',
      terserOptions: {
        compress: {
          // 生产环境移除 console 和 debugger
          drop_console: isProduction,
          drop_debugger: isProduction
        },
        mangle: {
          // 规避 terser 在 let/class 作用域变换时引入的 TDZ 误报（terser#943）
          safari10: true,
          keep_classnames: true,
          keep_fnames: true
        }
      },
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
              if (id.includes('echarts') || id.includes('zrender')) {
                return 'echarts'
              }
              // 白板（Excalidraw React 孤岛）：将 React 全家桶与 Excalidraw 强制隔离到独立 vendor chunk，
              // 仅当打开"白板"资产时才加载，避免思维导图/流程图资产无辜承担 React 体积
              if (
                id.includes('@excalidraw') ||
                id.includes('@radix-ui') ||
                id.includes('/react-dom/') ||
                id.includes('/react/') ||
                id.includes('react-reconciler') ||
                id.includes('/scheduler/')
              ) {
                return 'whiteboard-vendor'
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
        'axios',
        // 白板（Excalidraw React 孤岛）：预构建 React 与 Excalidraw，避免 dev 首次加载巨慢
        'react',
        'react-dom',
        'react-dom/client',
        '@excalidraw/excalidraw'
      ],
      exclude: []
    },
    // 实验性功能
    experimental: {
      /**
       * 渲染时给所有 import 进来的静态资源加 CDN 前缀
       * - 生产 + 配置了 VITE_CDN_BASE → 相对路径 xxx → https://cdn.example.com/xxx
       * - 开发/无配置 → 保持原始路径
       * - 绝对 URL（http://、data:、//）原样保留
       */
      renderBuiltUrl(filename) {
        if (!isProduction || !cdnBase) return filename
        // 已经是绝对 URL 或 data URI 不处理
        if (/^(https?:|data:|\/\/)/.test(filename)) return filename
        // 相对路径一律加 CDN 前缀（import 进来的产物都是相对路径）
        const normalized = filename.startsWith('/') ? filename : '/' + filename
        return cdnBase + normalized
      }
    },
    /**
     * 给 index.html 里的 modulepreload / script / link 也加 CDN 前缀
     * renderBuiltUrl 不覆盖 HTML 里 vite 自动注入的标签路径
     */
    transformIndexHtml(html: string): string {
      if (!isProduction || !cdnBase) return html
      // 匹配所有不以 http / data / // 开头的 src/href 属性
      return html.replace(
        /(href|src)="((?!(https?:|data:|\/\/))[^"]+)"/g,
        (_m: string, attr: string, path: string) => {
          const normalized = path.startsWith('/') ? path : '/' + path
          return `${attr}="${cdnBase}${normalized}"`
        }
      )
    }
  }
})
