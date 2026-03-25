/**
 * Validates required environment variables on startup.
 * Exits process if critical variables are missing.
 */

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVar[] = [
  { name: 'DATABASE_URL', required: true, description: 'PostgreSQL connection string' },
  { name: 'NODE_ENV', required: false, description: 'Node environment (development/production)' },
  { name: 'PORT', required: false, description: 'Server port (default: 4000)' },
  { name: 'RAZORPAY_KEY_ID', required: false, description: 'Razorpay key ID (payments disabled without it)' },
  { name: 'RAZORPAY_KEY_SECRET', required: false, description: 'Razorpay key secret' },
  { name: 'WHATSAPP_API_TOKEN', required: false, description: 'WhatsApp Cloud API token (optional)' },
  { name: 'WHATSAPP_PHONE_NUMBER_ID', required: false, description: 'WhatsApp Phone Number ID (optional)' },
  { name: 'SMTP_HOST', required: false, description: 'SMTP host for email (optional)' },
  { name: 'SMTP_USER', required: false, description: 'SMTP username' },
  { name: 'SMTP_PASS', required: false, description: 'SMTP password' },
  { name: 'FRONTEND_URL', required: false, description: 'Frontend URL for CORS' },
];

export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];
    if (!value) {
      if (envVar.required) {
        missing.push(`  ✗ ${envVar.name} — ${envVar.description}`);
      } else {
        warnings.push(`  ⚠ ${envVar.name} — ${envVar.description}`);
      }
    }
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('\n[env] Optional variables not set (some features may be disabled):');
    warnings.forEach((w) => console.warn(w));
  }

  if (missing.length > 0) {
    console.error('\n[env] FATAL — Required environment variables missing:');
    missing.forEach((m) => console.error(m));
    console.error('\nSet these variables in your .env file and restart.\n');
    process.exit(1);
  }
}
