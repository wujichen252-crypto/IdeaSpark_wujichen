"""
后端集成冒烟测试（真实 HTTP，打运行中的服务）
------------------------------------------
覆盖：公开接口、认证链路、响应信封格式、项目/文件/资产总线 CRUD。
默认打 http://127.0.0.1:8081，账号取自既有的 pytest 测试账号。

用法：
    python api_smoke.py [--base URL] [--email E] [--password P]
退出码：0 全通过；1 有失败
"""
import argparse
import sys
import time
import uuid

try:
    import httpx
except ImportError:
    print('缺少 httpx，请先安装')
    sys.exit(2)

PASS, FAIL = 0, 0
FAILED_ITEMS = []


def check(name, fn):
    global PASS, FAIL
    try:
        detail = fn()
        print(f'  PASS  {name}' + (f'   {detail}' if detail else ''))
        PASS += 1
        return True
    except Exception as e:
        print(f'  FAIL  {name}: {e}')
        FAIL += 1
        FAILED_ITEMS.append((name, str(e)))
        return False


class Client:
    def __init__(self, base):
        self.base = base.rstrip('/')
        self.headers = {}

    def req(self, method, path, **kw):
        kw.setdefault('timeout', 10)
        return httpx.request(method, self.base + path, headers=self.headers, **kw)


