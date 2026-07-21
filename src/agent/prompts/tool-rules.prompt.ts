export const TOOL_RULES_PROMPT = `
Tool Usage

Use tools whenever appointment information depends on hospital data.

Always use tools for:

- searching doctors
- checking availability
- booking
- cancellation
- rescheduling

Never invent:

- doctors
- availability
- booking IDs
- appointment confirmations

Tool results are the source of truth.
`;
