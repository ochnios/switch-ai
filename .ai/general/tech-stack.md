# Tech stack - switch-ai (MVP)

## Frontend - Astro with React for interactive components:

* Astro 5 allows for creating fast, efficient websites and applications with minimal JavaScript
* React 19 will provide interactivity where needed
* TypeScript 5 for static code typing and better IDE support
* Tailwind 4 allows for convenient application styling
* Shadcn/ui provides a library of available React components on which we will base the UI
* react-markdown with remark-gfm and rehype-highlight for rendering AI responses with GitHub Flavored Markdown and syntax highlighting

## Backend - Supabase as a comprehensive backend solution:

* Provides a PostgreSQL database
* Provides SDKs in many languages that will serve as Backend-as-a-Service
* It is an open-source solution that can be hosted locally or on your own server
* Has built-in user authentication

## AI - Communication with models via the Openrouter.ai service:

* Access to a wide range of models (OpenAI, Anthropic, Google, and many others), which will allow us to find a solution ensuring high efficiency and low costs
* Allows setting financial limits on API keys

## CI/CD and Hosting:

* Github Actions for creating CI/CD pipelines
* DigitalOcean for hosting applications via docker image
