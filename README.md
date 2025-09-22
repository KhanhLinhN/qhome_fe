## Getting Started
First, copy the example environment file and install the necessary dependencies using yarn:
```bash
cp .env.example .env
yarn
```

To start the development server, run the following command:
```bash
yarn dev
```
Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to see the result.

To add internationalization support for multiple languages, install the i18n library:
```bash
yarn install next-intl
```

To build and run the application using Docker, use this command:
```bash
docker compose up --build
```
Deployed web link:
[https://qhome.vercel.app/](https://qhome.vercel.app/)

## Architecture
- messages: Contains multiple language json
- src:
    - assets: Contains static files such as images, icons, etc.
    - components: Reusable React components.
    - hooks: Custom hooks for managing complex logic.
    - services: Modules for handling API calls and backend-related logic.
    - types: TypeScript type definitions.
    - utils: Shared utility functions used throughout the project.
    - i18n: Configuration translation files.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Tailwind](https://tailwindcss.com/plus/ui-blocks/documentation) - tailwind css document.
- [Next-intl](https://next-intl.dev/docs/getting-started) - i18n for Next.js document.
