import type { ReactNode } from 'react';
import { Logo } from '../components/layout/Logo';
import { Card } from '../components/ui/Card';

export function AuthShell({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-6">
        <Logo />
      </div>
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 font-display text-2xl font-bold">{title}</h1>
        {children}
      </Card>
      <p className="mt-6 text-sm text-muted">{footer}</p>
    </div>
  );
}
