export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  oauthStateSecret: process.env.OAUTH_STATE_SECRET ?? '',
  appBaseUrl: process.env.WEB_APP_URL ?? 'http://localhost:3000',
  webAppUrl: process.env.WEB_APP_URL ?? 'http://localhost:3000',
  adminAppUrl: process.env.ADMIN_APP_URL ?? 'http://localhost:3001',
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:5000',
  appName: process.env.APP_NAME ?? 'Fotopixelz',
  supportEmail: process.env.SUPPORT_EMAIL ?? 'support@fotopixelz.com',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:5000/api/v1/auth/google/callback',
  redisUrl: process.env.REDIS_URL ?? '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  emailFrom: process.env.EMAIL_FROM ?? '',
  emailReplyTo: process.env.EMAIL_REPLY_TO ?? '',
  emailLogoUrl: process.env.EMAIL_LOGO_URL ?? '',
  // Kill-switch for login-time email verification enforcement. Defaults to
  // enabled; set to the string "false" to disable without a code revert.
  enforceEmailVerification: process.env.ENFORCE_EMAIL_VERIFICATION !== 'false',
  storageProvider: process.env.STORAGE_PROVIDER ?? '',
  storageUploadExpirySeconds: Number(process.env.STORAGE_UPLOAD_EXPIRY_SECONDS ?? 900),
  storageDownloadExpirySeconds: Number(process.env.STORAGE_DOWNLOAD_EXPIRY_SECONDS ?? 300),
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? ''
}

