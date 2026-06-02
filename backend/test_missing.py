"""
Comprehensive test for all missing endpoints.
Run against the running dev server.
"""
import httpx, sys, time

BASE = "http://localhost:9001"

def wait_for_server():
    for i in range(15):
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

def test(name, func):
    try:
        func()
        print(f"  ✅ {name}")
    except Exception as e:
        print(f"  ❌ {name}: {e}")
        import traceback; traceback.print_exc()

assert wait_for_server(), "Server not ready"
print("Server ready\n")

TOKEN, USER_ID = login()
assert TOKEN, "Login failed"
print(f"Logged in as user_id={USER_ID}\n")
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

# 1. Password Reset
def test_forgot_password():
    r = httpx.post(f"{BASE}/api/user/forgot-password", json={"email": "pytest@test.com"}, timeout=5)
    assert r.status_code == 200
    assert r.json()["status"] == 200

def test_validate_token_invalid():
    r = httpx.get(f"{BASE}/api/user/validate-reset-token", params={"token": "invalid"}, timeout=5)
    assert r.status_code in (200, 400)  # may succeed or fail gracefully

def test_reset_password_invalid():
    r = httpx.post(f"{BASE}/api/user/reset-password", json={"token": "bad", "password": "newpass123"}, timeout=5)
    assert r.status_code in (200, 400)

# 2. Admin
def test_get_all_users():
    r = httpx.get(f"{BASE}/api/user/getAllUsers", headers=HEADERS, params={"page": 1, "size": 5}, timeout=5)
    # 200 if admin, 403 if not admin — either proves the endpoint works
    assert r.status_code in (200, 403)
    if r.status_code == 200:
        data = r.json()["data"]
        assert "content" in data

def test_get_all_users_noauth():
    r = httpx.get(f"{BASE}/api/user/getAllUsers", params={"page": 1, "size": 5}, timeout=5)
    assert r.status_code == 401

# 3. User Plugins
def test_my_plugins():
    r = httpx.get(f"{BASE}/api/user/plugins", headers=HEADERS, timeout=5)
    assert r.status_code == 200
    assert "plugins" in r.json()["data"]

def test_my_plugin_keys():
    r = httpx.get(f"{BASE}/api/user/plugins/keys", headers=HEADERS, timeout=5)
    assert r.status_code == 200
    assert "pluginKeys" in r.json()["data"]

def test_plugin_check():
    r = httpx.get(f"{BASE}/api/user/plugins/check", headers=HEADERS, params={"pluginKey": "test"}, timeout=5)
    assert r.status_code == 200

# 4. Project Delete (create then delete)
def test_delete_project():
    # Create a project first
    r = httpx.post(f"{BASE}/api/projects", headers=HEADERS, json={
        "name": "TempDeleteProject", "visibility": "private"
    }, timeout=5)
    assert r.status_code == 201 or r.status_code == 200
    pid = r.json()["data"]["id"]
    # Delete it
    r = httpx.delete(f"{BASE}/api/projects/{pid}", headers=HEADERS, timeout=5)
    assert r.status_code == 200
    # Verify deleted
    r = httpx.get(f"{BASE}/api/projects/{pid}", headers=HEADERS, timeout=5)
    assert r.status_code == 404

# 5. Project Market
def test_market_list():
    r = httpx.get(f"{BASE}/api/market/projects/list", params={"page": 1, "size": 5}, timeout=5)
    assert r.status_code == 200
    data = r.json()["data"]
    assert "projects" in data

# 6. Project Comments
def test_comment_crud():
    # Get a project first
    r = httpx.get(f"{BASE}/api/projects/my", headers=HEADERS, params={"page": 1, "size": 1}, timeout=5)
    assert r.status_code == 200
    items = r.json()["data"].get("items", [])
    if not items:
        # Create a project
        r = httpx.post(f"{BASE}/api/projects", headers=HEADERS, json={
            "name": "CommentTest", "visibility": "public"
        }, timeout=5)
        assert r.status_code in (200, 201)
        pid = r.json()["data"]["id"]
    else:
        pid = items[0]["id"]

    # Create comment
    r = httpx.post(f"{BASE}/api/market/comments", headers=HEADERS, json={
        "projectId": pid, "content": "Test comment"
    }, timeout=5)
    assert r.status_code == 201 or r.status_code == 200
    cid = r.json()["data"]["id"]

    # Get comments
    r = httpx.get(f"{BASE}/api/market/comments/project/{pid}", timeout=5)
    assert r.status_code == 200
    assert len(r.json()["data"]) > 0

    # Get all comments
    r = httpx.get(f"{BASE}/api/market/comments/project/{pid}/all", timeout=5)
    assert r.status_code == 200

    # Get comment count
    r = httpx.get(f"{BASE}/api/market/comments/project/{pid}/count", timeout=5)
    assert r.status_code == 200
    assert r.json()["data"]["count"] >= 1

    # Update likes
    r = httpx.put(f"{BASE}/api/market/comments/{cid}/likes", params={"count": 5}, timeout=5)
    assert r.status_code == 200
    assert r.json()["data"]["likesCount"] == 5

    # Delete comment
    r = httpx.delete(f"{BASE}/api/market/comments/{cid}", headers=HEADERS, timeout=5)
    assert r.status_code == 200

# 7. Plugins
def test_list_plugins():
    r = httpx.get(f"{BASE}/api/plugins", params={"source": "all"}, timeout=5)
    assert r.status_code == 200
    assert "plugins" in r.json()["data"]

def test_list_all_plugins():
    r = httpx.get(f"{BASE}/api/plugins/all", headers=HEADERS, timeout=5)
    assert r.status_code == 200

# 8. Project Plugins
def test_project_plugins():
    # Get a project
    r = httpx.get(f"{BASE}/api/projects/my", headers=HEADERS, params={"page": 1, "size": 1}, timeout=5)
    assert r.status_code == 200
    items = r.json()["data"].get("items", [])
    if not items:
        return  # Skip if no project
    pid = items[0]["id"]

    # Get project plugins
    r = httpx.get(f"{BASE}/api/projects/{pid}/plugins", timeout=5)
    assert r.status_code == 200

    # Get plugin ids
    r = httpx.get(f"{BASE}/api/projects/{pid}/plugins/ids", timeout=5)
    assert r.status_code == 200

    # Get plugin keys
    r = httpx.get(f"{BASE}/api/projects/{pid}/plugins/keys", timeout=5)
    assert r.status_code == 200

# Run all tests
print("=== Missing Endpoints Tests ===\n")

print("--- Password Reset ---")
test("forgot_password", test_forgot_password)
test("validate_token_invalid", test_validate_token_invalid)
test("reset_password_invalid", test_reset_password_invalid)

print("\n--- Admin ---")
test("get_all_users", test_get_all_users)
test("get_all_users_requires_auth", test_get_all_users_noauth)

print("\n--- User Plugins ---")
test("my_plugins", test_my_plugins)
test("my_plugin_keys", test_my_plugin_keys)
test("plugin_check", test_plugin_check)

print("\n--- Project ---")
test("delete_project", test_delete_project)

print("\n--- Market ---")
test("market_list", test_market_list)

print("\n--- Comments ---")
test("comment_crud", test_comment_crud)

print("\n--- Plugins ---")
test("list_plugins", test_list_plugins)
test("list_all_plugins", test_list_all_plugins)
test("project_plugins", test_project_plugins)

print("\n=== DONE ===")
