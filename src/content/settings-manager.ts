import { Logger } from "../shared/logger.js"

export class SettingsManager {
  private debugEnabled: boolean = false
  private autoHighlightEnabled: boolean = false
  private logger: Logger

  constructor() {
    this.logger = Logger.getInstance()
  }

  public async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(["debugEnabled", "autoHighlightEnabled"])

      this.debugEnabled = result.debugEnabled === true
      this.autoHighlightEnabled = result.autoHighlightEnabled === true

      this.logger.info("Content script settings loaded:", {
        debugEnabled: this.debugEnabled,
        autoHighlightEnabled: this.autoHighlightEnabled,
      })
    } catch (error) {
      this.logger.error("Error loading settings:", error)
    }
  }

  public async toggleDebug(enabled?: boolean): Promise<void> {
    this.debugEnabled = enabled !== undefined ? enabled : !this.debugEnabled

    try {
      await chrome.storage.local.set({ debugEnabled: this.debugEnabled })
    } catch (error) {
      this.logger.error("Error saving debug setting:", error)
    }
  }

  public async toggleAutoHighlight(enabled?: boolean): Promise<void> {
    this.autoHighlightEnabled = enabled !== undefined ? enabled : !this.autoHighlightEnabled

    try {
      await chrome.storage.local.set({ autoHighlightEnabled: this.autoHighlightEnabled })
    } catch (error) {
      this.logger.error("Error saving auto highlight setting:", error)
    }
  }

  public isDebugEnabled(): boolean {
    return this.debugEnabled
  }

  public isAutoHighlightEnabled(): boolean {
    return this.autoHighlightEnabled
  }
}
