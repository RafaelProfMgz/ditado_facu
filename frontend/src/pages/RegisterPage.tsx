import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { getErrorMessage } from '../lib/errors';
import { registerSchema, type RegisterForm } from '../lib/schemas';
import { register as registerUser } from '../services/auth';
import { useAuthStore } from '../store/authStore';
import { AuthShell } from './AuthShell';

export function RegisterPage() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: ({ user, accessToken }) => {
      setSession(user, accessToken);
      navigate('/app', { replace: true });
    },
  });

  return (
    <AuthShell
      title="Criar conta"
      footer={<>Já tem conta? <Link to="/entrar" className="font-medium text-accent hover:underline">Entrar</Link></>}
    >
      {/* confirmPassword fica só no cliente: o backend recusaria o campo extra. */}
      <form
        onSubmit={handleSubmit(({ name, email, password }) => mutation.mutate({ name, email, password }))}
        className="space-y-4"
        noValidate
      >
        {mutation.isError && <Alert>{getErrorMessage(mutation.error)}</Alert>}
        <Field label="Nome" autoComplete="name" {...register('name')} error={errors.name?.message} />
        <Field label="E-mail" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
        <Field label="Senha" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
        <Field label="Confirmar senha" type="password" autoComplete="new-password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Criar conta
        </Button>
      </form>
    </AuthShell>
  );
}
