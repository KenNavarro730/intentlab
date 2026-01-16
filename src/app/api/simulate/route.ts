/**
 * Simulation API Route
 * Uses the new pipeline with DLR/FLR/SSR methods and credit-based pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import { OpenAIProvider } from '@/lib/llm';
import { runPipeline, estimateCost, checkCreditSufficiency } from '@/lib/pipeline';
import { calculateCreditsNeeded, PLANS } from '@/lib/stripe/plans';
import { PRESET_PERSONAS } from '@/lib/simulate/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { RatingMethod, PipelineConfig } from '@/lib/pipeline';

export interface SimulationRequest {
    concept: {
        id?: string;
        name: string;
        category: string;
        description: string;
        features: string[];
        claims: string[];
        positioning?: string;
    };
    pricePoints: number[];
    segments: Array<{
        id: string;
        name: string;
        personaType?: keyof typeof PRESET_PERSONAS;
    }>;
    config?: {
        method?: RatingMethod;
        nRespondents?: number;
        nSamplesPerRespondent?: number;
        dryRun?: boolean;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: SimulationRequest = await request.json();

        // Validate request
        if (!body.concept || !body.pricePoints || body.pricePoints.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields: concept, pricePoints' },
                { status: 400 }
            );
        }

        // Check for API key
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey || apiKey === 'your-openai-api-key') {
            return NextResponse.json(
                {
                    error: 'OpenAI API key not configured',
                    message: 'Please set OPENAI_API_KEY in your environment variables'
                },
                { status: 500 }
            );
        }

        // Pipeline configuration
        const method: RatingMethod = body.config?.method ?? 'SSR';
        const nRespondents = body.config?.nRespondents ?? 200;
        const nSamples = body.config?.nSamplesPerRespondent ?? 2;
        const dryRun = body.config?.dryRun ?? false;

        // Calculate credits needed (simple rule: 1 credit = 100 respondents)
        const totalRespondents = nRespondents * body.pricePoints.length * body.segments.length;
        const creditsNeeded = calculateCreditsNeeded(totalRespondents);

        // Cost estimate
        const estimate = estimateCost(totalRespondents, method);

        // Get authenticated user and their credit balance from database
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        let creditsAvailable: number = PLANS.free.credits; // Default to free tier
        let userId: string | null = null;
        let subscriptionId: string | null = null;

        if (user) {
            userId = user.id;

            // Get user's subscription - use simulations_limit as fallback if credits_limit doesn't exist
            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('id, plan, simulations_limit')
                .eq('user_id', user.id)
                .single() as { data: { id: string; plan: string; simulations_limit: number } | null };

            // Get current month's usage - use simulations_used as fallback
            const periodStart = new Date().toISOString().slice(0, 7) + '-01';
            const { data: usage } = await supabase
                .from('usage')
                .select('simulations_used')
                .eq('user_id', user.id)
                .eq('period_start', periodStart)
                .single() as { data: { simulations_used: number } | null };

            if (subscription) {
                subscriptionId = subscription.id;
                // Use simulations_limit as credits (temporary workaround)
                // Each "simulation" counts as roughly 1 credit
                const planCredits = subscription.plan === 'free' ? 5 :
                    subscription.plan === 'starter' ? 30 :
                        subscription.plan === 'growth' ? 100 : 300;
                const usedCredits = usage?.simulations_used ?? 0;
                creditsAvailable = Math.max(0, planCredits - usedCredits);
            }
        }

        const creditCheck = checkCreditSufficiency(creditsNeeded, creditsAvailable, false);

        if (!creditCheck.allowed && !dryRun) {
            return NextResponse.json(
                {
                    error: 'Insufficient credits',
                    message: creditCheck.reason,
                    creditsNeeded,
                    creditsAvailable,
                },
                { status: 402 }
            );
        }

        // Initialize provider
        const provider = new OpenAIProvider(apiKey);

        // Build product concept
        const concept = {
            id: body.concept.id,
            name: body.concept.name,
            category: body.concept.category,
            description: body.concept.description,
            features: body.concept.features.filter(f => f.trim()),
            claims: body.concept.claims.filter(c => c.trim()),
            positioning: body.concept.positioning,
        };

        // Run simulations for each segment and price point
        const allResults: Array<{
            segmentId: string;
            segmentName: string;
            pricePoint: number;
            result: Awaited<ReturnType<typeof runPipeline>>;
        }> = [];

        for (const segment of body.segments) {
            // Get persona from presets
            const presetPersona = segment.personaType
                ? PRESET_PERSONAS[segment.personaType]
                : PRESET_PERSONAS['skincare-obsessed'];

            const persona = {
                age: presetPersona.age ?? '25-45',
                income: presetPersona.income ?? '$50,000-$100,000',
                location: presetPersona.location ?? 'Urban/Suburban',
                household: presetPersona.household ?? 'Varies',
                psychographics: presetPersona.psychographics ?? ['General consumer'],
            };

            for (const price of body.pricePoints) {
                const pricePoint = { price, purchaseType: 'one-time' as const };

                const pipelineConfig: Partial<PipelineConfig> = {
                    method,
                    nRespondents,
                    nSamplesPerRespondent: nSamples,
                    dryRun,
                };

                const result = await runPipeline(
                    provider,
                    persona,
                    concept,
                    pricePoint,
                    pipelineConfig
                );

                allResults.push({
                    segmentId: segment.id,
                    segmentName: segment.name,
                    pricePoint: price,
                    result,
                });
            }
        }

        // Calculate summary metrics
        const totalCreditsUsed = allResults.reduce((sum, r) => sum + r.result.creditsUsed, 0);
        const avgTop2Box = allResults.reduce((sum, r) => sum + r.result.metrics.top2Box, 0) / allResults.length;
        const avgExpectedLikert = allResults.reduce((sum, r) => sum + r.result.metrics.expectedLikert, 0) / allResults.length;

        // Format results for response
        const formattedResults = allResults.map(r => ({
            segmentId: r.segmentId,
            segmentName: r.segmentName,
            pricePoint: r.pricePoint,
            method: r.result.method,
            likertPmf: r.result.aggregatedPmf,
            metrics: r.result.metrics,
            sampleRationales: r.result.respondents
                .slice(0, 5)
                .flatMap(resp => resp.rationales ?? [])
                .slice(0, 12),
            confidence: {
                lower: r.result.metrics.top2Box - 0.05,
                upper: r.result.metrics.top2Box + 0.05,
            },
        }));

        // Save simulation to database if user is authenticated
        let simulationId: string | null = null;
        if (userId && !dryRun) {
            // Insert simulation record - only use columns that exist
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: simulation, error: simError } = await (supabase
                .from('simulations') as any)
                .insert({
                    user_id: userId,
                    name: concept.name,
                    concept: concept,
                    config: {
                        method,
                        nRespondents,
                        nSamples,
                        pricePoints: body.pricePoints,
                        segments: body.segments.map(s => ({ id: s.id, name: s.name })),
                    },
                    status: 'completed',
                    results: {
                        formattedResults,
                        summary: {
                            avgTop2Box,
                            avgExpectedLikert,
                            totalRespondents,
                        },
                    },
                    // Note: method, credits_used columns may not exist yet
                })
                .select('id')
                .single() as { data: { id: string } | null; error: Error | null };

            if (simulation) {
                simulationId = simulation.id;
            }
            if (simError) {
                console.error('Failed to save simulation:', simError);
            }

            // Update usage - use simulations_used (existing column) instead of credits
            const periodStart = new Date().toISOString().slice(0, 7) + '-01';

            // Try to get existing usage record
            const { data: existingUsage } = await supabase
                .from('usage')
                .select('id, simulations_used')
                .eq('user_id', userId)
                .eq('period_start', periodStart)
                .single() as { data: { id: string; simulations_used: number } | null };

            if (existingUsage) {
                // Update existing record - increment simulations count
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase.from('usage') as any)
                    .update({
                        simulations_used: existingUsage.simulations_used + 1,
                    })
                    .eq('id', existingUsage.id);
            } else {
                // Create new usage record for this period
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase.from('usage') as any)
                    .insert({
                        user_id: userId,
                        period_start: periodStart,
                        simulations_used: 1,
                    });
            }
        }

        return NextResponse.json({
            success: true,
            simulationId,
            concept,
            method,
            pricePoints: body.pricePoints,
            results: formattedResults,
            summary: {
                avgTop2Box,
                avgExpectedLikert,
                totalRespondents: nRespondents * body.pricePoints.length * body.segments.length,
            },
            credits: {
                estimated: creditsNeeded,
                used: totalCreditsUsed,
                costEstimate: estimate,
            },
            dryRun,
        });

    } catch (error) {
        console.error('Simulation error:', error);
        return NextResponse.json(
            {
                error: 'Simulation failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// GET: Return API documentation
export async function GET() {
    return NextResponse.json({
        name: 'IntentLab Simulation API v2',
        version: '2.0.0',
        creditPricing: {
            description: '1 credit = 100 respondent-evaluations',
            costPerCredit: '$2.50 overage',
        },
        endpoints: {
            'POST /api/simulate': {
                description: 'Run a purchase intent simulation',
                body: {
                    concept: {
                        name: 'string (required)',
                        category: 'string (required)',
                        description: 'string (required)',
                        features: 'string[] (optional)',
                        claims: 'string[] (optional)',
                        positioning: 'string (optional)',
                    },
                    pricePoints: 'number[] (required)',
                    segments: 'Array<{ id: string, name: string, personaType?: string }>',
                    config: {
                        method: "'DLR' | 'FLR' | 'SSR' (default: 'SSR')",
                        nRespondents: 'number (default: 200)',
                        nSamplesPerRespondent: 'number (default: 2)',
                        dryRun: 'boolean (default: false)',
                    },
                },
                methods: {
                    DLR: 'Direct Likert Rating - fastest, 1 API call per sample',
                    FLR: 'Free-text then Likert Rating - 2 API calls, captures rationale',
                    SSR: 'Semantic Similarity Rating - best accuracy, soft PMF output',
                },
            },
        },
    });
}
