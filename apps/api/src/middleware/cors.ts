import { cors } from 'hono/cors'

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')

export const corsMiddleware = cors({
  origin: (origin) => (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]),
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  maxAge: 86400,
})
