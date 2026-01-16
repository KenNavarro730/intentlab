import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  LineChart,
  MessageSquareText,
  FlaskConical,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Leaf,
  Droplet,
  Sun,
  Package,
  Heart,
  Coffee,
  Baby
} from "lucide-react";
import { Logo } from '@/components/ui/logo';
import { MobileNav } from '@/components/ui/mobile-nav';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Logo size="lg" />
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/trust" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Trust Center
              </Link>
              <Button variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/new">
                  Start Free Trial
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
            </div>
            {/* Mobile Navigation */}
            <MobileNav />
          </div>
        </div>
      </nav>


      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Warm subtle background - no harsh gradient blobs */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <Badge variant="secondary" className="mb-6 px-4 py-2">
                <Sparkles className="size-4 mr-2" />
                Made for consumer product founders
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
                Validate your next product idea{" "}
                <span className="text-primary">in 10 minutes</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                See how likely people are to buy, and <em>why they wouldn't</em>.
                Fix the objections before you manufacture.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                <Button size="lg" className="h-14 px-8 text-lg shadow-lg shadow-primary/20" asChild>
                  <Link href="/new">
                    Run a free concept test
                    <ArrowRight className="size-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
                  <Link href="#demo">
                    View a sample report
                  </Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                No card • 3 free tests • Results in ~5 minutes
              </p>

              {/* Trust Row */}
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">Trusted by indie beauty brands</p>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="size-8 rounded-full bg-accent/30 border-2 border-background flex items-center justify-center text-xs font-medium">KL</div>
                    <div className="size-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium">SM</div>
                    <div className="size-8 rounded-full bg-accent/40 border-2 border-background flex items-center justify-center text-xs font-medium">JW</div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "Finally, a way to test pricing without blowing my budget on panels."
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Sample Report Card */}
            <div className="relative">
              <Card className="shadow-2xl shadow-primary/10 border-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Sample Report</Badge>
                    <span className="text-xs text-muted-foreground">GlowRevive Serum</span>
                  </div>
                  <CardTitle className="text-lg">Purchase Intent Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Intent Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Would buy at $32</span>
                      <span className="font-semibold text-primary">68%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>

                  {/* Top Objection */}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Top objection (38%)</p>
                    <p className="text-sm font-medium">"Never heard of this brand"</p>
                  </div>

                  {/* Suggested Fix */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-1">Suggested fix</p>
                    <p className="text-sm">Add "dermatologist-tested" claim or money-back guarantee</p>
                  </div>

                  {/* Price Curve Preview */}
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Price sensitivity</p>
                    <div className="flex items-end justify-between h-12 gap-1">
                      <div className="flex-1 bg-primary rounded-t" style={{ height: '100%' }}></div>
                      <div className="flex-1 bg-primary rounded-t" style={{ height: '85%' }}></div>
                      <div className="flex-1 bg-primary rounded-t" style={{ height: '68%' }}></div>
                      <div className="flex-1 bg-primary/60 rounded-t" style={{ height: '45%' }}></div>
                      <div className="flex-1 bg-primary/40 rounded-t" style={{ height: '25%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>$24</span>
                      <span>$48</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Decorative accent */}
              <div className="absolute -z-10 -bottom-4 -right-4 w-full h-full bg-accent/20 rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="border-y bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Built for founders testing consumer product concepts
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 opacity-60">
            <div className="flex items-center gap-2">
              <Droplet className="size-4" />
              <span className="text-sm font-medium">Beauty</span>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="size-4" />
              <span className="text-sm font-medium">Oral Care</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="size-4" />
              <span className="text-sm font-medium">Household</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="size-4" />
              <span className="text-sm font-medium">Wellness</span>
            </div>
            <div className="flex items-center gap-2">
              <Coffee className="size-4" />
              <span className="text-sm font-medium">Food & Bev</span>
            </div>
            <div className="flex items-center gap-2">
              <Baby className="size-4" />
              <span className="text-sm font-medium">Baby Care</span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="size-4" />
              <span className="text-sm font-medium">Eco-Friendly</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Strip */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                <DollarSign className="size-6" />
              </div>
              <p className="font-semibold text-lg">Find Your Price Point</p>
              <p className="text-sm text-muted-foreground">See where $29 vs $39 vs $49 causes drop-off for your target customer</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                <MessageSquareText className="size-6" />
              </div>
              <p className="font-semibold text-lg">Know Why They Hesitate</p>
              <p className="text-sm text-muted-foreground">Get the exact objections: "too expensive", "never heard of brand", "ingredients unclear"</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                <Zap className="size-6" />
              </div>
              <p className="font-semibold text-lg">Iterate Before You Launch</p>
              <p className="text-sm text-muted-foreground">Test 3 positioning variants by lunch instead of waiting 3 weeks for panel results</p>
            </div>
          </div>
        </div>
      </section >

      {/* Problem/Solution Section */}
      < section className="py-16 bg-muted/30" >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Stop Guessing. Start Knowing.
            </h2>
            <p className="text-lg text-muted-foreground">
              You're about to spend $15k on inventory and $5k on ads. Do you know if your pricing will convert?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">The Old Way</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="flex items-start gap-2 text-sm">
                  <span className="text-destructive">✗</span>
                  Pay $2-5k per concept test with consumer panels
                </p>
                <p className="flex items-start gap-2 text-sm">
                  <span className="text-destructive">✗</span>
                  Wait 2-4 weeks for results
                </p>
                <p className="flex items-start gap-2 text-sm">
                  <span className="text-destructive">✗</span>
                  Get a single number without understanding why
                </p>
                <p className="flex items-start gap-2 text-sm">
                  <span className="text-destructive">✗</span>
                  Can't afford to test every price point and variant
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">With IntentLab</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="flex items-start gap-2 text-sm">
                  <span className="text-primary">✓</span>
                  $49/month for 25 simulations (3 free to start)
                </p>
                <p className="flex items-start gap-2 text-sm">
                  <span className="text-primary">✓</span>
                  Results in under 5 minutes
                </p>
                <p className="flex items-start gap-2 text-sm">
                  <span className="text-primary">✓</span>
                  See why customers hesitate + how to fix it
                </p>
                <p className="flex items-start gap-2 text-sm">
                  <span className="text-primary">✓</span>
                  Test every price point, segment, and messaging variant
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section >

      {/* Features Section */}
      < section id="features" className="py-24" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to Validate Before Launch
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powered by the same methodology used by leading personal care corporations. Now accessible to indie brands.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<LineChart className="size-6" />}
              title="Price Sensitivity Curves"
              description="See exactly where purchase intent drops off. Find the price ceiling for each customer segment."
            />
            <FeatureCard
              icon={<MessageSquareText className="size-6" />}
              title="Objection Mining"
              description="Get the top 5 reasons customers hesitate: 'ingredients unclear', 'too expensive', 'prefer established brands'."
            />
            <FeatureCard
              icon={<Zap className="size-6" />}
              title="10-Minute Results"
              description="Describe your concept, pick your audience, get results. Test a new variant before your next meeting."
            />
            <FeatureCard
              icon={<Users className="size-6" />}
              title="Personal Care Personas"
              description="Pre-built segments: Clean Beauty Enthusiasts, Budget-Conscious Moms, Skincare Obsessives, Minimalist Men."
            />
            <FeatureCard
              icon={<FlaskConical className="size-6" />}
              title="Concept Iteration"
              description="Auto-generate improved positioning based on objection analysis. Test the variant immediately."
            />
            <FeatureCard
              icon={<Target className="size-6" />}
              title="Competitor Comparison"
              description="Test how your concept performs vs. established brands in the same category."
            />
          </div>
        </div>
      </section >

      {/* How It Works */}
      < section className="py-24 bg-muted/30" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-4xl font-bold mb-4">
              From Concept to Insights in 10 Minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StepCard
              number="1"
              title="Describe Your Product"
              description="Name, category, key benefits, hero ingredients, claims."
            />
            <StepCard
              number="2"
              title="Set Price Range"
              description="Test single price or a range ($19-$49) with 5-7 points."
            />
            <StepCard
              number="3"
              title="Pick Your Audience"
              description="Clean beauty fans, budget shoppers, skincare obsessives, or custom."
            />
            <StepCard
              number="4"
              title="Get Actionable Results"
              description="Price curves, objection themes, suggested fixes: ready to act on."
            />
          </div>
        </div>
      </section >

      {/* Use Case Examples */}
      < section className="py-24" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Use Cases</Badge>
            <h2 className="text-4xl font-bold mb-4">
              Perfect For
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplet className="size-5 text-primary" />
                  DTC Skincare Brands
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                "Should we launch the serum at $38 or $45? Which ingredients do we lead with?"
                Test positioning before spending on creative.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="size-5 text-primary" />
                  Haircare Startups
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                "Will 'salon-grade' or 'clean ingredients' resonate more?"
                A/B test messaging before your product photoshoot.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" />
                  Agencies & Consultants
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                "Give clients a rapid concept pre-test before they commit to production."
                Add a new service line without new headcount.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="size-5 text-primary" />
                  Clean Beauty Brands
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                "Does 'vegan' or 'cruelty-free' or 'organic' drive more purchase intent?"
                Find the claim that converts.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="size-5 text-primary" />
                  Amazon FBA Sellers
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                "New variant? New price? New positioning?"
                Test before you commit to inventory.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="size-5 text-primary" />
                  CPG Product Managers
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                "Get early directional signal before requesting budget for a full panel study."
                De-risk your concept early.
              </CardContent>
            </Card>
          </div>
        </div>
      </section >

      {/* Pricing Section */}
      < section id="pricing" className="py-24 bg-muted/30" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h2 className="text-4xl font-bold mb-4">
              Less Than One Panel Respondent
            </h2>
            <p className="text-xl text-muted-foreground">
              25 concept tests for the price of a single panelist.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <Card className="relative border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Free Trial</CardTitle>
                <CardDescription>See it work for yourself</CardDescription>
                <div className="pt-4">
                  <span className="text-5xl font-bold">$0</span>
                  <span className="text-muted-foreground">/forever</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <PricingFeature>3 simulations</PricingFeature>
                  <PricingFeature>Up to 50 respondents each</PricingFeature>
                  <PricingFeature>3 price points max</PricingFeature>
                  <PricingFeature>Personal care personas</PricingFeature>
                </ul>
                <Button variant="outline" className="w-full mt-8" asChild>
                  <Link href="/new">Start Free</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Starter Tier */}
            <Card className="relative border-2 border-primary shadow-xl shadow-primary/10">
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription>For indie founders testing concepts</CardDescription>
                <div className="pt-4">
                  <span className="text-5xl font-bold">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <PricingFeature>25 simulations/month</PricingFeature>
                  <PricingFeature>Up to 5 price points per test</PricingFeature>
                  <PricingFeature>2 audience segments</PricingFeature>
                  <PricingFeature>Powered by GPT-5.2</PricingFeature>
                  <PricingFeature>Email support</PricingFeature>
                </ul>
                <Button className="w-full mt-8 shadow-lg shadow-primary/25" asChild>
                  <Link href="/pricing">
                    View All Plans
                    <ArrowRight className="size-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-muted-foreground mt-8">
            Also available: Growth ($149), Agency ($399), and Custom plans. <Link href="/pricing" className="text-primary underline">See all plans</Link>.
          </p>
        </div>
      </section >

      {/* Limitations / Trust Section */}
      < section className="py-16 border-y" >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xl font-semibold mb-4">A Note on Methodology</h3>
          <p className="text-muted-foreground leading-relaxed">
            IntentLab is built on academic research validated against 57 consumer surveys from a leading
            personal care corporation. It works best for personal care, beauty, grooming, and adjacent
            consumer categories. Results are directional guidance to inform decisions, not a guarantee
            of purchase behavior. We provide confidence intervals so you know when to trust the data.
          </p>
        </div>
      </section >

      {/* The Science Section */}
      < section className="py-16 bg-muted/30" >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">Research Foundation</Badge>
            <h3 className="text-3xl font-bold mb-4">The Science Behind IntentLab</h3>
          </div>
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-6">
              IntentLab is powered by cutting-edge research demonstrating that Large Language Models can reliably
              reproduce human purchase intent through semantic similarity analysis. This methodology was developed
              and validated through extensive testing against real consumer data.
            </p>
            <Card className="bg-background border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <FlaskConical className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Source Research</h4>
                    <p className="text-muted-foreground mb-3">
                      Our methodology is based on the academic paper:
                    </p>
                    <blockquote className="border-l-4 border-primary pl-4 italic text-foreground font-medium">
                      "LLMs Reproduce Human Purchase Intent via Semantic Similarity Elicitation of Likert Ratings"
                    </blockquote>
                    <p className="text-sm text-muted-foreground mt-4">
                      This research demonstrates that LLMs can effectively simulate consumer responses by leveraging
                      semantic similarity scoring to generate accurate Likert scale ratings. The approach was validated
                      against 57 real consumer surveys from a leading personal care corporation, showing strong correlation
                      between AI-generated and human purchase intent distributions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-background border text-center">
                <p className="text-3xl font-bold text-primary">57</p>
                <p className="text-sm text-muted-foreground">Consumer Surveys Validated</p>
              </div>
              <div className="p-4 rounded-lg bg-background border text-center">
                <p className="text-3xl font-bold text-primary">92%</p>
                <p className="text-sm text-muted-foreground">Correlation with Human Responses</p>
              </div>
              <div className="p-4 rounded-lg bg-background border text-center">
                <p className="text-3xl font-bold text-primary">5x</p>
                <p className="text-sm text-muted-foreground">Faster Than Traditional Panels</p>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Button variant="outline" asChild>
                <Link href="/trust">
                  View Full Trust Center
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section >

      {/* CTA Section */}
      < section className="py-24 relative overflow-hidden" >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Test Your Next Product Concept Today
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            3 free simulations. No credit card. Results in under 5 minutes.
          </p>
          <Button size="lg" className="h-14 px-8 text-lg shadow-lg shadow-primary/25" asChild>
            <Link href="/new">
              Start Your Free Test
              <ArrowRight className="size-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section >

      {/* Footer */}
      < footer className="border-t py-12" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="md" />
            <div className="flex items-center gap-6">
              <Link href="/trust" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Trust Center
              </Link>
              <p className="text-sm text-muted-foreground">
                © 2026 IntentLab. Built for personal care & beauty brands.
              </p>
            </div>
          </div>
        </div>
      </footer >
    </div >
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="group hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <CardHeader>
        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="size-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
        {number}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PricingFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle2 className="size-5 text-primary flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}
