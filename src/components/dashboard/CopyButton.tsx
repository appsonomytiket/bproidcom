
"use client";

import { Button } from "@/components/ui/button";
import { ClipboardCopy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
}

export function CopyButton({ textToCopy, label = "Teks" }: CopyButtonProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        toast({ title: `${label} Disalin!`, description: `${textToCopy} telah disalin ke clipboard Anda.` });
      }).catch(err => {
        toast({ title: "Penyalinan Gagal", description: `Tidak dapat menyalin ${label}.`, variant: "destructive" });
        console.error('Gagal menyalin: ', err);
      });
    } else {
       toast({ title: "Penyalinan Tidak Didukung", description: "Browser Anda tidak mendukung penyalinan ke clipboard.", variant: "destructive" });
    }
  };

  return (
    <Button variant="ghost" size="icon" className="ml-1 h-6 w-6" onClick={handleCopy} title={`Salin ${label}`}>
      <ClipboardCopy className="h-3 w-3" />
      <span className="sr-only">Salin {label}</span>
    </Button>
  );
}
