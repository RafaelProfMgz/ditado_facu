import { FileAudio, History, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/layout/Logo';
import { useAuthStore } from '../store/authStore';

const STEPS = [
  { icon: FileAudio, title: 'Envie o áudio', text: 'Grave no celular e envie: mp3, m4a, wav, ogg e outros, até 25 MB.' },
  { icon: Sparkles, title: 'Receba o texto', text: 'O Whisper transcreve em segundos, com pontuação, em português.' },
  { icon: History, title: 'Consulte depois', text: 'Tudo fica no seu histórico pessoal, pronto para copiar.' },
];

export function LandingPage() {
  const loggedIn = Boolean(useAuthStore((s) => s.accessToken));
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Logo />
        <nav className="flex items-center gap-2 text-sm font-medium">
          {loggedIn ? (
            <Link to="/app" className="rounded-lg bg-ink px-4 py-2 text-paper hover:bg-ink/85">
              Abrir o Ditado
            </Link>
          ) : (
            <>
              <Link to="/entrar" className="rounded-lg px-3 py-2 text-muted hover:text-ink">
                Entrar
              </Link>
              <Link to="/cadastrar" className="rounded-lg bg-ink px-4 py-2 text-paper hover:bg-ink/85">
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 pt-12 pb-20 sm:pt-20">
          <p className="mb-4 text-sm font-medium tracking-wide text-accent uppercase">Transcrição de áudio</p>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.1] font-bold sm:text-6xl">
            Você fala. <span className="text-accent">O Ditado escreve.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Reuniões, aulas, entrevistas e lembretes de voz viram texto pesquisável e fácil de copiar — sem digitar
            uma linha.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={loggedIn ? '/app' : '/cadastrar'} className="rounded-lg bg-accent px-5 py-3 font-medium text-paper hover:bg-accent-dark">
              {loggedIn ? 'Transcrever agora' : 'Começar grátis'}
            </Link>
            {!loggedIn && (
              <Link to="/entrar" className="rounded-lg border border-line bg-white px-5 py-3 font-medium hover:bg-accent-soft/50">
                Já tenho conta
              </Link>
            )}
          </div>

          <div aria-hidden className="mt-16 flex h-16 items-center gap-1 overflow-hidden">
            {Array.from({ length: 64 }, (_, i) => (
              <span
                key={i}
                className="w-1.5 shrink-0 rounded-full bg-accent/70"
                style={{ height: `${18 + Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.21)) * 82}%` }}
              />
            ))}
          </div>
        </section>

        <section className="border-t border-line bg-white">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <h2 className="font-display text-2xl font-bold">Como funciona</h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="rounded-2xl border border-line p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent-dark">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-display text-sm text-muted">Passo {i + 1}</span>
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted">
        Ditado · Tópicos Especiais em Programação · UNEMAT Sinop
      </footer>
    </div>
  );
}
