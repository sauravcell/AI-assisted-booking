import { ZodType } from "zod";

/**
 * ------------------------------------------------------------------
 * Agent Tool Contract
 * ------------------------------------------------------------------
 *
 * Every AI tool must implement this interface.
 *
 * The AI agent only knows about this abstraction.
 * It never imports concrete tools directly.
 *
 * This allows us to plug in new tools without changing
 * the agent orchestration.
 * ------------------------------------------------------------------
 */

export interface AgentTool<TInput = unknown, TOutput = unknown> {
  /**
   * Unique tool name.
   *
   * Must exactly match the name exposed
   * to the LLM for function calling.
   *
   * Example:
   * "searchDoctor"
   */
  readonly name: string;

  /**
   * Human-readable description.
   *
   * This will later be sent to the LLM
   * so it understands when to use the tool.
   */

  readonly description: string;

  /**
   * Input schema used for:
   * - LangChain tool definitions
   * - Runtime validation
   * - LLM function calling
   */
  readonly schema: ZodType<TInput>;

  /**
   * Executes the business logic.
   *
   * The tool should never contain SQL.
   * It delegates to Services.
   */
  execute(input: TInput): Promise<TOutput>;
}
