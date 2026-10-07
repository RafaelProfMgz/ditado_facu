import type { Role } from '../enums/role.enum.js';

/** Usuário autenticado, disponível em req.user e via @CurrentUser(). */
export interface AuthUser {
  id: string;
  role: Role;
}
