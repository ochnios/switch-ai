# switch-ai

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-0.0.1-informational.svg)

## Table of Contents

* [Project Description](#project-description)
* [Tech Stack](#tech-stack)
* [Getting Started Locally](#getting-started-locally)
* [Available Scripts](#available-scripts)
* [Project Structure](#project-structure)
* [Project Scope](#project-scope)
* [Project Status](#project-status)
* [License](#license)

## Project Description

**switch-ai** is a chat application designed for advanced Large Language Model (LLM) users who require greater flexibility and control over their conversations. The application focuses on solving two key problems: the inability to seamlessly switch between different AI models within a single conversation, and the difficulty in exploring alternative threads without losing context.

The product offers a single, fluid interface that allows users to select an AI model for each message sent and to create new, independent conversation threads (branching). The application is aimed at "power users," operates on a BYOK (Bring Your Own Key) model with OpenRouter integration, and prioritizes functionality and workflow efficiency.

## Tech Stack

**Frontend:**

* Astro 5
* React 19
* TypeScript 5
* Tailwind CSS 4
* Shadcn/ui

**Backend:**

* Supabase (PostgreSQL) for data storage and authentication
* AI integration via OpenRouter.ai API

**Testing:**

* **Vitest** for unit tests, component tests, and integration tests (integrated with Vite ecosystem)
* **React Testing Library (RTL)** for testing React components in isolation
* **Playwright** for end-to-end (E2E) testing with API mocking capabilities
* **MSW (Mock Service Worker)** for API mocking in tests

**CI/CD / Deployment:**

* GitHub Actions for continuous integration and deployment
* DigitalOcean for hosting using Docker images

## Getting Started Locally

1. **Clone the repository:**
   ```sh
   git clone https://github.com/ochnios/switch-ai.git
   cd switch-ai
   ```

2. **Ensure you are using the correct Node version:**
   This project uses the Node version specified in the `.nvmrc` file. Currently it's **22.14.0**.
   ```sh
   nvm use
   ```

3. **Install dependencies:**
   ```sh
   npm install
   ```

4. **Run the development server:**
   ```sh
   npm run dev
   ```
   Open <http://localhost:3000> in your browser to view the application.

## Available Scripts

* **`npm run dev`**: Starts the development server.
* **`npm run build`**: Builds the project for production.
* **`npm run preview`**: Previews the production build locally.
* **`npm run astro`**: Runs Astro CLI commands.
* **`npm run lint`**: Runs ESLint to check for linting issues.
* **`npm run lint:fix`**: Automatically fixes linting issues.
* **`npm run format`**: Formats the code using Prettier.
* **`npm run test`**: Runs unit and component tests using Vitest.
* **`npm run test:e2e`**: Runs end-to-end tests using Playwright.

## Project Structure

```md
.
├── src/
│   ├── layouts/    # Astro layouts
│   ├── pages/      # Astro pages
│   │   └── api/    # API endpoints
│   ├── components/ # UI components (Astro & React)
│   └── assets/     # Static assets
├── public/         # Public assets
```

## Project Scope

The project is currently focused on delivering a Minimum Viable Product (MVP) with the core functionalities.

### In Scope for MVP:

* **User Authentication**: Simple user authentication (email/password).
* **API Key Management (BYOK)**: Securely save an OpenRouter API key.
* **Chat Interface**: A clean interface for text conversations.
* **Per-message Model Switching**: Select an AI model for each message from a searchable list.
* **Conversation Management**: Create, switch between, and delete conversations.
* **Conversation Branching**: Create new conversation threads from any message, either with the full history or from a generated summary.
* **Automatic Conversation Naming**: New conversations are automatically named based on the first message.
* **Token Counter**: Display an estimated token count for the current conversation.

### Out of Scope for MVP:

* Complex conversation visualization (e.g., a tree format).
* File attachments (images, documents).
* Assistant response streaming.
* Web search integration.
* Sharing and exporting conversations.
* Handling multiple conversations simultaneously in one view.

## Project Status

The project is currently in the MVP stage and under active development.

## License

This project is licensed under the MIT License.
