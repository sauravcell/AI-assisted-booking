import { AgentTool } from "../tools/agent-tools";

// export class ToolRegistry {
//   private readonly tools = new Map<string, AgentTool>();

//   register() {}

//   get() {}
// }

/**
 * ------------------------------------------------------------------
 * Tool Registry
 * ------------------------------------------------------------------
 *
 * Central registry for every AI tool.
 *
 * The ToolNode never imports concrete tools.
 *
 * Instead:
 *
 * ToolNode
 *      ↓
 * ToolRegistry
 *      ↓
 * SearchDoctorTool
 *      ↓
 * BookingService
 *
 * This follows the Dependency Inversion Principle.
 * ------------------------------------------------------------------
 */
export class ToolRegistry {
  /**
   * Stores tools by their unique name.
   */
  private readonly tools = new Map<string, AgentTool>();

  /**
   * Registers a tool.
   *
   * Usually called once during application startup.
   */
  register(tool: AgentTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered.`);
    }

    this.tools.set(tool.name, tool);
  }

  /**
   * Returns a tool by name.
   */
  get(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Checks whether a tool exists.
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Returns every registered tool.
   *
   * This will later be used when binding
   * tools to the LLM.
   */
  getAll(): AgentTool[] {
    return [...this.tools.values()];
  }
}
