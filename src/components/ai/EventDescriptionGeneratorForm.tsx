
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition } from "react";
import { generateEventDescription, GenerateEventDescriptionInput } from "@/ai/flows/generate-event-description";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  keywords: z.string().min(5, {
    message: "Kata kunci minimal 5 karakter.",
  }),
  details: z.string().min(10, {
    message: "Detail minimal 10 karakter.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function EventDescriptionGeneratorForm() {
  const [isPending, startTransition] = useTransition();
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keywords: "",
      details: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setGeneratedDescription(null);
    startTransition(async () => {
      try {
        const input: GenerateEventDescriptionInput = {
          keywords: values.keywords,
          details: values.details,
        };
        const result = await generateEventDescription(input);
        setGeneratedDescription(result.description);
        toast({
          title: "Deskripsi Dihasilkan!",
          description: "AI berhasil membuat deskripsi acara.",
        });
      } catch (error) {
        console.error("Gagal menghasilkan deskripsi:", error);
        setGeneratedDescription("Error: Tidak dapat menghasilkan deskripsi.");
        toast({
          title: "Error Menghasilkan Deskripsi",
          description: (error as Error)?.message || "Terjadi kesalahan yang tidak diketahui.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="keywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kata Kunci Acara</FormLabel>
                <FormControl>
                  <Input placeholder="cth: festival musik, rock, indie, outdoor" {...field} />
                </FormControl>
                <FormDescription>
                  Kata kunci yang dipisahkan koma yang mendeskripsikan acara Anda.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detail Tambahan Acara</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="cth: Menampilkan 3 panggung, vendor makanan lokal, kegiatan ramah keluarga. Bintang tamu: Band Hebat."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Berikan detail penting lainnya untuk AI.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending} className="bg-accent hover:bg-accent/90">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Hasilkan Deskripsi
          </Button>
        </form>
      </Form>

      {generatedDescription && (
        <Card className="mt-8 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-accent" />
              Deskripsi Acara yang Dihasilkan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line rounded-md border bg-muted p-4 text-sm">
              {generatedDescription}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
