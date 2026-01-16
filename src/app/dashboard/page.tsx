'use client';

/**
 * Dashboard Page
 * Main hub for logged-in users showing credits, recent activity, and quick actions
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Sparkles,
    Plus,
    Zap,
    TrendingUp,
    Clock,
    CreditCard,
    BarChart3,
    Loader2,
    LogOut,
    Settings,
    ArrowRight
} from 'lucide-react';

interface UserData {
    email: string;
    name: string | null;
    avatar_url: string | null;
}

interface SubscriptionData {
    plan: string;
    simulations_limit: number;
    status: string;
}

interface UsageData {
    simulations_used: number;
}

interface SimulationData {
    id: string;
    name: string;
    status: string;
    method: string | null;
    created_at: string;
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserData | null>(null);
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [recentSimulations, setRecentSimulations] = useState<SimulationData[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        const supabase = createClient();

        // Get authenticated user
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            window.location.href = '/login';
            return;
        }

        // Load user profile
        const { data: userData } = await supabase
            .from('users')
            .select('email, name, avatar_url')
            .eq('id', authUser.id)
            .single();

        if (userData) {
            setUser(userData);
        }

        // Load subscription
        // Only select guaranteed columns
        const { data: subData } = await supabase
            .from('subscriptions')
            .select('plan, status')
            .eq('user_id', authUser.id)
            .single() as { data: { plan: string; status: string } | null };

        if (subData) {
            // Provide default limit since column might be missing
            setSubscription({
                plan: subData.plan,
                status: subData.status,
                simulations_limit: 5 // Default for free plan
            } as SubscriptionData);
        }

        // Load usage
        const { data: usageData } = await supabase
            .from('usage')
            .select('simulations_used')
            .eq('user_id', authUser.id)
            .order('period_start', { ascending: false })
            .limit(1)
            .single() as { data: { simulations_used: number } | null };

        if (usageData) {
            setUsage(usageData as UsageData);
        }

        // Load recent simulations
        // Remove 'method' as it may not exist in the table yet
        const { data: simData } = await (supabase
            .from('simulations')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .select('id, name, status, created_at') as any)
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (simData) {
            // Map to include null method
            setRecentSimulations((simData as any[]).map((s: { id: string; name: string; status: string; created_at: string }) => ({
                id: s.id,
                name: s.name,
                status: s.status,
                created_at: s.created_at,
                method: null
            })) as SimulationData[]);
        }

        setLoading(false);
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    // Calculate credits from simulations (workaround until credits_* columns exist)
    const planCredits = subscription?.plan === 'free' ? 5 :
        subscription?.plan === 'starter' ? 30 :
            subscription?.plan === 'growth' ? 100 : 300;
    const creditsUsed = usage?.simulations_used ?? 0;
    const creditsRemaining = Math.max(0, planCredits - creditsUsed);
    const creditsTotal = planCredits;
    const creditsPercent = (creditsRemaining / creditsTotal) * 100;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/dashboard">
                            <Logo size="lg" />
                        </Link>

                        <div className="flex items-center gap-4">
                            <Badge variant="secondary" className="hidden sm:flex">
                                {subscription?.plan === 'free' ? 'Free' : subscription?.plan} Plan
                            </Badge>
                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/settings">
                                    <Settings className="size-5" />
                                </Link>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleLogout}>
                                <LogOut className="size-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                        Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
                    </h1>
                    <p className="text-muted-foreground">
                        Test your product concepts and predict purchase intent
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Credits Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Credits Remaining
                            </CardTitle>
                            <Zap className="size-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{creditsRemaining}</div>
                            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${creditsPercent}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                of {creditsTotal} credits
                            </p>
                        </CardContent>
                    </Card>

                    {/* Simulations Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Simulations
                            </CardTitle>
                            <BarChart3 className="size-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{recentSimulations.length}</div>
                            <p className="text-xs text-muted-foreground mt-2">
                                concepts tested
                            </p>
                        </CardContent>
                    </Card>

                    {/* Plan Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Current Plan
                            </CardTitle>
                            <CreditCard className="size-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold capitalize">
                                {subscription?.plan || 'Free'}
                            </div>
                            {subscription?.plan === 'free' && (
                                <Link href="/pricing">
                                    <Button variant="link" className="px-0 text-xs">
                                        Upgrade for more credits <ArrowRight className="size-3 ml-1" />
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>
                                Start testing your product concepts
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/new" className="block">
                                <Button className="w-full justify-start gap-3 h-12" size="lg">
                                    <Plus className="size-5" />
                                    New Concept Test
                                </Button>
                            </Link>
                            <Link href="/pricing" className="block">
                                <Button variant="outline" className="w-full justify-start gap-3 h-12" size="lg">
                                    <TrendingUp className="size-5" />
                                    View Pricing Plans
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Recent Simulations */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Tests</CardTitle>
                            <CardDescription>
                                Your latest concept simulations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentSimulations.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Clock className="size-12 mx-auto mb-3 opacity-50" />
                                    <p>No simulations yet</p>
                                    <p className="text-sm">Run your first test to see results here</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentSimulations.map((sim) => (
                                        <Link
                                            key={sim.id}
                                            href={`/results/${sim.id}`}
                                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div>
                                                <p className="font-medium">{sim.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {sim.method || 'SSR'} • {new Date(sim.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge variant={sim.status === 'completed' ? 'default' : 'secondary'}>
                                                {sim.status}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
