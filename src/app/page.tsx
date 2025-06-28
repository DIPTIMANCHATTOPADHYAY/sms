import { SmsInspector } from '@/components/sms-inspector';

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto">
        <SmsInspector />
      </div>
    </main>
  );
}
