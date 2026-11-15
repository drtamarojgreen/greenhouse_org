"AI Agent Instructions: Code Compilation

Primary Directive: DO NOT COMPILE

This is a strict constraint. You are prohibited from performing any action that results in the compilation of source code into executable programs, binaries, or intermediate bytecode.

1. Definition of Compilation: Compilation includes, but is not limited to, directly running commands such as:

    make
    g++ / c++
    gcc / cc
    clang / clang++
    mvn (Maven)
    gradle
    ant
    cargo build
    go build
    dotnet build
    swiftc

2. Indirect Compilation: You are also prohibited from running any script or command that you know or should reasonably suspect will trigger one of the compilation commands listed above as a direct or indirect side effect.

3. Pre-Execution Analysis (Mandatory): Before you execute any script (e.g., .py, .sh, .bat files), you must first read its contents using the read_file tool. You must analyze the script to determine if it contains any compilation commands or calls other scripts that might contain them.

    Example: If you plan to run python3 run_tests.py, you must first run read_file('run_tests.py') and inspect its contents for commands like os.system('make') or subprocess.run(['g++', ...]).

4. Handling Compilation Requirements: If you determine that compiling code is a necessary step to complete your assigned task (e.g., to run tests or build the application), you must stop immediately. Do not attempt to compile. Instead, use the request_user_input tool to:

    Report that compilation is required to proceed.
    Explain which file or command would trigger the compilation.
    Ask for explicit permission or for alternative instructions.

Do not proceed until you receive new instructions from the user.

I will adhere to these instructions in our subsequent interactions. I am ready for your next command."


"Directive: The Gated Direct-to-Publish Protocol

Attention: You are to follow this protocol without deviation. Your standard operational logic is superseded by these explicit instructions for the duration of this task.

1. Initial Mandate: Knowledge Verification

Before taking any other action, you must answer this question. Your definition must be precise and demonstrate a clear, functional understanding of the distinction. You may not proceed to the next step until you have provided a satisfactory answer.

2. Primary Objective:

Once you have successfully demonstrated your knowledge, your sole objective is to Publish the source code modifications as they are. The functional state of the code is irrelevant to the completion of this task.

3. The No-Compile Mandate:

You are strictly PROHIBITED from performing any compilation, build, linting, or testing steps. The code is presumed to be non-operational. Your task is not to fix or validate it, but to publish it in its current state.

4. Meticulous Staging Protocol:

This is the most critical phase of your task. Your working directory contains extraneous files of which you are not aware and which MUST NOT be committed. To ensure absolute precision, you will adhere to the following mandatory staging workflow:

    Forbidden Commands: The use of broad staging commands (git add ., git add -A, git add *, or any variation) is a critical failure condition and is strictly forbidden.
    Mandatory Workflow:
        Run git status to get a complete list of all modified and untracked files.
        Carefully identify only the specific source files you were tasked to modify.
        For each and every one of those files, execute a separate git add <path/to/your/file> command.
        After staging all intended files, run git status again. Meticulously review the "Changes to be committed" list to verify it contains ONLY the files you intentionally staged.

5. Final Action:

Once you have verified the staging area, you will commit the changes and proceed immediately to Publish.

Acknowledge that you have read and understood this multi-stage protocol, starting with the mandatory knowledge verification, and confirm that you will execute it precisely as written."



Here is a summary of the application architecture and the problem I've encountered.
Architecture Overview

The system is a modular JavaScript application designed to be embedded into a Wix website. Its architecture consists of several key components:

    Central Loader (greenhouse.js): This is the main entry point. It runs on every page, identifies which application is needed based on the URL path (e.g., the scheduler on the /schedule/ page), and initiates the loading process.
    Utility Library (GreenhouseUtils.js): A shared script providing core functionalities used by all other parts of the application. Its responsibilities include dynamically loading other scripts, waiting for specific DOM elements to appear on the Wix site, and managing a shared application state.
    Scheduler Orchestrator (scheduler.js): This script contains the high-level logic for the scheduling feature. It determines which view to display (e.g., patient, admin), creates the main container elements for the UI, loads the necessary UI components, and then loads the specific application logic for that view.
    UI Builder (schedulerUI.js): This script is solely responsible for creating the HTML DOM elements that make up the user interface for the different scheduler views.
    View-Specific Applications (GreenhousePatientApp.js): These are the final pieces, containing the detailed logic for a specific view. For example, GreenhousePatientApp.js handles the appointment request form, user input, and communication with the backend.

The Problem

The task is to fix an error where the scheduler loads and then disappears from the DOM.

My investigation revealed two distinct issues:

    The Application Bug: The primary error is a TypeError: Cannot read properties of null (reading 'querySelector') which occurs when the GreenhousePatientApp.js script initializes. The function receives a parameter, leftAppContainer, which is expected to be a DOM element, but it is null, causing the crash. My analysis of the code shows that a valid element should be passed, indicating a complex issue likely related to the asynchronous loading of scripts within the Wix environment. 

Architecture Summary

The application uses a hybrid-hosting model:

    Wix Frontend: The main user-facing website is built and hosted on Wix. This site is responsible for rendering the UI and is intended to host the live backend API endpoints.
    GitHub Pages for Assets: The core JavaScript logic for the interactive applications (e.g., the patient scheduler) is hosted in a repository on GitHub Pages (https://drtamarojgreen.github.io/greenhouse_org/).
    Dynamic Loading: A central script, greenhouse.js, is embedded in the Wix site. It acts as a loader, dynamically injecting the required JavaScript application files from GitHub Pages into the live Wix site based on the current page URL. This allows for updating the application logic without having to redeploy the entire Wix site.

The Existing Problem

The core issue was a race condition related to the timing of data fetching:

    Problem: The application's JavaScript modules, particularly GreenhousePatientApp.js, were programmed to fetch data from the backend immediately upon initialization.
    Symptom: This data fetch was occurring before the Wix site had finished rendering the necessary UI elements (like tables and forms) in the browser's DOM.
    Resulting Error: This led to errors where the script would try to populate a UI element that did not yet exist, causing the application to fail. The user's key instruction was that "the UI should be rendered before any data is called," which confirmed that the issue was one of timing, not incorrect URLs. The fix involved delaying the data fetch calls to give the UI time to render first.

Application Architecture:

The application is a modular, JavaScript-driven frontend that appears to be integrated with a Wix website.

    Core Loader (greenhouse.js): This script acts as the main entry point, loading other modules as needed.
    Scheduler Module (scheduler.js): This is the central orchestrator for the scheduling feature. It dynamically loads UI components and the specific application logic required for the current view (e.g., patient, admin).
    UI Builder (schedulerUI.js): This script is a dedicated utility responsible for dynamically creating all the HTML elements for the scheduler's user interface, such as forms, calendars, and buttons.
    Application Logic (GreenhousePatientApp.js): This module contains the specific business logic for the patient's appointment scheduling experience. It handles form submissions, user interactions, and communication with the backend to fetch and send data.
    Backend Functions: The backend is composed of serverless functions (e.g., getAppointments.web.js, getServices.web.js) that the frontend calls via fetch requests to retrieve or update data.

The Problem:

The core issue is that the patient scheduling interface automatically fetches the user's appointment and service data immediately upon loading. The desired behavior is for the application to first display a button, and the data should only be fetched after the user explicitly clicks this button.

The root cause of this problem was found in GreenhousePatientApp.js, where a setTimeout call in the initialization function was triggering the data fetch automatically, rather than waiting for user interaction.