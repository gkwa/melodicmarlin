import { SelectorConfig, TestResult, HighlightOptions } from "../shared/types.js"
import { Logger } from "../shared/logger.js"

export interface ISelectorManager {
  testSelector(config: SelectorConfig): TestResult
  highlightElements(config: SelectorConfig, options?: HighlightOptions): void
  removeElements(config: SelectorConfig): void
  clearHighlights(): void
}

export class SelectorManager implements ISelectorManager {
  private logger: Logger
  private readonly HIGHLIGHT_CLASS = "melodic-marlin-highlight"

  constructor() {
    this.logger = Logger.getInstance()
  }

  public testSelector(config: SelectorConfig): TestResult {
    try {
      this.logger.debug(`Testing selector: ${config.selector}`)

      const elements = this.findElements(config.selector)

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
      const elements = this.findElements(config.selector)
      const defaultOptions: HighlightOptions = {
        borderColor: config.highlightColor || "#ff0000",
        backgroundColor: this.hexToRgba(config.highlightColor || "#ff0000", 0.1),
        borderWidth: "3px",
      }

      const finalOptions = { ...defaultOptions, ...options }

      elements.forEach((element) => {
        if (element instanceof HTMLElement) {
          element.classList.add(this.HIGHLIGHT_CLASS)
          element.style.border = `${finalOptions.borderWidth} solid ${finalOptions.borderColor}`
          element.style.backgroundColor = finalOptions.backgroundColor
        }
      })

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
      const elements = this.findElements(config.selector)

      elements.forEach((element) => {
        element.remove()
      })

      this.logger.info(`Removed ${elements.length} elements with selector: ${config.selector}`)
    } catch (error) {
      this.logger.error(`Error removing elements:`, error)
    }
  }

  public clearHighlights(): void {
    try {
      const highlightedElements = document.querySelectorAll(`.${this.HIGHLIGHT_CLASS}`)

      highlightedElements.forEach((element) => {
        if (element instanceof HTMLElement) {
          element.classList.remove(this.HIGHLIGHT_CLASS)
          element.style.removeProperty("border")
          element.style.removeProperty("background-color")
        }
      })

      // Only log if there were highlights to clear
      if (highlightedElements.length > 0) {
        this.logger.debug(`Cleared highlights from ${highlightedElements.length} elements`)
      }
    } catch (error) {
      this.logger.error(`Error clearing highlights:`, error)
    }
  }

  private findElements(selector: string): NodeListOf<Element> {
    // Handle special pseudo-selectors like :contains()
    if (selector.includes(":contains(")) {
      return this.handleContainsSelector(selector)
    }

    return document.querySelectorAll(selector)
  }

  private handleContainsSelector(selector: string): NodeListOf<Element> {
    // Parse :contains() pseudo-selector
    const match = selector.match(/^([^:]*):contains\("([^"]+)"\)$/)
    if (!match) {
      this.logger.warn(`Invalid :contains() selector: ${selector}`)
      return document.querySelectorAll("nonexistent")
    }

    const [, baseSelector, containsText] = match

    // Check that containsText is defined
    if (!containsText) {
      this.logger.warn(`Empty contains text in selector: ${selector}`)
      return document.querySelectorAll("nonexistent")
    }

    const baseElements = document.querySelectorAll(baseSelector || "*")
    const matchingElements: Element[] = []

    baseElements.forEach((element) => {
      if (element.textContent?.includes(containsText)) {
        matchingElements.push(element)
      }
    })

    // Create a NodeList-like object
    return {
      length: matchingElements.length,
      [Symbol.iterator]: () => matchingElements[Symbol.iterator](),
      forEach: (callback: (element: Element, index: number) => void) => {
        matchingElements.forEach(callback)
      },
      item: (index: number) => matchingElements[index] || null,
    } as NodeListOf<Element>
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
}
