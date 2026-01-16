"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    ArrowLeft,
    Download,
    Share2,
    FlaskConical,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    MessageSquareText,
    Lightbulb,
    BarChart3,
    Target,
    Droplet,
    Info,
    HelpCircle,
    ExternalLink,
    Loader2
} from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types for simulation results
interface SimulationResult {
    segmentId: string;
    segmentName: string;
    pricePoint: number;
    method: string;
    likertPmf: number[];
    metrics: {
        top2Box: number;
        expectedLikert: number;
    };
    sampleRationales: string[];
    confidence: {
        lower: number;
        upper: number;
    };
}

interface SimulationData {
    success: boolean;
    concept: {
        name: string;
        category: string;
        description: string;
        features: string[];
        claims: string[];
        positioning?: string;
    };
    method: string;
    pricePoints: number[];
    results: SimulationResult[];
    summary: {
        avgTop2Box: number;
        avgExpectedLikert: number;
        totalRespondents: number;
    };
    credits: {
        estimated: number;
        used: number;
    };
}

// Segment colors for visualization
const SEGMENT_COLORS: Record<string, string> = {
    'skincare-obsessed': '#8b5cf6',
    'clean-beauty': '#10b981',
    'budget-conscious-mom': '#f59e0b',
    'general-consumer': '#6366f1',
    'default': '#64748b',
};

