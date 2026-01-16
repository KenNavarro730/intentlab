"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Upload,
    FileText,
    Database,
    MessageSquare,
    Users,
    ArrowRight,
    Check,
    AlertTriangle,
    Loader2,
    FileSpreadsheet,
    X
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Blueprint Types
type FileType = "customer_list" | "order_history" | "survey" | "persona_deck";

interface BlueprintUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSegmentsGenerated: (segments: any[]) => void;
}

export function BlueprintUploadModal({ open, onOpenChange, onSegmentsGenerated }: BlueprintUploadModalProps) {
    const [step, setStep] = useState<"upload" | "classify" | "mapping" | "processing" | "review">("upload");
    const [file, setFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<FileType | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setStep("classify");
        }
    };

    const handleClassify = (type: FileType) => {
        setFileType(type);
        setStep("mapping");
    };

    const startProcessing = () => {
        setStep("processing");
        setIsProcessing(true);

        // Simulating processing phases
        let p = 0;
        const interval = setInterval(() => {
            p += 5;
            setProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                setIsProcessing(false);
                setStep("review");
                // Mock generated segments
                onSegmentsGenerated([
                    {
                        id: "bp_1",
                        name: "High-Value Loyalists",
                        weight: 35,
                        icon: "Star",
                        isCustom: true,
                        source: "file", // Provenance
                        promptCard: "Demographics: F, 35-50, Urban, HHI $120k+. Behavior: Frequent replenishment, high AOV. Values: Quality, Convenience."
                    },
                    {
                        id: "bp_2",
                        name: "Price-Sensitive Switchers",
                        weight: 25,
                        icon: "Tag",
                        isCustom: true,
                        source: "inferred", // Provenance
                        promptCard: "Demographics: F, 25-34, Suburban. Behavior: Discount driven, high churn. Values: Best deal, social proof."
                    }
                ]);
            }
        }, 150);
    };

    return (
        open ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
                <div className="bg-background rounded-xl border shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b">
                        <div>
                            <h2 className="text-lg font-semibold">Import Audience Blueprint</h2>
                            <p className="text-sm text-muted-foreground">
                                Upload your proprietary data to generate high-fidelity consumer segments.
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                            <X className="size-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Step 1: Upload */}
                        {step === "upload" && (
                            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-muted/20">
                                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                    <Upload className="size-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Upload your customer data</h3>
                                <p className="text-muted-foreground text-center max-w-md mb-6">
                                    Supports CSV, Excel, PDF, or Slide Decks. We strip PII locally before processing.
                                </p>
                                <Button size="lg" className="relative cursor-pointer">
                                    Select File
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileUpload}
                                        accept=".csv,.xlsx,.pdf,.docx,.pptx"
                                    />
                                </Button>
                            </div>
                        )}

                        {/* Step 2: Classify */}
                        {step === "classify" && file && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                                    <FileText className="size-5 text-primary" />
                                    <span className="font-medium">{file.name}</span>
                                    <Badge variant="outline" className="ml-auto">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-lg">What type of file is this?</Label>
                                    <p className="text-sm text-muted-foreground">Helping us understand the structure improves segment quality.</p>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <ClassificationCard
                                            icon={Users}
                                            title="Customer List / CRM"
                                            desc="Structured demographics, LTV, geo"
                                            onClick={() => handleClassify("customer_list")}
                                        />
                                        <ClassificationCard
                                            icon={FileSpreadsheet}
                                            title="Order History"
                                            desc="Transactions, bundles, replenishment"
                                            onClick={() => handleClassify("order_history")}
                                        />
                                        <ClassificationCard
                                            icon={MessageSquare}
                                            title="Survey / Research"
                                            desc="Open-ends, feature preferences, jobs-to-be-done"
                                            onClick={() => handleClassify("survey")}
                                        />
                                        <ClassificationCard
                                            icon={FileText}
                                            title="Persona Deck"
                                            desc="Strategy docs, existing segmentation slides"
                                            onClick={() => handleClassify("persona_deck")}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Field Mapping (Simulated) */}
                        {step === "mapping" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">Verify Field Mapping</h3>
                                        <p className="text-sm text-muted-foreground">We matched columns to our canonical schema.</p>
                                    </div>
                                    <Badge variant="secondary">Auto-Detected</Badge>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-3 bg-muted p-3 text-sm font-medium">
                                        <div>Canonical Field</div>
                                        <div>Your File Column</div>
                                        <div>Confidence</div>
                                    </div>
                                    <MappingRow canon="Age Band" file="dob_year" conf="High" />
                                    <MappingRow canon="Income Proxy" file="est_hhi" conf="Medium" />
                                    <MappingRow canon="Purchase Freq" file="orders_count" conf="High" />
                                    <MappingRow canon="Category" file="last_category" conf="High" />
                                </div>

                                <Card className="bg-yellow-50 border-yellow-200">
                                    <CardContent className="p-4 flex gap-3">
                                        <AlertTriangle className="size-5 text-yellow-600 shrink-0" />
                                        <div className="text-sm text-yellow-800">
                                            <p className="font-semibold">Privacy Guardian Active</p>
                                            <p>PII columns (email, phone, name) were detected and will be dropped before processing.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Step 4: Processing */}
                        {step === "processing" && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                <div className="relative size-20">
                                    <Loader2 className="size-20 animate-spin text-primary/30" />
                                    <Database className="size-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-semibold">Generating Segments...</h3>
                                    <p className="text-muted-foreground">Extracting demographics, behavior patterns, and intent drivers.</p>
                                </div>
                                <Progress value={progress} className="w-full max-w-sm" />
                                <div className="text-xs text-muted-foreground">
                                    {progress < 30 && "Parsing file structure..."}
                                    {progress >= 30 && progress < 60 && "Mapping to canonical schema..."}
                                    {progress >= 60 && progress < 90 && "Clustering behavior patterns..."}
                                    {progress >= 90 && "Drafting prompt cards..."}
                                </div>
                            </div>
                        )}

                        {/* Step 5: Review */}
                        {step === "review" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Blueprint Generated</h3>
                                    <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                                        <Check className="size-4" /> Ready for testing
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-muted-foreground">Generated Segments</h4>
                                        <Card className="p-4 border-l-4 border-l-primary">
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="font-semibold">High-Value Loyalists (35%)</h5>
                                                <Badge variant="outline" className="text-xs">
                                                    ✅ From File
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground pb-2">
                                                Urban professionals, 35-50, valuing quality over price.
                                            </p>
                                            <div className="bg-muted/50 p-2 rounded text-xs font-mono text-muted-foreground">
                                                PROMPT: Demographics: F, 35-50, Urban...
                                            </div>
                                        </Card>
                                        <Card className="p-4 border-l-4 border-l-muted">
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="font-semibold">Price-Sensitive Switchers (25%)</h5>
                                                <Badge variant="secondary" className="text-xs">
                                                    🟡 Inferred
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground pb-2">
                                                Younger demographic, sensitive to discount depth.
                                            </p>
                                            <div className="bg-muted/50 p-2 rounded text-xs font-mono text-muted-foreground">
                                                PROMPT: Demographics: F, 25-34, Suburban...
                                            </div>
                                        </Card>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-muted-foreground">Drivers & Conditioning</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Check className="size-4 text-green-600" />
                                                <span>Age & Income conditioning applied</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="size-4 text-green-600" />
                                                <span>Past purchase constraints active</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="size-4 text-green-600" />
                                                <span>Vocabulary matched to reviews</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t flex justify-between items-center bg-muted/10">
                        {step !== "upload" && step !== "processing" && step !== "review" && (
                            <Button variant="outline" onClick={() => setStep("upload")} className="mr-auto">Back</Button>
                        )}

                        {/* Spacers for layout when buttons are missing */}
                        {step === "upload" && <div />}
                        {step === "processing" && <div />}
                        {step === "review" && <div />}

                        <div className="flex gap-2">
                            {step === "classify" && (
                                <div className="text-sm text-muted-foreground italic mr-4 self-center">Select a type to proceed</div>
                            )}
                            {step === "mapping" && (
                                <Button onClick={startProcessing}>
                                    Generate Segments <ArrowRight className="size-4 ml-2" />
                                </Button>
                            )}
                            {step === "review" && (
                                <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                                    Import & Use Blueprint
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ) : null
    );
}

function ClassificationCard({ icon: Icon, title, desc, onClick }: { icon: any, title: string, desc: string, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="flex items-start gap-4 p-4 rounded-xl border-2 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
        >
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="size-5 text-muted-foreground" />
            </div>
            <div>
                <h4 className="font-semibold">{title}</h4>
                <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
        </div>
    );
}

function MappingRow({ canon, file, conf }: { canon: string, file: string, conf: string }) {
    return (
        <div className="grid grid-cols-3 p-3 border-b last:border-0 text-sm items-center">
            <div className="font-medium text-primary">{canon}</div>
            <div className="font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded w-fit">{file}</div>
            <div>
                <Badge variant={conf === "High" ? "default" : "secondary"} className={conf === "High" ? "bg-green-600" : ""}>
                    {conf}
                </Badge>
            </div>
        </div>
    );
}
