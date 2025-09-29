# Integrating TissDB with Wix

## 1. Introduction

This guide will walk you through the process of connecting a TissDB database to a Wix site. This is achieved by creating a "Wix Adaptor," which is a web service that acts as a bridge between Wix and TissDB. The adaptor translates Wix Data API requests into TissDB API requests, allowing you to use TissDB as a backend for your Wix site.

## 2. Prerequisites

Before you begin, you will need the following:

*   A running instance of TissDB.
*   A Wix account with a site that has Dev Mode enabled.
*   Node.js and npm installed on your local machine.
*   A Heroku account (or another PaaS/container hosting solution).

## 3. TissDB API Overview

TissDB provides a RESTful API for interacting with the database. The key endpoints are:

### Collections:
*   `PUT /<collection_name>`: Create a collection.
*   `DELETE /<collection_name>`: Delete a collection.

### Documents:
*   `POST /<collection_name>`: Create a document.
*   `GET /<collection_name>/<document_id>`: Retrieve a document.
*   `PUT /<collection_name>/<document_id>`: Update a document.
*   `DELETE /<collection_name>/<document_id>`: Delete a document.

### Querying:
*   `POST /<collection_name>/_query`: Execute a TissQL query.

## 4. Wix Adaptor Design

The Wix adaptor is a Node.js application built with the Express framework. It implements the Wix External Database API and translates the requests to the TissDB API.

### Technology Stack

*   **Language:** Node.js
*   **Framework:** Express.js
*   **HTTP Client:** axios

### API Mapping

The adaptor maps the Wix Data API to the TissDB API as described in the implementation section.

### Data Transformation

The adaptor is responsible for managing the Wix system fields (`_id`, `_createdDate`, `_updatedDate`, `_owner`).

### Configuration

The adaptor is configured using environment variables:

*   `TISSDB_HOST`: The hostname of the TissDB server.
*   `TISSDB_PORT`: The port of the TissDB server.

## 5. Implementation Details

Here is a brief guide to implementing the Wix adaptor.

### Project Setup

```bash
mkdir wix-tissdb-adaptor
cd wix-tissdb-adaptor
npm init -y
npm install express axios dotenv uuid
```

### Code

Create a file named `index.js` with the following content:

```javascript
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const TISSDB_HOST = process.env.TISSDB_HOST || 'localhost';
const TISSDB_PORT = process.env.TISSDB_PORT || 8080;
const TISSDB_BASE_URL = `http://${TISSDB_HOST}:${TISSDB_PORT}`;

