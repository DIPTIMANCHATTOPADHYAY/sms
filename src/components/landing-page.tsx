import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Wand2, ShieldCheck, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  siteName: string;
  signupEnabled: boolean;
  footerText: string;
}

export function LandingPage({ siteName, signupEnabled, footerText }: LandingPageProps) {
  const processedFooterText = footerText
    .replace('{YEAR}', new Date().getFullYear().toString())
    .replace('{SITENAME}', siteName);

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-foreground">{siteName}</span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
             <Link href="/login">
                <Button variant="ghost">Login</Button>
            </Link>
            {signupEnabled && (
                <Link href="/signup">
                    <Button>Sign Up</Button>
                </Link>
            )}
          </nav>
          <div className="flex items-center gap-2 md:hidden">
             <Link href="/login">
                <Button variant="outline" size="sm">Login</Button>
            </Link>
            {signupEnabled && (
                <Link href="/signup">
                    <Button size="sm">Sign Up</Button>
                </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 md:px-6 py-20 md:py-32 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Unlock Insights from Every Message
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Our platform provides powerful tools to filter, analyze, and extract valuable information from your SMS records using cutting-edge AI.
            </p>
            <div className="flex justify-center gap-4">
               {signupEnabled && (
                <Link href="/signup">
                    <Button size="lg">Get Started Free</Button>
                </Link>
               )}
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
                  Access Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="bg-muted/50 py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Powerful Features, Simple Interface</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Everything you need to turn raw SMS data into actionable intelligence.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="transform hover:-translate-y-2 transition-transform duration-300">
                <CardHeader className="items-center">
                  <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
                    <Filter className="h-8 w-8" />
                  </div>
                  <CardTitle>Advanced Filtering</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  Quickly search and filter your SMS records by date, sender ID, phone number, and more to find exactly what you need.
                </CardContent>
              </Card>
              <Card className="transform hover:-translate-y-2 transition-transform duration-300">
                <CardHeader className="items-center">
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
                        <Wand2 className="h-8 w-8" />
                    </div>
                  <CardTitle>AI-Powered Extraction</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  Use AI to automatically extract key information like confirmation codes, links, and important details from messages.
                </CardContent>
              </Card>
              <Card className="transform hover:-translate-y-2 transition-transform duration-300">
                <CardHeader className="items-center">
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                  <CardTitle>Secure & Private</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  Your data is handled securely. With robust user management and IP restrictions, you control who has access.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 md:px-6 py-6 text-center text-muted-foreground text-sm">
          {processedFooterText}
        </div>
      </footer>
    </div>
  );
}
