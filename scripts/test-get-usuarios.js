const http = require('http');

function postJson(path, body) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function getJson(path, token) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
                } catch {
                    resolve({ statusCode: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function runTest() {
    try {
        console.log('Logging in as admin/1234...');
        const loginRes = await postJson('/api/login', { nombre: 'admin', contrasena: '1234' });
        if (!loginRes.body.success || !loginRes.body.token) {
            console.error('Failed login:', loginRes.body);
            return;
        }

        const token = loginRes.body.token;
        console.log('Calling GET /api/usuarios...');
        const usersRes = await getJson('/api/usuarios', token);
        console.log('Status Code:', usersRes.statusCode);
        console.log('Users:', usersRes.body);
    } catch (err) {
        console.error('Error:', err);
    }
}

runTest();
