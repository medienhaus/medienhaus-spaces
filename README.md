<img src="./public/favicon.svg" width="70" />

### medienhaus/

Customizable, modular, free and open-source environment for decentralized, distributed communication and collaboration without third-party dependencies.

[Website](https://medienhaus.dev/) — [Fediverse](https://chaos.social/@medienhaus)

<br>

# medienhaus-spaces

This repository contains the code for the **medienhaus/** React application, which is designed to intuitively introduce all participants to the paradigm of federated communication through the modern technology our platform is built around.

The application itself is written in JavaScript, we're using the Next.js framework. Documentation can be found at [https://nextjs.org/docs](https://nextjs.org/docs).

## Development

If you don't want to dive deep and just get started use Docker. The provided `docker-compose.yml` file will fetch and start all necessary containers to develop, including a copy of Element. Just run `docker compose watch` to start. You can use `docker compose down` to stop & then also delete all containers.

### Installation

#### `npm install`

Installs all the application's dependencies.

### Configuration

Configuration happens in the `config.js` file.

### Available Scripts

In the project directory, you can run:

#### `npm run dev`

Runs the application in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

#### `npm run export`

Builds a production-ready version of the application and exports it to the `out` directory. The build is minified and the filenames include the hashes.

### Linting

We use [`ESLint`](https://github.com/eslint/eslint) and [`Prettier`](https://github.com/prettier/prettier). The respective configuration files should be detected automatically.

### Customisation

You can add custom styles by defining them in `users.css` file to the `assets` directory. This file will be loaded after the default styles.

_Don't forget to add `!important` to any rule overriding default styles._
