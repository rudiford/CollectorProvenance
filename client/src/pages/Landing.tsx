import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ArrowRight, Shield, BookOpen, GitMerge, Search } from "lucide-react";
import { useTitle } from "@/lib/useTitle";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  useTitle();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-background pointer-events-none" />

        {/* Background logo watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img src="/logo.png" alt="" className="w-[800px] max-w-[90vw] opacity-[0.04]" />
        </div>

        <div className="container mx-auto px-4 pt-24 pb-20 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6 leading-tight">
              Provenance documentation
              <br />
              <span className="text-muted-foreground">for your prized assets, starting with collector cars.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Increase the value of your assets. When you're considering a collector car purchase, 
              what do you want to know about the car and its provenance? Would you pay more for a 
              well-documented car? Document the provenance of your cars here and build a lasting record.
            </p>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Just like wine, art, watches, and collectables — provenance is the starting point and 
              the ending point. Whether you're keeping it, selling it, or looking to buy, the more 
              information available, the better for all parties.
            </p>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              How much information you make public is completely up to you. Keep your profile hidden, 
              partially open to the public, or completely open. It's your information and you're in control.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link href="/auth?tab=register">
                <Button size="lg" className="gap-2 text-base">
                  Start your registry
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/browse">
                <Button size="lg" className="gap-2 text-base">
                  <Search className="h-4 w-4" />
                  Browse public cars
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" className="gap-2 text-base">
                  How It Works
                </Button>
              </a>
            </div>


          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-b border-border/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-semibold text-center mb-12">How It Works</h2>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <div className="flex gap-4">
              <span className="text-2xl font-semibold text-foreground shrink-0">1.</span>
              <p>Create a free profile and add any cars you wish to list. Each car becomes its own detailed record.</p>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl font-semibold text-foreground shrink-0">2.</span>
              <p>In each car's profile, you can update photos, maintenance records, shows, rallies, concours events, restoration updates, ownership history, upgrades, modifications, specs, and more.</p>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl font-semibold text-foreground shrink-0">3.</span>
              <p>You can keep all info private, or select which points of information about you or your cars to make public. Share your city and state only if you'd like. You're always in control.</p>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl font-semibold text-foreground shrink-0">4.</span>
              <p>If you decide to sell a car, transfer the full provenance record to the new owner. The history follows the car, not the person.</p>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl font-semibold text-foreground shrink-0">5.</span>
              <p>If you decide you'd like to make a car available for sale, just click a box and it will show as available. Completely up to you.</p>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl font-semibold text-foreground shrink-0">6.</span>
              <p>Browse the registry to research cars, discover what's out there, and connect with other collectors.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
            {[
              { value: "∞", label: "Condition log entries" },
              { value: "100%", label: "Verifiable ownership chain" },
              { value: "Free", label: "To start documenting" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-semibold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4">Everything your car's history needs</h2>
            <p className="text-muted-foreground">
              From the factory floor to your garage — document every chapter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: BookOpen,
                title: "Condition Journal",
                desc: "Log maintenance, restorations, events, and observations. Like a wine cellar diary — but for your 911.",
              },
              {
                icon: Shield,
                title: "Verified Provenance",
                desc: "Build an immutable ownership chain. Every owner, every transfer, cryptographically tied to the chassis.",
              },
              {
                icon: GitMerge,
                title: "Ownership Transfers",
                desc: "Generate a transfer code when selling. The new owner claims it and the registry updates automatically.",
              },
              {
                icon: Search,
                title: "Public Registry",
                desc: "Make your car visible to the community. Buyers and enthusiasts can verify the history before purchase.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-border/50 bg-card p-6 hover:border-border transition-colors"
              >
                <feature.icon className="h-8 w-8 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Waitlist */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-3">Join the registry</h2>
            <p className="text-muted-foreground text-sm mb-8">
              Start documenting your Porsche today. It takes 2 minutes.
            </p>

            {submitted ? (
              <div className="text-sm text-green-400 border border-green-400/20 rounded-lg p-4 bg-green-400/5">
                You're on the list. We'll be in touch.
              </div>
            ) : (
              <form onSubmit={handleWaitlist} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit">Get early access</Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Collector Provenance</span>
          <span>collectorprovenance.com</span>
        </div>
      </footer>
    </div>
  );
}
