/**
 * MCP Types - Shared types for the modular MCP system
 */

import { z, ZodSchema } from "zod";

/**
 * Tool definition for MCP
 */
export interface MCPToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: ZodSchema<TInput>;
  handler: (args: TInput) => Promise<TOutput>;
}

/**
 * Tool metadata for JSON-RPC tools/list response
 */
export interface MCPToolMetadata {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * JSON-RPC 2.0 Request
 */
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, any>;
}

/**
 * JSON-RPC 2.0 Response
 */
export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * MCP Server Info
 */
export interface MCPServerInfo {
  name: string;
  version: string;
  description?: string;
}

/**
 * MCP Tool Result
 */
export interface MCPToolResult {
  success: boolean;
  error?: string;
  [key: string]: any;
}

/**
 * Get the type name from a zod schema
 */
function getZodTypeName(schema: ZodSchema): string | undefined {
  const def = schema._def as any;
  return def?.typeName;
}

/**
 * Get the inner type from an optional schema
 */
function unwrapOptional(schema: ZodSchema): { schema: ZodSchema; isOptional: boolean } {
  const typeName = getZodTypeName(schema);
  if (typeName === "ZodOptional") {
    const def = schema._def as any;
    return { schema: def.innerType, isOptional: true };
  }
  return { schema, isOptional: false };
}

/**
 * Get description from a zod schema
 */
function getDescription(schema: ZodSchema): string | undefined {
  const def = schema._def as any;
  return def?.description;
}

/**
 * Convert Zod schema to JSON Schema for MCP tools/list
 */
export function zodToJsonSchema(schema: ZodSchema): {
  type: "object";
  properties: Record<string, any>;
  required: string[];
} {
  const typeName = getZodTypeName(schema);
  
  // Handle ZodObject
  if (typeName === "ZodObject") {
    const shape = (schema as z.ZodObject<any>).shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const fieldSchema = value as ZodSchema;
      
      // Get the inner type if optional
      const { schema: innerSchema, isOptional } = unwrapOptional(fieldSchema);
      const innerTypeName = getZodTypeName(innerSchema);
      
      // Build property definition
      const prop: any = {};
      
      switch (innerTypeName) {
        case "ZodString":
          prop.type = "string";
          break;
        case "ZodNumber":
          prop.type = "number";
          break;
        case "ZodBoolean":
          prop.type = "boolean";
          break;
        case "ZodArray":
          prop.type = "array";
          // Recursively handle array items
          const arrayDef = (innerSchema._def as any);
          if (arrayDef?.type) {
            const itemSchema = zodToJsonSchema(arrayDef.type);
            prop.items = itemSchema;
          }
          break;
        case "ZodObject":
          const nested = zodToJsonSchema(innerSchema);
          prop.type = nested.type;
          prop.properties = nested.properties;
          if (nested.required.length > 0) {
            prop.required = nested.required;
          }
          break;
        default:
          prop.type = "string"; // fallback
      }
      
      // Add description if available
      const description = getDescription(innerSchema);
      if (description) {
        prop.description = description;
      }
      
      properties[key] = prop;
      
      if (!isOptional) {
        required.push(key);
      }
    }

    return { type: "object", properties, required };
  }

  // Fallback for non-object schemas
  return { type: "object", properties: {}, required: [] };
}
