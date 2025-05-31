import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { SelectorManager } from "../core/selector-manager"
import { SelectorConfig } from "../shared/types"

// Create proper HTMLElement mock
class MockHTMLElement {
  classList = {
    add: vi.fn(),
    remove: vi.fn(),
  }

  style = {
    border: "",
    backgroundColor: "",
    removeProperty: vi.fn(),
  }

  remove = vi.fn()
}

// Mock the instanceof check
const originalHTMLElement = globalThis.HTMLElement
const mockQuerySelectorAll = vi.fn()

// Setup DOM mock
Object.defineProperty(globalThis, "document", {
  value: {
    querySelectorAll: mockQuerySelectorAll,
  },
  configurable: true,
})

describe("SelectorManager", () => {
  let selectorManager: SelectorManager
  let testConfig: SelectorConfig
  let mockElement: MockHTMLElement

  beforeEach(() => {
    // Mock HTMLElement constructor for instanceof checks
    Object.defineProperty(globalThis, "HTMLElement", {
      value: MockHTMLElement,
      configurable: true,
    })

    selectorManager = new SelectorManager()
    testConfig = {
      name: "Test Selector",
      selector: ".test-class",
      action: "highlight",
      highlightColor: "#ff0000",
    }

    mockElement = new MockHTMLElement()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original HTMLElement
    Object.defineProperty(globalThis, "HTMLElement", {
      value: originalHTMLElement,
      configurable: true,
    })
  })

  describe("testSelector", () => {
    it("should return successful result when elements are found", () => {
      const mockElements = [mockElement, mockElement]
      mockQuerySelectorAll.mockReturnValue(mockElements)

      const result = selectorManager.testSelector(testConfig)

      expect(result.success).toBe(true)
      expect(result.matchCount).toBe(2)
      expect(result.selector).toBe(".test-class")
    })

    it("should return unsuccessful result when no elements are found", () => {
      mockQuerySelectorAll.mockReturnValue([])

      const result = selectorManager.testSelector(testConfig)

      expect(result.success).toBe(false)
      expect(result.matchCount).toBe(0)
    })
  })

  describe("highlightElements", () => {
    it("should apply highlight styles to found elements", () => {
      const mockElements = [mockElement]
      mockQuerySelectorAll.mockReturnValue(mockElements)

      selectorManager.highlightElements(testConfig)

      expect(mockElement.classList.add).toHaveBeenCalledWith("melodic-marlin-highlight")
      expect(mockElement.style.border).toBe("3px solid #ff0000")
    })
  })

  describe("clearHighlights", () => {
    it("should remove highlight classes and styles", () => {
      const mockElements = [mockElement]
      mockQuerySelectorAll.mockReturnValue(mockElements)

      selectorManager.clearHighlights()

      expect(mockElement.classList.remove).toHaveBeenCalledWith("melodic-marlin-highlight")
      expect(mockElement.style.removeProperty).toHaveBeenCalledWith("border")
      expect(mockElement.style.removeProperty).toHaveBeenCalledWith("background-color")
    })
  })

  describe("removeElements", () => {
    it("should remove elements from DOM", () => {
      const mockElements = [mockElement]
      mockQuerySelectorAll.mockReturnValue(mockElements)

      const removeConfig: SelectorConfig = {
        name: "Remove Test",
        selector: ".remove-me",
        action: "remove",
      }

      selectorManager.removeElements(removeConfig)

      expect(mockElement.remove).toHaveBeenCalled()
    })
  })

  describe("contains selector handling", () => {
    it("should handle :contains() pseudo-selector", () => {
      const containsConfig: SelectorConfig = {
        name: "Contains Test",
        selector: 'button:contains("Fetched")',
        action: "highlight",
      }

      // Mock elements with textContent
      const mockButtonElement = new MockHTMLElement()
      ;(mockButtonElement as any).textContent = "Fetched Data"

      mockQuerySelectorAll.mockReturnValue([mockButtonElement])

      const result = selectorManager.testSelector(containsConfig)

      expect(result.success).toBe(true)
      expect(result.matchCount).toBe(1)
    })
  })
})
