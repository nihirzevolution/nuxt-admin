import { compare, genSalt, hash } from 'bcryptjs'

const ROUNDS = 10

export async function hashPassword(plain: string) {
  const salt = await genSalt(ROUNDS)
  return hash(plain, salt)
}

export function verifyPassword(plain: string, passwordHash: string) {
  return compare(plain, passwordHash)
}
