import * as typescript from 'typescript';

export interface SchemaField {
  type: string;
  isOptional: boolean;
  name: string;
  fields?: Record<string, SchemaField>;
}

export interface ParsedCollection {
  type: 'content' | 'data';
  schema: Record<string, SchemaField>;
}

export interface ParsedConfig {
  collections: Record<string, ParsedCollection>;
}

export function parseContentConfig(configPath: string): ParsedConfig {
  console.log('Starting to parse content config from:', configPath);
  const program = typescript.createProgram([configPath], {});
  console.log('TypeScript program created');
  const sourceFile = program.getSourceFile(configPath);

  if (!sourceFile) {
    console.error(`Could not find source file: ${configPath}`);
    throw new Error(`Could not find source file: ${configPath}`);
  }

  console.log('Source file found, content length:', sourceFile.getText().length);

  const collections: Record<string, ParsedCollection> = {};

  function visit(node: typescript.Node) {
    console.log('Visiting node kind:', typescript.SyntaxKind[node.kind]);
    
    if (typescript.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (typescript.isIdentifier(declaration.name)) {
        console.log('Found variable declaration:', declaration.name.text);
        if (declaration.name.text === 'collections' && declaration.initializer) {
          console.log('Found collections variable, initializer kind:', typescript.SyntaxKind[declaration.initializer.kind]);
          if (typescript.isObjectLiteralExpression(declaration.initializer)) {
            console.log('Collections is an object literal with', declaration.initializer.properties.length, 'properties');
            declaration.initializer.properties.forEach(prop => {
              if (typescript.isPropertyAssignment(prop) && typescript.isIdentifier(prop.name)) {
                const collectionName = prop.name.text;
                console.log('Processing collection:', collectionName);
                const collection = parseCollection(prop.initializer);
                if (collection) {
                  collections[collectionName] = collection;
                  console.log('Parsed collection:', collectionName);
                }
              }
            });
          }
        }
      }
    }

    typescript.forEachChild(node, visit);
  }

  console.log('Starting to visit nodes');
  visit(sourceFile);
  console.log('Finished visiting nodes');

  console.log('Parsed collections:', Object.keys(collections));
  return { collections };
}

function parseCollection(node: typescript.Node): ParsedCollection | null {
  if (!typescript.isCallExpression(node)) return null;

  const collection: ParsedCollection = {
    type: 'content',
    schema: {}
  };

  node.arguments.forEach(arg => {
    if (typescript.isObjectLiteralExpression(arg)) {
      arg.properties.forEach(prop => {
        if (typescript.isPropertyAssignment(prop)) {
          if (typescript.isIdentifier(prop.name)) {
            if (prop.name.text === 'type') {
              collection.type = (prop.initializer as typescript.StringLiteral).text as 'content' | 'data';
            } else if (prop.name.text === 'schema') {
              collection.schema = parseSchema(prop.initializer);
            }
          }
        }
      });
    }
  });

  return collection;
}

function parseSchema(node: typescript.Node): Record<string, SchemaField> {
  const schema: Record<string, SchemaField> = {};

  if (typescript.isCallExpression(node)) {
    const arg = node.arguments[0];
    if (typescript.isObjectLiteralExpression(arg)) {
      arg.properties.forEach(prop => {
        if (typescript.isPropertyAssignment(prop) && typescript.isIdentifier(prop.name)) {
          const fieldName = prop.name.text;
          schema[fieldName] = {
            type: getSchemaFieldType(prop.initializer),
            isOptional: isOptionalField(prop.initializer),
            name: fieldName
          };
        }
      });
    }
  }

  return schema;
}

function getSchemaFieldType(node: typescript.Node): string {
  if (typescript.isCallExpression(node)) {
    const expression = node.expression;
    if (typescript.isPropertyAccessExpression(expression)) {
      return expression.name.text;
    }
  }
  return 'unknown';
}

function isOptionalField(node: typescript.Node): boolean {
  if (typescript.isCallExpression(node)) {
    const expression = node.expression;
    if (typescript.isPropertyAccessExpression(expression)) {
      return expression.name.text === 'optional';
    }
  }
  return false;
}