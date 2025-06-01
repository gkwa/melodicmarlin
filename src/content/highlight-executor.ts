import { SelectorManager } from "../core/selector-manager.js"
import { SettingsManager } from "./settings-manager.js"
import { BadgeUpdater } from "./badge-updater.js"
import { Logger } from "../shared/logger.js"
import { ALL_SELECTORS } from "../shared/selectors.js"
import { DebugInfo } from "../shared/types.js"

export class HighlightExecutor {
  private lastHighlightCount: number = 0

  constructor(
    private selectorManager: SelectorManager,
    private settingsManager: SettingsManager,
    private badgeUpdater: BadgeUpdater,
    private logger: Logger,
  ) {}

  public executeHighlight(): number {
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

    this.lastHighlightCount = totalHighlighted
    return totalHighlighted
  }

  public getLastHighlightCount(): number {
    return this.lastHighlightCount
  }

  public getDebugInfo(): DebugInfo {
    const results = ALL_SELECTORS.map((config) => this.selectorManager.testSelector(config))
    return {
      enabled: this.settingsManager.isDebugEnabled(),
      results,
      timestamp: new Date().toLocaleTimeString(),
    }
  }
}
