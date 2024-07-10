import type * as ts from 'typescript';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const typescript: typeof ts = require('typescript');

export interface SchemaField {
  type: string;
  isOptional: boolean;
  name: string;
}

export interface ParsedCollection {
  type: 'content' | 'data';
  schema: Record<string, SchemaField>;
}

export interface ParsedConfig {
  collections: Record<string, ParsedCollection>;
}

export function parseContentConfig(configPath: string): ParsedConfig {
  const program = typescript.createProgram([configPath], {});
  const sourceFile = program.getSourceFile(configPath);

  if (!sourceFile) {
    throw new Error(`Could not find source file: ${configPath}`);
  }

  const collections: Record<string, ParsedCollection> = {};

  typescript.forEachChild(sourceFile, node => {
    if (typescript.isExportAssignment(node) && typescript.isObjectLiteralExpression(node.expression)) {
      const collectionsObj = node.expression;
      collectionsObj.properties.forEach(prop => {
        if (typescript.isPropertyAssignment(prop) && typescript.isIdentifier(prop.name)) {
          const collectionName = prop.name.text;
          const collection = parseCollection(prop.initializer);
          if (collection) {
            collections[collectionName] = collection;
          }
        }
      });
    }
  });

  return { collections };
}

function parseCollection(node: ts.Node): ParsedCollection | null {
  if (!typescript.isCallExpression(node)) return null;

  const arg = node.arguments[0];
  if (!arg || !typescript.isObjectLiteralExpression(arg)) return null;

  let type: 'content' | 'data' = 'content';
  let schema: Record<string, SchemaField> = {};

  arg.properties.forEach(prop => {
    if (!typescript.isPropertyAssignment(prop)) return;

    if (typescript.isIdentifier(prop.name)) {
      if (prop.name.text === 'type') {
        type = parseCollectionType(prop.initializer);
      } else if (prop.name.text === 'schema') {
        schema = parseSchema(prop.initializer);
      }
    }
  });

  return { type, schema };
}

function parseCollectionType(node: ts.Node): 'content' | 'data' {
  return typescript.isStringLiteral(node) && node.text === 'data' ? 'data' : 'content';
}

function parseSchema(node: ts.Node): Record<string, SchemaField> {
  if (!typescript.isCallExpression(node) || !typescript.isPropertyAccessExpression(node.expression)) return {};

  const arg = node.arguments[0];
  if (!arg || !typescript.isObjectLiteralExpression(arg)) return {};

  const schema: Record<string, SchemaField> = {};

  arg.properties.forEach(prop => {
    if (!typescript.isPropertyAssignment(prop) || !typescript.isIdentifier(prop.name)) return;

    const fieldName = prop.name.text;
    const fieldType = parseSchemaField(prop.initializer);
    if (fieldType) {
      schema[fieldName] = fieldType;
    }
  });

  return schema;
}

function parseSchemaField(node: ts.Node): SchemaField | null {
  if (!typescript.isCallExpression(node) || !typescript.isPropertyAccessExpression(node.expression)) return null;

  const zodType = node.expression.name.text;
  const isOptional = node.expression.expression.getText().includes('.optional');

  return {
    type: zodType,
    isOptional,
    name: '' // The name will be set by the parent function
  };
}