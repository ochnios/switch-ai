import { ArrowRight, Sparkles, GitBranch, Key } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * LandingPage - Landing page component for switch-ai
 *
 * Displays:
 * - Hero section with value proposition
 * - Problems section (model switching, conversation linearity)
 * - Features section (per-message switching, branching, BYOK)
 * - Call-to-action button
 */
export function LandingPage() {
  const handleGetStarted = () => {
    // Navigate to sign-in page using View Transitions
    if (typeof window !== "undefined" && "startViewTransition" in document) {
      import("astro:transitions/client").then(({ navigate }) => {
        navigate("/auth/login");
      });
    } else {
      window.location.href = "/auth/login";
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-24 md:py-32">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">switch-ai</h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
            Chat with multiple AI models. Switch models per message. Branch conversations effortlessly.
          </p>

          {/* CTA Button */}
          <div className="mt-10 flex items-center justify-center">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="w-full sm:w-auto"
              aria-label="Get started with switch-ai"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="border-t border-border bg-muted/30 py-16 px-4 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Problems We Solve
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {/* Problem 1 */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-xl font-semibold text-foreground">Lack of Flexibility in Model Selection</h3>
              <p className="mt-4 text-muted-foreground">
                Different AI models specialize in different tasks. Switching between them requires multiple browser
                windows and manual context copying, which is time-consuming and disrupts your workflow.
              </p>
            </div>

            {/* Problem 2 */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-xl font-semibold text-foreground">Conversation Linearity</h3>
              <p className="mt-4 text-muted-foreground">
                Exploring alternative ideas or testing different scenarios is difficult. Users must either clutter the
                main thread or start from scratch, losing all previous context and conversation history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Key Features</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Sparkles className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">Per-Message Model Switching</h3>
              <p className="mt-2 text-muted-foreground">
                Select the perfect AI model for each message. Leverage specialized models for different tasks without
                leaving your conversation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <GitBranch className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">Conversation Branching</h3>
              <p className="mt-2 text-muted-foreground">
                Create independent conversation threads from any point. Choose between full history copy or intelligent
                summary-based branching.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Key className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">BYOK (Bring Your Own Key)</h3>
              <p className="mt-2 text-muted-foreground">
                Use your own OpenRouter API key. Full control with secure server-side encryption. Your key, your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="border-t border-border bg-muted/30 py-16 px-4 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Experience the power of flexible AI model switching and conversation branching.
          </p>
          <div className="mt-8 flex items-center justify-center">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="w-full sm:w-auto"
              aria-label="Get started with switch-ai"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
