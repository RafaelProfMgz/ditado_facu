import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="secondary" onClick={copy} type="button">
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? 'Copiado' : 'Copiar'}
    </Button>
  );
}
