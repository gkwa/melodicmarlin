import { Logger } from "../shared/logger.js"

export class ElementRemover {
  constructor(private logger: Logger) {}

  public removeElements(elements: NodeListOf<Element>): void {
    elements.forEach((element) => {
      element.remove()
    })
  }
}
