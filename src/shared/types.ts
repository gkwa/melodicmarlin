export interface SelectorConfig {
  name: string
  selector: string
  description?: string
  action: "highlight" | "remove" | "test"
  highlightColor?: string
}

export interface HighlightOptions {
  borderColor: string
  backgroundColor: string
  borderWidth?: string
}

export interface TestResult {
  selector: string
  matchCount: number
  elements: Element[]
  success: boolean
}

export interface DebugInfo {
  enabled: boolean
  results: TestResult[]
  timestamp: string
}

export interface MessagePayload {
  action: string
  data?: any
}
