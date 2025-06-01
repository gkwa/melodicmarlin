import { Logger } from "../shared/logger.js"

export class PopupMessenger {
  constructor(private logger: Logger) {}

  public async sendMessage(action: string, data?: any): Promise<any> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab || !tab.id) {
      throw new Error("No active tab found")
    }

    this.logger.info("Sending message to content script:", { action, data })

    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id!, { action, data }, (response) => {
        if (chrome.runtime.lastError) {
          this.logger.error("Message error:", chrome.runtime.lastError)
          resolve(null)
        } else {
          this.logger.info("Content script response:", response)
          resolve(response)
        }
      })
    })
  }
}
