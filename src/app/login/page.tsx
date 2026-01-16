'use client';

/**
 * Professional Login Page
 * Supports Google OAuth and Magic Link authentication
 */

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

// Google icon SVG
const GoogleIcon = () => (
    <svg className="size-5" viewBox="0 0 24 24">
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </svg>
);

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'select' | 'email'>('select');

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
            setGoogleLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
            setSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send login link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
                    >
                        <ArrowLeft className="size-4" />
                        Back to home
                    </Link>
                    <div className="flex items-center justify-center mb-3 pr-8">
                        <Logo size="xl" />
                    </div>
                    <p className="text-muted-foreground">
                        Predict purchase intent before you launch
                    </p>
                </div>

                {/* Main Card */}
                <Card className="shadow-xl border-border/50 backdrop-blur">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-xl">
                            {sent ? 'Check your email' : 'Welcome'}
                        </CardTitle>
                        <CardDescription>
                            {sent
                                ? `We sent a magic link to ${email}`
                                : 'Sign in to continue testing your concepts'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {sent ? (
                            /* Email Sent Confirmation */
                            <div className="text-center py-4">
                                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                                    <CheckCircle2 className="size-8" />
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Click the link in your email to sign in.
                                    <br />
                                    Check your spam folder if you don&apos;t see it.
                                </p>
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => { setSent(false); setMode('select'); }}
                                        className="w-full"
                                    >
                                        Use a different method
                                    </Button>
                                </div>
                            </div>
                        ) : mode === 'select' ? (
                            /* Method Selection */
                            <>
                                {/* Google Button */}
                                <Button
                                    variant="outline"
                                    className="w-full h-12 text-base font-medium gap-3 border-border hover:bg-muted/50 transition-all"
                                    onClick={handleGoogleLogin}
                                    disabled={googleLoading}
                                >
                                    {googleLoading ? (
                                        <Loader2 className="size-5 animate-spin" />
                                    ) : (
                                        <GoogleIcon />
                                    )}
                                    Continue with Google
                                </Button>

                                {/* Divider */}
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-border" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-3 text-muted-foreground">
                                            or
                                        </span>
                                    </div>
                                </div>

                                {/* Email Button */}
                                <Button
                                    variant="secondary"
                                    className="w-full h-12 text-base font-medium gap-3"
                                    onClick={() => setMode('email')}
                                >
                                    <Mail className="size-5" />
                                    Continue with Email
                                </Button>

                                {error && (
                                    <p className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-lg">
                                        {error}
                                    </p>
                                )}
                            </>
                        ) : (
                            /* Email Form */
                            <form onSubmit={handleEmailLogin} className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="text-sm font-medium block mb-2">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 h-12"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                                        {error}
                                    </p>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-medium"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin mr-2" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send magic link'
                                    )}
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full text-muted-foreground"
                                    onClick={() => setMode('select')}
                                >
                                    Back to all options
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="mt-6 text-center space-y-3">
                    <Badge variant="secondary" className="text-xs px-3 py-1">
                        5 free credits included
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                        By continuing, you agree to our{' '}
                        <Link href="/terms" className="underline hover:text-foreground">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="underline hover:text-foreground">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
