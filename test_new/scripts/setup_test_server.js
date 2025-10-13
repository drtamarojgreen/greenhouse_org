#!/usr/bin/env node

/**
 * Local Test Server Setup
 * 
 * Simple HTTP server for running tests locally.
 * Serves test files and simulates cross-origin scenarios.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const TEST_DIR = path.join(__dirname, '..');

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Create HTTP server
const server = http.createServer((req, res) => {
  // Parse URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Default to index.html for directory requests
  if (pathname === '/') {
    pathname = '/pages/schedule_test_page.html';
  }

  // Build file path
  const filePath = path.join(TEST_DIR, pathname);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      console.log(`404: ${pathname}`);
      return;
    }

    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 Internal Server Error</h1>');
        console.error(`Error reading file: ${filePath}`, err);
        return;
      }

      // Get file extension and MIME type
      const ext = path.extname(filePath);
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

      // Set CORS headers to simulate cross-origin scenario
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });

      res.end(data);
      console.log(`200: ${pathname} (${mimeType})`);
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log('\n========================================');
  console.log('Test Server Started');
  console.log('========================================');
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Test page: http://localhost:${PORT}/pages/schedule_test_page.html`);
  console.log('\nPress Ctrl+C to stop the server');
  console.log('========================================\n');
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nError: Port ${PORT} is already in use.`);
    console.error('Please close the other application or use a different port.\n');
  } else {
    console.error('\nServer error:', err);
  }
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});
