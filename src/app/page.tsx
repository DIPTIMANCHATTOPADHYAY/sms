import { SmsInspector } from '@/components/sms-inspector';

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8 text-center">
          <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
            SMS Inspector
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Fetch, view, and analyze your SMS records with the power of AI.
          </p>
        </header>
        <SmsInspector />
      </div>
    </main>
  );
}
