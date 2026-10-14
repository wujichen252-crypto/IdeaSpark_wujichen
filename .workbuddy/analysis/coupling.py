# -*- coding: utf-8 -*-
"""IdeaSpark 项目耦合度量化分析

分析内容:
  1. 前端: 模块依赖图(文件级 SCC 循环检测 / 目录级扇入扇出 / 分层违规)
  2. 后端: Django app 间依赖矩阵 + app 内分层违规
"""
import os
import re
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FE = os.path.join(ROOT, "frontend", "src")
BE = os.path.join(ROOT, "backend", "apps")

# ---------------------------------------------------------------- 前端
IMPORT_RE = re.compile(
    r"""(?:^|\n)\s*(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]"""
    r"""|import\(\s*['"]([^'"]+)['"]\s*\)""",
    re.M,
)
EXTS = [".ts", ".vue", ".js", ".tsx", ".jsx"]


def resolve(spec, from_file):
    from_file = os.path.normpath(from_file)
    if spec.startswith("@/"):
        base = os.path.normpath(os.path.join(FE, spec[2:]))
    elif spec.startswith("."):
        base = os.path.normpath(os.path.join(os.path.dirname(from_file), spec))
    else:
        return None  # 外部依赖
    for ext in EXTS:
        if os.path.isfile(base + ext):
            return os.path.normpath(base + ext)
    for ext in EXTS:
        idx = os.path.join(base, "index" + ext)
        if os.path.isfile(idx):
            return os.path.normpath(idx)
    if os.path.isfile(base):
        return os.path.normpath(base)
    return None


def collect_frontend():
    files = []
    for dp, _, fns in os.walk(FE):
        if "__tests__" in dp:
            continue
        for fn in fns:
            if fn.endswith((".ts", ".vue")) and not fn.endswith(".d.ts"):
                files.append(os.path.join(dp, fn))
    edges = defaultdict(set)  # file -> set(files)
    for f in files:
        with open(f, encoding="utf-8", errors="ignore") as fh:
            src = fh.read()
        for m in IMPORT_RE.finditer(src):
            spec = m.group(1) or m.group(2)
            if not spec or spec.endswith((".css", ".scss", ".json", ".svg", ".png")):
                continue
            tgt = resolve(spec, f)
            if tgt and tgt != f:
                edges[f].add(tgt)
    return files, edges


def layer_of(path):
    rel = os.path.relpath(path, FE)
    top = rel.split(os.sep)[0]
    return top if top != os.path.basename(path) else "(root)"


def tarjan_scc(nodes, edges):
    index, low, on, st = {}, {}, set(), []
    counter = [0]
    sccs = []

    def dfs(v):
        index[v] = low[v] = counter[0]
        counter[0] += 1
        st.append(v)
        on.add(v)
        for w in edges.get(v, ()):  # w must be node
            if w not in nodes:
                continue
            if w not in index:
                dfs(w)
                low[v] = min(low[v], low[w])
            elif w in on:
                low[v] = min(low[v], index[w])
        if low[v] == index[v]:
            comp = []
            while True:
                w = st.pop()
                on.discard(w)
                comp.append(w)
                if w == v:
                    break
            sccs.append(comp)

    sys.setrecursionlimit(10000)
    for v in nodes:
        if v not in index:
            dfs(v)
    return sccs


LAYER_RULES = {
    # layer: 不允许依赖的层
    "api": ["store", "components", "views", "composables"],
    "utils": ["api", "store", "components", "views", "composables", "router"],
    "constants": ["api", "store", "components", "views", "composables", "router"],
    "store": ["components", "views", "router"],
    "composables": ["components", "views", "router"],
    "components": ["views"],
    "router": ["views"],
    "plugins": ["views"],
}


