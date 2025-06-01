import { Logger } from "../shared/logger.js"
import { SelectorManager } from "../core/selector-manager.js"
import { ALL_SELECTORS } from "../shared/selectors.js"

export class BadgeUpdater {
  private logger: Logger

  constructor(private selectorManager: SelectorManager) {
    this.logger = Logger.getInstance()
  }

  public updateBadge(text?: string): void {
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
