"""Run against the deployed WSL dashboard; secret only from stdin."""
import base64
import json
import sys
import urllib.request
import urllib.error

secret = sys.stdin.buffer.read().rstrip(b'\r\n')
auth = 'Basic ' + base64.b64encode(b'admin:' + secret).decode()
results = []
def request(path, expected, headers=None, method='GET'):
    req = urllib.request.Request('http://127.0.0.1:9337' + path, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            code, body = response.status, response.read()
    except urllib.error.HTTPError as error:
        code, body = error.code, error.read()
    assert code in expected, (path, code, body[:200])
    results.append({'path': path, 'status': code})
    return body

request('/', [200])
request('/api/stats', [401])
request('/api/stats', [401], {'Authorization': 'Basic ' + base64.b64encode(b'admin:wrong').decode()})
request('/api/stats', [403], {'Host': 'evil.example:9337', 'Authorization': auth})
request('/api/replay', [403], {'Authorization': auth})
request('/api/stats', [405], {'Authorization': auth}, method='POST')
request('/.git/config', [404])
request('/env/settings', [404])
for route in ['/stats', '/state', '/security/events?limit=100', '/security/events/counts', '/telemetry/health', '/fontes', '/cases', '/compliance/status', '/sentinel/status', '/sentinel/incidents?limit=100', '/sentinel/actions?limit=100']:
    body = request('/api' + route, [200], {'Authorization': auth})
    parsed = json.loads(body)
    if route == '/stats':
        print(json.dumps({'database_head': parsed.get('head')}))
    if route in ['/fontes', '/cases', '/sentinel/status']:
        print(json.dumps({'route': route, 'response_shape': list(parsed) if isinstance(parsed, dict) else 'array'}))
print(json.dumps({'checks': results, 'status': 'passed'}))
