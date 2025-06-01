import { PopupView } from "./popup-view.js"
import { PopupMessenger } from "./popup-messenger.js"
import { PopupStateManager } from "./popup-state-manager.js"
import { Logger } from "../shared/logger.js"

export class PopupController {
  constructor(
    private view: PopupView,
    private messenger: PopupMessenger,
    private stateManager: PopupStateManager,
    private logger: Logger,
  ) {}

  public init(): void {
    this.view.bindElements()
    this.setupEventHandlers()
    this.loadState()
  }

  private setupEventHandlers(): void {
    this.view.onDebugToggle(async (enabled) => {
      await this.handleDebugToggle(enabled)
    })

    this.view.onAutoHighlightToggle(async (enabled) => {
      await this.handleAutoHighlightToggle(enabled)
    })

    this.view.onHighlightClick(async () => {
      await this.handleHighlight()
    })

    this.view.onClearClick(async () => {
      await this.handleClear()
    })

    this.view.onTestClick(async () => {
      await this.handleTest()
    })
  }

  private async loadState(): Promise<void> {
    try {
      this.logger.info("Loading popup state from storage...")
      const settings = await this.stateManager.loadSettings()

      this.view.setDebugToggle(settings.debugEnabled)
      this.view.setAutoHighlightToggle(settings.autoHighlightEnabled)

      this.logger.info("Popup checkboxes set to:", settings)
    } catch (error) {
      this.logger.error("Error loading state:", error)
    }
  }

  private async handleDebugToggle(enabled: boolean): Promise<void> {
    this.logger.info("Debug toggle clicked, new state:", enabled)

    try {
      await this.stateManager.saveDebugSetting(enabled)
      await this.messenger.sendMessage("toggleDebug", { enabled })
      this.view.updateStatus(enabled ? "Debug mode enabled" : "Debug mode disabled")
      this.logger.info("Debug toggle complete")
    } catch (error) {
      this.logger.error("Error toggling debug:", error)
      this.view.updateStatus("Error toggling debug mode")
      this.view.setDebugToggle(!enabled) // Revert on error
    }
  }

  private async handleAutoHighlightToggle(enabled: boolean): Promise<void> {
    this.logger.info("Auto highlight toggle clicked, new state:", enabled)

    try {
      await this.stateManager.saveAutoHighlightSetting(enabled)
      await this.messenger.sendMessage("toggleAutoHighlight", { enabled })
      this.view.updateStatus(enabled ? "Auto highlight enabled" : "Auto highlight disabled")
      this.logger.info("Auto highlight toggle complete")
    } catch (error) {
      this.logger.error("Error toggling auto highlight:", error)
      this.view.updateStatus("Error toggling auto highlight")
      this.view.setAutoHighlightToggle(!enabled) // Revert on error
    }
  }

  private async handleHighlight(): Promise<void> {
    try {
      this.view.updateStatus("Highlighting elements...")
      await this.messenger.sendMessage("highlightElements")
      this.view.updateStatus("Elements highlighted")
    } catch (error) {
      this.logger.error("Error highlighting elements:", error)
      this.view.updateStatus("Error highlighting elements")
    }
  }

  private async handleClear(): Promise<void> {
    try {
      this.view.updateStatus("Clearing highlights...")
      await this.messenger.sendMessage("clearHighlights")
      this.view.updateStatus("Highlights cleared")
      this.view.hideResults()
    } catch (error) {
      this.logger.error("Error clearing highlights:", error)
      this.view.updateStatus("Error clearing highlights")
    }
  }

  private async handleTest(): Promise<void> {
    try {
      this.view.updateStatus("Testing selectors...")
      const response = await this.messenger.sendMessage("testSelectors")

      if (response?.success) {
        this.view.displayResults(response.data)
        this.view.updateStatus(`Found ${response.data.totalMatches} total matches`)
      } else {
        this.view.updateStatus("Test failed")
      }
    } catch (error) {
      this.logger.error("Error testing selectors:", error)
      this.view.updateStatus("Error testing selectors")
    }
  }
}
