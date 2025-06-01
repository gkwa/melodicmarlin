import { Logger } from "../shared/logger.js"

export class DebounceManager {
  private debounceTimer: number | null = null
  private readonly DEBOUNCE_DELAY = 2000

  constructor(private logger: Logger) {}

  public debounce(callback: () => void): void {
    this.clear()
    this.debounceTimer = window.setTimeout(callback, this.DEBOUNCE_DELAY)
  }

  public clear(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  }
}
