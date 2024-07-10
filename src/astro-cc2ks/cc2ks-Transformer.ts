// src/contentToKeystaticTransformer.ts

import type { ParsedConfig, SchemaField } from './contentConfigParser';

export function transformToKeystaticConfig(contentConfig: ParsedConfig): string {
  let keystaticConfig = `// @ts-nocheck
// This file is automatically generated. Do not modify it manually.

import { collection, fields } from '@keystatic/core';\n\n`;
  keystaticConfig += `export const generatedCollections = {\n`;

  for (const [collectionName, collection] of Object.entries(contentConfig.collections)) {
    keystaticConfig += `  ${collectionName}: collection({\n`;
    keystaticConfig += `    label: '${capitalizeFirstLetter(collectionName)}',\n`;
    keystaticConfig += `    schema: {\n`;

    for (const [fieldName, field] of Object.entries(collection.schema)) {
      keystaticConfig += `      ${fieldName}: ${transformField(field)},\n`;
    }

    keystaticConfig += `    },\n`;
    keystaticConfig += `  }),\n`;
  }

  keystaticConfig += `};\n`;
  return keystaticConfig;
}

function transformField(field: SchemaField): string {
  switch (field.type) {
    case 'string':
      return `fields.text({ label: '${capitalizeFirstLetter(field.name)}' ${field.isOptional ? ', optional: true' : ''} })`;
    case 'number':
      return `fields.number({ label: '${capitalizeFirstLetter(field.name)}' ${field.isOptional ? ', optional: true' : ''} })`;
    case 'boolean':
      return `fields.checkbox({ label: '${capitalizeFirstLetter(field.name)}' ${field.isOptional ? ', optional: true' : ''} })`;
    case 'date':
      return `fields.date({ label: '${capitalizeFirstLetter(field.name)}' ${field.isOptional ? ', optional: true' : ''} })`;
    case 'array':
      // This is a simplification. You might need to handle different array types
      return `fields.array(fields.text({ label: 'Item' }), { label: '${capitalizeFirstLetter(field.name)}' ${field.isOptional ? ', optional: true' : ''} })`;
    default:
      return `fields.text({ label: '${capitalizeFirstLetter(field.name)}' ${field.isOptional ? ', optional: true' : ''} })`; // Default to text field
  }
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}