import { Logger } from "../shared/logger.js"

export class MutationWatcher {
  private observer: MutationObserver | null = null

  constructor(private logger: Logger) {}

  public start(onMutation: (triggerReason: string) => void): void {
    if (this.observer) {
      this.observer.disconnect()
    }

    this.observer = new MutationObserver((mutations) => {
      const triggerReason = this.analyzeMutations(mutations)
      if (triggerReason) {
        onMutation(triggerReason)
      }
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  public stop(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }

  private analyzeMutations(mutations: MutationRecord[]): string | null {
    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element

            if (element.tagName === "BUTTON") {
              return "Button element added"
            }

            if (element.querySelector && element.querySelector("button")) {
              return "Container with buttons added"
            }
          }
        }
      }
    }
    return null
  }
}
