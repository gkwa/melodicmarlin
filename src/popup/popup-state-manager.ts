import { Logger } from "../shared/logger.js"

export interface PopupSettings {
  debugEnabled: boolean
  autoHighlightEnabled: boolean
}

export class PopupStateManager {
  constructor(private logger: Logger) {}

  public async loadSettings(): Promise<PopupSettings> {
    try {
      const result = await chrome.storage.local.get(["debugEnabled", "autoHighlightEnabled"])

      const settings: PopupSettings = {
        debugEnabled: result.debugEnabled === true,
        autoHighlightEnabled: result.autoHighlightEnabled === true,
      }

      this.logger.info("Raw storage result:", result)
      return settings
    } catch (error) {
      this.logger.error("Error loading settings:", error)
      return { debugEnabled: false, autoHighlightEnabled: false }
    }
  }

  public async saveDebugSetting(enabled: boolean): Promise<void> {
    this.logger.info("Saving debug setting to storage...")
    await chrome.storage.local.set({ debugEnabled: enabled })

    const verification = await chrome.storage.local.get(["debugEnabled"])
    this.logger.info("Debug setting saved, verification:", verification)
  }

  public async saveAutoHighlightSetting(enabled: boolean): Promise<void> {
    this.logger.info("Saving auto highlight setting to storage...")
    await chrome.storage.local.set({ autoHighlightEnabled: enabled })

    const verification = await chrome.storage.local.get(["autoHighlightEnabled"])
    this.logger.info("Auto highlight setting saved, verification:", verification)
  }
}
