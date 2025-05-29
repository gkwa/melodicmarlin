import { DebugInfo, TestResult } from "../shared/types.js"
import { Logger } from "../shared/logger.js"

export interface IDebugOverlay {
  show(debugInfo: DebugInfo): void
  hide(): void
  isVisible(): boolean
}

export class DebugOverlay implements IDebugOverlay {
  private logger: Logger
  private overlay: HTMLElement | null = null
  private readonly OVERLAY_ID = "melodic-marlin-debug-overlay"

  constructor() {
    this.logger = Logger.getInstance()
  }

  public show(debugInfo: DebugInfo): void {
    if (!debugInfo.enabled) {
      this.hide()
      return
    }

    try {
      this.createOverlay()
      this.updateContent(debugInfo)
      this.logger.debug("Debug overlay shown")
    } catch (error) {
      this.logger.error("Error showing debug overlay:", error)
    }
  }

  public hide(): void {
    if (this.overlay) {
      this.overlay.remove()
      this.overlay = null
      this.logger.debug("Debug overlay hidden")
    }
  }

  public isVisible(): boolean {
    return this.overlay !== null && document.contains(this.overlay)
  }

  private createOverlay(): void {
    if (this.overlay) {
      return
    }

    this.overlay = document.createElement("div")
    this.overlay.id = this.OVERLAY_ID
    this.overlay.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: 300px;
      max-height: 400px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      border: 2px solid #0066cc;
      border-radius: 8px;
      padding: 15px;
      font-family: monospace;
      font-size: 12px;
      z-index: 999999;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `

    document.body.appendChild(this.overlay)
  }

  private updateContent(debugInfo: DebugInfo): void {
    if (!this.overlay) {
      return
    }

    const content = this.generateContent(debugInfo)
    this.overlay.innerHTML = content
  }

  private generateContent(debugInfo: DebugInfo): string {
    const { results, timestamp } = debugInfo

    let html = `
      <div style="border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 10px;">
        <strong>🎯 MelodicMarlin Debug</strong>
        <div style="font-size: 10px; opacity: 0.7;">${timestamp}</div>
      </div>
    `

    if (results.length === 0) {
      html += '<div style="color: #888;">No test results available</div>'
      return html
    }

    results.forEach((result, index) => {
      const status = result.success ? "✅" : "❌"
      const color = result.success ? "#00cc66" : "#ff6666"

      html += `
        <div style="margin-bottom: 10px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
          <div style="color: ${color};">
            ${status} ${result.matchCount} matches
          </div>
          <div style="font-size: 10px; word-break: break-all; opacity: 0.8;">
            ${result.selector}
          </div>
        </div>
      `
    })

    return html
  }
}
