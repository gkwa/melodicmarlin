import { SelectorConfig, TestResult, HighlightOptions } from "../shared/types.js"
import { Logger } from "../shared/logger.js"
import { ElementFinder } from "./element-finder.js"
import { ElementHighlighter } from "./element-highlighter.js"
import { ElementRemover } from "./element-remover.js"

export interface ISelectorManager {
  testSelector(config: SelectorConfig): TestResult
  highlightElements(config: SelectorConfig, options?: HighlightOptions): void
  removeElements(config: SelectorConfig): void
  clearHighlights(): void
}

export class SelectorManager implements ISelectorManager {
  private logger: Logger
  private elementFinder: ElementFinder
  private elementHighlighter: ElementHighlighter
  private elementRemover: ElementRemover

  constructor() {
    this.logger = Logger.getInstance()
    this.elementFinder = new ElementFinder(this.logger)
    this.elementHighlighter = new ElementHighlighter(this.logger)
    this.elementRemover = new ElementRemover(this.logger)
  }

  public testSelector(config: SelectorConfig): TestResult {
    try {
      this.logger.debug(`Testing selector: ${config.selector}`)

      const elements = this.elementFinder.findElements(config.selector)

      const result: TestResult = {
        selector: config.selector,
        matchCount: elements.length,
        elements: Array.from(elements),
        success: elements.length > 0,
      }

      this.logger.verbose(`Selector test result:`, result)
      return result
    } catch (error) {
      this.logger.error(`Error testing selector ${config.selector}:`, error)
      return {
        selector: config.selector,
        matchCount: 0,
        elements: [],
        success: false,
      }
    }
  }

  public highlightElements(config: SelectorConfig, options?: HighlightOptions): void {
    try {
      const elements = this.elementFinder.findElements(config.selector)
      this.elementHighlighter.highlightElements(elements, config, options)

      // Only log if elements were actually highlighted
      if (elements.length > 0) {
        this.logger.debug(
          `Highlighted ${elements.length} elements with selector: ${config.selector}`,
        )
      }
    } catch (error) {
      this.logger.error(`Error highlighting elements:`, error)
    }
  }

  public removeElements(config: SelectorConfig): void {
    try {
      const elements = this.elementFinder.findElements(config.selector)
      this.elementRemover.removeElements(elements)

      this.logger.info(`Removed ${elements.length} elements with selector: ${config.selector}`)
    } catch (error) {
      this.logger.error(`Error removing elements:`, error)
    }
  }

  public clearHighlights(): void {
    try {
      this.elementHighlighter.clearHighlights()
    } catch (error) {
      this.logger.error(`Error clearing highlights:`, error)
    }
  }
}
