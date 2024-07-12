# Astro Content Collections To KeyStatic (CC2KS)

## Overview

Manually keeping your Astro Content Collection config file in sync with the Keystatic config file is both annoying and error prone.

**Astro CC2KS** is an Astro plugin that takes your ***C***ontent ***C***ollections `config.ts` and automatically converts those ***to*** a ***K***ey***S***tatic configuration file `keystatic.config.ts`, simplifying the process a lot.

## Features

- Automatically generates a Keystatic configuration file based on your Astro content collections 
- Watches for changes in your content configuration and updates the Keystatic config accordingly on each build
- Provides detailed logging for easy debugging

Additionally for fresh installs:
- Creates a default content collection configuration file if one doesn't exist
- Creates a default KeyStatic configuration file if one doesn't exist

## Installation

To install the Astro Keystatic Config Generator, run the following command in your Astro project directory:

`npm i astro-cc2ks`

This assumes that you... 
* ... already have your **Astro Keystatic integration** setup. If not, [do that first](https://docs.astro.build/en/guides/cms/keystatic/):
  * `npm install @keystatic/core @keystatic/astro`
  * `npx astro add react markdoc`
* ... already have an **SSR Adapter** installed like Vercel or Netlify. This is needed to run Astro in Hybrid or SSR mode which is required for KeyStatic. If not, [do that first](https://docs.astro.build/en/guides/integrations-guide/), e.g.:
  * `npx astro add netlify`
  or
  * `npx astro add @astrojs/vercel`

## Usage

### 1. Install the plugin
Add the integration to your `astro.config.mjs` by adding ``import { astroCC2KS } from 'astro-cc2ks';`` and `astroCC2KS()` to the integrations. 

Example `astro.config.mjs` file:

```
import { defineConfig } from 'astro/config';

import react from "@astrojs/react";
import markdoc from "@astrojs/markdoc";
import keystatic from '@keystatic/astro';
import netlify from "@astrojs/netlify";
import { astroCC2KS } from 'astro-cc2ks';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), markdoc(), keystatic(), astroCC2KS()],
  output: 'hybrid',
  adapter: netlify()
});
```

### 2. Adjust your existing keystatic config (if applicable)
If you already have a `keystatic.config.ts` file, replace the collection part with `collections: {
    ...generatedCollections,
  },`

So it looks like this:
```
import { config } from '@keystatic/core';
import { generatedCollections } from './keystatic.generated';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    ...generatedCollections,
    // Add any additional collections or overrides here
  },
  // Add any other Keystatic-specific configurations here
});
```
If it's a new Astro installation and you don't have this file yet it will be created for you.

Optionally, you can customize your `keystatic.config.ts` file to add any additional Keystatic-specific configurations. See [KeyStatic Configuration](https://keystatic.com/docs/configuration).

### 3. Run your Astro build process

`npm run build`

The plugin will automatically generate two files in your project root:

- `keystatic.generated.ts`: Contains the generated Keystatic collections based on your Astro content collections.
- `keystatic.config.ts` (if it doesn't exist yet): A default Keystatic configuration file that imports and uses the generated collections. If you already have this file, it won't override it and you need to look at step #2 above.

`npm run dev` and go to `127.0.0.1:4321/admin` to validate if the conversion was done correctly.

## Configuration

Currently, the plugin works out of the box without any additional configuration. Future versions may include customizable options. Please add your requests to [Issues](https://github.com/gxjansen/Astro-CC2KS/issues).

## How It Works

1. The plugin reads your Astro content collections from `src/content/config.ts`. If no config.ts exists yet, a default one will be created for you.
2. It parses the collection schemas and transforms them into Keystatic field definitions.
3. The plugin generates a `keystatic.generated.ts` file with these field definitions.
4. If a `keystatic.config.ts` file doesn't exist, the plugin creates a default one that imports the generated collections.

## Structure
```md
/
├── astro-cc2ks.ts                # Main entry point, exports the plugin
├── src/
│   └── astro-cc2ks/              # Plugin-specific subfolder
│       ├── cc2ks-Parser.ts       # Parses Astro CC config.
│       └── cc2ks-Transformer.ts  # Transforms parsed schemas into Keystatic config
├── package.json
├── README.md
└── tsconfig.json
```

## Troubleshooting

If you encounter any issues, check the console output for detailed error messages and stack traces. The plugin provides verbose logging to help diagnose problems.

Still stuck? Report to [Issues](https://github.com/gxjansen/Astro-CC2KS/issues).

## Contributing

Contributions are welcome! Please feel free to submit a [Pull Request](https://github.com/gxjansen/Astro-CC2KS/pulls).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
