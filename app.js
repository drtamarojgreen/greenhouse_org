const path = require('node:path');
const express = require('express');

const app = express();
const projectRoot = __dirname;

app.use('/js', express.static(path.join(projectRoot, 'js')));

app.get('/css/model.css', (_request, response) => {
  response.sendFile(path.join(projectRoot, 'docs', 'css', 'model.css'));
});

app.get('/endpoints/models_pathways.json', (_request, response) => {
  response.sendFile(path.join(projectRoot, 'docs', 'endpoints', 'models_pathways.json'));
});

app.get('/endpoints/model_descriptions.xml', (_request, response) => {
  response.sendFile(path.join(projectRoot, 'docs', 'endpoints', 'model_descriptions.xml'));
});

app.get('/', (_request, response) => {
  response.sendFile(path.join(projectRoot, 'index.html'));
});

module.exports = app;

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`Greenhouse site listening on port ${port}`);
  });
}
