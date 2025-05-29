import { Logger, LogLevel } from "../shared/logger.js"

class BackgroundService {
  private logger: Logger

  constructor() {
    this.logger = Logger.getInstance()
    this.logger.setLogLevel(LogLevel.INFO)
    this.init()
  }

  private init(): void {
    this.logger.info("MelodicMarlin background service initialized")
    this.setupMessageHandlers()
  }

  private setupMessageHandlers(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.logger.debug("Background received message:", message)

      switch (message.action) {
        case "getTabInfo":
          this.handleGetTabInfo(sendResponse)
          return true
        case "updateBadge":
          this.handleUpdateBadge(message.data)
          return false
        default:
          this.logger.warn("Unknown message action:", message.action)
          return false
      }
    })
  }

  private async handleGetTabInfo(sendResponse: (response: any) => void): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!tab) {
        sendResponse({ success: false, error: "No active tab found" })
        return
      }

      sendResponse({
        success: true,
        data: {
          id: tab.id,
          url: tab.url,
          title: tab.title,
        },
      })
    } catch (error) {
      this.logger.error("Error getting tab info:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      sendResponse({ success: false, error: errorMessage })
    }
  }

  private handleUpdateBadge(data: { text: string; color?: string }): void {
    try {
      chrome.action.setBadgeText({ text: data.text })
      if (data.color) {
        chrome.action.setBadgeBackgroundColor({ color: data.color })
      }
    } catch (error) {
      this.logger.error("Error updating badge:", error)
    }
  }
}

new BackgroundService()
