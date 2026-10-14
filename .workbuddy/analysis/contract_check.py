"""
前后端接口契约一致性校验
--------------------------------
对「前端 api 层实际发出的 URL」与「后端 OpenAPI 已注册路由」做逐条比对，
找出：
  A. 前端调用了但后端没有的接口（404 风险）
  B. 后端提供了但前端没用到的接口（死接口/待对接）
  C. 两边 HTTP 方法不一致的接口（405 风险）

用法：
    python contract_check.py                # 对比后端 http://127.0.0.1:8081
    python contract_check.py --base URL     # 指定后端地址
    python contract_check.py --offline      # 后端不可用时，仅统计前端调用清单
"""
import argparse
import json
import os
import re
import sys
import urllib.request
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FE_API = os.path.join(ROOT, 'frontend', 'src', 'api')

# 定位 HTTP 方法调用起点：只认 `service.get` 这类前缀，不解析 <泛型>
# （泛型里可能含 `;`、嵌套 `<>`，一旦参与匹配就会错位）
CALL_PREFIX_RE = re.compile(r'service\s*\.\s*(get|post|put|delete|patch)')
# 从调用点向后扫描第一个路径型引号字符串（含 '/ping' 这类非 /api/ 运维接口）
URL_AFTER_RE = re.compile(r'''(['"`])(/[^'"`]*)\1''', re.S)
# 注释（先剥离，避免把注释掉的示例代码算成真实调用）
BLOCK_COMMENT_RE = re.compile(r'/\*.*?\*/', re.S)
LINE_COMMENT_RE = re.compile(r'//[^\n]*')


def strip_comments(src: str) -> str:
    """移除注释但保持字符偏移与行数不变，便于后续定位。"""
    def blank(m):
        # 保留换行符数量，其余替换为空格
        return re.sub(r'[^\n]', ' ', m.group(0))
    src = BLOCK_COMMENT_RE.sub(blank, src)
    src = LINE_COMMENT_RE.sub(blank, src)
    return src
# 模板变量 ${xxx} -> {param}
TPL_RE = re.compile(r'\$\{[^}]*\}')


def normalize(path: str) -> str:
    """把前端模板字符串与后端路径参数统一成 {param} 形式，便于比对。"""
    p = TPL_RE.sub('{param}', path)
    p = re.sub(r'\{[a-zA-Z_][a-zA-Z0-9_]*\}', '{param}', p)
    p = p.rstrip('/') or '/'
    return p


def collect_frontend_calls():
    """返回 {(method, normalized_path): [源文件...]}"""
    calls = defaultdict(list)
    if not os.path.isdir(FE_API):
        return calls
    for dirpath, _, filenames in os.walk(FE_API):
        if '__tests__' in dirpath:
            continue
        for fn in filenames:
            if not fn.endswith('.ts'):
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, ROOT).replace('\\', '/')
            try:
                src = strip_comments(open(full, encoding='utf-8').read())
            except Exception:
                continue
            # 逐个调用处理：窗口截止到「下一个 service.xxx 调用」，防止越界抓到下个调用的 URL
            starts = [m for m in CALL_PREFIX_RE.finditer(src)]
            for i, m in enumerate(starts):
                method = m.group(1).upper()
                end = starts[i + 1].start() if i + 1 < len(starts) else len(src)
                seg = src[m.end(): min(end, m.end() + 1200)]
                um = URL_AFTER_RE.search(seg)
                if not um:
                    continue  # 该调用没有 /api/ 字面量（如 '/ping'、纯变量拼接）
                path = um.group(2)
                # 识别字符串拼接的动态参数：'/api/user/' + id  =>  /api/user/{param}
                tail = seg[um.end(): um.end() + 80]
                if re.match(r'\s*\+', tail):
                    path = path.rstrip('/') + '/{param}'
                calls[(method, normalize(path))].append(rel)
    return calls


def fetch_backend_spec(base: str):
    url = base.rstrip('/') + '/openapi.json'
    with urllib.request.urlopen(url, timeout=25) as resp:
        return json.loads(resp.read().decode('utf-8'))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://127.0.0.1:8081')
    ap.add_argument('--offline', action='store_true')
    args = ap.parse_args()

    fe = collect_frontend_calls()
    print('=' * 72)
    print('前后端接口契约一致性校验')
    print('=' * 72)
    print(f'前端 api 层提取到的调用：{len(fe)} 条（去重后 URL+方法）\n')

    be = {}
    if not args.offline:
        try:
            spec = fetch_backend_spec(args.base)
            for p, ops in spec.get('paths', {}).items():
                for m in ops:
                    if m.upper() in ('GET', 'POST', 'PUT', 'DELETE', 'PATCH'):
                        be[(m.upper(), normalize(p))] = True
            print(f'后端 OpenAPI 已注册路由：{len(be)} 条（{args.base}）\n')
        except Exception as e:
            print(f'!! 无法读取后端 OpenAPI：{e}')
            print('   后端接口清单缺失，仅输出前端侧清单\n')
            be = {}

    if not be:
        print('--- 前端调用清单 ---')
        for (m, p), files in sorted(fe.items()):
            print(f'  {m:7s} {p}    <- {files[0]}')
        return 0

    fe_keys, be_keys = set(fe), set(be)

    missing = sorted(fe_keys - be_keys)          # A 前端调了后端没有
    unused = sorted(be_keys - fe_keys)           # B 后端有前端没用
    matched = fe_keys & be_keys                  # C 完全匹配

    print('-' * 72)
    print(f'[结果] 完全匹配 {len(matched)} 条')
    print(f'[结果] A 前端调用但后端缺失：{len(missing)} 条   <-- 404 风险')
    print(f'[结果] B 后端存在但前端未用：{len(unused)} 条')
    print('-' * 72)

    if missing:
        print('\n### A. 前端调用 → 后端缺失（前端会 404 / 对接断裂）')
        for m, p in missing:
            files = sorted(set(fe[(m, p)]))
            # 是否存在同路径但方法不同的情况（405 而非 404）
            others = [mm for mm in ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')
                      if (mm, p) in be_keys]
            tag = f'   注意：该路径后端支持 {"/".join(others)}（疑似 405 而非 404）' if others else ''
            print(f'  [{m}] {p}{tag}')
            for f in files[:3]:
                print(f'         源码: {f}')

    if unused:
        print(f'\n### B. 后端存在 → 前端未调用（共 {len(unused)} 条，列前 30）')
        for m, p in unused[:30]:
            print(f'  [{m}] {p}')
        if len(unused) > 30:
            print(f'  ... 其余 {len(unused) - 30} 条省略')

    print('\n' + '=' * 72)
    verdict = 'PASS ✅ 前后端契约一致' if not missing else f'FAIL ❌ 存在 {len(missing)} 条对接断裂'
    print(f'判定：{verdict}')
    print('=' * 72)
    return 1 if missing else 0


if __name__ == '__main__':
    sys.exit(main())
