import { SelectorManager } from "../core/selector-manager.js"
import { DebugOverlay } from "../core/debug-overlay.js"
import { SettingsManager } from "./settings-manager.js"
import { BadgeUpdater } from "./badge-updater.js"
import { Logger } from "../shared/logger.js"
import { MutationWatcher } from "./mutation-watcher.js"
import { HighlightExecutor } from "./highlight-executor.js"
import { DebounceManager } from "./debounce-manager.js"

export class AutoHighlightService {
  private mutationWatcher: MutationWatcher
  private highlightExecutor: HighlightExecutor
  private debounceManager: DebounceManager
  private highlightCheckCount: number = 0

  constructor(
    private selectorManager: SelectorManager,
    private debugOverlay: DebugOverlay,
    private settingsManager: SettingsManager,
    private badgeUpdater: BadgeUpdater,
    private logger: Logger,
  ) {
    this.highlightExecutor = new HighlightExecutor(
      selectorManager,
      settingsManager,
      badgeUpdater,
      logger,
    )
    this.debounceManager = new DebounceManager(logger)
    this.mutationWatcher = new MutationWatcher(logger)
  }

  public start(): void {
    this.logger.info("🚀 Starting conservative auto highlight...")
    this.highlightCheckCount = 0
    this.performAutoHighlight()
    this.setupMutationObserver()
    this.logger.info("✅ Conservative auto highlight active")
  }

  public stop(): void {
    this.logger.info("🛑 Stopping auto highlight...")
    this.mutationWatcher.stop()
    this.debounceManager.clear()
    this.logger.info("❌ Auto highlight stopped")
  }

  public performAutoHighlight(): void {
    if (!this.settingsManager.isAutoHighlightEnabled()) {
      return
    }
    this.performHighlight()
  }

  public performManualHighlight(): void {
    this.performHighlight()
  }

  private setupMutationObserver(): void {
    this.mutationWatcher.start((triggerReason) => {
      this.logger.info(`🔍 Mutation trigger: ${triggerReason}`)
      this.debouncedHighlight()
    })
  }

  private performHighlight(): void {
    this.highlightCheckCount++
    this.logger.info(`🎨 Highlight scan #${this.highlightCheckCount}`)

    const totalHighlighted = this.highlightExecutor.executeHighlight()

    this.logHighlightResult(totalHighlighted)
    this.badgeUpdater.updateBadge()
  }

  private logHighlightResult(totalHighlighted: number): void {
    const lastCount = this.highlightExecutor.getLastHighlightCount()
    if (totalHighlighted !== lastCount || this.highlightCheckCount % 10 === 0) {
      this.logger.info(
        `🎯 Highlight #${this.highlightCheckCount}: ${totalHighlighted} elements (was ${lastCount})`,
      )
    }
  }

  private debouncedHighlight(): void {
    this.debounceManager.debounce(() => {
      this.logger.info("🔄 Debounced auto-highlight triggered")
      this.performAutoHighlight()
      if (this.settingsManager.isDebugEnabled()) {
        this.showDebugInfo()
      }
    })
  }

  private showDebugInfo(): void {
    const debugInfo = this.highlightExecutor.getDebugInfo()
    this.debugOverlay.show(debugInfo)
  }
}
