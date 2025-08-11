import { Buffer } from 'buffer'
import fetch from 'cross-fetch'
import { EngageError } from './error'

if (typeof btoa === 'undefined') {
  global.btoa = function (str) {
    return Buffer.from(str).toString('base64')
  }
}

export interface Key {
  key?: string
  secret?: string
}
export interface EventParameter {
  event: string
  value?: string | number | Date | boolean
  properties?: {
    [key: string]: string | number | Date | boolean
  }
  timestamp?: string | number | Date
}
export interface UserAttrParams {
  [key: string]: string | number | Date | boolean
}
export type UserIdentifyParams = UserAttrParams & { id: string }
type DataParameters = {
  [key: string]: string | number | Date | boolean
} & {
  meta?: {
    [key: string]: string | number | Date | boolean
  }
}
type Methods = 'POST' | 'PUT' | 'DELETE' | 'GET'
// type UserIdentifyParams = {
//   id: string
//   [key: string]: string | number | Date | boolean
// }
// type UserAttrParams = Omit<UserIdentifyParams, 'id'>

// const rootURL = 'https://api.engage.so/v1'
let auth: string = ''
let currentUserId: string = ''
const notMeta = ['created_at', 'is_account', 'number', 'device_token', 'device_platform', 'email', 'first_name', 'last_name', 'tz', 'app_version', 'app_build', 'app_last_active']
const apiRoot = 'https://api.engage.so/v1'

function isNull (v: any | null | undefined): boolean {
  return (v === null || v === undefined)
}
function isNullString (v: string | null | undefined): boolean {
  return (v === null || v === undefined || v === '')
}

function resolveUserId (uid?: string): string {
  if (!isNullString(uid)) {
    return uid as string
  }
  if (isNullString(currentUserId)) {
    throw new EngageError('User ID missing. Call identify() first or provide a uid parameter.')
  }
  return currentUserId
}

async function _request (url: string, params: Record<string, any> | null | undefined, method: Methods): Promise<object> {
  try {
    const o: any = {
      method,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        Authorization: `Basic ${auth}`
      }
      // throwHttpErrors: false,
      // prefixUrl: rootURL
    }
    if (!isNull(params)) {
      o.body = JSON.stringify(params)
    }
    // const response = await ky(url, o)
    const response = await fetch(`${apiRoot}${url}`, o)
    const body: any = await response.json()
    let error = 'API connection error'
    if (!response.ok) {
      if (typeof body?.error === 'string') {
        error = body.error
      }
      return { error }
    }
    return body
  } catch (e) {
    return { error: 'API connection error' }
  }
}
// Alias of _request method
// Same with _request for now but can later have modifications
export async function request (url: string, params: Record<string, any> | null | undefined, method: Methods = 'GET'): Promise<object> {
  return await _request(url, params, method)
}

export function init (key: Key | string): void {
  if (isNull(key)) {
    throw new EngageError('You need to pass in your API key(s).')
  }

  // Clear any stored user ID when reinitializing
  currentUserId = ''

  const options: Key = {
    key: '',
    secret: ''
  }
  if (typeof key === 'string') {
    if (key === '') {
      throw new EngageError('`key` is empty.')
    }
    options.key = key
  } else {
    if (isNullString(key.key)) {
      throw new EngageError('`key` missing in object.')
    }
    options.key = key.key
    if (!isNullString(key.secret)) {
      options.secret = key.secret
    }
  }
  // Set auth
  auth = btoa(`${options.key ?? ''}:${options.secret ?? ''}`)
}

// Data tracking
export async function identify (user: UserIdentifyParams): Promise<object> {
  if (isNull(user)) {
    throw new EngageError('You need to pass an object with at least an id.')
  }
  if (isNullString(user.id)) {
    throw new EngageError('ID missing.')
  }
  if (!isNull(user.email) && (typeof user.email !== 'string' || !/^\S+@\S+$/.test(user.email))) {
    throw new EngageError('Email invalid.')
  }
  const params: DataParameters = {}
  params.meta = {}
  for (const k in user) {
    if (k === 'id' || notMeta.includes(k)) {
      params[k] = user[k]
    } else {
      params.meta[k] = user[k]
    }
  }

  // Store the user ID for use in other functions
  currentUserId = user.id

  return await _request(`/users/${user.id}`, params, 'PUT')
}

// Overloaded function signatures for addAttribute
export async function addAttribute (attributes: UserAttrParams): Promise<object>
export async function addAttribute (uid: string, attributes: UserAttrParams): Promise<object>
export async function addAttribute (uidOrAttributes: string | UserAttrParams, attributes?: UserAttrParams): Promise<object> {
  let uid: string
  let attrs: UserAttrParams

  // Handle overloaded parameters
  if (typeof uidOrAttributes === 'string') {
    uid = resolveUserId(uidOrAttributes)
    if (isNull(attributes)) {
      throw new EngageError('Attributes missing when uid is provided.')
    }
    attrs = attributes as UserAttrParams
  } else {
    uid = resolveUserId()
    attrs = uidOrAttributes
  }

  if (isNull(attrs)) {
    throw new EngageError('Attributes missing.')
  }
  if (Object.keys(attrs).length === 0) {
    throw new EngageError('Attributes missing.')
  }
  const params: DataParameters = {}
  params.meta = {}
  for (const k in attrs) {
    if (notMeta.includes(k)) {
      params[k] = attrs[k]
    } else {
      params.meta[k] = attrs[k]
    }
  }
  if (Object.keys(params.meta).length === 0) {
    delete params.meta
  }

  return await _request(`/users/${uid}`, params, 'PUT')
}