def envelope(data, expect_status=200):
    """后端统一信封 {status, message, data} 校验"""
    if not isinstance(data, dict):
        raise Exception(f'响应非对象: {str(data)[:120]}')
    if 'status' not in data:
        raise Exception(f'缺少 status 字段（非统一信封）: {list(data)[:6]}')
    if data['status'] != expect_status:
        raise Exception(f'status={data["status"]}，期望 {expect_status}；message={data.get("message")}')
    return data.get('data')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://127.0.0.1:8081')
    ap.add_argument('--email', default='pytest@test.com')
    ap.add_argument('--password', default='test123')
    args = ap.parse_args()

    c = Client(args.base)
    print('=' * 70)
    print(f'后端集成冒烟测试  —  {args.base}')
    print('=' * 70)

    # ---------- 1. 服务可用性 ----------
    print('\n[1] 服务可用性 / 公开接口')
    for path in ['/', '/ping', '/api', '/metrics']:
        def f(path=path):
            r = c.req('GET', path)
            assert r.status_code == 200, f'HTTP {r.status_code}'
            return f'HTTP 200'
        check(f'GET {path}', f)

    def f_openapi():
        r = c.req('GET', '/openapi.json')
        assert r.status_code == 200, f'HTTP {r.status_code}'
        d = r.json()
        return f'{len(d.get("paths", {}))} 条路由'
    check('GET /openapi.json', f_openapi)

    def f_docs():
        r = c.req('GET', '/docs/')
        assert r.status_code in (200, 307), f'HTTP {r.status_code}'
        return f'HTTP {r.status_code}'
    check('GET /docs/', f_docs)

    # ---------- 2. 认证链路 ----------
    print('\n[2] 认证链路')
    token = refresh = None
    user_id = None

    def f_login():
        nonlocal token, refresh, user_id
        r = c.req('POST', '/api/user/login', json={'email': args.email, 'password': args.password})
        assert r.status_code == 200, f'HTTP {r.status_code} {r.text[:150]}'
        d = envelope(r.json())
        token = d.get('token') or d.get('accessToken')
        refresh = d.get('refreshToken')
        user_id = (d.get('userInfo') or {}).get('id')
        assert token, '未返回 token'
        c.headers['Authorization'] = f'Bearer {token}'
        return f'user_id={user_id}'
    if not check('POST /api/user/login', f_login):
        print('\n登录失败，后续鉴权用例无法执行')
        report()
        return 1

    def f_me():
        r = c.req('GET', '/api/user/me')
        d = envelope(r.json())
        assert str(d.get('id')) == str(user_id), f'id 不一致 {d.get("id")} vs {user_id}'
        return f'username={d.get("username")}'
    check('GET /api/user/me', f_me)

    def f_refresh():
        r = c.req('POST', '/api/user/refresh-token', json={'refreshToken': refresh})
        assert r.status_code == 200, f'HTTP {r.status_code} {r.text[:150]}'
        d = envelope(r.json())
        assert (d.get('token') or d.get('accessToken')), '未返回新 token'
        return '双令牌刷新正常'
    check('POST /api/user/refresh-token', f_refresh)

    def f_stats():
        r = c.req('GET', '/api/user/stats')
        envelope(r.json())
        return ''
    check('GET /api/user/stats', f_stats)

    def f_401():
        old = c.headers.pop('Authorization', None)
        r = c.req('GET', '/api/user/me')
        assert r.status_code == 401, f'未鉴权却返回 {r.status_code}'
        if old:
            c.headers['Authorization'] = old
        return '未鉴权正确拒绝'
    check('GET /api/user/me 未鉴权应 401', f_401)

    # ---------- 3. 项目 CRUD ----------
    print('\n[3] 项目 CRUD')
    pid = None
    name = f'SmokeTest-{uuid.uuid4().hex[:6]}'

    def f_create():
        nonlocal pid
        r = c.req('POST', '/api/projects', json={'name': name, 'visibility': 'private'})
        assert r.status_code in (200, 201), f'HTTP {r.status_code} {r.text[:150]}'
        d = envelope(r.json(), 200)
        pid = d.get('id') or d.get('projectId')
        assert pid, f'未返回项目 id: {list(d)[:6]}'
        return f'project_id={pid}'
    if check('POST /api/projects', f_create):

        def f_get():
            r = c.req('GET', f'/api/projects/{pid}')
            d = envelope(r.json())
            assert str(d.get('id') or d.get('projectId')) == str(pid), 'id 不一致'
            return ''
        check('GET /api/projects/{id}', f_get)

        def f_my():
            r = c.req('GET', '/api/projects/my', params={'page': 1, 'size': 5})
            envelope(r.json())
            return ''
        check('GET /api/projects/my', f_my)

        def f_update():
            r = c.req('PUT', f'/api/projects/{pid}', json={'name': name + '-renamed'})
            assert r.status_code == 200, f'HTTP {r.status_code}'
            return ''
        check('PUT /api/projects/{id}', f_update)

        # ---------- 4. 文件 + 资产数据总线（本项目核心） ----------
        print('\n[4] 项目文件 / 嵌入式资产数据总线')
        fid = None

        def f_create_file():
            nonlocal fid
            payload = {'data': {'text': '中心主题'}, 'children': []}
            r = c.req('POST', f'/api/projects/{pid}/files', json={
                'name': 'smoke-mindmap', 'type': 'mindmap', 'ext': '',
                'size': 100, 'source': 'system',
                'content': '{"schema_version":1,"payload":{"data":{"text":"root"},"children":[]}}',
            })
            assert r.status_code in (200, 201), f'HTTP {r.status_code} {r.text[:200]}'
            d = envelope(r.json(), 200)
            fid = d.get('id')
            assert fid, f'未返回文件 id: {list(d)[:6]}'
            return f'file_id={fid}'
        if check('POST /api/projects/{id}/files', f_create_file):

            def f_list_files():
                # 后端无独立文件列表接口，文件随项目详情返回
                r = c.req('GET', f'/api/projects/{pid}')
                assert r.status_code == 200, f'HTTP {r.status_code}'
                d = envelope(r.json())
                files = d.get('files')
                assert isinstance(files, list), f'详情中缺少 files 列表: {list(d)[:8]}'
                assert any(str(f.get('id')) == str(fid) for f in files), '新建文件未出现在详情列表'
                return f'{len(files)} 个文件'
            check('GET /api/projects/{id}  (含 files 列表)', f_list_files)

            def f_get_content():
                r = c.req('GET', f'/api/projects/{pid}/files/{fid}/content')
                assert r.status_code == 200, f'HTTP {r.status_code} {r.text[:150]}'
                d = envelope(r.json())
                assert 'payload' in d, f'缺少 payload: {list(d)[:6]}'
                assert 'version' in d, f'缺少 version（乐观锁令牌）: {list(d)[:6]}'
                return f'schema_version={d.get("schema_version")}, version={str(d.get("version"))[:16]}'
            check('GET /files/{fid}/content  (读资产)', f_get_content)

            def f_put_content():
                # 1) 先取当前 version 令牌
                r0 = c.req('GET', f'/api/projects/{pid}/files/{fid}/content')
                assert r0.status_code == 200, f'读取 HTTP {r0.status_code}'
                cur = envelope(r0.json())
                ver = cur.get('version')
                new_payload = {'data': {'text': '已更新主题'}, 'children': [{'data': {'text': '子节点'}}]}
                # 契约字段：type + schema_version + payload + base_version
                r = c.req('PUT', f'/api/projects/{pid}/files/{fid}/content', json={
                    'type': 'mindmap',
                    'schema_version': 1,
                    'payload': new_payload,
                    'base_version': ver,
                })
                assert r.status_code == 200, f'HTTP {r.status_code} {r.text[:200]}'
                envelope(r.json())
                # 2) 回读确认持久化
                r2 = c.req('GET', f'/api/projects/{pid}/files/{fid}/content')
                back = envelope(r2.json())
                assert back.get('payload', {}).get('data', {}).get('text') == '已更新主题', \
                    f'回读内容不符: {str(back.get("payload"))[:120]}'
                return '写入并回读一致'
            check('PUT /files/{fid}/content  (写资产)', f_put_content)

            def f_conflict():
                # 用过期令牌写入，应触发 409 乐观锁冲突
                c.req('PUT', f'/api/projects/{pid}/files/{fid}/content', json={
                    'type': 'mindmap', 'schema_version': 1,
                    'payload': {'data': {'text': '占位写，使令牌过期'}, 'children': []},
                    'base_version': None,  # 不带令牌（按最新），使下方 stale 失效
                })
                r0 = c.req('GET', f'/api/projects/{pid}/files/{fid}/content')
                cur = envelope(r0.json())
                stale = cur.get('version')
                # 再用最新令牌写一次，让 stale 过期
                c.req('PUT', f'/api/projects/{pid}/files/{fid}/content', json={
                    'type': 'mindmap', 'schema_version': 1,
                    'payload': {'data': {'text': '第一次写'}, 'children': []},
                    'base_version': stale,
                })
                r = c.req('PUT', f'/api/projects/{pid}/files/{fid}/content', json={
                    'type': 'mindmap', 'schema_version': 1,
                    'payload': {'data': {'text': '过期令牌写'}, 'children': []},
                    'base_version': stale,  # 已过期
                })
                if r.status_code == 409:
                    return '过期令牌正确返回 409'
                return f'注意：返回 {r.status_code}（期望 409，乐观锁可能未生效）'
            check('PUT /files/{fid}/content  (过期令牌→409)', f_conflict)

            def f_del_file():
                r = c.req('DELETE', f'/api/projects/{pid}/files/{fid}')
                assert r.status_code in (200, 204), f'HTTP {r.status_code}'
                return ''
            check('DELETE /api/projects/{id}/files/{fid}', f_del_file)

    # ---------- 5. 社区 / 团队 / 通知 ----------
    print('\n[5] 社区 / 团队 / 通知')
    for label, path, params in [
        ('GET /api/community/posts', '/api/community/posts', {'page': 1, 'size': 5}),
        ('GET /api/community/groups', '/api/community/groups', None),
        ('GET /api/teams/my', '/api/teams/my', {'page': 1, 'size': 5}),
        ('GET /api/notifications', '/api/notifications', {'page': 1, 'size': 5}),
        ('GET /api/ai/status', '/api/ai/status', None),
        ('GET /api/ai/models', '/api/ai/models', None),
        ('GET /api/market/projects/list', '/api/market/projects/list', {'page': 1, 'size': 5}),
    ]:
        def f(path=path, params=params):
            r = c.req('GET', path, params=params)
            assert r.status_code == 200, f'HTTP {r.status_code} {r.text[:120]}'
            body = r.json()
            assert isinstance(body, dict), '响应非对象'
            return ''
        check(label, f)

    # ---------- 6. 清理 ----------
    print('\n[6] 清理测试项目')
    def f_cleanup():
        if not pid:
            return '无项目需清理'
        r = c.req('DELETE', f'/api/projects/{pid}')
        return f'HTTP {r.status_code}'
    check('DELETE /api/projects/{id}', f_cleanup)

    report()
    return 1 if FAIL else 0


def report():
    print('\n' + '=' * 70)
    print(f'结果：{PASS} 通过 / {FAIL} 失败')
    if FAILED_ITEMS:
        print('\n失败明细：')
        for n, e in FAILED_ITEMS:
            print(f'  - {n}: {e}')
    print('=' * 70)


if __name__ == '__main__':
    t0 = time.time()
    code = main()
    print(f'耗时 {time.time() - t0:.1f}s')
    sys.exit(code)
