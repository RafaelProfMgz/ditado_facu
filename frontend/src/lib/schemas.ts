import { z } from 'zod';

// Espelha as regras do backend (especificação, seção 5.3).
const email = z.string().trim().toLowerCase().email('E-mail inválido').max(255);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha').max(72),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Mínimo de 2 caracteres').max(100, 'Máximo de 100 caracteres'),
    email,
    password: z.string().min(8, 'Mínimo de 8 caracteres').max(72, 'Máximo de 72 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;

export const MAX_UPLOAD_MB = 25;
export const ACCEPTED_AUDIO = '.mp3,.m4a,.wav,.ogg,.webm,.flac,.mp4,.mpeg,audio/*';