// Get item
app.get('/items/:collectionId/:itemId', async (req, res, next) => {
  try {
    const { collectionId, itemId } = req.params;
    const response = await axios.get(`${TISSDB_BASE_URL}/${collectionId}/${itemId}`);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Create item
app.post('/items/:collectionId', async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    const newItem = {
      ...req.body,
      _id: uuidv4(),
      _createdDate: new Date().toISOString(),
      _updatedDate: new Date().toISOString(),
    };
    await axios.post(`${TISSDB_BASE_URL}/${collectionId}`, newItem);
    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
});

// Update item
app.put('/items/:collectionId/:itemId', async (req, res, next) => {
    try {
        const { collectionId, itemId } = req.params;
        const updatedItem = {
            ...req.body,
            _updatedDate: new Date().toISOString(),
        };
        await axios.put(`${TISSDB_BASE_URL}/${collectionId}/${itemId}`, updatedItem);
        res.json(updatedItem);
    } catch (error) {
        next(error);
    }
});

// Delete item
app.delete('/items/:collectionId/:itemId', async (req, res, next) => {
    try {
        const { collectionId, itemId } = req.params;
        await axios.delete(`${TISSDB_BASE_URL}/${collectionId}/${itemId}`);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// Query items
app.post('/items/:collectionId/query', async (req, res, next) => {
    try {
        const { collectionId } = req.params;
        // This is a simplified implementation. A real implementation would need to
        // parse the Wix query and translate it to a TissQL query.
        const response = await axios.post(`${TISSDB_BASE_URL}/${collectionId}/_query`, {
            query: `SELECT * FROM ${collectionId}`
        });
        res.json(response.data);
    } catch (error) {
        next(error);
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  const status = error.response ? error.response.status : 500;
  const message = error.response ? error.response.data : 'Internal Server Error';
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Wix TissDB Adaptor listening on port ${PORT}`);
});
```

## 6. Deployment

You can deploy the adaptor to a PaaS like Heroku or using Docker.

### Heroku

```bash
Create a Procfile: web: node index.js
heroku create <app_name>
heroku config:set TISSDB_HOST=<your_tissdb_host> TISSDB_PORT=<your_tissdb_port>
git push heroku main
```

### Docker

*   Create a Dockerfile.
*   Build and push the image to a container registry.
*   Deploy the container to a cloud provider.

## 7. Connecting to Wix

1.  Open the Wix Editor and enable Dev Mode.
2.  Go to the "Databases" section.
3.  Click "Connect to External Database".
4.  Enter the URL of your deployed adaptor.
5.  Give the collection a name.
6.  Click "Save".

You can now use the external collection in your Wix site.

## 8. Integration Plan for the News Page

This section outlines the specific steps to integrate the news page with TissDB.

1.  **Set up the TissDB Wix Adaptor Project**
    *   Create a new directory named `wix-tissdb-adaptor` in the root of the repository.
    *   Inside the new directory, initialize a Node.js project by running `npm init -y`.
    *   Install the necessary dependencies: `npm install express axios dotenv uuid`.

2.  **Implement the TissDB Wix Adaptor**
    *   Create an `index.js` file inside the `wix-tissdb-adaptor` directory.
    *   Populate `index.js` with the provided adaptor code. This code will create an Express server that listens for requests from Wix.
    *   The adaptor will handle the following Wix Data operations:
        *   `GET /items/:collectionId/:itemId` (Get Item)
        *   `POST /items/:collectionId` (Create Item)
        *   `PUT /items/:collectionId/:itemId` (Update Item)
        *   `DELETE /items/:collectionId/:itemId` (Delete Item)
        *   `POST /items/:collectionId/query` (Query Items)
    *   The adaptor will translate these requests into the corresponding TissDB REST API calls.

3.  **Configure the TissDB Wix Adaptor**
    *   Create a `.env` file in the `wix-tissdb-adaptor` directory.
    *   Add the following environment variables to the `.env` file:
        ```
        TISSDB_HOST=your_tissdb_host
        TISSDB_PORT=your_tissdb_port
        ```
    *   Replace `your_tissdb_host` and `your_tissdb_port` with the actual connection details for the TissDB instance.

4.  **Deploy the TissDB Wix Adaptor**
    *   Choose a suitable platform for deploying the Node.js application (e.g., Heroku, as suggested in the guide).
    *   Create a `Procfile` in the `wix-tissdb-adaptor` directory with the content: `web: node index.js`.
    *   Follow the platform-specific instructions to deploy the application.
    *   Set the `TISSDB_HOST` and `TISSDB_PORT` environment variables in the deployment environment.

5.  **Connect Wix to the TissDB Adaptor**
    *   Open the Wix site editor and enable Dev Mode.
    *   Navigate to the "Databases" section.
    *   Click on "Connect to External Database".
    *   Enter the URL of the deployed TissDB Wix Adaptor.
    *   Create a new collection and name it "news".
    *   Save the configuration.

6.  **Update the News Page to Use the New Collection**
    *   Open the `News.js` file in the Wix Code editor (`apps/frontend/news/News.js`).
    *   Modify the code to query the new "news" external collection instead of fetching data from the static JSON file.
    *   The code will look something like this:
        ```javascript
        import wixData from 'wix-data';

        $w.onReady(function () {
            wixData.query("news")
                .find()
                .then((results) => {
                    $w("#newsRepeater").data = results.items;
                })
                .catch((err) => {
                    let errorMsg = err;
                    console.error(errorMsg);
                });

            $w("#newsRepeater").onItemReady(($item, itemData, index) => {
                $item("#newsHeadline").text = itemData.headline;
                $item("#newsDate").text = itemData.date;
                $item("#newsContent").text = itemData.content;
            });
        });
        ```

## 7. Testing and Verification

*   Use the Wix interface to add, edit, and delete news articles.
*   Verify that these operations are correctly persisted in the TissDB database by checking the database directly or by reloading the news page.
*   Ensure that existing news articles (if any) are correctly displayed on the page.
*   Run existing tests and create new ones for the TissDB integration if required.
