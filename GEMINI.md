# SolvexIT Info Site

## Project Overview

This project is the source code for the **SolvexIT Information Site** (hosted at `SolvexIT.github.io`). It is a static Single Page Application (SPA)-style website designed to serve as a central hub for SolvexIT resources, links, and information.

The interface features a unique "Orbit Menu" for navigation, a background music player, and a powerful client-side search engine that indexes content from an external database.

### Key Technologies
*   **HTML5:** Semantic structure.
*   **CSS3:** Advanced styling with animations, flexbox/grid, and modular CSS files.
*   **JavaScript (Vanilla ES6+):** Core logic for UI interactions, data fetching, and search functionality. No frameworks (React/Vue/Angular) are used.
*   **External Data:** Content is fetched dynamically from a GitHub Gist JSON file.
*   **FontAwesome:** Used for icons via CDN.

## Architecture & Key Components

*   **Entry Point:** `index.html` is the main file that loads all styles and scripts.
*   **Orbit Menu (`JS/Main-menu.js`):** Implements the circular, rotating navigation menu. Handles menu state, history (back navigation), and folder rendering.
*   **Search Engine (`JS/search-engine.js`):**
    *   Fetches data from a remote JSON Gist.
    *   Implements client-side filtering by name, description, and tags.
    *   Features a "load more" pagination system and tag-based filtering.
    *   Uses debouncing for performance optimization on input.
*   **Music Player (`JS/music-player.js`):** Manages background audio playback and volume control.

## Building and Running

Since this is a purely static site, there is no build process (no Webpack, Vite, etc.).

### Local Development
1.  **Clone the repository.**
2.  **Open `index.html`** in your preferred web browser.
    *   *Note:* Due to CORS policies, some features (like fetching the JSON database) might require running a local server instead of just opening the file protocol (`file://`).
    *   **Recommended:** Use a simple HTTP server (e.g., VS Code "Live Server" extension, `python -m http.server`, or `npx serve`).

### Deployment
*   The site is hosted on **GitHub Pages**.
*   Changes pushed to the `main` branch are automatically deployed by GitHub.

## Directory Structure

*   **`CSS/`**: Stylesheets.
    *   `style.css`: Global styles and resets.
    *   `Main-menu.css`: Specific styles for the orbit menu.
    *   `search.css`: Styles for the search interface and results.
    *   `spa-transitions.css`: Animations for state changes.
*   **`JS/`**: JavaScript logic.
    *   `app.js`: Main entry logic (currently seems to be a duplicate or older version of logic found in `Main-menu.js` or `search-engine.js` - check imports in `index.html`).
    *   `Main-menu.js`: Logic for the orbit menu.
    *   `search-engine.js`: Logic for the search functionality.
    *   `music-player.js`: Logic for the audio player.
*   **`Media/`**: Static assets (images, logos).
*   **`Information/`**: (Appears empty or reserved for future static content).

## Development Conventions

*   **Code Style:** Standard JavaScript/CSS. No strict linting configuration is currently visible, but code generally follows modern ES6 conventions (const/let, arrow functions, fetch API).
*   **CSS:** Modularized by component/feature.
*   **External Dependencies:** Minimized. FontAwesome is loaded via CDN.
