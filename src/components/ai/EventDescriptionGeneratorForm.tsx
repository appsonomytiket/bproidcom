
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
    message: "Keywords must be at least 5 characters.",
  }),
  details: z.string().min(10, {
    message: "Details must be at least 10 characters.",
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
          title: "Description Generated!",
          description: "AI has successfully created an event description.",
        });
      } catch (error) {
        console.error("Failed to generate description:", error);
        setGeneratedDescription("Error: Could not generate description.");
        toast({
          title: "Error Generating Description",
          description: (error as Error)?.message || "An unknown error occurred.",
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
                <FormLabel>Event Keywords</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., music festival, rock, indie, outdoor" {...field} />
                </FormControl>
                <FormDescription>
                  Comma-separated keywords that describe your event.
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
                <FormLabel>Additional Event Details</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Featuring 3 stages, local food vendors, family-friendly activities. Special guest: The Great Band."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide any other important details for the AI.
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
            Generate Description
          </Button>
        </form>
      </Form>

      {generatedDescription && (
        <Card className="mt-8 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-accent" />
              Generated Event Description
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
