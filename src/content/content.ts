import { SelectorManager } from "../core/selector-manager.js"
import { DebugOverlay } from "../core/debug-overlay.js"
import { Logger, LogLevel } from "../shared/logger.js"
import { ALL_SELECTORS } from "../shared/selectors.js"
import { DebugInfo, MessagePayload } from "../shared/types.js"

class ContentScript {
  private selectorManager: SelectorManager
  private debugOverlay: DebugOverlay
  private logger: Logger
  private debugEnabled: boolean = false

  constructor() {
    this.logger = Logger.getInstance()
    this.logger.setLogLevel(LogLevel.INFO)
    this.selectorManager = new SelectorManager()
    this.debugOverlay = new DebugOverlay()
    this.init()
  }

  private init(): void {
    this.logger.info("MelodicMarlin content script initialized")
    this.setupMessageHandlers()
    this.loadDebugState()
  }

  private setupMessageHandlers(): void {
    chrome.runtime.onMessage.addListener((message: MessagePayload, sender, sendResponse) => {
      this.logger.debug("Content script received message:", message)

      switch (message.action) {
        case "toggleDebug":
          this.handleToggleDebug(message.data?.enabled)
          break
        case "highlightElements":
          this.handleHighlightElements()
          break
        case "clearHighlights":
          this.handleClearHighlights()
          break
        case "testSelectors":
          this.handleTestSelectors(sendResponse)
          return true
        case "removeElements":
          this.handleRemoveElements(message.data?.selector)
          break
        default:
          this.logger.warn("Unknown message action:", message.action)
      }
    })
  }

  private async loadDebugState(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(["debugEnabled"])
      this.debugEnabled = result.debugEnabled || false
      this.logger.debug("Debug state loaded:", this.debugEnabled)
    } catch (error) {
      this.logger.error("Error loading debug state:", error)
    }
  }

  private async saveDebugState(): Promise<void> {
    try {
      await chrome.storage.local.set({ debugEnabled: this.debugEnabled })
      this.logger.debug("Debug state saved:", this.debugEnabled)
    } catch (error) {
      this.logger.error("Error saving debug state:", error)
    }
  }

  private handleToggleDebug(enabled?: boolean): void {
    this.debugEnabled = enabled !== undefined ? enabled : !this.debugEnabled
    this.saveDebugState()

    if (this.debugEnabled) {
      this.showDebugInfo()
    } else {
      this.debugOverlay.hide()
    }

    this.logger.info("Debug mode:", this.debugEnabled ? "enabled" : "disabled")
  }

  private handleHighlightElements(): void {
    this.selectorManager.clearHighlights()

    ALL_SELECTORS.forEach((config) => {
      if (config.action === "highlight") {
        this.selectorManager.highlightElements(config)
      }
    })

    if (this.debugEnabled) {
      this.showDebugInfo()
    }

    this.updateBadge()
  }

  private handleClearHighlights(): void {
    this.selectorManager.clearHighlights()
    this.debugOverlay.hide()
    this.updateBadge("")
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

    if (this.debugEnabled) {
      this.showDebugInfo()
    }
  }

  private handleRemoveElements(selector?: string): void {
    if (!selector) {
      return
    }

    const config = ALL_SELECTORS.find((s) => s.selector === selector)
    if (config) {
      this.selectorManager.removeElements(config)
    }
  }

  private showDebugInfo(): void {
    const results = ALL_SELECTORS.map((config) => this.selectorManager.testSelector(config))

    const debugInfo: DebugInfo = {
      enabled: this.debugEnabled,
      results,
      timestamp: new Date().toLocaleTimeString(),
    }

    this.debugOverlay.show(debugInfo)
  }

  private updateBadge(text?: string): void {
    if (text === undefined) {
      const results = ALL_SELECTORS.map((config) => this.selectorManager.testSelector(config))
      const totalMatches = results.reduce((sum, result) => sum + result.matchCount, 0)
      text = totalMatches > 0 ? totalMatches.toString() : ""
    }

    chrome.runtime.sendMessage({
      action: "updateBadge",
      data: {
        text,
        color: text ? "#00cc66" : "#666666",
      },
    })
  }
}

new ContentScript()
