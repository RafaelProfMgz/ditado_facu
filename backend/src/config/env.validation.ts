const REQUIRED = ['JWT_SECRET', 'GROQ_API_KEY'] as const;

export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !String(config[key] ?? '').trim());
  if (missing.length > 0) {
    throw new Error(
      `Variáveis obrigatórias ausentes em backend/.env: ${missing.join(', ')}. ` +
        'Veja backend/.env.example.',
    );
  }
  return config;
}
