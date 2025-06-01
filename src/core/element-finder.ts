import { Logger } from "../shared/logger.js"

export class ElementFinder {
  constructor(private logger: Logger) {}

  public findElements(selector: string): NodeListOf<Element> {
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
}
