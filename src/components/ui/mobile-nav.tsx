'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface MobileNavProps {
    isLoggedIn?: boolean;
}

export function MobileNav({ isLoggedIn = false }: MobileNavProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="size-5" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-6 border-b">
                        <Logo size="md" />
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-col gap-1 py-6">
                        <Link
                            href="#features"
                            onClick={() => setOpen(false)}
                            className="flex items-center py-3 px-4 rounded-lg hover:bg-muted transition-colors text-base font-medium"
                        >
                            Features
                        </Link>
                        <Link
                            href="/pricing"
                            onClick={() => setOpen(false)}
                            className="flex items-center py-3 px-4 rounded-lg hover:bg-muted transition-colors text-base font-medium"
                        >
                            Pricing
                        </Link>
                        <Link
                            href="/trust"
                            onClick={() => setOpen(false)}
                            className="flex items-center py-3 px-4 rounded-lg hover:bg-muted transition-colors text-base font-medium"
                        >
                            Trust Center
                        </Link>
                    </nav>

                    {/* Auth Buttons */}
                    <div className="mt-auto pt-6 border-t space-y-3">
                        {isLoggedIn ? (
                            <>
                                <Button asChild className="w-full" size="lg">
                                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                                        Go to Dashboard
                                        <ArrowRight className="size-4 ml-2" />
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" asChild className="w-full" size="lg">
                                    <Link href="/login" onClick={() => setOpen(false)}>
                                        Sign in
                                    </Link>
                                </Button>
                                <Button asChild className="w-full" size="lg">
                                    <Link href="/new" onClick={() => setOpen(false)}>
                                        Start Free Trial
                                        <ArrowRight className="size-4 ml-2" />
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