export default function ResultsPage() {
    const params = useParams();
    const router = useRouter();
    const simulationId = params.id;

    const [data, setData] = useState<SimulationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [selectedResult, setSelectedResult] = useState<{
        segment: string;
        segmentName: string;
        price: number;
        top2Box: number;
        expectedLikert: number;
        rationales: string[];
    } | null>(null);

    // Load results from sessionStorage
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('simulation_results');
            if (stored) {
                const parsed = JSON.parse(stored);
                setData(parsed);
            } else {
                setError('No simulation results found. Please run a new test.');
            }
        } catch (e) {
            setError('Failed to load simulation results.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleShare = async () => {
        setIsSharing(true);
        const url = window.location.href;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: `IntentLab Results: ${data?.concept.name || 'Concept Test'}`,
                    text: `Check out the simulation results for ${data?.concept.name}`,
                    url,
                });
            } else {
                await navigator.clipboard.writeText(url);
            }
        } catch (err) {
            console.error('Error sharing:', err);
        } finally {
            setTimeout(() => setIsSharing(false), 2000);
        }
    };

    const handleExportPDF = () => {
        if (!data) return;
        setIsExporting(true);

        try {
            // eslint-disable-next-line new-parens
            const doc = new jsPDF() as any; // Cast to any to avoid chart type issues if present
            const pageWidth = doc.internal.pageSize.getWidth();

            // --- Header ---
            // Branding background
            doc.setFillColor(249, 248, 245);
            doc.rect(0, 0, pageWidth, 40, 'F');

            // Logo Placeholder
            doc.setFillColor(217, 119, 87);
            doc.circle(20, 20, 6, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text("iL", 18, 21.5);

            // Title
            doc.setFontSize(22);
            doc.setTextColor(26, 24, 22);
            doc.text("IntentLab Simulation Report", 32, 22);

            // Concept Info
            doc.setFontSize(14);
            doc.setTextColor(217, 119, 87); // Primary
            doc.text(data.concept.name, 14, 55);

            doc.setFontSize(10);
            doc.setTextColor(100);
            const dateStr = new Date().toLocaleDateString();
            doc.text(`${data.concept.category} • Generated ${dateStr}`, 14, 60);

            let yPos = 70;

            // --- Summary Cards ---
            doc.setFontSize(14);
            doc.setTextColor(0);
            // doc.text("Executive Summary", 14, yPos);
            // yPos += 10;

            const summaryBody = [
                ['Optimal Price', `$${bestPrice.price}`, `Captures ${(bestPrice.avg * 100).toFixed(0)}% of market`],
                ['Avg Intent', `${(data.summary.avgTop2Box * 100).toFixed(0)}%`, 'Top-2 Box (Likely to Buy)'],
                ['Price Cliffs', `${priceCliffs.length}`, priceCliffs.length > 0 ? 'Warning: Drop-offs detected' : 'No significant drop-offs'],
                ['Method', data.method, `${data.summary.totalRespondents} Respondents`]
            ];

            autoTable(doc, {
                startY: yPos,
                head: [['Key Metric', 'Value', 'Context']],
                body: summaryBody,
                theme: 'grid',
                headStyles: { fillColor: [26, 24, 22], textColor: 255 },
                styles: { fontSize: 10, cellPadding: 4, valign: 'middle' },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 40 },
                    1: { fontStyle: 'bold', fontSize: 12, textColor: [217, 119, 87] }
                }
            });

            yPos = doc.lastAutoTable.finalY + 15;

            // --- Price Sensitivity Data ---
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("Price Sensitivity Breakdown", 14, yPos);
            yPos += 5;

            const headers = ['Price Point', ...segments.map(s => s.name), 'Average'];
            const rows = data.pricePoints.map(price => {
                const row = [`$${price}`];
                let rowSum = 0;
                let count = 0;

                segments.forEach(seg => {
                    const res = data.results.find(r => r.segmentId === seg.id && r.pricePoint === price);
                    if (res) {
                        row.push(`${(res.metrics.top2Box * 100).toFixed(0)}%`);
                        rowSum += res.metrics.top2Box;
                        count++;
                    } else {
                        row.push('-');
                    }
                });

                // Add Average column
                const avg = count > 0 ? (rowSum / count) : 0;
                row.push(`${(avg * 100).toFixed(0)}%`);

                return row;
            });

            autoTable(doc, {
                startY: yPos,
                head: [headers],
                body: rows,
                theme: 'striped',
                headStyles: { fillColor: [217, 119, 87] },
                styles: { halign: 'center' },
                columnStyles: { 0: { fontStyle: 'bold', halign: 'left' } }
            });

            yPos = doc.lastAutoTable.finalY + 15;

            // --- Recommendations ---
            // Check page break
            if (yPos > 240) { doc.addPage(); yPos = 20; }

            doc.setFontSize(14);
            doc.text("Strategic Recommendations", 14, yPos);
            yPos += 8;

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`Recommended Launch Price: $${bestPrice.price}`, 14, yPos);
            doc.setFont("helvetica", "normal");
            yPos += 6;

            const recText = `At $${bestPrice.price}, you capture ${(bestPrice.avg * 100).toFixed(0)}% purchase intent across all tested segments. This offers the optimal balance of volume and margin based on the simulation data.`;
            const splitRec = doc.splitTextToSize(recText, pageWidth - 28);
            doc.text(splitRec, 14, yPos);
            yPos += splitRec.length * 6 + 6;

            if (priceCliffs.length > 0) {
                doc.setFont("helvetica", "bold");
                doc.setTextColor(200, 100, 0); // Warning color
                doc.text("Price Sensitivity Warning", 14, yPos);
                doc.setTextColor(0);
                doc.setFont("helvetica", "normal");
                yPos += 6;

                const cliffText = `Avoiding pricing above $${priceCliffs[0].fromPrice} to prevent a ${(priceCliffs[0].drop * 100).toFixed(0)}% drop in specific segments.`;
                doc.text(cliffText, 14, yPos);
                yPos += 12;
            }

            // --- Rationales ---
            // New Page
            doc.addPage();
            yPos = 20;

            doc.setFontSize(14);
            doc.text("Consumer Rationales (Full List)", 14, yPos);
            yPos += 10;

            const rationaleData = allRationales.map(r => [r]);

            autoTable(doc, {
                startY: yPos,
                body: rationaleData,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 4, fontStyle: 'italic', textColor: 80 },
                columnStyles: { 0: { cellWidth: 'auto' } }
            });

            // Save
            doc.save(`IntentLab_Report_${data.concept.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);

        } catch (err) {
            console.error(err);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="size-8 animate-spin mx-auto text-primary mb-4" />
                    <p className="text-muted-foreground">Loading results...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <AlertTriangle className="size-12 text-amber-500 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold mb-2">No Results Found</h2>
                        <p className="text-muted-foreground mb-4">{error || 'Please run a new simulation to see results.'}</p>
                        <Button asChild>
                            <Link href="/new">Run New Test</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Get unique segments from results
    const segments = Array.from(new Set(data.results.map(r => r.segmentId))).map(id => {
        const result = data.results.find(r => r.segmentId === id);
        return {
            id,
            name: result?.segmentName || id,
            color: SEGMENT_COLORS[id] || SEGMENT_COLORS.default
        };
    });

    // Get best price point (highest average top2box)
    const avgByPrice = data.pricePoints.map(price => {
        const priceResults = data.results.filter(r => r.pricePoint === price);
        const avg = priceResults.reduce((sum, r) => sum + r.metrics.top2Box, 0) / priceResults.length;
        return { price, avg };
    });
    const bestPrice = avgByPrice.reduce((best, curr) => curr.avg > best.avg ? curr : best);

    // Calculate price cliffs (drops > 10% between adjacent prices)
    const priceCliffs: Array<{ fromPrice: number; toPrice: number; segment: string; drop: number }> = [];
    segments.forEach(segment => {
        const segmentResults = data.results
            .filter(r => r.segmentId === segment.id)
            .sort((a, b) => a.pricePoint - b.pricePoint);

        for (let i = 0; i < segmentResults.length - 1; i++) {
            const drop = segmentResults[i].metrics.top2Box - segmentResults[i + 1].metrics.top2Box;
            if (drop > 0.10) {
                priceCliffs.push({
                    fromPrice: segmentResults[i].pricePoint,
                    toPrice: segmentResults[i + 1].pricePoint,
                    segment: segment.id,
                    drop
                });
            }
        }
    });

    // Collect all rationales for display
    const allRationales = data.results.flatMap(r => r.sampleRationales || []);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/dashboard">
                                    <ArrowLeft className="size-4" />
                                </Link>
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                    <Droplet className="size-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="font-bold">{data.concept.name}</h1>
                                    <p className="text-sm text-muted-foreground">{data.concept.category}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleShare}
                                disabled={isSharing}
                            >
                                <Share2 className="size-4 mr-2" />
                                {isSharing ? 'Copied!' : 'Share Results'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportPDF}
                                disabled={isExporting}
                            >
                                {isExporting ? (
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="size-4 mr-2" />
                                )}
                                {isExporting ? 'Generating Report...' : 'Export Full Report'}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main id="results-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Top Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <Target className="size-5" />
                                <span className="text-sm font-medium">Optimal Price Point</span>
                            </div>
                            <p className="text-4xl font-bold">${bestPrice.price}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {(bestPrice.avg * 100).toFixed(0)}% average intent across segments
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <BarChart3 className="size-5" />
                                <span className="text-sm font-medium">Average Intent</span>
                            </div>
                            <p className="text-4xl font-bold">{(data.summary.avgTop2Box * 100).toFixed(0)}%</p>
                            <p className="text-sm text-muted-foreground mt-1">Top-2 box (likely to buy)</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <TrendingDown className="size-5" />
                                <span className="text-sm font-medium">Price Cliffs</span>
                            </div>
                            <p className="text-4xl font-bold">{priceCliffs.length}</p>
                            <p className="text-sm text-muted-foreground mt-1">Sharp drop-off points</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <FlaskConical className="size-5" />
                                <span className="text-sm font-medium">Method</span>
                            </div>
                            <p className="text-xl font-bold">{data.method}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {data.summary.totalRespondents} simulated respondents
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="curve" className="space-y-6">
                    <TabsList className="flex flex-wrap">
                        <TabsTrigger value="curve">Price Sensitivity</TabsTrigger>
                        <TabsTrigger value="rationales">Sample Rationales</TabsTrigger>
                        <TabsTrigger value="actions">Recommendations</TabsTrigger>
                    </TabsList>

                    {/* Price Curve Tab */}
                    <TabsContent value="curve" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Purchase Intent by Price</CardTitle>
                                <CardDescription>
                                    What percentage of each segment would likely buy at each price point
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8">
                                    {segments.map(segment => {
                                        const segmentResults = data.results
                                            .filter(r => r.segmentId === segment.id)
                                            .sort((a, b) => a.pricePoint - b.pricePoint);
                                        return (
                                            <div key={segment.id}>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div
                                                        className="size-4 rounded-full"
                                                        style={{ backgroundColor: segment.color }}
                                                    />
                                                    <span className="font-semibold">{segment.name}</span>
                                                </div>
                                                <div className="grid grid-cols-5 gap-3">
                                                    {segmentResults.map(result => (
                                                        <div key={result.pricePoint} className="text-center relative group">
                                                            <button
                                                                onClick={() => setSelectedResult({
                                                                    segment: result.segmentId,
                                                                    segmentName: result.segmentName,
                                                                    price: result.pricePoint,
                                                                    top2Box: result.metrics.top2Box,
                                                                    expectedLikert: result.metrics.expectedLikert,
                                                                    rationales: result.sampleRationales || []
                                                                })}
                                                                className="w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                                                            >
                                                                <div className="relative h-32 bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                                                                    <div
                                                                        className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all"
                                                                        style={{
                                                                            height: `${result.metrics.top2Box * 100}%`,
                                                                            backgroundColor: segment.color,
                                                                            opacity: 0.85
                                                                        }}
                                                                    />
                                                                    <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">
                                                                        {(result.metrics.top2Box * 100).toFixed(0)}%
                                                                    </span>
                                                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Info className="size-4 text-muted-foreground" />
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm font-semibold mt-2">${result.pricePoint}</p>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Price Cliff Alerts */}
                        {priceCliffs.length > 0 && (
                            <Card className="border-amber-500/50 bg-amber-500/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-amber-600">
                                        <AlertTriangle className="size-5" />
                                        Price Cliff Alerts
                                    </CardTitle>
                                    <CardDescription>
                                        Significant drops in purchase intent. Consider pricing below these thresholds
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {priceCliffs.map((cliff, idx) => {
                                            const segment = segments.find(s => s.id === cliff.segment);
                                            return (
                                                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-background">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">${cliff.fromPrice}</Badge>
                                                        <TrendingDown className="size-4 text-destructive" />
                                                        <Badge variant="outline">${cliff.toPrice}</Badge>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        <strong>{segment?.name}</strong> drops {(cliff.drop * 100).toFixed(0)} points
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Rationales Tab */}
                    <TabsContent value="rationales" className="space-y-4">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                <MessageSquareText className="size-5 text-primary" />
                                Sample Consumer Rationales
                            </h3>
                            <p className="text-muted-foreground">
                                AI-generated reasoning patterns from simulated consumers.
                            </p>
                            <Badge variant="outline" className="mt-2">⚠️ Synthetic rationales, not real customer quotes</Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {allRationales.slice(0, 12).map((rationale, idx) => (
                                <Card key={idx}>
                                    <CardContent className="pt-6">
                                        <blockquote className="text-sm italic text-muted-foreground">
                                            "{rationale}"
                                        </blockquote>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Recommendations Tab */}
                    <TabsContent value="actions" className="space-y-4">
                        <Card className="border-primary/50">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <Target className="size-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Recommended Launch Price: ${bestPrice.price}</h3>
                                        <p className="text-muted-foreground mb-4">
                                            At <strong>${bestPrice.price}</strong>, you capture {(bestPrice.avg * 100).toFixed(0)}% intent across segments.
                                            This price point shows the best balance of conversion and margin potential.
                                        </p>
                                        <div className="flex gap-2">
                                            <Badge>High confidence</Badge>
                                            <Badge variant="outline">Based on {data.summary.totalRespondents} simulated responses</Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {priceCliffs.length > 0 && (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-4">
                                        <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0">
                                            <AlertTriangle className="size-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2">Price Sensitivity Warning</h3>
                                            <p className="text-muted-foreground mb-4">
                                                We detected {priceCliffs.length} significant price cliff{priceCliffs.length > 1 ? 's' : ''}.
                                                Consider staying below ${priceCliffs[0].fromPrice} to avoid steep drop-offs.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="size-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 flex-shrink-0">
                                        <Lightbulb className="size-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Next Steps</h3>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2">
                                                <span className="size-1.5 rounded-full bg-green-500" />
                                                <span className="text-sm">Test different positioning or claims to improve intent</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="size-1.5 rounded-full bg-green-500" />
                                                <span className="text-sm">Compare against competitor concepts</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="size-1.5 rounded-full bg-green-500" />
                                                <span className="text-sm">Run with different audience segments</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Methodology Notice */}
                <div className="mt-12 p-4 rounded-lg bg-muted/50 border text-center">
                    <p className="text-sm text-muted-foreground">
                        <strong>Methodology:</strong> Results based on {data.method} (Semantic Similarity Rating),
                        simulating {data.summary.totalRespondents} consumer responses. Use as directional guidance for pricing and messaging decisions.
                    </p>
                </div>
            </main>

            {/* Detail Drawer */}
            <Sheet open={selectedResult !== null} onOpenChange={(open) => !open && setSelectedResult(null)}>
                <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <HelpCircle className="size-5 text-primary" />
                            Result Details
                        </SheetTitle>
                        <SheetDescription>
                            {selectedResult?.segmentName} at ${selectedResult?.price}
                        </SheetDescription>
                    </SheetHeader>

                    {selectedResult && (
                        <div className="mt-6 space-y-6">
                            {/* Distribution Breakdown */}
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <BarChart3 className="size-4 text-primary" />
                                    Distribution
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Likely to buy (4-5)</span>
                                        <span className="font-semibold text-primary">{(selectedResult.top2Box * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full"
                                            style={{ width: `${selectedResult.top2Box * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Expected Likert: {selectedResult.expectedLikert.toFixed(1)} / 5.0
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            {/* Sample Rationales */}
                            {selectedResult.rationales.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <MessageSquareText className="size-4 text-primary" />
                                        Sample Rationales
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedResult.rationales.slice(0, 3).map((rationale, idx) => (
                                            <div key={idx} className="p-3 rounded-lg bg-muted/50 border text-sm italic">
                                                "{rationale}"
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Separator />

                            {/* Method Explanation */}
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <FlaskConical className="size-4 text-primary" />
                                    How This Was Calculated
                                </h4>
                                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        This score was generated using <strong>Semantic Similarity Rating (SSR)</strong>:
                                    </p>
                                    <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                                        <li>Your concept description was compared to purchase intent anchors</li>
                                        <li>The AI measured semantic similarity to statements like "I would definitely buy this"</li>
                                        <li>Similarity scores were converted to Likert ratings (1-5 scale)</li>
                                        <li>Multiple simulated respondents produced the distribution shown above</li>
                                    </ol>
                                </div>
                            </div>

                            {/* Link to Trust Center */}
                            <div className="pt-4">
                                <Button variant="outline" size="sm" className="w-full" asChild>
                                    <Link href="/trust" className="flex items-center gap-2">
                                        Learn more about our methodology
                                        <ExternalLink className="size-3" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
