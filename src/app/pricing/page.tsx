'use client';

/**
 * Pricing Page
 * Displays subscription plans with Stripe checkout integration
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { PLANS } from '@/lib/stripe';

export default function PricingPage() {
    const handleCheckout = async (planId: string) => {
        // For now, redirect to login if not authenticated
        // After auth is set up, this will redirect to Stripe Checkout
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/">
                            <Logo size="lg" />
                        </Link>
                        <Button variant="outline" asChild>
                            <Link href="/login">Sign in</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <Badge variant="secondary" className="mb-4">Simple pricing</Badge>
                    <h1 className="text-4xl font-bold mb-4">
                        Test concepts for less than the cost of coffee
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Powered by GPT-5.2. 1000x cheaper than traditional panels.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {/* Free */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Free</CardTitle>
                            <CardDescription>Try it out</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">$0</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 mb-6">
                                {PLANS.free.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <Check className="size-4 text-primary" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/login">Get started</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Starter */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Starter</CardTitle>
                            <CardDescription>For indie founders</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">${PLANS.starter.price}</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 mb-6">
                                {PLANS.starter.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <Check className="size-4 text-primary" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Button className="w-full" onClick={() => handleCheckout('starter')}>
                                Subscribe
                                <ArrowRight className="size-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Growth */}
                    <Card className="border-primary relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge>Most popular</Badge>
                        </div>
                        <CardHeader>
                            <CardTitle>Growth</CardTitle>
                            <CardDescription>For scaling brands</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">${PLANS.growth.price}</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 mb-6">
                                {PLANS.growth.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <Check className="size-4 text-primary" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Button className="w-full" onClick={() => handleCheckout('growth')}>
                                Subscribe
                                <ArrowRight className="size-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Agency */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Agency</CardTitle>
                            <CardDescription>For teams and agencies</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">${PLANS.agency.price}</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 mb-6">
                                {PLANS.agency.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <Check className="size-4 text-primary" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Button className="w-full" onClick={() => handleCheckout('agency')}>
                                Subscribe
                                <ArrowRight className="size-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Custom/Enterprise */}
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle>Custom</CardTitle>
                            <CardDescription>For enterprise needs</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">Let's talk</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-2 text-sm">
                                    <Check className="size-4 text-primary" />
                                    Unlimited simulations
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <Check className="size-4 text-primary" />
                                    Custom personas & segments
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <Check className="size-4 text-primary" />
                                    API access
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <Check className="size-4 text-primary" />
                                    Dedicated account manager
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <Check className="size-4 text-primary" />
                                    SOC 2 compliance
                                </li>
                            </ul>
                            <a
                                href="https://mail.google.com/mail/?view=cm&to=KenatIntentLab@gmail.com&su=IntentLab%20Custom%20Plan%20Inquiry"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
                            >
                                Contact us
                            </a>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-muted-foreground">
                        All plans include GPT-5.2, priority queue, and email support.
                    </p>
                </div>
            </main>
        </div>
    );
}
