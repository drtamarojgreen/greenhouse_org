const http = require('http');
const path = require('path');
const fs = require('fs');

const port = 3003;

const server = http.createServer((req, res) => {
    if (req.url === '/apps/wv/backend/getBooks.web.js') {
        // Handle the API request for books
        const getBooksPath = path.join(__dirname, '../../wv/backend/getBooks.web.js');
        fs.readFile(getBooksPath, 'utf8', async (error, content) => {
            if (error) {
                console.error("Error reading getBooks.web.js:", error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Failed to load book data." }), 'utf-8');
                return;
            }

            try {
                // Dynamically import and execute the getBooks function
                // This requires Node.js to support dynamic import or a transpilation step
                // For simplicity, we'll simulate the execution by directly returning the data
                // In a real scenario, you'd use a module loader or a more robust approach
                const module = await import(getBooksPath);
                const bookResponse = module.default(req); // Assuming getBooks is the default export

                // Extract status and body from the Response object
                const status = bookResponse.status || 200;
                const headers = Object.fromEntries(bookResponse.headers.entries());
                const body = await bookResponse.json();

                res.writeHead(status, headers);
                res.end(JSON.stringify(body), 'utf-8');

            } catch (execError) {
                console.error("Error executing getBooks.web.js:", execError);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Failed to process book data." }), 'utf-8');
            }
        });
    } else {
        // Serve static files
        let filePath = '.' + req.url;
        if (filePath == './') {
            filePath = './index.html';
        }

        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css'
        }[extname] || 'application/octet-stream';

        fs.readFile(filePath, (error, content) => {
            if (error) {
                if(error.code == 'ENOENT'){
                    fs.readFile('./404.html', (error, content) => {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf-8');
                    });
                } else {
                    res.writeHead(500);
                    res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
