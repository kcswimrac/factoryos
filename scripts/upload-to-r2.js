#!/usr/bin/env node
/**
 * Upload a file to Polsia R2 proxy
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const R2_BASE = 'polsia.com';
const API_KEY = process.env.POLSIA_API_KEY || 'company_42984_634ae6f92a708824ce8edf53a0bb4330';

async function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function tryEndpoint(method, path, body, extraHeaders = {}) {
  const options = {
    hostname: R2_BASE,
    path,
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'User-Agent': 'factoryos-upload',
      ...extraHeaders
    }
  };
  try {
    const res = await httpRequest(options, body);
    return res;
  } catch (e) {
    return { status: 0, body: e.message };
  }
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node upload-to-r2.js <file>');
    process.exit(1);
  }

  const fileData = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const mimeType = fileName.endsWith('.sql') ? 'application/sql' :
                   fileName.endsWith('.tar.gz') ? 'application/gzip' :
                   'application/octet-stream';

  console.log(`File: ${fileName}, Size: ${(fileData.length/1024).toFixed(1)} KB`);

  // Try common Polsia R2 proxy endpoints
  const endpoints = [
    { method: 'POST', path: '/r2/upload', key: 'factoryos/' + fileName },
    { method: 'POST', path: '/api/r2/upload', key: 'factoryos/' + fileName },
    { method: 'PUT', path: `/r2/factoryos/${fileName}`, key: null },
    { method: 'PUT', path: `/api/r2/factoryos/${fileName}`, key: null },
  ];

  for (const ep of endpoints) {
    console.log(`\nTrying ${ep.method} ${ep.path}...`);

    let body, headers;
    if (ep.method === 'POST') {
      // Try multipart
      const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
      const parts = [];
      if (ep.key) {
        parts.push(
          `--${boundary}\r\nContent-Disposition: form-data; name="key"\r\n\r\n${ep.key}`,
        );
      }
      parts.push(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`
      );
      const prefix = Buffer.from(parts.join('\r\n') + '\r\n');
      const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
      body = Buffer.concat([prefix, fileData, suffix]);
      headers = {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      };
    } else {
      body = fileData;
      headers = { 'Content-Type': mimeType, 'Content-Length': fileData.length };
    }

    const res = await tryEndpoint(ep.method, ep.path, body, headers);
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${res.body.slice(0, 300)}`);

    if (res.status >= 200 && res.status < 300) {
      console.log('\n✅ Upload succeeded!');
      try {
        const json = JSON.parse(res.body);
        console.log('URL:', json.url || json.key || JSON.stringify(json));
      } catch {}
      break;
    }
  }
}

main().catch(console.error);
