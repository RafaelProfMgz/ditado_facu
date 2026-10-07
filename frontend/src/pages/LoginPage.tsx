import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { getErrorMessage } from '../lib/errors';
import { loginSchema, type LoginForm } from '../lib/schemas';
import { login } from '../services/auth';
import { useAuthStore } from '../store/authStore';
import { AuthShell } from './AuthShell';

export function LoginPage() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ user, accessToken }) => {
      setSession(user, accessToken);
      navigate(from, { replace: true });
    },
  });

  return (
    <AuthShell
      title="Entrar"
      footer={<>Não tem conta? <Link to="/cadastrar" className="font-medium text-accent hover:underline">Criar conta</Link></>}
    >
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4" noValidate>
        {params.get('expirada') && !mutation.isError && <Alert kind="info">Sua sessão expirou. Entre novamente.</Alert>}
        {mutation.isError && <Alert>{getErrorMessage(mutation.error)}</Alert>}
        <Field label="E-mail" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
        <Field label="Senha" type="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Entrar
        </Button>
      </form>
    </AuthShell>
  );
}
