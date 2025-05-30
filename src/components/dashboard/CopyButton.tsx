
"use client";

import { Button } from "@/components/ui/button";
import { ClipboardCopy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  useOrigin?: boolean; // New prop
}

export function CopyButton({ textToCopy, label = "Teks", useOrigin = false }: CopyButtonProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      let finalStringToCopy = textToCopy;
      if (useOrigin && typeof window !== 'undefined') {
        // Ensure the relative path starts with a single slash
        const relativePath = textToCopy.startsWith('/') ? textToCopy : `/${textToCopy}`;
        finalStringToCopy = `${window.location.origin}${relativePath}`;
      }

      navigator.clipboard.writeText(finalStringToCopy).then(() => {
        toast({ title: `${label} Disalin!`, description: `${finalStringToCopy} telah disalin ke clipboard Anda.` });
      }).catch(err => {
        toast({ title: "Penyalinan Gagal", description: `Tidak dapat menyalin ${label}. Error: ${err.message}`, variant: "destructive" });
        console.error('Gagal menyalin: ', err);
      });
    } else {
       toast({ title: "Penyalinan Tidak Didukung", description: "Browser Anda tidak mendukung penyalinan ke clipboard.", variant: "destructive" });
    }
  };

  return (
    <Button variant="ghost" size="icon" className="ml-1 h-7 w-7 shrink-0" onClick={handleCopy} title={`Salin ${label}`}>
      <ClipboardCopy className="h-3.5 w-3.5" />
      <span className="sr-only">Salin {label}</span>
    </Button>
  );
}

