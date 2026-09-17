/**
 * Lives outside the server-action files: a 'use server' module may only export
 * async functions, so a shared constant cannot sit in one.
 */
export const ORDER_COOKIE = 'iris-order'
