import { SelectorManager } from "../core/selector-manager.js"
import { DebugOverlay } from "../core/debug-overlay.js"
import { SettingsManager } from "./settings-manager.js"
import { BadgeUpdater } from "./badge-updater.js"
import { Logger } from "../shared/logger.js"
import { ALL_SELECTORS } from "../shared/selectors.js"

export class AutoHighlightService {
  private observer: MutationObserver | null = null
  private debounceTimer: number | null = null
  private lastHighlightCount: number = 0
  private highlightCheckCount: number = 0

  constructor(
    private selectorManager: SelectorManager,
    private debugOverlay: DebugOverlay,
    private settingsManager: SettingsManager,
    private badgeUpdater: BadgeUpdater,
    private logger: Logger,
  ) {}

  public start(): void {
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

  public stop(): void {
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

  public performAutoHighlight(): void {
    // Only check auto-highlight setting for automatic triggers, not manual ones
    if (!this.settingsManager.isAutoHighlightEnabled()) {
      return
    }

    this.performHighlight()
  }

  public performManualHighlight(): void {
    // Manual highlighting should always work regardless of auto-highlight setting
    this.performHighlight()
  }

  private performHighlight(): void {
    this.highlightCheckCount++
    this.logger.info(`🎨 Highlight scan #${this.highlightCheckCount}`)

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
        `🎯 Highlight #${this.highlightCheckCount}: ${totalHighlighted} elements (was ${this.lastHighlightCount})`,
      )
      this.lastHighlightCount = totalHighlighted
    }

    this.badgeUpdater.updateBadge()
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

      // Show debug info after auto-highlight if debug is enabled
      if (this.settingsManager.isDebugEnabled()) {
        this.showDebugInfo()
      }
    }, 2000) // Increased to 2 seconds
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
