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
  private autoHighlightEnabled: boolean = false
  private observer: MutationObserver | null = null
  private debounceTimer: number | null = null
  private lastHighlightCount: number = 0
  private highlightCheckCount: number = 0

  constructor() {
    this.logger = Logger.getInstance()
    this.logger.setLogLevel(LogLevel.INFO)
    this.selectorManager = new SelectorManager()
    this.debugOverlay = new DebugOverlay()
    this.init()
  }

  private init(): void {
    // Only run on Claude sites
    if (!this.isClaudeSite()) {
      this.logger.info("Not a Claude site, MelodicMarlin not initializing")
      return
    }

    this.logger.info("MelodicMarlin content script initialized")
    this.setupMessageHandlers()

    // Load settings and start auto-highlight if enabled
    this.loadSettings().then(() => {
      // Initial scan after page settles
      setTimeout(() => {
        if (this.autoHighlightEnabled) {
          this.performAutoHighlight()
        }
      }, 3000)
    })
  }

  private isClaudeSite(): boolean {
    const hostname = window.location.hostname
    return hostname === "claude.ai" || hostname.endsWith(".claude.ai")
  }

  private setupMessageHandlers(): void {
    chrome.runtime.onMessage.addListener((message: MessagePayload, sender, sendResponse) => {
      this.logger.info("Content script received message:", message)

      switch (message.action) {
        case "toggleDebug":
          this.handleToggleDebug(message.data?.enabled)
          sendResponse({ success: true })
          return true
        case "toggleAutoHighlight":
          this.handleToggleAutoHighlight(message.data?.enabled)
          sendResponse({ success: true })
          return true
        case "highlightElements":
          this.handleHighlightElements()
          sendResponse({ success: true })
          return true
        case "clearHighlights":
          this.handleClearHighlights()
          sendResponse({ success: true })
          return true
        case "testSelectors":
          this.handleTestSelectors(sendResponse)
          return true
        case "removeElements":
          this.handleRemoveElements(message.data?.selector)
          sendResponse({ success: true })
          return true
        default:
          this.logger.warn("Unknown message action:", message.action)
          sendResponse({ success: false, error: "Unknown action" })
          return true
      }
    })
  }

  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(["debugEnabled", "autoHighlightEnabled"])

      this.debugEnabled = result.debugEnabled === true
      this.autoHighlightEnabled = result.autoHighlightEnabled === true

      this.logger.info("Content script settings loaded:", {
        debugEnabled: this.debugEnabled,
        autoHighlightEnabled: this.autoHighlightEnabled,
      })

      if (this.autoHighlightEnabled) {
        this.logger.info("Auto highlight enabled from storage, starting observer...")
        this.startAutoHighlight()
      }
    } catch (error) {
      this.logger.error("Error loading settings:", error)
    }
  }

  private async handleToggleDebug(enabled?: boolean): Promise<void> {
    this.debugEnabled = enabled !== undefined ? enabled : !this.debugEnabled

    try {
      await chrome.storage.local.set({ debugEnabled: this.debugEnabled })
    } catch (error) {
      this.logger.error("Error saving debug setting:", error)
    }

    if (this.debugEnabled) {
      this.showDebugInfo()
    } else {
      this.debugOverlay.hide()
    }

    this.logger.info("Debug mode:", this.debugEnabled ? "enabled" : "disabled")
  }

  private async handleToggleAutoHighlight(enabled?: boolean): Promise<void> {
    this.autoHighlightEnabled = enabled !== undefined ? enabled : !this.autoHighlightEnabled

    try {
      await chrome.storage.local.set({ autoHighlightEnabled: this.autoHighlightEnabled })
    } catch (error) {
      this.logger.error("Error saving auto highlight setting:", error)
    }

    if (this.autoHighlightEnabled) {
      this.startAutoHighlight()
    } else {
      this.stopAutoHighlight()
    }
  }

  private startAutoHighlight(): void {
    this.logger.info("🚀 Starting conservative auto highlight...")

    // Reset counters
    this.highlightCheckCount = 0

    // Immediate highlight
    this.performAutoHighlight()

    // Set up very conservative mutation observer
    if (this.observer) {
      this.observer.disconnect()
    }

    this.observer = new MutationObserver((mutations) => {
      let shouldCheck = false
      let triggerReason = ""

      // Be VERY selective about what triggers highlighting
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element

              // ONLY trigger for button elements
              if (element.tagName === "BUTTON") {
                shouldCheck = true
                triggerReason = "Button element added"
                break
              }

              // Or if a container was added that contains buttons
              if (element.querySelector && element.querySelector("button")) {
                shouldCheck = true
                triggerReason = "Container with buttons added"
                break
              }
            }
          }
        }
        if (shouldCheck) break
      }

      if (shouldCheck) {
        this.logger.info(`🔍 Mutation trigger: ${triggerReason}`)
        this.debouncedHighlight()
      }
    })

    // Only watch for new child elements
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    this.logger.info("✅ Conservative auto highlight active")
  }

  private stopAutoHighlight(): void {
    this.logger.info("🛑 Stopping auto highlight...")

    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    this.logger.info("❌ Auto highlight stopped")
  }

  private debouncedHighlight(): void {
    // Clear any existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    // Much longer debounce - wait 2 seconds for changes to settle
    this.debounceTimer = window.setTimeout(() => {
      this.logger.info("🔄 Debounced auto-highlight triggered")
      this.performAutoHighlight()
    }, 2000) // Increased to 2 seconds
  }

  private performAutoHighlight(): void {
    if (!this.autoHighlightEnabled) {
      return
    }

    this.highlightCheckCount++
    this.logger.info(`🎨 Auto-highlight scan #${this.highlightCheckCount}`)

    // Clear existing highlights first
    this.selectorManager.clearHighlights()

    let totalHighlighted = 0

    ALL_SELECTORS.forEach((config) => {
      if (config.action === "highlight") {
        const result = this.selectorManager.testSelector(config)

        if (result.matchCount > 0) {
          this.selectorManager.highlightElements(config)
          totalHighlighted += result.matchCount
        }
      }
    })

    // Only log if the count changed or every 10th check
    if (totalHighlighted !== this.lastHighlightCount || this.highlightCheckCount % 10 === 0) {
      this.logger.info(
        `🎯 Auto-highlight #${this.highlightCheckCount}: ${totalHighlighted} elements (was ${this.lastHighlightCount})`,
      )
      this.lastHighlightCount = totalHighlighted
    }

    if (this.debugEnabled) {
      this.showDebugInfo()
    }

    this.updateBadge()
  }

  private handleHighlightElements(): void {
    this.logger.info("👆 Manual highlight triggered")
    this.performAutoHighlight()
  }

  private handleClearHighlights(): void {
    this.logger.info("🧹 Clearing highlights")
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
