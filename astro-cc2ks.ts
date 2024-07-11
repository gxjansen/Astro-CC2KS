import type { AstroIntegration } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { URL } from 'url';
import { parseContentConfig } from './src/astro-cc2ks/cc2ks-Parser';
import { transformToKeystaticConfig } from './src/astro-cc2ks/cc2ks-Transformer';

export function astroCC2KS(): AstroIntegration {
  return {
    name: 'astro-cc2ks',
    hooks: {
      'astro:config:setup': async ({ updateConfig, config, logger }) => {
        logger.info('Astro Content Collection To KeyStatic plugin initialized');

        const contentConfigPath = new URL('./src/content/config.ts', config.root).pathname;
        const keystaticConfigPath = new URL('./keystatic.config.ts', config.root).pathname;
        const keystaticGeneratedPath = new URL('./keystatic.generated.ts', config.root).pathname;

        async function generateKeystaticConfig() {
          try {
            logger.info(`Checking for content config at: ${contentConfigPath}`);
            logger.info(`Current working directory: ${process.cwd()}`);

            if (!await fileExists(contentConfigPath)) {
              logger.warn('No content config found. Creating a default one.');
              await ensureDirectoryExists(contentConfigPath);
              await createDefaultContentConfig(contentConfigPath);
              logger.info('Default content config created successfully.');
            } else {
              logger.info('Content config found. Proceeding with Keystatic config generation.');
            }

            logger.info('Parsing content config...');
            let contentConfig;
            try {
              contentConfig = parseContentConfig(contentConfigPath);
              logger.info('Content config parsed successfully.');
            } catch (error) {
              logger.error(`Error parsing content config: ${error instanceof Error ? error.message : String(error)}`);
              if (error instanceof Error && error.stack) {
                logger.error(`Stack trace: ${error.stack}`);
              }
              return; // Exit the function if parsing fails
            }

            logger.info('Transforming to Keystatic config...');
            logger.info(`Content config before transformation: ${JSON.stringify(contentConfig, null, 2)}`);
            const keystaticConfig = transformToKeystaticConfig(contentConfig);
            logger.info('Keystatic config transformation complete.');
            logger.info(`Generated Keystatic config: ${keystaticConfig}`);

            await writeKeystaticConfig(keystaticGeneratedPath, keystaticConfig, logger);

            if (!await fileExists(keystaticConfigPath)) {
              logger.info(`Creating default Keystatic config at: ${keystaticConfigPath}`);
              await createDefaultKeystaticConfig(keystaticConfigPath);
              logger.info('Default Keystatic config created successfully.');
            } else {
              logger.info('Keystatic config already exists. Skipping default config creation.');
            }

          } catch (error) {
            if (error instanceof Error) {
              logger.error(`Error generating Keystatic config: ${error.message}`);
              if (error.stack) {
                logger.error(`Stack trace: ${error.stack}`);
              }
            } else {
              logger.error(`Error generating Keystatic config: ${String(error)}`);
            }
          }
        }

        await generateKeystaticConfig();

        // Watch for changes in content config
        updateConfig({
          vite: {
            plugins: [{
              name: 'keystatic-config-regenerator',
              async handleHotUpdate({ file }) {
                if (file === contentConfigPath) {
                  logger.info(`Content config changed. Regenerating Keystatic config...`);
                  await generateKeystaticConfig();
                }
              },
            }],
          },
        });
      },
    },
  };
}

async function writeKeystaticConfig(configPath: string, config: string, logger: any): Promise<void> {
  try {
    logger.info(`Writing Keystatic config to: ${configPath}`);
    logger.info(`Config content: ${config}`);
    await fs.writeFile(configPath, config, 'utf-8');
    logger.info('Keystatic config written successfully.');
  } catch (error) {
    logger.error(`Error writing Keystatic config: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
  }
}

async function createDefaultKeystaticConfig(configPath: string): Promise<void> {
  const defaultConfig = `
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
`;
  await fs.writeFile(configPath, defaultConfig, 'utf-8');
}

async function createDefaultContentConfig(configPath: string): Promise<void> {
  const defaultConfig = `
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    author: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }).optional(),
    tags: z.array(z.string()).default(['uncategorized'])
  })
});

export const collections = {
  'blog': blogCollection,
};
`;
  await fs.writeFile(configPath, defaultConfig, 'utf-8');
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectoryExists(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}