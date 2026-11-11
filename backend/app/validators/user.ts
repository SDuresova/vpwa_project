import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.create({
  firstName: vine.string().trim().minLength(1).maxLength(64),
  lastName: vine.string().trim().minLength(1).maxLength(64),
  nickname: vine.string().trim().minLength(3).maxLength(32).regex(/^[a-zA-Z0-9_-]+$/).unique({ table: 'users', column: 'nickname' }),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  nickname: vine.string().trim(),
  password: vine.string(),
})
