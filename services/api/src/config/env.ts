export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  redisUrl: process.env.REDIS_URL ?? '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  resendApiKey: process.env.RESEND_API_KEY ?? ''
}

