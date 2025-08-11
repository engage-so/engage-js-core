import * as Engage from '../src/index'

describe('Function Overloads', () => {
  beforeEach(() => {
    // Initialize SDK before each test
    Engage.init({ key: 'test-key', secret: 'test-secret' })
  })

  describe('Identify and stored user ID', () => {
    test('should store user ID when identify is called', async () => {
      await expect(Engage.identify({ id: 'test-user-123', email: 'test@example.com' }))
        .resolves.toMatchObject({ error: expect.any(String) })
    })
  })

  describe('addAttribute overloads', () => {
    test('should work with uid parameter', async () => {
      await expect(Engage.addAttribute('test-user-123', { name: 'John' }))
        .resolves.toMatchObject({ error: expect.any(String) })
    })

    test('should work without uid parameter after identify', async () => {
      // First identify to store user ID
      await Engage.identify({ id: 'test-user-123', email: 'test@example.com' })
      
      // Then use addAttribute without uid
      await expect(Engage.addAttribute({ name: 'John' }))
        .resolves.toMatchObject({ error: expect.any(String) })
    })

    test('should throw error if no stored uid and no uid provided', async () => {
      // Reset any stored user ID by re-initializing
      Engage.init({ key: 'test-key', secret: 'test-secret' })
      
      await expect(Engage.addAttribute({ name: 'John' }))
        .rejects.toThrow('User ID missing. Call identify() first or provide a uid parameter.')
    })
  })

  describe('track overloads', () => {
    test('should work with uid parameter', async () => {
      await expect(Engage.track('test-user-123', { event: 'login' }))
        .resolves.toMatchObject({ error: expect.any(String) })
    })

    test('should work without uid parameter after identify', async () => {
      // First identify to store user ID
      await Engage.identify({ id: 'test-user-123', email: 'test@example.com' })
      
      // Then use track without uid
      await expect(Engage.track({ event: 'login' }))
        .resolves.toMatchObject({ error: expect.any(String) })
    })

    test('should throw error if no stored uid and no uid provided', async () => {
      // Reset any stored user ID by re-initializing
      Engage.init({ key: 'test-key', secret: 'test-secret' })
      
      await expect(Engage.track({ event: 'login' }))
        .rejects.toThrow('User ID missing. Call identify() first or provide a uid parameter.')
    })
  })

  describe('convertToCustomer overloads', () => {
    test('should work with uid parameter', async () => {
      await expect((Engage.convertToCustomer as any)('test-user-123'))
        .resolves.toMatchObject({ error: expect.any(String) })
    })

    test('should work without uid parameter after identify', async () => {
      // First identify to store user ID
      await Engage.identify({ id: 'test-user-123', email: 'test@example.com' })
      
      // Then use convertToCustomer without uid
      await expect(Engage.convertToCustomer())
        .resolves.toMatchObject({ error: expect.any(String) })
    })

    test('should throw error if no stored uid and no uid provided', async () => {
      // Reset any stored user ID by re-initializing
      Engage.init({ key: 'test-key', secret: 'test-secret' })
      
      await expect(Engage.convertToCustomer())
        .rejects.toThrow('User ID missing. Call identify() first or provide a uid parameter.')
    })
  })

  describe('merge overloads', () => {
    test('should work with both source and destination uid', async () => {
      await expect(Engage.merge('source-user', 'dest-user'))
        .resolves.toMatchObject({ error: expect.any(String) })
    })

    test('should work with destination uid only after identify', async () => {
      // First identify to store user ID (source)
      await Engage.identify({ id: 'source-user', email: 'test@example.com' })
      
      // Then merge with destination only
      await expect(Engage.merge('dest-user'))
        .resolves.toMatchObject({ error: expect.any(String) })
    })

    test('should throw error if no stored uid and only destination provided', async () => {
      // Reset any stored user ID by re-initializing
      Engage.init({ key: 'test-key', secret: 'test-secret' })
      
      await expect(Engage.merge('dest-user'))
        .rejects.toThrow('User ID missing. Call identify() first or provide a uid parameter.')
    })
  })

  describe('account management overloads', () => {
    test('removeFromAccount should work with both signatures', async () => {
      await expect(Engage.removeFromAccount('user-id', 'account-id'))
        .resolves.toMatchObject({ error: expect.any(String) })
      
      // After identify
      await Engage.identify({ id: 'user-id', email: 'test@example.com' })
      await expect(Engage.removeFromAccount('account-id'))
        .resolves.toMatchObject({ error: expect.any(String) })
    })

    test('changeAccountRole should work with both signatures', async () => {
      await expect(Engage.changeAccountRole('user-id', 'account-id', 'owner'))
        .resolves.toMatchObject({ error: expect.any(String) })
      
      // After identify
      await Engage.identify({ id: 'user-id', email: 'test@example.com' })
      await expect(Engage.changeAccountRole('account-id', 'owner'))
        .resolves.toMatchObject({ error: expect.any(String) })
    })
  })
})
