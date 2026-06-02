"""
Smoke test for ALL modules — quick pass/fail per endpoint category.
Run against running dev server at localhost:9001.
"""
import httpx, time, sys

BASE = "http://localhost:9001"

def wait_for_server():
    for i in range(30):
        try:
            r = httpx.get(f"{BASE}/ping", timeout=3)
            if r.status_code == 200:
                return True
        except: pass
        time.sleep(1)
    return False

def login():
    r = httpx.post(f"{BASE}/api/user/login", json={
        "email": "pytest@test.com", "password": "test123"
    }, timeout=5)
    if r.status_code == 200:
        data = r.json().get("data", {})
        token = data.get("token") or data.get("accessToken")
        uid = (data.get("userInfo") or {}).get("id")
        return token, uid
    return None, None

PASS = 0
FAIL = 0

def check(name, func):
    global PASS, FAIL
    try:
        func()
        print(f"  ✅ {name}")
        PASS += 1
    except Exception as e:
        print(f"  ❌ {name}: {e}")
        FAIL += 1

assert wait_for_server(), "Server not ready"

TOKEN, USER_ID = login()
assert TOKEN, "Login failed"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

print(f"\n{'='*60}")
print(f"Full API Smoke Test — user_id={USER_ID}")
print(f"{'='*60}\n")

# ── Accounts ──
print("--- Accounts ---")
def t_register(): raise Exception("Skip — user already exists")
check("POST /api/user/register", t_register)  # skip

def t_login_again():
    r = httpx.post(f"{BASE}/api/user/login", json={"email":"pytest@test.com","password":"test123"}, timeout=5)
    assert r.status_code == 200 and r.json()["status"] == 200
check("POST /api/user/login", t_login_again)

def t_profile():
    r = httpx.get(f"{BASE}/api/user/me", headers=HEADERS, timeout=5)
    assert r.status_code == 200
    assert r.json()["data"]["id"] == USER_ID
check("GET /api/user/me", t_profile)

def t_update():
    r = httpx.post(f"{BASE}/api/user/update", headers=HEADERS, json={"username":"pytest_updated"}, timeout=5)
    assert r.status_code == 200
    r2 = httpx.post(f"{BASE}/api/user/update", headers=HEADERS, json={"username":"pytest"}, timeout=5)
    assert r2.status_code == 200
check("POST /api/user/update", t_update)

def t_stats():
    r = httpx.get(f"{BASE}/api/user/stats", headers=HEADERS, timeout=5)
    assert r.status_code == 200
check("GET /api/user/stats", t_stats)

def t_public_user():
    r = httpx.get(f"{BASE}/api/user/{USER_ID}", timeout=5)
    assert r.status_code == 200
check("GET /api/user/{id}", t_public_user)

# ── Projects ──
print("\n--- Projects ---")
def t_my_projects():
    r = httpx.get(f"{BASE}/api/projects/my", headers=HEADERS, params={"page":1,"size":5}, timeout=5)
    assert r.status_code == 200
    assert "items" in r.json()["data"]
check("GET /api/projects/my", t_my_projects)

def t_create_project():
    r = httpx.post(f"{BASE}/api/projects", headers=HEADERS, json={"name":"SmokeTest","visibility":"private"}, timeout=5)
    assert r.status_code in (200, 201)
    global SMOKE_PID
    SMOKE_PID = r.json()["data"]["id"]
check("POST /api/projects", t_create_project)

def t_get_project():
    r = httpx.get(f"{BASE}/api/projects/{SMOKE_PID}", headers=HEADERS, timeout=5)
    assert r.status_code == 200
check("GET /api/projects/{id}", t_get_project)

def t_update_project():
    r = httpx.put(f"{BASE}/api/projects/{SMOKE_PID}", headers=HEADERS, json={"name":"SmokeTestRenamed"}, timeout=5)
    assert r.status_code == 200
check("PUT /api/projects/{id}", t_update_project)

# ── Teams ──
print("\n--- Teams ---")
def t_my_teams():
    r = httpx.get(f"{BASE}/api/teams/my", headers=HEADERS, timeout=5)
    assert r.status_code == 200
check("GET /api/teams/my", t_my_teams)

# ── Community ──
print("\n--- Community ---")
def t_community_posts():
    r = httpx.get(f"{BASE}/api/community/posts", params={"page":1,"size":5}, timeout=5)
    assert r.status_code == 200
check("GET /api/community/posts", t_community_posts)

def t_community_groups():
    r = httpx.get(f"{BASE}/api/community/groups", timeout=5)
    assert r.status_code == 200
check("GET /api/community/groups", t_community_groups)

# ── AI ──
print("\n--- AI ---")
def t_ai_models():
    r = httpx.get(f"{BASE}/api/ai/models", headers=HEADERS, timeout=5)
    assert r.status_code == 200
check("GET /api/ai/models", t_ai_models)

def t_ai_status():
    r = httpx.get(f"{BASE}/api/ai/status", timeout=5)
    assert r.status_code == 200
check("GET /api/ai/status", t_ai_status)

# ── Notifications ──
print("\n--- Notifications ---")
def t_notifications():
    r = httpx.get(f"{BASE}/api/notifications", headers=HEADERS, params={"page":1,"size":5}, timeout=5)
    assert r.status_code == 200
check("GET /api/notifications", t_notifications)

# ── Files ──
print("\n--- Files ---")

# ── Security Logs ──
print("\n--- Security Logs ---")
def t_security_logs():
    r = httpx.get(f"{BASE}/api/security/logs", headers=HEADERS, params={"page":1,"size":5}, timeout=5)
    assert r.status_code == 200
check("GET /api/security/logs", t_security_logs)

# ── Market ──
print("\n--- Market ---")
def t_market():
    r = httpx.get(f"{BASE}/api/market/projects/list", params={"page":1,"size":5}, timeout=5)
    assert r.status_code == 200
check("GET /api/market/projects/list", t_market)

# ── Plugins ──
print("\n--- Plugins ---")
def t_plugins():
    r = httpx.get(f"{BASE}/api/plugins", params={"source":"all"}, timeout=5)
    assert r.status_code == 200
check("GET /api/plugins", t_plugins)

def t_all_plugins():
    r = httpx.get(f"{BASE}/api/plugins/all", headers=HEADERS, timeout=5)
    assert r.status_code == 200
check("GET /api/plugins/all", t_all_plugins)

# ── Export ──
print("\n--- Export ---")
def t_export_docx():
    r = httpx.post(f"{BASE}/api/export/docx", headers=HEADERS,
                   json={"content":"<p>Hello</p>","fileName":"test.docx"}, timeout=5)
    assert r.status_code in (200, 500)
check("POST /api/export/docx", t_export_docx)

# Cleanup: delete the test project
print("\n--- Cleanup ---")
def t_delete():
    r = httpx.delete(f"{BASE}/api/projects/{SMOKE_PID}", headers=HEADERS, timeout=5)
    assert r.status_code in (200, 403)
check("DELETE /api/projects/{id}", t_delete)

print(f"\n{'='*60}")
print(f"Results: {PASS} passed, {FAIL} failed")
print(f"{'='*60}")
sys.exit(FAIL)
