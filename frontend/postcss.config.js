/**
 * PostCSS 配置
 * @description 仅启用 autoprefixer：按 package.json 的 browserslist 自动补齐
 *              -webkit- 等厂商前缀（重点覆盖 backdrop-filter / mask / appearance），
 *              避免 Safari、iOS WebView 下玻璃拟态与表单控件样式失效。
 */
export default {
  plugins: {
    autoprefixer: {}
  }
}
