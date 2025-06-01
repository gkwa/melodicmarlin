import { Logger, LogLevel } from "../shared/logger.js"
import { PopupController } from "./popup-controller.js"
import { PopupView } from "./popup-view.js"
import { PopupMessenger } from "./popup-messenger.js"
import { PopupStateManager } from "./popup-state-manager.js"

class PopupApp {
  private logger: Logger
  private view: PopupView
  private messenger: PopupMessenger
  private stateManager: PopupStateManager
  private controller: PopupController

  constructor() {
    this.logger = Logger.getInstance()
    this.logger.setLogLevel(LogLevel.INFO)

    this.view = new PopupView()
    this.messenger = new PopupMessenger(this.logger)
    this.stateManager = new PopupStateManager(this.logger)
    this.controller = new PopupController(this.view, this.messenger, this.stateManager, this.logger)

    this.init()
  }

  private init(): void {
    this.logger.info("Popup initialized")
    this.controller.init()
  }
}

new PopupApp()
