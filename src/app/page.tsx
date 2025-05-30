
import { EventList } from "@/components/events/EventList";
import { MOCK_EVENTS } from "@/lib/constants";

export default function HomePage() {
  // In a real app, you'd fetch events here
  const events = MOCK_EVENTS;

  return (
    <div className="container py-12">
      <h1 className="mb-10 text-center text-4xl font-extrabold tracking-tight text-primary lg:text-5xl">
        Temukan Acara Mendatang
      </h1>
      <EventList events={events} />
    </div>
  );
}
