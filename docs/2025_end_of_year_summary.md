# 2025 End of Year Summary: Greenhouse for Mental Health Development

## Introduction

This report summarizes the key development projects undertaken in 2025 for the Greenhouse for Mental Health's digital infrastructure. The projects span a wide range of technologies and platforms, from a comprehensive patient portal to a mobile meditation application and a machine learning pipeline for 3D brain model analysis.

## Core Architectural Improvements

### GitHub Integration and Decoupled Frontend

A major architectural improvement this year was the integration of the Wix website with custom JavaScript and CSS assets hosted on GitHub Pages. This decoupled frontend approach allows for more agile development cycles and easier updates to the website's interactive features. Many of the pages and applications listed below are built on this architecture.

### CSS Enhancements

Significant effort was put into improving the website's CSS, with a focus on best practices, cross-browser compatibility, and performance. This includes:

*   **Scoped CSS:** All new CSS classes are prefixed with `greenhouse-` to prevent collisions with the Wix platform.
*   **Cross-Browser Compatibility:** Vendor prefixes and fallbacks are used to ensure a consistent experience across all browsers.
*   **Modern CSS:** Features like Flexbox and media queries are used to create responsive and robust layouts.
*   **Performance:** CSS is loaded dynamically, with fallbacks in place to ensure the site remains functional even if the primary CSS fails to load.

### Homepage Animations

The homepage was enhanced with a variety of animations to create a more engaging and calming user experience. This includes a "watering can effect" and a "vine effect," as well as other subtle animations.

## Projects and Key Pages

### 1. MediTrack Patient Portal

A HIPAA and GDPR compliant healthcare application for managing patient records, appointments, therapy sessions, and medical assessments.

**Key Features:**

*   **Secure:** Multi-factor authentication, JWT-based authentication, role-based access control, and field-level encryption for sensitive data.
*   **Comprehensive:** Manages patient demographics, appointments, vital signs, therapy sessions, and more.
*   **Modern Tech Stack:** Built with Flask and vanilla JavaScript, with a PostgreSQL database.

### 2. Velo Backend Services

A collection of backend services for the main Wix website, `greenhousementalhealth.org`.

**Key Features:**

*   **Integrated:** Provides backend functionality for FAQs, guides, quizzes, and more, directly within the Wix platform.
*   **Seamless:** Uses Wix Velo's web modules to expose backend functions to the frontend.

### 3. Velo Interactive Scheduler

A frontend Velo application for the interactive appointment scheduler on the Greenhouse for Mental Health website.

**Key Features:**

*   **Interactive:** Allows users to dynamically filter services and therapists, select available time slots on a calendar, and book appointments in real-time.
*   **User-Friendly:** Uses a lightbox booking form for a smooth user experience.
*   **Integrated:** Fully integrated with the Velo backend functions for creating appointments and checking for conflicts.

### 4. Meditation Fields Mobile App

A web-based mobile application for meditation and wellness tracking.

**Key Features:**

*   **Holistic:** Tracks meditation, breathing rate, pulse, mood, and scheduling.
*   **Engaging:** Includes a guided meditation scene and a running routes map.
*   **Accessible:** Web-based application that can be accessed on any mobile device.

### 5. 3D Brain Model GNN Pipeline

A data processing pipeline for a Graph Neural Network (GNN) that analyzes a 3D brain model.

**Key Features:**

*   **Cutting-Edge:** Preprocesses a 3D brain model (`brain.fbx`) for use in a GNN.
*   **In-Depth Analysis:** Extracts vertices, faces, normals, and curvature from the 3D model.
*   **Machine Learning Ready:** Saves the processed data as NumPy arrays, ready for a machine learning pipeline.

### 6. Content Pages

Several new content pages were added to the website, all of which are built on the decoupled frontend architecture, fetching their content from external JSON files hosted on GitHub Pages. This makes them lightweight and easy to update.

*   **Videos Page:** Displays a list of videos from a static JSON file.
*   **Projects Page:** A "living portfolio" of community and development initiatives, with all project information fetched directly from GitHub Pages.
*   **Books Page:** Displays a list of recommended books from a static JSON file.

### 7. Interactive Simulation Pages

The website now includes several interactive simulation pages, which are loaded as external applications.

#### Models Page

This page serves as the foundational 3D visualization framework for the other simulation pages. It uses the HTML5 Canvas 2D API and a custom 3D math library to render neural networks. This innovative approach allows for the creation of complex 3D scenes without relying on WebGL, ensuring broad browser compatibility.

#### Neuro Page

The Neuro page is a sophisticated 3D visualization of a neural network, built on the "Models" framework. Its goal is to provide a research-grade, "Scientific Digital" interface for exploring the brain's structure and function.

**Key Features:**

*   **Detailed Visuals:** Renders neurons, synapses, and neurotransmitters with a high degree of detail.
*   **Dynamic Lighting:** Uses lighting effects, such as glows and depth fog, to enhance the 3D perception.
*   **Interactive Exploration:** Allows users to explore the neural network with camera controls and zoom into specific connections.

#### Genetic Page

The Genetic page is a 3D visualization of a genetic algorithm, also built on the "Models" framework. It demonstrates how genetic traits influence the structure and function of neural networks.

**Key Features:**

*   **Multi-Scale View:** A Picture-in-Picture (PiP) system allows for simultaneous views of the DNA double helix, a specific gene, the affected brain region, and the resulting protein structure.
*   **Gene Expression Visualization:** Shows how genes are expressed, with a "reading frame" box highlighting the active gene and an animation of a new mRNA strand being synthesized.
*   **Interactive Simulation:** Users can observe the genetic algorithm in action as it evolves a neural network over generations.

## Conclusion

The projects developed in 2025 represent a significant step forward for the Greenhouse for Mental Health's digital presence. The new patient portal, interactive scheduler, mobile app, and machine learning pipeline, combined with the architectural improvements and new content pages, provide a solid foundation for future growth and innovation.
