import { SelectorConfig, HighlightOptions } from "../shared/types.js"
import { Logger } from "../shared/logger.js"
import { ColorUtils } from "../shared/color-utils.js"

export class ElementHighlighter {
  private readonly HIGHLIGHT_CLASS = "melodic-marlin-highlight"

  constructor(private logger: Logger) {}

  public highlightElements(
    elements: NodeListOf<Element>,
    config: SelectorConfig,
    options?: HighlightOptions,
  ): void {
    const defaultOptions: HighlightOptions = {
      borderColor: config.highlightColor || "#ff0000",
      backgroundColor: ColorUtils.hexToRgba(config.highlightColor || "#ff0000", 0.1),
      borderWidth: "3px",
    }

    const finalOptions = { ...defaultOptions, ...options }

    elements.forEach((element) => {
      if (element instanceof HTMLElement) {
        this.applyHighlight(element, finalOptions)
      }
    })
  }

  public clearHighlights(): void {
    const highlightedElements = document.querySelectorAll(`.${this.HIGHLIGHT_CLASS}`)

    highlightedElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        this.removeHighlight(element)
      }
    })

    // Only log if there were highlights to clear
    if (highlightedElements.length > 0) {
      this.logger.debug(`Cleared highlights from ${highlightedElements.length} elements`)
    }
  }

  private applyHighlight(element: HTMLElement, options: HighlightOptions): void {
    element.classList.add(this.HIGHLIGHT_CLASS)
    element.style.border = `${options.borderWidth} solid ${options.borderColor}`
    element.style.backgroundColor = options.backgroundColor
  }

  private removeHighlight(element: HTMLElement): void {
    element.classList.remove(this.HIGHLIGHT_CLASS)
    element.style.removeProperty("border")
    element.style.removeProperty("background-color")
  }
}
