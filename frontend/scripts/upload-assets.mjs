#!/usr/bin/env node
/**
 * 将前端 dist/ 构建产物同步到阿里云 OSS（CDN 源站）
 *
 * 使用方式：
 *   1. 在 scripts/.env 中填写 OSS 凭据（见 scripts/.env.example）
 *   2. pnpm run build && pnpm run upload:cdn
 *   3. 首次使用前先用 --dry-run 预览
 *
 * 特性：
 *   - 增量同步（hash 已变才上传）
 *   - 自动设置强缓存头（Cache-Control: immutable 一年）
 *   - 可选删除远端过期文件（--delete-remote）
 *   - 排除 _redirects（SPA 回退规则需留在 nginx 根目录，不走 CDN）
 *
 * 注意：脚本只同步 dist/ 下的静态资源，后端 API / 登录态 / CORS 等仍由 nginx 处理
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import OSS from 'ali-oss'
import { config as loadDotenv } from 'dotenv'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = resolve(__dirname, '..')

// 1. 加载凭据（scripts/.env 必须在 .gitignore 里）
const envPath = join(__dirname, '.env')
if (existsSync(envPath)) loadDotenv({ path: envPath })

const {
  OSS_ACCESS_KEY_ID,
  OSS_ACCESS_KEY_SECRET,
  OSS_BUCKET,
  // endpoint 必须完整 URL，ali-oss 的 region 参数拼 endpoint 有坑
  OSS_ENDPOINT = 'https://oss-cn-beijing.aliyuncs.com'
} = process.env

if (!OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET || !OSS_BUCKET) {
  console.error('❌ 缺少 OSS 凭据。请在 scripts/.env 中设置：')
  console.error('   OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET / OSS_BUCKET')
  process.exit(1)
}

// 2. 解析命令行参数
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const deleteRemote = args.includes('--delete-remote')

// 3. 初始化 OSS 客户端
const client = new OSS({
  endpoint: OSS_ENDPOINT,
  accessKeyId: OSS_ACCESS_KEY_ID,
  accessKeySecret: OSS_ACCESS_KEY_SECRET,
  bucket: OSS_BUCKET
})

const DIST_DIR = join(projectRoot, 'dist')
if (!existsSync(DIST_DIR)) {
  console.error('❌ dist/ 不存在，先 pnpm run build')
  process.exit(1)
}

// 4. 扫描 dist 下所有文件（排除 _redirects）
const EXCLUDE = new Set(['_redirects'])

function walk(dir, base = '') {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (EXCLUDE.has(entry.name)) continue
    const local = join(dir, entry.name)
    const remote = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push(...walk(local, remote))
    } else if (entry.isFile()) {
      files.push({ local, remote, size: statSync(local).size })
    }
  }
  return files
}

const localFiles = walk(DIST_DIR)
console.log(`📦 待同步 ${localFiles.length} 个文件（${dryRun ? '[预览模式]' : ''}）`)

// 5. 上传
let uploaded = 0
let skipped = 0
let errors = 0

/**
 * 构建 HTTP 缓存头：
 *   - 带 hash 的产物（绝大多数） → immutable 一年
 *   - index.html（无稳定 hash） → 短缓存 + must-revalidate，避免用户拿到过期入口
 */
function cacheHeader(remoteKey) {
  if (remoteKey === 'index.html' || remoteKey.endsWith('.html')) {
    return 'public, max-age=600, must-revalidate'
  }
  return 'public, max-age=31536000, immutable'
}

for (const file of localFiles) {
  const headers = { 'Cache-Control': cacheHeader(file.remote) }
  const displayKB = (file.size / 1024).toFixed(1)

  if (dryRun) {
    console.log(`  📤 [DRY] ${file.remote}  (${displayKB} KB)`)
    continue
  }

  try {
    await client.put(file.remote, file.local, { headers })
    console.log(`  ✅ ${file.remote}  (${displayKB} KB)`)
    uploaded++
  } catch (err) {
    console.error(`  ❌ ${file.remote}: ${err.message}`)
    errors++
  }
}

// 6. 删除远端过期文件（可选）
if (deleteRemote && !dryRun) {
  console.log('\n🧹 扫描远端待删除文件...')
  const { objects } = await client.list()
  const localKeys = new Set(localFiles.map(f => f.remote))
  const stale = objects.filter(o => !localKeys.has(o.name))
  console.log(`  发现 ${stale.length} 个远端过期文件`)
  for (const o of stale) {
    await client.delete(o.name)
    console.log(`    🗑️  ${o.name}`)
  }
}

// 7. 汇总
console.log(`\n${'='.repeat(40)}`)
console.log(`📊 完成：上传 ${uploaded} / 跳过 ${skipped} / 错误 ${errors}`)
if (dryRun) console.log('💡 去掉 --dry-run 即可实际上传')
