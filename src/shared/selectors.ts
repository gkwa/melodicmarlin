import { SelectorConfig } from "./types.js"

export const CLAUDE_SELECTORS: SelectorConfig[] = [
  {
    name: "User Messages",
    selector: '[data-testid="user-message"]',
    description: "User message containers",
    action: "highlight",
    highlightColor: "#0066cc", // Blue for user messages
  },
  {
    name: "Claude Responses",
    selector: ".font-claude-message",
    description: "Claude message containers",
    action: "highlight",
    highlightColor: "#00cc66", // Green for Claude responses
  },
]

export const GENERIC_SELECTORS: SelectorConfig[] = [
  {
    name: "Fetched Button",
    selector: 'button:contains("Fetched")',
    description: 'Buttons containing "Fetched" text',
    action: "highlight",
    highlightColor: "#00cc66", // Green for successful fetches
  },
  {
    name: "Failed Fetch Button",
    selector: 'button:contains("Failed to fetch")',
    description: 'Buttons containing "Failed to fetch" text',
    action: "highlight",
    highlightColor: "#ff3333", // Red for failed fetches
  },
]

export const ALL_SELECTORS = [...CLAUDE_SELECTORS, ...GENERIC_SELECTORS]