// Overloaded function signatures for track
export async function track (data: EventParameter): Promise<object>
export async function track (uid: string, data: EventParameter): Promise<object>
export async function track (uidOrData: string | EventParameter, data?: EventParameter): Promise<object> {
  let uid: string
  let eventData: EventParameter

  // Handle overloaded parameters
  if (typeof uidOrData === 'string') {
    uid = resolveUserId(uidOrData)
    if (isNull(data)) {
      throw new EngageError('Event data missing when uid is provided.')
    }
    eventData = data as EventParameter
  } else {
    uid = resolveUserId()
    eventData = uidOrData
  }

  if (isNull(eventData)) {
    throw new EngageError('Event data missing.')
  }
  if (typeof eventData === 'string') {
    eventData = {
      event: eventData,
      value: true
    }
  } else {
    if (Object.keys(eventData).length === 0) {
      throw new EngageError('Attributes missing.')
    }
  }

  return await _request(`/users/${uid}/events`, eventData, 'POST')
}

// Overloaded function signatures for merge
export async function merge (destinationUid: string): Promise<object>
export async function merge (sourceUid: string, destinationUid: string): Promise<object>
export async function merge (sourceOrDestinationUid: string, destinationUid?: string): Promise<object> {
  let sourceUid: string
  let destUid: string

  // Handle overloaded parameters
  if (isNullString(destinationUid)) {
    // Called with one parameter: merge(destinationUid)
    sourceUid = resolveUserId()
    destUid = sourceOrDestinationUid
  } else {
    // Called with two parameters: merge(sourceUid, destinationUid)
    sourceUid = resolveUserId(sourceOrDestinationUid)
    destUid = destinationUid as string
  }

  if (isNullString(destUid)) {
    throw new EngageError('Destination ID missing.')
  }

  return await _request('/users/merge', {
    source: sourceUid,
    destination: destUid
  }, 'POST')
}

// Account functions
export async function addToAccount (uid: string, accountId: string, role?: string): Promise<object> {
  if (isNullString(uid)) {
    throw new EngageError('User ID missing.')
  }
  if (isNullString(accountId)) {
    throw new EngageError('Account ID missing.')
  }
  if (!isNull(role) && typeof role !== 'string') {
    throw new EngageError('Role should be a text.')
  }
  const g: Record<string, string> = {
    id: accountId
  }
  if (!isNullString(role)) {
    g.role = role as string
  }
  return await _request(`/users/${uid}/accounts`, { accounts: [g] }, 'POST')
}

// Overloaded function signatures for removeFromAccount
export async function removeFromAccount (accountId: string): Promise<object>
export async function removeFromAccount (uid: string, accountId: string): Promise<object>
export async function removeFromAccount (uidOrAccountId: string, accountId?: string): Promise<object> {
  let uid: string
  let acctId: string

  // Handle overloaded parameters
  if (isNullString(accountId)) {
    // Called with one parameter: removeFromAccount(accountId)
    uid = resolveUserId()
    acctId = uidOrAccountId
  } else {
    // Called with two parameters: removeFromAccount(uid, accountId)
    uid = resolveUserId(uidOrAccountId)
    acctId = accountId as string
  }

  if (isNullString(acctId)) {
    throw new EngageError('Account ID missing.')
  }
  return await _request(`/users/${uid}/accounts/${acctId}`, null, 'DELETE')
}

// Overloaded function signatures for changeAccountRole
export async function changeAccountRole (accountId: string, role: string): Promise<object>
export async function changeAccountRole (uid: string, accountId: string, role: string): Promise<object>
export async function changeAccountRole (uidOrAccountId: string, accountIdOrRole: string, role?: string): Promise<object> {
  let uid: string
  let accountId: string
  let newRole: string

  // Handle overloaded parameters
  if (isNullString(role)) {
    // Called with two parameters: changeAccountRole(accountId, role)
    uid = resolveUserId()
    accountId = uidOrAccountId
    newRole = accountIdOrRole
  } else {
    // Called with three parameters: changeAccountRole(uid, accountId, role)
    uid = resolveUserId(uidOrAccountId)
    accountId = accountIdOrRole
    newRole = role as string
  }

  if (isNullString(accountId)) {
    throw new EngageError('Account ID missing.')
  }
  if (isNullString(newRole)) {
    throw new EngageError('New role missing.')
  }
  return await _request(`/users/${uid}/accounts/${accountId}`, { role: newRole }, 'PUT')
}

// Overloaded function signatures for convertToCustomer
export async function convertToCustomer (): Promise<object>
export async function convertToCustomer (uid?: string): Promise<object> {
  const userId = resolveUserId(uid)
  return await _request(`/users/${userId}/convert`, { type: 'customer' }, 'POST')
}

// Overloaded function signatures for convertToAccount
export async function convertToAccount (): Promise<object>
export async function convertToAccount (uid?: string): Promise<object> {
  const userId = resolveUserId(uid)
  return await _request(`/users/${userId}/convert`, { type: 'account' }, 'POST')
}

// Create an object containing all exports for easy access
const EngageSDK = {
  init,
  identify,
  addAttribute,
  track,
  merge,
  addToAccount,
  removeFromAccount,
  changeAccountRole,
  convertToCustomer,
  convertToAccount,
  request
}

// Export as default for import EngageSDK syntax
export default EngageSDK
