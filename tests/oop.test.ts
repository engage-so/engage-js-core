import * as Engage from '../src/index'
import EngageSDK from '../src/index'

describe('Object-Oriented Pattern', () => {
  describe('Functional style imports', () => {
    test('should work with named import init', () => {
      expect(() => {
        Engage.init('test-key')
      }).not.toThrow()
    })

    test('should work with destructured init', () => {
      const { init } = Engage
      expect(() => {
        init('test-key-2')
      }).not.toThrow()
    })
  })

  describe('Static class style imports', () => {
    test('should work with default import init', () => {
      expect(() => {
        EngageSDK.init('test-key')
      }).not.toThrow()
    })

    test('should have all expected methods on default export', () => {
      expect(typeof EngageSDK.init).toBe('function')
      expect(typeof EngageSDK.identify).toBe('function')
      expect(typeof EngageSDK.addAttribute).toBe('function')
      expect(typeof EngageSDK.track).toBe('function')
      expect(typeof EngageSDK.merge).toBe('function')
      expect(typeof EngageSDK.addToAccount).toBe('function')
      expect(typeof EngageSDK.removeFromAccount).toBe('function')
      expect(typeof EngageSDK.changeAccountRole).toBe('function')
      expect(typeof EngageSDK.convertToCustomer).toBe('function')
      expect(typeof EngageSDK.convertToAccount).toBe('function')
      expect(typeof EngageSDK.request).toBe('function')
    })
  })
})
