# Astro Keystatic Config Generator

## Overview

Astro Keystatic Config Generator is an Astro integration that automatically generates a Keystatic configuration based on your Astro content collections. This plugin simplifies the process of setting up Keystatic with Astro by creating and maintaining the necessary configuration files.

## Features

- Automatically generates a Keystatic configuration file based on your Astro content collections
- Creates a default content collection configuration if one doesn't exist
- Watches for changes in your content configuration and updates the Keystatic config accordingly
- Provides detailed logging for easy debugging

## Installation

To install the Astro Keystatic Config Generator, run the following command in your Astro project directory:

npm install astro-keystatic-config-generator

## Usage

1. Add the integration to your `astro.config.mjs`:

import { defineConfig } from 'astro/config';
import { astroCC2KS } from 'astro-cc2ks';

export default defineConfig({
  integrations: [astroCC2KS()],
});

2. Run your Astro build process:

npm run build

The plugin will automatically generate two files in your project root:

- `keystatic.generated.ts`: Contains the generated Keystatic collections based on your Astro content collections.
- `keystatic.config.ts`: A default Keystatic configuration file that imports and uses the generated collections.

3. (Optional) Customize your `keystatic.config.ts` file to add any additional Keystatic-specific configurations.

## Configuration

Currently, the plugin works out of the box without any additional configuration. Future versions may include customizable options.

## How It Works

1. The plugin reads your Astro content collections from `src/content/config.ts`.
2. It parses the collection schemas and transforms them into Keystatic field definitions.
3. The plugin generates a `keystatic.generated.ts` file with these field definitions.
4. If a `keystatic.config.ts` file doesn't exist, the plugin creates a default one that imports the generated collections.

## Structure
/
├── astro-cc2ks.ts         # Main entry point, exports the plugin
├── src/
│   └── astro-cc2ks/       # Plugin-specific subfolder
│       ├── cc2ks-Parser.ts         # Parses Astro content collection configurations and extracts schema information.
│       └── cc2ks-Transformer.ts    # Transforms the parsed Astro content collection schemas into Keystatic-compatible configuration objects.
├── package.json
├── README.md
└── tsconfig.json

## Troubleshooting

If you encounter any issues, check the console output for detailed error messages and stack traces. The plugin provides verbose logging to help diagnose problems.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.