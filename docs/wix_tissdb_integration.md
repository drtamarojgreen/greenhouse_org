# Integrating TissDB with Wix

This document provides a detailed guide on how to integrate the TissDB database with a Wix website.

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

*   **Collections:**
    *   `PUT /<collection_name>`: Create a collection.
    *   `DELETE /<collection_name>`: Delete a collection.
*   **Documents:**
    *   `POST /<collection_name>`: Create a document.
    *   `GET /<collection_name>/<document_id>`: Retrieve a document.
    *   `PUT /<collection_name>/<document_id>`: Update a document.
    *   `DELETE /<collection_name>/<document_id>`: Delete a document.
*   **Querying:**
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

1.  Create a `Procfile`: `web: node index.js`
2.  `heroku create <app_name>`
3.  `heroku config:set TISSDB_HOST=<your_tissdb_host> TISSDB_PORT=<your_tissdb_port>`
4.  `git push heroku main`

### Docker

1.  Create a `Dockerfile`.
2.  Build and push the image to a container registry.
3.  Deploy the container to a cloud provider.

## 7. Connecting to Wix

1.  Open the Wix Editor and enable Dev Mode.
2.  Go to the "Databases" section.
3.  Click "Connect to External Database".
4.  Enter the URL of your deployed adaptor.
5.  Give the collection a name.
6.  Click "Save".

You can now use the external collection in your Wix site.

## 8. Connecting the News Page

Once you have deployed the Wix Adaptor and connected it to your Wix site as an external database collection named `news`, you can update your "News" page to fetch its content from TissDB.

This involves modifying the frontend code to use the `wix-data` API instead of `wix-fetch`.

### Updating the Frontend Code

Here is the updated code for `apps/frontend/news/News.js`:

```javascript
import wixData from 'wix-data';

$w.onReady(function () {
    // The header text can be set manually in the editor or fetched from another source
    // if it's not part of the 'news' collection in TissDB.

    wixData.query("news") // Use the name of your external collection
        .find()
        .then((results) => {
            if (results.items.length > 0) {
                $w("#newsRepeater").data = results.items;
            } else {
                // Optional: Display a message if no news is available
                console.log("No news items found in TissDB.");
                $w("#newsRepeater").data = []; // Clear the repeater
            }
        })
        .catch((err) => {
            console.error("Error querying 'news' collection from TissDB:", err);
            // Optional: Display an error message to the user
            // $w("#errorMessage").text = "Could not load news at this time.";
            // $w("#errorMessage").show();
        });

    $w("#newsRepeater").onItemReady(($item, itemData, index) => {
        // The field names must match the fields in your TissDB documents.
        // The Wix Adaptor will pass them through.
        $item("#newsHeadline").text = itemData.headline;
        $item("#newsDate").text = itemData.date;
        $item("#newsContent").text = itemData.content;
        // For images, you would set the 'src' property if you have an image element
        // $item("#newsImage").src = itemData.imageUrl;
    });
});
```

With this change, your News page is now fully integrated with TissDB as its backend, allowing for dynamic content updates.
