export class PopupView {
  private debugToggle!: HTMLInputElement
  private autoHighlightToggle!: HTMLInputElement
  private highlightBtn!: HTMLButtonElement
  private clearBtn!: HTMLButtonElement
  private testBtn!: HTMLButtonElement
  private status!: HTMLElement
  private results!: HTMLElement
  private resultContent!: HTMLElement

  public bindElements(): void {
    this.debugToggle = document.getElementById("debugToggle") as HTMLInputElement
    this.autoHighlightToggle = document.getElementById("autoHighlightToggle") as HTMLInputElement
    this.highlightBtn = document.getElementById("highlightBtn") as HTMLButtonElement
    this.clearBtn = document.getElementById("clearBtn") as HTMLButtonElement
    this.testBtn = document.getElementById("testBtn") as HTMLButtonElement
    this.status = document.getElementById("status") as HTMLElement
    this.results = document.getElementById("results") as HTMLElement
    this.resultContent = document.getElementById("resultContent") as HTMLElement

    if (
      !this.debugToggle ||
      !this.autoHighlightToggle ||
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

  public onDebugToggle(callback: (enabled: boolean) => void): void {
    this.debugToggle.addEventListener("change", () => {
      callback(this.debugToggle.checked)
    })
  }

  public onAutoHighlightToggle(callback: (enabled: boolean) => void): void {
    this.autoHighlightToggle.addEventListener("change", () => {
      callback(this.autoHighlightToggle.checked)
    })
  }

  public onHighlightClick(callback: () => void): void {
    this.highlightBtn.addEventListener("click", callback)
  }

  public onClearClick(callback: () => void): void {
    this.clearBtn.addEventListener("click", callback)
  }

  public onTestClick(callback: () => void): void {
    this.testBtn.addEventListener("click", callback)
  }

  public setDebugToggle(enabled: boolean): void {
    this.debugToggle.checked = enabled
  }

  public setAutoHighlightToggle(enabled: boolean): void {
    this.autoHighlightToggle.checked = enabled
  }

  public updateStatus(message: string): void {
    this.status.textContent = message
  }

  public displayResults(data: any): void {
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

  public hideResults(): void {
    this.results.style.display = "none"
  }
}
