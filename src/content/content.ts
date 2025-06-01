import { SelectorManager } from "../core/selector-manager.js"
import { DebugOverlay } from "../core/debug-overlay.js"
import { Logger, LogLevel } from "../shared/logger.js"
import { MessageHandler } from "./message-handler.js"
import { SettingsManager } from "./settings-manager.js"
import { AutoHighlightService } from "./auto-highlight-service.js"
import { BadgeUpdater } from "./badge-updater.js"

class ContentScript {
  private selectorManager: SelectorManager
  private debugOverlay: DebugOverlay
  private logger: Logger
  private messageHandler: MessageHandler
  private settingsManager: SettingsManager
  private autoHighlightService: AutoHighlightService
  private badgeUpdater: BadgeUpdater

  constructor() {
    this.logger = Logger.getInstance()
    this.logger.setLogLevel(LogLevel.INFO)
    this.selectorManager = new SelectorManager()
    this.debugOverlay = new DebugOverlay()
    this.settingsManager = new SettingsManager()
    this.badgeUpdater = new BadgeUpdater(this.selectorManager)

    this.autoHighlightService = new AutoHighlightService(
      this.selectorManager,
      this.debugOverlay,
      this.settingsManager,
      this.badgeUpdater,
      this.logger,
    )

    this.messageHandler = new MessageHandler(
      this.selectorManager,
      this.debugOverlay,
      this.settingsManager,
      this.autoHighlightService,
      this.badgeUpdater,
      this.logger,
    )

    this.init()
  }

  private init(): void {
    // Only run on Claude sites
    if (!this.isClaudeSite()) {
      this.logger.info("Not a Claude site, MelodicMarlin not initializing")
      return
    }

    this.logger.info("MelodicMarlin content script initialized")
    this.messageHandler.setup()

    // Load settings and start auto-highlight if enabled
    this.settingsManager.loadSettings().then(() => {
      if (this.settingsManager.isAutoHighlightEnabled()) {
        this.logger.info("Auto-highlight was enabled in settings, starting service...")
        this.autoHighlightService.start()
      }

      // Initial scan after page settles
      setTimeout(() => {
        if (this.settingsManager.isAutoHighlightEnabled()) {
          this.autoHighlightService.performAutoHighlight()
        }
      }, 3000)
    })
  }

  private isClaudeSite(): boolean {
    const hostname = window.location.hostname
    return hostname === "claude.ai" || hostname.endsWith(".claude.ai")
  }
}

new ContentScript()
