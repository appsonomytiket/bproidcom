
import { EventDescriptionGeneratorForm } from "@/components/ai/EventDescriptionGeneratorForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

export default function AiDescriptionGeneratorPage() {
  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-3xl shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
            <div className="flex items-center gap-3">
                <Bot className="h-10 w-10" />
                <div>
                    <CardTitle className="text-3xl font-bold">AI Event Description Generator</CardTitle>
                    <CardDescription className="text-primary-foreground/80">
                        Let AI help you craft compelling descriptions for your events.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <EventDescriptionGeneratorForm />
        </CardContent>
      </Card>
    </div>
  );
}
