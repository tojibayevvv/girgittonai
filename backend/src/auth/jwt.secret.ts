import { ConfigService } from '@nestjs/config';

// Sirni DI vaqtida (ConfigService orqali) o'qiymiz: import vaqtida process.env
// hali .env dan to'lmagan bo'ladi. Sir yo'q bo'lsa — server boot bo'lmaydi,
// chunki yashirin fallback sir bilan ishlash xavfli.
export function requireJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (!secret) {
    throw new Error('JWT_SECRET sozlanmagan — backend/.env faylida belgilang.');
  }
  return secret;
}
