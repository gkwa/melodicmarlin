import { Logger, LogLevel } from "../shared/logger.js"

class PopupController {
  private logger: Logger
  private debugToggle: HTMLInputElement
  private highlightBtn: HTMLButtonElement
  private clearBtn: HTMLButtonElement
  private testBtn: HTMLButtonElement
  private status: HTMLElement
  private results: HTMLElement
  private resultContent: HTMLElement

  constructor() {
    this.logger = Logger.getInstance()
    this.logger.setLogLevel(LogLevel.INFO)
    this.init()
  }

  private init(): void {
    this.logger.info("Popup initialized")
    this.bindElements()
    this.setupEventHandlers()
    this.loadState()
  }

  private bindElements(): void {
    this.debugToggle = document.getElementById("debugToggle") as HTMLInputElement
    this.highlightBtn = document.getElementById("highlightBtn") as HTMLButtonElement
    this.clearBtn = document.getElementById("clearBtn") as HTMLButtonElement
    this.testBtn = document.getElementById("testBtn") as HTMLButtonElement
    this.status = document.getElementById("status") as HTMLElement
    this.results = document.getElementById("results") as HTMLElement
    this.resultContent = document.getElementById("resultContent") as HTMLElement

    if (
      !this.debugToggle ||
      !this.highlightBtn ||
      !this.clearBtn ||
      !this.testBtn ||
      !this.status ||
      !this.results ||
      !this.resultContent
    ) {
      throw new Error("Failed to bind required DOM elements")
    }
  }

  private setupEventHandlers(): void {
    this.debugToggle.addEventListener("change", () => {
      this.handleDebugToggle()
    })

    this.highlightBtn.addEventListener("click", () => {
      this.handleHighlight()
    })

    this.clearBtn.addEventListener("click", () => {
      this.handleClear()
    })

    this.testBtn.addEventListener("click", () => {
      this.handleTest()
    })
  }

  private async loadState(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(["debugEnabled"])
      this.debugToggle.checked = result.debugEnabled || false
    } catch (error) {
      this.logger.error("Error loading state:", error)
    }
  }

  private async handleDebugToggle(): Promise<void> {
    const enabled = this.debugToggle.checked

    try {
      await chrome.storage.local.set({ debugEnabled: enabled })
      await this.sendMessageToContentScript("toggleDebug", { enabled })

      this.updateStatus(enabled ? "Debug mode enabled" : "Debug mode disabled")
      this.logger.info("Debug toggled:", enabled)
    } catch (error) {
      this.logger.error("Error toggling debug:", error)
      this.updateStatus("Error toggling debug mode")
    }
  }

  private async handleHighlight(): Promise<void> {
    try {
      this.updateStatus("Highlighting elements...")
      await this.sendMessageToContentScript("highlightElements")
      this.updateStatus("Elements highlighted")
    } catch (error) {
      this.logger.error("Error highlighting elements:", error)
      this.updateStatus("Error highlighting elements")
    }
  }

  private async handleClear(): Promise<void> {
    try {
      this.updateStatus("Clearing highlights...")
      await this.sendMessageToContentScript("clearHighlights")
      this.updateStatus("Highlights cleared")
      this.hideResults()
    } catch (error) {
      this.logger.error("Error clearing highlights:", error)
      this.updateStatus("Error clearing highlights")
    }
  }

  private async handleTest(): Promise<void> {
    try {
      this.updateStatus("Testing selectors...")

      const response = await this.sendMessageToContentScript("testSelectors")

      if (response?.success) {
        this.displayResults(response.data)
        this.updateStatus(`Found ${response.data.totalMatches} total matches`)
      } else {
        this.updateStatus("Test failed")
      }
    } catch (error) {
      this.logger.error("Error testing selectors:", error)
      this.updateStatus("Error testing selectors")
    }
  }

  private async sendMessageToContentScript(action: string, data?: any): Promise<any> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (!tab.id) {
      throw new Error("No active tab found")
    }

    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id!, { action, data }, (response) => {
        if (chrome.runtime.lastError) {
          this.logger.error("Message error:", chrome.runtime.lastError)
          resolve(null)
        } else {
          resolve(response)
        }
      })
    })
  }

  private updateStatus(message: string): void {
    this.status.textContent = message
    this.logger.debug("Status updated:", message)
  }

  private displayResults(data: any): void {
    const { results, totalMatches, timestamp } = data

    let html = `<div class="result-item">
      <strong>Total Matches: ${totalMatches}</strong>
      <div style="font-size: 10px; opacity: 0.7;">${new Date(timestamp).toLocaleTimeString()}</div>
    </div>`

    results.forEach((result: any) => {
      const status = result.success ? "✅" : "❌"
      html += `
        <div class="result-item">
          <div>${status} ${result.matchCount} matches</div>
          <div style="font-size: 10px; opacity: 0.8; word-break: break-all;">
            ${result.selector}
          </div>
        </div>
      `
    })

    this.resultContent.innerHTML = html
    this.results.style.display = "block"
  }

  private hideResults(): void {
    this.results.style.display = "none"
  }
}

new PopupController()
