<img src="./public/favicon.svg" width="70" />

### medienhaus/

Customizable modular free and open-source environment for decentralized, distributed communication and collaboration.

[Website](https://medienhaus.dev/) — [Twitter](https://twitter.com/medienhaus_)

<br>

# medienhaus-spaces

This repository contains the code for the **medienhaus/** React application, which is designed to intuitively introduce all participants to the paradigm of federated communication through the modern technology our platform is built around.

The application itself is written in JavaScript, we're using the Next.js framework. Documentation can be found at [https://nextjs.org/docs](https://nextjs.org/docs).

## Development

If you don't want to dive deep and just get started use Docker. The provided `docker-compose.yml` file will fetch and start all necessary containers to develop, including a copy of Element. Just run `docker-compose up -d` to start, and `docker-compose down` to stop & delete all containers.

### Installation

#### `npm install`

Installs all of the application's dependencies.

### Configuration

Configuration happens in the `next.config.js` file.

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

We use [`ESLint`](https://github.com/eslint/eslint) and [`Stylelint`](https://github.com/stylelint/stylelint). The respective configuration files should be detected automatically. For `stylelint` it might be important to tell your editor or IDE to not only check `.css` files, but also `.js` files because we're using styled components.

### Notes

When wrapping a [Link](https://nextjs.org/docs/api-reference/next/link) from `next/link` within a styled-component, the [as](https://styled-components.com/docs/api#as-polymorphic-prop) prop provided by `styled` will collide with the Link's `as` prop and cause styled-components to throw an `Invalid tag` error. To avoid this, you can either use the recommended [forwardedAs](https://styled-components.com/docs/api#forwardedas-prop) prop from styled-components or use a different named prop to pass to a `styled` Link.

<details>
<summary>Click to expand workaround example</summary>
<br />

**components/StyledLink.js**

```javascript
import Link from 'next/link'
import styled from 'styled-components'

const StyledLink = ({ as, children, className, href }) => (
  <Link href={href} as={as} passHref>
    <a className={className}>{children}</a>
  </Link>
)

export default styled(StyledLink)`
  color: #0075e0;
  text-decoration: none;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: #40a9ff;
  }

  &:focus {
    color: #40a9ff;
    outline: none;
    border: 0;
  }
`
```

**pages/index.js**

```javascript
import StyledLink from '../components/StyledLink'

export default () => (
  <StyledLink href="/post/[pid]" forwardedAs="/post/abc">
    First post
  </StyledLink>
)
```

</details>
