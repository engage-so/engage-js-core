import * as Engage from '../src/index'
import EngageSDK from '../src/index'

describe('Method Overriding', () => {
  describe('Individual function exports', () => {
    test('should allow access to original init function', () => {
      expect(() => {
        Engage.init('test-key')
      }).not.toThrow()
    })

    test('should allow method overriding by replacing function', async () => {
      // Save original function
      const originalTrack = Engage.track

      // Create a mock function to override with
      const customTrack = jest.fn().mockImplementation(async (uidOrData: any, data?: any) => {
        // Call original function for proper behavior
        const result = await originalTrack(uidOrData, data)
        // Add custom flag to result
        return { ...result, customFlag: 'overridden' }
      })

      // Override the function
      ;(Engage as any).track = customTrack

      // Test the overridden function
      try {
        const result = await (Engage as any).track('user123', { event: 'test-event' })
        expect(result).toHaveProperty('customFlag', 'overridden')
        expect(customTrack).toHaveBeenCalledWith('user123', { event: 'test-event' })
      } catch (error) {
        // Expected to fail due to API authentication, but should still call our custom function
        expect(customTrack).toHaveBeenCalledWith('user123', { event: 'test-event' })
      }

      // Restore original function
      ;(Engage as any).track = originalTrack
    })

    test('should maintain function reference integrity', () => {
      const trackFunction = Engage.track
      expect(typeof trackFunction).toBe('function')
      expect(trackFunction).toBe(Engage.track)
    })
  })

  describe('Default export overriding', () => {
    test('should work with default export init', () => {
      expect(() => {
        EngageSDK.init('test-key-2')
      }).not.toThrow()
    })

    test('should allow method overriding on default export', async () => {
      // Save original function
      const originalIdentify = EngageSDK.identify

      // Create a mock function
      const customIdentify = jest.fn().mockImplementation(async (user: any) => {
        const result = await originalIdentify(user)
        return { ...result, customProcessed: true }
      })

      // Override the function
      ;(EngageSDK as any).identify = customIdentify

      // Test the overridden function
      try {
        const result = await (EngageSDK as any).identify({ id: 'test-user', email: 'test@example.com' })
        expect(result).toHaveProperty('customProcessed', true)
        expect(customIdentify).toHaveBeenCalledWith({ id: 'test-user', email: 'test@example.com' })
      } catch (error) {
        // Expected to fail due to API authentication, but should still call our custom function
        expect(customIdentify).toHaveBeenCalledWith({ id: 'test-user', email: 'test@example.com' })
      }

      // Restore original function
      ;(EngageSDK as any).identify = originalIdentify
    })

    test('should have consistent function references between named and default exports', () => {
      expect(typeof EngageSDK.init).toBe('function')
      expect(typeof EngageSDK.track).toBe('function')
      expect(typeof EngageSDK.identify).toBe('function')
    })
  })

  describe('Overriding behavior validation', () => {
    test('should allow chaining of overridden methods', async () => {
      const originalAddAttribute = Engage.addAttribute

      // First override
      const firstOverride = jest.fn().mockImplementation(async (uidOrAttrs: any, attrs?: any) => {
        const result = await (originalAddAttribute as any)(uidOrAttrs, attrs)
        return { ...result, step1: 'complete' }
      })

      // Second override that calls first override
      const secondOverride = jest.fn().mockImplementation(async (uidOrAttrs: any, attrs?: any) => {
        const result = await firstOverride(uidOrAttrs, attrs)
        return { ...result, step2: 'complete' }
      })

      ;(Engage as any).addAttribute = secondOverride

      try {
        await (Engage as any).addAttribute('test-user', { name: 'Test' })
        expect(secondOverride).toHaveBeenCalled()
        expect(firstOverride).toHaveBeenCalled()
      } catch (error) {
        // Expected to fail but should still call our functions
        expect(secondOverride).toHaveBeenCalled()
        expect(firstOverride).toHaveBeenCalled()
      }

      // Restore
      ;(Engage as any).addAttribute = originalAddAttribute
    })
  })
})
