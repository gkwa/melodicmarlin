import { SelectorManager } from "../core/selector-manager.js"
import { DebugOverlay } from "../core/debug-overlay.js"
import { SettingsManager } from "./settings-manager.js"
import { AutoHighlightService } from "./auto-highlight-service.js"
import { BadgeUpdater } from "./badge-updater.js"
import { Logger } from "../shared/logger.js"
import { MessagePayload } from "../shared/types.js"
import { ALL_SELECTORS } from "../shared/selectors.js"

export class MessageHandler {
  constructor(
    private selectorManager: SelectorManager,
    private debugOverlay: DebugOverlay,
    private settingsManager: SettingsManager,
    private autoHighlightService: AutoHighlightService,
    private badgeUpdater: BadgeUpdater,
    private logger: Logger,
  ) {}

  public setup(): void {
    chrome.runtime.onMessage.addListener((message: MessagePayload, sender, sendResponse) => {
      this.logger.info("Content script received message:", message)

      switch (message.action) {
        case "toggleDebug":
          this.handleToggleDebug(message.data?.enabled, sendResponse)
          return true
        case "toggleAutoHighlight":
          this.handleToggleAutoHighlight(message.data?.enabled, sendResponse)
          return true
        case "highlightElements":
          this.handleHighlightElements(sendResponse)
          return true
        case "clearHighlights":
          this.handleClearHighlights(sendResponse)
          return true
        case "testSelectors":
          this.handleTestSelectors(sendResponse)
          return true
        case "removeElements":
          this.handleRemoveElements(message.data?.selector, sendResponse)
          return true
        default:
          this.logger.warn("Unknown message action:", message.action)
          sendResponse({ success: false, error: "Unknown action" })
          return true
      }
    })
  }

  private async handleToggleDebug(
    enabled?: boolean,
    sendResponse?: (response: any) => void,
  ): Promise<void> {
    await this.settingsManager.toggleDebug(enabled)

    if (this.settingsManager.isDebugEnabled()) {
      this.showDebugInfo()
    } else {
      this.debugOverlay.hide()
    }

    this.logger.info("Debug mode:", this.settingsManager.isDebugEnabled() ? "enabled" : "disabled")
    sendResponse?.({ success: true })
  }

  private async handleToggleAutoHighlight(
    enabled?: boolean,
    sendResponse?: (response: any) => void,
  ): Promise<void> {
    await this.settingsManager.toggleAutoHighlight(enabled)

    if (this.settingsManager.isAutoHighlightEnabled()) {
      this.autoHighlightService.start()
    } else {
      this.autoHighlightService.stop()
    }

    sendResponse?.({ success: true })
  }

  private handleHighlightElements(sendResponse?: (response: any) => void): void {
    this.logger.info("👆 Manual highlight triggered")
    this.autoHighlightService.performManualHighlight()

    // Show debug info if debug mode is enabled
    if (this.settingsManager.isDebugEnabled()) {
      this.showDebugInfo()
    }

    sendResponse?.({ success: true })
  }

  private handleClearHighlights(sendResponse?: (response: any) => void): void {
    this.logger.info("🧹 Clearing highlights")
    this.selectorManager.clearHighlights()
    this.debugOverlay.hide()
    this.badgeUpdater.updateBadge("")
    sendResponse?.({ success: true })
  }

  private handleTestSelectors(sendResponse: (response: any) => void): void {
    const results = ALL_SELECTORS.map((config) => this.selectorManager.testSelector(config))
    const totalMatches = results.reduce((sum, result) => sum + result.matchCount, 0)

    sendResponse({
      success: true,
      data: {
        results,
        totalMatches,
        timestamp: new Date().toISOString(),
      },
    })

    if (this.settingsManager.isDebugEnabled()) {
      this.showDebugInfo()
    }
  }

  private handleRemoveElements(selector?: string, sendResponse?: (response: any) => void): void {
    if (!selector) {
      sendResponse?.({ success: false, error: "No selector provided" })
      return
    }

    const config = ALL_SELECTORS.find((s) => s.selector === selector)
    if (config) {
      this.selectorManager.removeElements(config)
    }

    sendResponse?.({ success: true })
  }

  private showDebugInfo(): void {
    const results = ALL_SELECTORS.map((config) => this.selectorManager.testSelector(config))

    const debugInfo = {
      enabled: this.settingsManager.isDebugEnabled(),
      results,
      timestamp: new Date().toLocaleTimeString(),
    }

    this.debugOverlay.show(debugInfo)
  }
}