def frontend_report():
    files, edges = collect_frontend()
    nodes = set(files)
    sccs = tarjan_scc(nodes, edges)
    cycles = [c for c in sccs if len(c) > 1]
    self_loops = [(f,) for f in files if f in edges.get(f, ())]

    # 分层违规
    violations = []
    for f, tgts in edges.items():
        lf = layer_of(f)
        bad = set(LAYER_RULES.get(lf, []))
        if not bad:
            continue
        for t in tgts:
            lt = layer_of(t)
            if lt in bad:
                violations.append((os.path.relpath(f, FE), os.path.relpath(t, FE)))

    # 目录级扇入/扇出
    dir_fan_out = defaultdict(set)
    dir_fan_in = defaultdict(set)
    for f, tgts in edges.items():
        lf = layer_of(f)
        for t in tgts:
            lt = layer_of(t)
            if lt != lf:
                dir_fan_out[lf].add(lt)
                dir_fan_in[lt].add(lf)

    print("=" * 64)
    print("前端依赖分析  ({} 个模块)".format(len(files)))
    print("=" * 64)

    print("\n[1] 循环依赖 (SCC > 1): {}".format(len(cycles)))
    for c in sorted(cycles, key=len, reverse=True)[:10]:
        print("    环大小 {}: {}".format(len(c), " -> ".join(os.path.basename(x) for x in c[:8])))

    print("\n[2] 文件级依赖边总数: {}  平均扇出: {:.2f}".format(
        sum(len(t) for t in edges.values()),
        sum(len(t) for t in edges.values()) / max(len(files), 1)))

    print("\n[3] 目录间耦合矩阵 (扇出 -> 被依赖层):")
    for lf in sorted(dir_fan_out):
        print("    {:12s} -> {}".format(lf, ", ".join(sorted(dir_fan_out[lf]))))

    print("\n[4] 各层被依赖度 (扇入):")
    for lt in sorted(dir_fan_in, key=lambda x: -len(dir_fan_in[x])):
        print("    {:12s} <- {} 层".format(lt, len(dir_fan_in[lt])))

    print("\n[5] 分层违规 (共 {} 条):".format(len(violations)))
    seen = set()
    for a, b in sorted(violations):
        key = (layer_of(os.path.join(FE, a)), layer_of(os.path.join(FE, b)))
        if key in seen:
            continue
        seen.add(key)
        cnt = sum(1 for x, y in violations if (layer_of(os.path.join(FE, x)), layer_of(os.path.join(FE, y))) == key)
        print("    {:12s} -> {:12s} ({} 条)  例: {} -> {}".format(key[0], key[1], cnt, a, b))

    # 文件级扇出 top
    print("\n[6] 扇出最高文件 (top 10):")
    for f in sorted(files, key=lambda x: -len(edges[x]))[:10]:
        print("    {:3d}  {}".format(len(edges[f]), os.path.relpath(f, FE)))
    fanin = defaultdict(int)
    for f, tgts in edges.items():
        for t in tgts:
            fanin[t] += 1
    print("\n[7] 扇入最高文件 (top 10):")
    for f in sorted(files, key=lambda x: -fanin[x])[:10]:
        print("    {:3d}  {}".format(fanin[f], os.path.relpath(f, FE)))
    return files, edges


# ---------------------------------------------------------------- 后端
PY_IMPORT_RE = re.compile(
    r"^\s*(?:from\s+(apps\.[\w.]+)\s+import|import\s+(apps\.[\w.]+))", re.M)


def backend_report():
    apps = defaultdict(list)  # app -> [files]
    edges = defaultdict(set)
    for dp, _, fns in os.walk(BE):
        if "__pycache__" in dp:
            continue
        for fn in fns:
            if fn.endswith(".py"):
                f = os.path.join(dp, fn)
                rel = os.path.relpath(f, BE)
                app = rel.split(os.sep)[0]
                apps[app].append(f)
                with open(f, encoding="utf-8", errors="ignore") as fh:
                    src = fh.read()
                for m in PY_IMPORT_RE.finditer(src):
                    target = m.group(1) or m.group(2)
                    tgt_app = target.split(".")[1]
                    if tgt_app != app:
                        edges[app].add(tgt_app)

    print("\n" + "=" * 64)
    print("后端 App 依赖分析  ({} 个 app / {} 个 py 文件)".format(len(apps), sum(len(v) for v in apps.values())))
    print("=" * 64)
    print("\n[1] App 间依赖 (谁依赖谁):")
    for a in sorted(edges):
        print("    {:16s} -> {}".format(a, ", ".join(sorted(edges[a]))))
    if not edges:
        print("    (无跨 app 依赖)")

    # app 内分层违规: services 不应 import api; models 不应 import services/api
    print("\n[2] App 内分层违规检查:")
    viol = []
    for app, fs in apps.items():
        for f in fs:
            rel = os.path.relpath(f, BE)
            with open(f, encoding="utf-8", errors="ignore") as fh:
                src = fh.read()
            deps = set(m.group(1) or m.group(2) for m in PY_IMPORT_RE.finditer(src))
            for d in deps:
                parts = d.split(".")
                if len(parts) < 3 or parts[1] != app:
                    continue
                tail = parts[2] if len(parts) > 2 else ""
                if "services" in rel and tail == "api":
                    viol.append((rel, d))
                if "models" in rel and tail in ("services", "api"):
                    viol.append((rel, d))
    if viol:
        for a, b in viol:
            print("    [违规] {} -> {}".format(a, b))
    else:
        print("    (未发现 services->api / models->services 违规)")

    # 文件级扇出
    print("\n[3] 后端文件跨 app 依赖明细:")
    for app, fs in sorted(apps.items()):
        hits = []
        for f in fs:
            with open(f, encoding="utf-8", errors="ignore") as fh:
                src = fh.read()
            for m in PY_IMPORT_RE.finditer(src):
                d = m.group(1) or m.group(2)
                if d.split(".")[1] != app:
                    hits.append((os.path.relpath(f, BE), d))
        if hits:
            for h in hits[:6]:
                print("    {} -> {}".format(h[0], h[1]))
            if len(hits) > 6:
                print("    ... 共 {} 处".format(len(hits)))
    return apps, edges


if __name__ == "__main__":
    frontend_report()
    backend_report()
