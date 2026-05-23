import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    throw new Error(`Variable d'environnement manquante : ${name}. Vérifie ton fichier .env.`)
  }
  return value
}

export const PORT = parseInt(requireEnv('PORT'), 10)
export const JWT_SECRET = requireEnv('JWT_SECRET')
export const DATABASE_URL = requireEnv('DATABASE_URL')
export const NODE_ENV = process.env.NODE_ENV ?? 'development'
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

if (Number.isNaN(PORT)) {
  throw new Error(`PORT invalide : "${process.env.PORT}". Doit être un nombre.`)
}

if (JWT_SECRET.length < 16) {
  throw new Error(`JWT_SECRET trop court (${JWT_SECRET.length} caractères, minimum 16). Génère-en un avec : node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`)
}

if (JWT_SECRET.length < 32) {
  console.warn(`⚠️  JWT_SECRET fait ${JWT_SECRET.length} caractères. Recommandé : 32+ pour la sécurité.`)
}