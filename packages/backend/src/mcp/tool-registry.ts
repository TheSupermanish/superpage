/**
 * MCP Tool Registry
 * 
 * Centralized registry for all MCP tools.
 * Tools can be registered and composed into different MCP servers.
 */

import { 
  MCPToolDefinition, 
  MCPToolMetadata, 
  MCPToolResult,
  zodToJsonSchema 
} from "./types.js";

/**
 * Global tool registry
 */
class ToolRegistry {
  private tools: Map<string, MCPToolDefinition> = new Map();
  private categories: Map<string, Set<string>> = new Map();

  /**
   * Register a tool
   */
  register<TInput, TOutput>(
    tool: MCPToolDefinition<TInput, TOutput>,
    category?: string
  ): void {
    this.tools.set(tool.name, tool as MCPToolDefinition);
    
    if (category) {
      if (!this.categories.has(category)) {
        this.categories.set(category, new Set());
      }
      this.categories.get(category)!.add(tool.name);
    }
    
    console.log(`[ToolRegistry] Registered tool: ${tool.name}${category ? ` (${category})` : ""}`);
  }

  /**
   * Get a tool by name
   */
  get(name: string): MCPToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all tools
   */
  getAll(): MCPToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): MCPToolDefinition[] {
    const toolNames = this.categories.get(category);
    if (!toolNames) return [];
    
    return Array.from(toolNames)
      .map(name => this.tools.get(name))
      .filter((t): t is MCPToolDefinition => t !== undefined);
  }

  /**
   * Get tool names by category
   */
  getNamesByCategory(category: string): string[] {
    const toolNames = this.categories.get(category);
    return toolNames ? Array.from(toolNames) : [];
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Execute a tool by name
   */
  async execute(name: string, args: any): Promise<MCPToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, error: `Unknown tool: ${name}` };
    }

    try {
      // Validate input
      const validatedArgs = tool.inputSchema.parse(args);
      
      // Execute handler
      const result = await tool.handler(validatedArgs);
      return result;
    } catch (error: any) {
      if (error.name === "ZodError") {
        const issues = error.issues || error.errors || [];
        return {
          success: false,
          error: `Validation error: ${issues.map((e: any) => e.message).join(", ")}`
        };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Get tool metadata for JSON-RPC tools/list response
   */
  getMetadata(toolNames?: string[]): MCPToolMetadata[] {
    const tools = toolNames 
      ? toolNames.map(name => this.tools.get(name)).filter((t): t is MCPToolDefinition => t !== undefined)
      : this.getAll();

    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema),
    }));
  }

  /**
   * Clear all tools (useful for testing)
   */
  clear(): void {
    this.tools.clear();
    this.categories.clear();
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();

/**
 * Helper to create a tool definition
 */
export function defineTool<TInput, TOutput>(
  definition: MCPToolDefinition<TInput, TOutput>
): MCPToolDefinition<TInput, TOutput> {
  return definition;
}
