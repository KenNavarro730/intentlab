import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    FlaskConical,
    BookOpen,
    AlertTriangle,
    CheckCircle2,
    Shield,
    Lightbulb,
    Target,
    Sparkles,
    Users,
    Zap,
    Package,
    Heart,
    Leaf,
    Baby,
    ShoppingBag,
    Coffee,
    Dog
} from "lucide-react";

export default function TrustCenterPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/">
                                    <ArrowLeft className="size-4" />
                                </Link>
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                    <Shield className="size-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="font-bold">Trust Center</h1>
                                    <p className="text-sm text-muted-foreground">How it works & who it's for</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* The Problem & Solution - Plain English */}
                <section className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                        <Lightbulb className="size-6 text-primary" />
                        <h2 className="text-2xl font-bold">How IntentLab Works</h2>
                        <Badge variant="secondary">Plain English</Badge>
                    </div>

                    <div className="space-y-6">
                        {/* The Problem */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">The problem with asking "Would you buy this?"</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground space-y-3">
                                <p>
                                    Companies ask people to rate purchase intent on a 1 to 5 scale. But when you ask an AI
                                    to just pick a number, it tends to give boring, unrealistic answers (like always
                                    choosing the middle).
                                </p>
                            </CardContent>
                        </Card>

                        {/* The Big Idea */}
                        <Card className="border-primary/30 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Sparkles className="size-5 text-primary" />
                                    The breakthrough: Semantic Similarity Rating (SSR)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-muted-foreground">
                                    Instead of forcing the AI to answer with a number, we make it answer with a
                                    <strong className="text-foreground"> short sentence</strong>, like a real person would:
                                </p>
                                <blockquote className="border-l-4 border-primary pl-4 italic text-foreground">
                                    "I might try it if it's not too expensive."
                                </blockquote>
                                <p className="text-muted-foreground">
                                    Then we convert that sentence into a 1 to 5 rating by checking which "reference sentence"
                                    it's most similar to in meaning. This produces more realistic, nuanced responses.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Step by Step */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">How a test runs, step by step</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="space-y-4">
                                    <li className="flex gap-3">
                                        <span className="flex-shrink-0 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">1</span>
                                        <div>
                                            <p className="font-medium">Create synthetic consumers</p>
                                            <p className="text-sm text-muted-foreground">The AI impersonates people with specific demographics (age, gender, lifestyle) to simulate diverse perspectives.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="flex-shrink-0 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">2</span>
                                        <div>
                                            <p className="font-medium">Show your product concept</p>
                                            <p className="text-sm text-muted-foreground">Your product description, benefits, price point, and target audience are presented to each synthetic consumer.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="flex-shrink-0 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">3</span>
                                        <div>
                                            <p className="font-medium">Get a text response (not just a number)</p>
                                            <p className="text-sm text-muted-foreground">The AI explains its purchase intent in natural language, including reasoning and objections.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="flex-shrink-0 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">4</span>
                                        <div>
                                            <p className="font-medium">Convert to a rating distribution</p>
                                            <p className="text-sm text-muted-foreground">We compare the response to five reference statements (one for each rating 1 to 5) and output a probability distribution, not a single forced number.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="flex-shrink-0 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">5</span>
                                        <div>
                                            <p className="font-medium">Aggregate into actionable insights</p>
                                            <p className="text-sm text-muted-foreground">Many synthetic responses combine into a survey-wide distribution, mean intent score, and clustered objection themes.</p>
                                        </div>
                                    </li>
                                </ol>
                            </CardContent>
                        </Card>

                        {/* Why Demographics Matter */}
                        <div className="p-4 rounded-lg bg-muted/50 border">
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-foreground">Why personas matter:</strong> The research shows that
                                the best results only happen when the AI is prompted to impersonate people with specific
                                demographic attributes. This is why IntentLab asks you to define your target audience.
                            </p>
                        </div>
                    </div>
                </section>

                <Separator className="my-12" />

                {/* Who This Is For - Expanded Categories */}
                <section className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                        <Users className="size-6 text-primary" />
                        <h2 className="text-2xl font-bold">Who IntentLab Is For</h2>
                    </div>

                    <p className="text-muted-foreground mb-6">
                        IntentLab works best for consumer products with rich online discussion and reviews.
                        Here are the business categories we're built for:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="hover:border-primary/50 transition-colors">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <Sparkles className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Beauty & Personal Care</h3>
                                        <p className="text-sm text-muted-foreground">Skincare, haircare, grooming, cosmetics</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <Zap className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Oral Care</h3>
                                        <p className="text-sm text-muted-foreground">Whitening, toothpaste, floss, gum health</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <Package className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Household & Home Care</h3>
                                        <p className="text-sm text-muted-foreground">Cleaning, laundry, air care, candles</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <Dog className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Pet Products</h3>
                                        <p className="text-sm text-muted-foreground">Grooming, treats, supplements, litter</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <Heart className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Wellness Products</h3>
                                        <p className="text-sm text-muted-foreground">Sleep aids, hydration, topicals, bath/body</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <Coffee className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Food & Beverage</h3>
                                        <p className="text-sm text-muted-foreground">Functional drinks, snacks, "better-for-you"</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <Baby className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Baby & Family Care</h3>
                                        <p className="text-sm text-muted-foreground">Diapers, wipes, baby wash, sensitive skin</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <Leaf className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Sustainable & Eco-Friendly</h3>
                                        <p className="text-sm text-muted-foreground">Refill systems, low-waste swaps</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <ShoppingBag className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Amazon & DTC Sellers</h3>
                                        <p className="text-sm text-muted-foreground">Private label, multi-SKU builders</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <Target className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Subscription Boxes & Retailers</h3>
                                        <p className="text-sm text-muted-foreground">Curators choosing what to feature</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                        <p className="text-sm text-muted-foreground">
                            <strong className="text-foreground">Why these categories?</strong> IntentLab works best
                            for products with rich consumer discussion online. The more people talk about your
                            category (in reviews, forums, social media), the better the AI can simulate realistic
                            consumer reasoning.
                        </p>
                    </div>
                </section>

                <Separator className="my-12" />

                {/* Source Research */}
                <section className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                        <BookOpen className="size-6 text-primary" />
                        <h2 className="text-2xl font-bold">Research Foundation</h2>
                    </div>

                    <Card className="border-primary/30">
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                    <FlaskConical className="size-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg mb-2">Peer-Reviewed Methodology</CardTitle>
                                    <CardDescription>
                                        IntentLab is built on published academic research
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <blockquote className="border-l-4 border-primary pl-4 py-2 mb-6 bg-primary/5 rounded-r-lg">
                                <p className="font-semibold text-foreground italic">
                                    "LLMs Reproduce Human Purchase Intent via Semantic Similarity Elicitation of Likert Ratings"
                                </p>
                            </blockquote>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Validation Data</h4>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="size-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-sm">57 real consumer surveys (9,300 total respondents)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="size-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-sm">Tested against leading personal care, oral care, and household product concepts</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="size-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-sm">Strong correlation between AI-generated and human distributions</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="size-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-sm">Richer qualitative rationales than traditional panel responses</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Validation Stats */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-4xl font-bold text-primary">57</p>
                                <p className="text-sm text-muted-foreground">Real Surveys Validated</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-4xl font-bold text-primary">9,300</p>
                                <p className="text-sm text-muted-foreground">Human Respondents</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-4xl font-bold text-primary">92%</p>
                                <p className="text-sm text-muted-foreground">Correlation Score</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Model Upgrade Note */}
                    <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-sm text-muted-foreground">
                            <strong className="text-foreground">Model improvements:</strong>{" "}
                            The published research was validated using GPT-4o. IntentLab now runs on GPT-5.2,
                            which may produce improved accuracy over the original benchmarks.
                        </p>
                    </div>
                </section>

                <Separator className="my-12" />

                {/* Known Limitations */}
                <section className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                        <AlertTriangle className="size-6 text-amber-500" />
                        <h2 className="text-2xl font-bold">Known Limitations</h2>
                    </div>

                    <p className="text-muted-foreground mb-6">
                        We believe in transparent communication about what IntentLab can and cannot do.
                    </p>

                    <div className="space-y-4">
                        <Card className="border-amber-500/30 bg-amber-500/5">
                            <CardContent className="pt-6">
                                <h3 className="font-semibold mb-1">Directional guidance, not prediction</h3>
                                <p className="text-sm text-muted-foreground">
                                    IntentLab helps you iterate and find "deal-breakers" quickly. For high-stakes
                                    decisions, validate with real consumers before major investments.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-amber-500/30 bg-amber-500/5">
                            <CardContent className="pt-6">
                                <h3 className="font-semibold mb-1">Best for review-rich categories</h3>
                                <p className="text-sm text-muted-foreground">
                                    Results are strongest for products people discuss online (beauty, household, pet,
                                    food, wellness). Niche B2B or highly technical products may have less reliable results.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-amber-500/30 bg-amber-500/5">
                            <CardContent className="pt-6">
                                <h3 className="font-semibold mb-1">AI can occasionally hallucinate</h3>
                                <p className="text-sm text-muted-foreground">
                                    We mitigate this with structured semantic similarity scoring, but some variance
                                    is inherent. Use the qualitative rationales to sanity-check the numbers.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Founder's Forward-Looking Note */}
                    <div className="mt-8 p-5 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
                        <div className="flex items-start gap-4">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                <Sparkles className="size-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Looking forward</h4>
                                <p className="text-sm text-muted-foreground">
                                    These limitations are real today, but I'm genuinely optimistic about what's coming.
                                    The pace of AI improvement is accelerating, and each new model generation brings meaningful
                                    gains in reasoning and accuracy. I believe we're on a path where tools like IntentLab
                                    will approach 99%+ correlation with human panels, delivered in seconds instead of weeks.
                                    We're building for that future now.
                                </p>
                                <p className="text-sm text-muted-foreground mt-2 italic">
                                    Kenneth Navarro
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
                    <h3 className="text-2xl font-bold mb-4">Ready to Test Your Concept?</h3>
                    <p className="text-muted-foreground mb-6">
                        Screen 10 ideas quickly. Find the "why nots." Ship with confidence.
                    </p>
                    <Button size="lg" asChild>
                        <Link href="/new">
                            Run a Free Test
                        </Link>
                    </Button>
                </section>
            </main>
        </div>
    );
}
