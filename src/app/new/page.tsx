"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    ArrowLeft,
    ArrowRight,
    Package,
    DollarSign,
    Users,
    Play,
    FlaskConical,
    Plus,
    Trash2,
    Check,
    Droplet,
    Sun,
    Leaf,
    Sparkles,
    ShoppingBag,
    Home,
    Dog,
    Heart,
    Apple,
    Baby,
    Recycle,
    Store,
    MoreHorizontal,
    Pencil,
    Copy,
    AlertTriangle,
    Info,
    Loader2,
    Image as ImageIcon,
    FileUp,
    Coffee,
    Brain,
    Lightbulb,
    Target,
    Zap
} from "lucide-react";

import { BlueprintUploadModal } from "./blueprint-upload-modal";

type Step = "industry" | "product" | "price" | "audience" | "run";

interface ProductData {
    name: string;
    category: string;
    description: string;
    features: string[];
    claims: string[];
    positioning: string;
    image?: string | null;
}

interface PriceData {
    mode: "single" | "range";
    singlePrice: number;
    minPrice: number;
    maxPrice: number;
    pricePoints: number;
    purchaseType: "one-time" | "subscription";
    priceFraming: "per-unit" | "per-month" | "per-ounce" | "bundle";
    productSize: string;
}

interface CustomSegment {
    id: string;
    name: string;
    ageRange: string;
    budgetSensitivity: "low" | "medium" | "high";
    householdContext: string;
    needs: string[];
    channelPreference: string;
    isCustom: boolean;
    icon?: string;
    source?: "file" | "inferred";
    promptCard?: string;
}

interface PresetSegment {
    id: string;
    name: string;
    enabled: boolean;
    weight: number;
    icon?: string;
    isCustom?: boolean;
    ageRange?: string;
    budgetSensitivity?: "low" | "medium" | "high";
    source?: "file" | "inferred";
    promptCard?: string;
}

type Segment = PresetSegment | CustomSegment & { enabled: boolean; weight: number };

interface AudienceData {
    segments: (PresetSegment | (CustomSegment & { enabled: boolean; weight: number }))[];
    respondentsPerSegment: number;
}

// Industry definitions with icons
const INDUSTRIES = [
    { id: "beauty", name: "Beauty & Personal Care", icon: "droplet", description: "Skincare, hair, cosmetics" },
    { id: "oral", name: "Oral Care", icon: "sparkles", description: "Toothpaste, mouthwash, whitening" },
    { id: "household", name: "Household & Home", icon: "home", description: "Cleaning, organization, decor" },
    { id: "pet", name: "Pet Products", icon: "dog", description: "Food, treats, accessories" },
    { id: "wellness", name: "Wellness & Supplements", icon: "heart", description: "Vitamins, fitness, sleep" },
    { id: "food", name: "Food & Beverage", icon: "apple", description: "Snacks, drinks, meal kits" },
    { id: "baby", name: "Baby & Family", icon: "baby", description: "Diapers, formula, kids products" },
    { id: "eco", name: "Sustainable / Eco", icon: "recycle", description: "Zero-waste, refillable, organic" },
    { id: "dtc", name: "DTC / Amazon FBA", icon: "store", description: "Direct-to-consumer products" },
    { id: "other", name: "Other Consumer", icon: "more", description: "Custom category" },
];

// Segment templates per industry
const SEGMENT_TEMPLATES: Record<string, PresetSegment[]> = {
    beauty: [
        { id: "skincare-obsessed", name: "Skincare Obsessives (25-40, Urban)", enabled: true, weight: 25, icon: "droplet", ageRange: "25-40", budgetSensitivity: "low" },
        { id: "clean-beauty", name: "Clean Beauty Enthusiasts (28-45)", enabled: true, weight: 25, icon: "leaf", ageRange: "28-45", budgetSensitivity: "medium" },
        { id: "budget-conscious-mom", name: "Budget-Conscious Moms (30-50)", enabled: true, weight: 20, icon: "users", ageRange: "30-50", budgetSensitivity: "high" },
        { id: "minimalist-men", name: "Minimalist Men (25-45)", enabled: false, weight: 15, icon: "sparkles", ageRange: "25-45", budgetSensitivity: "medium" },
        { id: "gen-z-tiktok", name: "Gen Z TikTok Buyers (18-26)", enabled: false, weight: 15, icon: "sun", ageRange: "18-26", budgetSensitivity: "medium" },
    ],
    oral: [
        { id: "whitening-seekers", name: "Whitening Seekers (25-45)", enabled: true, weight: 30, icon: "sparkles", ageRange: "25-45", budgetSensitivity: "medium" },
        { id: "natural-oral", name: "Natural/Organic Oral Care (28-50)", enabled: true, weight: 25, icon: "leaf", ageRange: "28-50", budgetSensitivity: "low" },
        { id: "budget-families", name: "Budget Family Buyers (30-55)", enabled: true, weight: 25, icon: "users", ageRange: "30-55", budgetSensitivity: "high" },
        { id: "sensitive-teeth", name: "Sensitive Teeth Sufferers (35-60)", enabled: false, weight: 20, icon: "heart", ageRange: "35-60", budgetSensitivity: "low" },
    ],
    household: [
        { id: "clean-home", name: "Clean Home Enthusiasts (28-50)", enabled: true, weight: 30, icon: "home", ageRange: "28-50", budgetSensitivity: "medium" },
        { id: "eco-cleaners", name: "Eco-Conscious Cleaners (25-45)", enabled: true, weight: 25, icon: "leaf", ageRange: "25-45", budgetSensitivity: "low" },
        { id: "busy-parents", name: "Busy Parents (30-50)", enabled: true, weight: 25, icon: "users", ageRange: "30-50", budgetSensitivity: "high" },
        { id: "home-organizers", name: "Home Organization Fans (25-55)", enabled: false, weight: 20, icon: "sparkles", ageRange: "25-55", budgetSensitivity: "medium" },
    ],
    pet: [
        { id: "dog-parents", name: "Dog Parents (25-55)", enabled: true, weight: 35, icon: "dog", ageRange: "25-55", budgetSensitivity: "low" },
        { id: "cat-parents", name: "Cat Parents (25-55)", enabled: true, weight: 30, icon: "heart", ageRange: "25-55", budgetSensitivity: "medium" },
        { id: "premium-pet", name: "Premium Pet Owners (30-50)", enabled: true, weight: 20, icon: "sparkles", ageRange: "30-50", budgetSensitivity: "low" },
        { id: "budget-pet", name: "Budget Pet Owners (22-45)", enabled: false, weight: 15, icon: "users", ageRange: "22-45", budgetSensitivity: "high" },
    ],
    wellness: [
        { id: "fitness-focused", name: "Fitness Enthusiasts (22-45)", enabled: true, weight: 30, icon: "heart", ageRange: "22-45", budgetSensitivity: "low" },
        { id: "health-conscious", name: "Health-Conscious Parents (30-55)", enabled: true, weight: 25, icon: "users", ageRange: "30-55", budgetSensitivity: "medium" },
        { id: "stress-sleep", name: "Stress & Sleep Seekers (28-50)", enabled: true, weight: 25, icon: "sun", ageRange: "28-50", budgetSensitivity: "medium" },
        { id: "aging-gracefully", name: "Aging Gracefully (45-65)", enabled: false, weight: 20, icon: "sparkles", ageRange: "45-65", budgetSensitivity: "low" },
    ],
    food: [
        { id: "health-foodies", name: "Health-Conscious Foodies (25-45)", enabled: true, weight: 30, icon: "apple", ageRange: "25-45", budgetSensitivity: "low" },
        { id: "busy-professionals", name: "Busy Professionals (28-50)", enabled: true, weight: 25, icon: "sparkles", ageRange: "28-50", budgetSensitivity: "medium" },
        { id: "budget-shoppers", name: "Budget Grocery Shoppers (25-55)", enabled: true, weight: 25, icon: "users", ageRange: "25-55", budgetSensitivity: "high" },
        { id: "snack-enthusiasts", name: "Snack Enthusiasts (18-35)", enabled: false, weight: 20, icon: "sun", ageRange: "18-35", budgetSensitivity: "medium" },
    ],
    baby: [
        { id: "new-parents", name: "New Parents (25-40)", enabled: true, weight: 35, icon: "baby", ageRange: "25-40", budgetSensitivity: "medium" },
        { id: "experienced-parents", name: "Experienced Parents (30-45)", enabled: true, weight: 30, icon: "users", ageRange: "30-45", budgetSensitivity: "high" },
        { id: "eco-parents", name: "Eco-Conscious Parents (28-42)", enabled: true, weight: 20, icon: "leaf", ageRange: "28-42", budgetSensitivity: "low" },
        { id: "premium-parents", name: "Premium Product Parents (28-45)", enabled: false, weight: 15, icon: "sparkles", ageRange: "28-45", budgetSensitivity: "low" },
    ],
    eco: [
        { id: "zero-waste", name: "Zero-Waste Advocates (22-45)", enabled: true, weight: 30, icon: "recycle", ageRange: "22-45", budgetSensitivity: "low" },
        { id: "conscious-consumers", name: "Conscious Consumers (28-55)", enabled: true, weight: 30, icon: "leaf", ageRange: "28-55", budgetSensitivity: "medium" },
        { id: "climate-aware", name: "Climate-Aware Gen Z (18-28)", enabled: true, weight: 25, icon: "sun", ageRange: "18-28", budgetSensitivity: "medium" },
        { id: "practical-eco", name: "Practical Eco-Switchers (30-50)", enabled: false, weight: 15, icon: "users", ageRange: "30-50", budgetSensitivity: "high" },
    ],
    dtc: [
        { id: "early-adopters", name: "Early Adopters (22-40)", enabled: true, weight: 30, icon: "sparkles", ageRange: "22-40", budgetSensitivity: "low" },
        { id: "amazon-shoppers", name: "Amazon Power Shoppers (28-55)", enabled: true, weight: 30, icon: "store", ageRange: "28-55", budgetSensitivity: "medium" },
        { id: "subscription-lovers", name: "Subscription Lovers (25-45)", enabled: true, weight: 25, icon: "heart", ageRange: "25-45", budgetSensitivity: "medium" },
        { id: "deal-hunters", name: "Deal Hunters (22-50)", enabled: false, weight: 15, icon: "users", ageRange: "22-50", budgetSensitivity: "high" },
    ],
    other: [
        { id: "general-consumer", name: "General Consumers (25-55)", enabled: true, weight: 40, icon: "users", ageRange: "25-55", budgetSensitivity: "medium" },
        { id: "early-adopter-general", name: "Early Adopters (22-40)", enabled: true, weight: 30, icon: "sparkles", ageRange: "22-40", budgetSensitivity: "low" },
        { id: "budget-conscious-general", name: "Budget-Conscious (25-60)", enabled: true, weight: 30, icon: "heart", ageRange: "25-60", budgetSensitivity: "high" },
    ],
};

// Category suggestions per industry
const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
    beauty: ["Facial Serum", "Moisturizer", "Cleanser", "Sunscreen", "Shampoo", "Conditioner", "Hair Mask", "Body Lotion", "Deodorant", "Lip Balm", "Face Mask", "Toner", "Eye Cream", "Body Wash", "Hand Cream"],
    oral: ["Toothpaste", "Mouthwash", "Whitening Strips", "Electric Toothbrush", "Floss", "Tongue Scraper"],
    household: ["All-Purpose Cleaner", "Laundry Detergent", "Dish Soap", "Air Freshener", "Storage Containers", "Candles"],
    pet: ["Dog Food", "Cat Food", "Pet Treats", "Pet Toys", "Pet Shampoo", "Pet Supplements"],
    wellness: ["Multivitamins", "Protein Powder", "Sleep Gummies", "Probiotics", "Collagen Supplements", "Stress Relief"],
    food: ["Protein Bars", "Healthy Snacks", "Meal Kits", "Beverages", "Coffee/Tea", "Condiments", "Frozen Meals"],
    baby: ["Diapers", "Baby Wipes", "Baby Formula", "Baby Food", "Baby Skincare", "Nursing Products"],
    eco: ["Refillable Products", "Bamboo Products", "Reusable Bags", "Compostable Items", "Zero-Waste Kits"],
    dtc: ["Subscription Box", "Direct-to-Consumer Product", "Amazon FBA Product"],
    other: ["Consumer Product", "Retail Product", "Specialty Item"],
};

// Loading screen content - quotes, tips, and fun facts
const LOADING_CONTENT = [
    { type: "quote", icon: "coffee", text: "Feel free to grab a cup of coffee while this cooks!", subtext: "We're simulating real consumer decisions" },
    { type: "quote", icon: "brain", text: "Great products start with understanding your customer", subtext: "— Every successful founder ever" },
    { type: "tip", icon: "lightbulb", text: "Did you know? The best price point isn't always the cheapest", subtext: "Value perception matters more than cost" },
    { type: "quote", icon: "sparkles", text: "Innovation distinguishes between a leader and a follower", subtext: "— Steve Jobs" },
    { type: "tip", icon: "target", text: "Pro tip: Test 5-7 price points to find the sweet spot", subtext: "You're already doing this right!" },
    { type: "quote", icon: "zap", text: "The goal is to turn data into information, and information into insight", subtext: "— Carly Fiorina" },
    { type: "fact", icon: "brain", text: "Your AI panelists are evaluating your concept right now", subtext: "Each one brings unique perspectives" },
    { type: "quote", icon: "heart", text: "People don't buy products, they buy better versions of themselves", subtext: "— Samuel Hulick" },
    { type: "tip", icon: "lightbulb", text: "Fun fact: A/B tests take weeks. You'll have insights in minutes", subtext: "That's the power of AI simulation" },
    { type: "quote", icon: "sparkles", text: "Make it simple. Make it memorable. Make it inviting to look at", subtext: "— Leo Burnett" },
    { type: "fact", icon: "target", text: "We're analyzing purchase intent across your audience segments", subtext: "Building your price sensitivity curve" },
    { type: "quote", icon: "zap", text: "In God we trust. All others must bring data", subtext: "— W. Edwards Deming" },
    { type: "tip", icon: "coffee", text: "Stretch break? Your results will be ready when you return", subtext: "Self-care is important too ☕" },
    { type: "quote", icon: "heart", text: "The aim of marketing is to know the customer so well the product sells itself", subtext: "— Peter Drucker" },
    { type: "fact", icon: "brain", text: "Processing thousands of simulated purchase decisions", subtext: "Almost there..." },
];

export default function NewSimulationPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>("industry");
    const [selectedIndustry, setSelectedIndustry] = useState<string>("");
    const [showResults, setShowResults] = useState(false);
    const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingQuoteIndex, setLoadingQuoteIndex] = useState(0);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [customSegmentOpen, setCustomSegmentOpen] = useState(false);
    const [editingSegment, setEditingSegment] = useState<PresetSegment | null>(null);

    // Custom segment form state
    const [customSegmentForm, setCustomSegmentForm] = useState({
        name: "",
        ageRange: "25-45",
        budgetSensitivity: "medium" as "low" | "medium" | "high",
        householdContext: "",
        needs: ["", ""],
        channelPreference: "any",
    });

    const [productData, setProductData] = useState<ProductData>({
        name: "",
        category: "",
        description: "",
        features: [""],
        claims: [""],
        positioning: "",
        image: null
    });

    const [priceData, setPriceData] = useState<PriceData>({
        mode: "range",
        singlePrice: 34,
        minPrice: 24,
        maxPrice: 48,
        pricePoints: 5,
        purchaseType: "one-time",
        priceFraming: "per-unit",
        productSize: "",
    });

    const [audienceData, setAudienceData] = useState<AudienceData>({
        segments: [],
        respondentsPerSegment: 50,
    });

    // Persist form state to localStorage on change
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const formState = {
            currentStep,
            selectedIndustry,
            productData,
            priceData,
            audienceData,
        };
        localStorage.setItem('intentlab_draft', JSON.stringify(formState));
    }, [currentStep, selectedIndustry, productData, priceData, audienceData]);

    // Restore form state from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem('intentlab_draft');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.selectedIndustry) setSelectedIndustry(parsed.selectedIndustry);
                if (parsed.productData) setProductData(parsed.productData);
                if (parsed.priceData) setPriceData(parsed.priceData);
                if (parsed.audienceData) setAudienceData(parsed.audienceData);
                // Restore step only if they had made progress
                if (parsed.currentStep && parsed.currentStep !== 'industry') {
                    setCurrentStep(parsed.currentStep);
                }
            } catch (e) {
                console.error('Failed to restore form state:', e);
            }
        }
    }, []);

    // Clear draft after successful submission
    const clearDraft = () => {
        localStorage.removeItem('intentlab_draft');
    };

    // Rotate loading quotes and simulate progress during submission
    useEffect(() => {
        if (!isSubmitting) {
            setLoadingQuoteIndex(0);
            setLoadingProgress(0);
            return;
        }

        // Track elapsed time for consistent progress
        const startTime = Date.now();
        const estimatedDuration = 180000; // 3 minutes expected duration

        // Rotate quotes every 4 seconds
        const quoteInterval = setInterval(() => {
            setLoadingQuoteIndex(prev => (prev + 1) % LOADING_CONTENT.length);
        }, 4000);

        // Use time-based logarithmic progress for natural feel
        // This creates consistent perceived progress without obvious slowdown
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const timeRatio = elapsed / estimatedDuration;

            // Logarithmic curve: fast start, gradual but consistent slowdown
            // ln(1 + x*4) / ln(5) gives nice 0-1 curve with natural feel
            const baseProgress = Math.log(1 + timeRatio * 4) / Math.log(5);

            // Cap at 95% and add subtle randomness for organic feel
            const targetProgress = Math.min(baseProgress * 100, 95);
            const jitter = (Math.random() - 0.5) * 2; // ±1% random variation

            setLoadingProgress(Math.min(targetProgress + jitter, 95));
        }, 300);

        return () => {
            clearInterval(quoteInterval);
            clearInterval(progressInterval);
        };
    }, [isSubmitting]);

    // Helper to get loading icon
    const getLoadingIcon = (iconName: string) => {
        switch (iconName) {
            case "coffee": return <Coffee className="size-8" />;
            case "brain": return <Brain className="size-8" />;
            case "lightbulb": return <Lightbulb className="size-8" />;
            case "target": return <Target className="size-8" />;
            case "zap": return <Zap className="size-8" />;
            case "sparkles": return <Sparkles className="size-8" />;
            case "heart": return <Heart className="size-8" />;
            default: return <FlaskConical className="size-8" />;
        }
    };

    const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
        { key: "industry", label: "Industry", icon: <Store className="size-4" /> },
        { key: "product", label: "Product", icon: <Package className="size-4" /> },
        { key: "price", label: "Pricing", icon: <DollarSign className="size-4" /> },
        { key: "audience", label: "Audience", icon: <Users className="size-4" /> },
        { key: "run", label: "Run", icon: <Play className="size-4" /> },
    ];

    const stepIndex = steps.findIndex(s => s.key === currentStep);
    const progress = ((stepIndex + 1) / steps.length) * 100;

    const canContinue = () => {
        switch (currentStep) {
            case "industry":
                return selectedIndustry !== "";
            case "product":
                return productData.name && productData.description;
            case "price":
                return priceData.mode === "single" ? priceData.singlePrice > 0 :
                    priceData.minPrice > 0 && priceData.maxPrice > priceData.minPrice;
            case "audience":
                return audienceData.segments.some(s => s.enabled);
            case "run":
                return true;
        }
    };

    const nextStep = () => {
        const idx = steps.findIndex(s => s.key === currentStep);
        if (idx < steps.length - 1) {
            // When leaving industry step, load segments for that industry
            if (currentStep === "industry" && selectedIndustry) {
                const industrySegments = SEGMENT_TEMPLATES[selectedIndustry] || SEGMENT_TEMPLATES.other;
                setAudienceData(prev => ({
                    ...prev,
                    segments: industrySegments.map(s => ({ ...s }))
                }));
            }
            setCurrentStep(steps[idx + 1].key);
        }
    };

    const prevStep = () => {
        const idx = steps.findIndex(s => s.key === currentStep);
        if (idx > 0) {
            setCurrentStep(steps[idx - 1].key);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Build price points array
            const pricePoints = priceData.mode === "single"
                ? [priceData.singlePrice]
                : Array.from(
                    { length: priceData.pricePoints },
                    (_, i) => Math.round(
                        priceData.minPrice +
                        (priceData.maxPrice - priceData.minPrice) * (i / (priceData.pricePoints - 1))
                    )
                );

            // Build segments array from enabled segments
            const enabledSegs = audienceData.segments.filter(s => s.enabled);
            // Map segment IDs to valid preset persona types
            const segments = enabledSegs.map(s => {
                // Determine persona type based on segment characteristics
                let personaType: 'skincare-obsessed' | 'clean-beauty' | 'budget-conscious-mom' | 'minimalist-men' | 'gen-z-tiktok' = 'skincare-obsessed';

                const idLower = s.id.toLowerCase();
                const nameLower = s.name.toLowerCase();

                if (idLower.includes('clean') || nameLower.includes('clean') || nameLower.includes('eco') || nameLower.includes('natural')) {
                    personaType = 'clean-beauty';
                } else if (idLower.includes('budget') || nameLower.includes('budget') || nameLower.includes('value')) {
                    personaType = 'budget-conscious-mom';
                } else if (idLower.includes('men') || nameLower.includes('men') || nameLower.includes('minimalist')) {
                    personaType = 'minimalist-men';
                } else if (idLower.includes('gen-z') || idLower.includes('tiktok') || nameLower.includes('gen z') || nameLower.includes('tiktok')) {
                    personaType = 'gen-z-tiktok';
                }

                return {
                    id: s.id,
                    name: s.name,
                    personaType
                };
            });

            // Build the request payload
            const payload = {
                concept: {
                    name: productData.name,
                    category: productData.category,
                    description: productData.description,
                    features: productData.features.filter(f => f.trim()),
                    claims: productData.claims.filter(c => c.trim()),
                    positioning: productData.positioning,
                },
                pricePoints,
                segments,
                config: {
                    method: 'SSR' as const,
                    nRespondents: audienceData.respondentsPerSegment,
                    nSamplesPerRespondent: 2,
                    dryRun: false,
                }
            };

            // Call the simulation API
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Simulation failed');
            }

            const results = await response.json();

            // Store results in sessionStorage for the results page to read
            sessionStorage.setItem('simulation_results', JSON.stringify(results));

            clearDraft(); // Clear saved draft on successful submission

            // Navigate to results page with the real simulation ID from the database
            // Fall back to timestamp-based ID if not returned (e.g., user not logged in)
            const simulationId = results.simulationId || `sim-${Date.now()}`;
            router.push(`/results/${simulationId}`);

        } catch (error) {
            console.error('Simulation error:', error);
            alert(error instanceof Error ? error.message : 'Simulation failed. Please try again.');
            setIsSubmitting(false);
        }
    };

    const addFeature = () => {
        setProductData(prev => ({ ...prev, features: [...prev.features, ""] }));
    };

    const removeFeature = (index: number) => {
        setProductData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const updateFeature = (index: number, value: string) => {
        setProductData(prev => ({
            ...prev,
            features: prev.features.map((f, i) => i === index ? value : f)
        }));
    };

    const addClaim = () => {
        setProductData(prev => ({ ...prev, claims: [...prev.claims, ""] }));
    };

    const removeClaim = (index: number) => {
        setProductData(prev => ({
            ...prev,
            claims: prev.claims.filter((_, i) => i !== index)
        }));
    };

    const updateClaim = (index: number, value: string) => {
        setProductData(prev => ({
            ...prev,
            claims: prev.claims.map((c, i) => i === index ? value : c)
        }));
    };

    const toggleSegment = (id: string) => {
        setAudienceData(prev => ({
            ...prev,
            segments: prev.segments.map(s =>
                s.id === id ? { ...s, enabled: !s.enabled } : s
            )
        }));
    };

    const cloneSegment = (segment: PresetSegment) => {
        const newSegment: PresetSegment = {
            ...segment,
            id: `${segment.id}-copy-${Date.now()}`,
            name: `${segment.name} (Copy)`,
            enabled: true,
        };
        setAudienceData(prev => ({
            ...prev,
            segments: [...prev.segments, newSegment]
        }));
    };

    const deleteSegment = (id: string) => {
        setAudienceData(prev => ({
            ...prev,
            segments: prev.segments.filter(s => s.id !== id)
        }));
    };

    const addCustomSegment = () => {
        if (!customSegmentForm.name) return;

        const newSegment: PresetSegment = {
            id: `custom-${Date.now()}`,
            name: `${customSegmentForm.name} (${customSegmentForm.ageRange})`,
            enabled: true,
            weight: 20,
            icon: "users",
            ageRange: customSegmentForm.ageRange,
            budgetSensitivity: customSegmentForm.budgetSensitivity,
        };

        setAudienceData(prev => ({
            ...prev,
            segments: [...prev.segments, newSegment]
        }));

        setCustomSegmentForm({
            name: "",
            ageRange: "25-45",
            budgetSensitivity: "medium",
            householdContext: "",
            needs: ["", ""],
            channelPreference: "any",
        });
        setCustomSegmentOpen(false);
    };

    const getPricePointsArray = (): number[] => {
        if (priceData.mode === "single") {
            return [priceData.singlePrice];
        }

        const min = priceData.minPrice;
        const max = priceData.maxPrice;
        const count = priceData.pricePoints;

        // Handle edge cases
        if (min <= 0 || max <= 0) return [];
        if (min >= max) return [min];
        if (count <= 1) return [min];

        // Generate evenly spaced price points
        const step = (max - min) / (count - 1);
        const prices = Array.from({ length: count }, (_, i) =>
            Math.round(min + step * i)
        );

        // Ensure unique values and sort
        const unique = [...new Set(prices)].sort((a, b) => a - b);
        return unique;
    };

    const getIndustryIcon = (iconName: string) => {
        switch (iconName) {
            case "droplet": return <Droplet className="size-6" />;
            case "sparkles": return <Sparkles className="size-6" />;
            case "home": return <Home className="size-6" />;
            case "dog": return <Dog className="size-6" />;
            case "heart": return <Heart className="size-6" />;
            case "apple": return <Apple className="size-6" />;
            case "baby": return <Baby className="size-6" />;
            case "recycle": return <Recycle className="size-6" />;
            case "store": return <Store className="size-6" />;
            case "more": return <MoreHorizontal className="size-6" />;
            default: return <Package className="size-6" />;
        }
    };

    const getSegmentIcon = (iconName?: string) => {
        switch (iconName) {
            case "droplet": return <Droplet className="size-4" />;
            case "leaf": return <Leaf className="size-4" />;
            case "sun": return <Sun className="size-4" />;
            case "sparkles": return <Sparkles className="size-4" />;
            case "heart": return <Heart className="size-4" />;
            case "home": return <Home className="size-4" />;
            case "dog": return <Dog className="size-4" />;
            case "apple": return <Apple className="size-4" />;
            case "baby": return <Baby className="size-4" />;
            case "recycle": return <Recycle className="size-4" />;
            case "store": return <Store className="size-4" />;
            default: return <Users className="size-4" />;
        }
    };

    const enabledSegments = audienceData.segments.filter(s => s.enabled);
    const totalRespondents = enabledSegments.length * audienceData.respondentsPerSegment * getPricePointsArray().length;
    const currentCategorySuggestions = CATEGORY_SUGGESTIONS[selectedIndustry] || CATEGORY_SUGGESTIONS.other;

    return (
        <div className="min-h-screen bg-background">
            {/* Full-screen Loading Overlay */}
            {isSubmitting && (
                <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-[spin_20s_linear_infinite]" />
                        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary/10 via-transparent to-accent/10 animate-[spin_25s_linear_infinite_reverse]" />
                    </div>

                    {/* Main content */}
                    <div className="relative z-10 flex flex-col items-center max-w-lg px-6 text-center">
                        {/* Circular progress indicator */}
                        <div className="relative mb-8">
                            {/* Outer rotating ring */}
                            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="none"
                                    className="text-muted/30"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="none"
                                    className="text-primary transition-all duration-500 ease-out"
                                    strokeLinecap="round"
                                    strokeDasharray={`${loadingProgress * 2.83} 283`}
                                />
                            </svg>
                            {/* Center icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="size-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 animate-pulse">
                                    <FlaskConical className="size-8 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Progress percentage */}
                        <div className="mb-6">
                            <span className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                {Math.min(Math.round(loadingProgress), 99)}%
                            </span>
                        </div>

                        {/* Status text */}
                        <h2 className="text-xl font-semibold mb-2">Simulating Consumer Responses</h2>
                        <p className="text-muted-foreground mb-8">
                            Analyzing {totalRespondents.toLocaleString()} purchase decisions...
                        </p>

                        {/* Quote card with animation */}
                        <div className="relative w-full">
                            <div
                                key={loadingQuoteIndex}
                                className="bg-card/60 backdrop-blur-sm rounded-xl border border-border/50 p-6 shadow-xl animate-[fadeIn_0.5s_ease-out]"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                                        {getLoadingIcon(LOADING_CONTENT[loadingQuoteIndex].icon)}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-foreground leading-relaxed">
                                            {LOADING_CONTENT[loadingQuoteIndex].text}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {LOADING_CONTENT[loadingQuoteIndex].subtext}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quote navigation dots */}
                            <div className="flex justify-center gap-1.5 mt-4">
                                {LOADING_CONTENT.slice(0, 5).map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`size-1.5 rounded-full transition-all duration-300 ${loadingQuoteIndex % 5 === idx
                                            ? "bg-primary w-4"
                                            : "bg-muted-foreground/30"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Estimated time */}
                        <p className="text-xs text-muted-foreground mt-8">
                            Usually takes 2-5 minutes • Results will be worth the wait!
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/">
                                    <ArrowLeft className="size-4" />
                                </Link>
                            </Button>
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                    <FlaskConical className="size-5 text-white" />
                                </div>
                                <span className="font-bold text-lg">New Concept Test</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {steps.map((step, idx) => (
                                <button
                                    key={step.key}
                                    onClick={() => {
                                        // Only allow going to previous steps or current
                                        if (idx <= stepIndex) setCurrentStep(step.key);
                                    }}
                                    disabled={idx > stepIndex}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${currentStep === step.key
                                        ? "bg-primary text-primary-foreground"
                                        : idx < stepIndex
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground"
                                        } ${idx > stepIndex ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
                                >
                                    {idx < stepIndex ? <Check className="size-4" /> : step.icon}
                                    <span className="hidden sm:inline">{step.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <Progress value={progress} className="h-1" />
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Step: Industry (NEW) */}
                {currentStep === "industry" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Store className="size-5 text-primary" />
                                Choose Your Industry
                            </CardTitle>
                            <CardDescription>
                                Select your product category for tailored audience segments
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {INDUSTRIES.map(industry => (
                                    <button
                                        key={industry.id}
                                        onClick={() => setSelectedIndustry(industry.id)}
                                        className={`p-4 rounded-xl border-2 text-center transition-all ${selectedIndustry === industry.id
                                            ? "border-primary bg-primary/5 shadow-md"
                                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                                            }`}
                                    >
                                        <div className={`mx-auto mb-2 size-12 rounded-full flex items-center justify-center ${selectedIndustry === industry.id
                                            ? "bg-primary text-white"
                                            : "bg-muted text-muted-foreground"
                                            }`}>
                                            {getIndustryIcon(industry.icon)}
                                        </div>
                                        <p className="font-medium text-sm">{industry.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{industry.description}</p>
                                    </button>
                                ))}
                            </div>

                            {selectedIndustry === "other" && (
                                <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                                    <AlertTriangle className="size-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800">Category Suitability Note</p>
                                        <p className="text-sm text-amber-700 mt-1">
                                            IntentLab works best for consumer products with rich online reviews and discussion. For niche or B2B products, treat results as directional insights.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Step: Product */}
                {currentStep === "product" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="size-5 text-primary" />
                                Product Concept
                            </CardTitle>
                            <CardDescription>
                                Describe your consumer product concept
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Product Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., GlowRevive Vitamin C Serum"
                                        value={productData.name}
                                        onChange={e => setProductData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Input
                                        id="category"
                                        placeholder="e.g., Facial Serum"
                                        value={productData.category}
                                        onChange={e => setProductData(prev => ({ ...prev, category: e.target.value }))}
                                        list="category-suggestions"
                                    />
                                    <datalist id="category-suggestions">
                                        {currentCategorySuggestions.map(cat => (
                                            <option key={cat} value={cat} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <textarea
                                    id="description"
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Describe your product: What is it? What problem does it solve? Key ingredients or features? Who is it for?"
                                    value={productData.description}
                                    onChange={e => setProductData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Key Features / Ingredients</Label>
                                    <Button variant="ghost" size="sm" onClick={addFeature}>
                                        <Plus className="size-4 mr-1" />
                                        Add
                                    </Button>
                                </div>
                                {productData.features.map((feature, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input
                                            placeholder={idx === 0 ? "e.g., 15% Vitamin C" : `Feature ${idx + 1}`}
                                            value={feature}
                                            onChange={e => updateFeature(idx, e.target.value)}
                                        />
                                        {productData.features.length > 1 && (
                                            <Button variant="ghost" size="icon" onClick={() => removeFeature(idx)}>
                                                <Trash2 className="size-4 text-muted-foreground" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Claims / Benefits</Label>
                                    <Button variant="ghost" size="sm" onClick={addClaim}>
                                        <Plus className="size-4 mr-1" />
                                        Add
                                    </Button>
                                </div>
                                {productData.claims.map((claim, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input
                                            placeholder={idx === 0 ? "e.g., Visibly brighter skin in 2 weeks" : `Claim ${idx + 1}`}
                                            value={claim}
                                            onChange={e => updateClaim(idx, e.target.value)}
                                        />
                                        {productData.claims.length > 1 && (
                                            <Button variant="ghost" size="icon" onClick={() => removeClaim(idx)}>
                                                <Trash2 className="size-4 text-muted-foreground" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="positioning">Brand Positioning (optional)</Label>
                                <Input
                                    id="positioning"
                                    placeholder="e.g., Clean, cruelty-free, dermatologist-recommended"
                                    value={productData.positioning}
                                    onChange={e => setProductData(prev => ({ ...prev, positioning: e.target.value }))}
                                />
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <Label>Concept Image (optional)</Label>
                                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => document.getElementById('image-upload')?.click()}
                                >
                                    {productData.image ? (
                                        <div className="relative w-full max-w-sm aspect-video bg-muted rounded overflow-hidden">
                                            {/* In a real app, this would show the uploaded image preview */}
                                            <img
                                                src={productData.image}
                                                alt="Product preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setProductData(prev => ({ ...prev, image: null }));
                                                }}
                                            >
                                                <Trash2 className="size-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                                <ImageIcon className="size-5 text-primary" />
                                            </div>
                                            <p className="text-sm font-medium">Click to upload product image</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                PNG, JPG up to 5MB. AI will analyze visual cues like packaging style.
                                            </p>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        id="image-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                // In a real app, we'd upload to storage. Here just setting a dummy value.
                                                setProductData(prev => ({ ...prev, image: URL.createObjectURL(e.target.files![0]) }));
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step: Price */}
                {currentStep === "price" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="size-5 text-primary" />
                                Price Experiment
                            </CardTitle>
                            <CardDescription>
                                Test single price or find your optimal price point
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Tabs value={priceData.mode} onValueChange={v => setPriceData(prev => ({ ...prev, mode: v as "single" | "range" }))}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="single">Single Price</TabsTrigger>
                                    <TabsTrigger value="range">Price Range (Recommended)</TabsTrigger>
                                </TabsList>

                                <TabsContent value="single" className="mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="singlePrice">Price ($)</Label>
                                        <Input
                                            id="singlePrice"
                                            type="number"
                                            min="1"
                                            value={priceData.singlePrice}
                                            onChange={e => setPriceData(prev => ({ ...prev, singlePrice: Number(e.target.value) }))}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="range" className="mt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="minPrice">Minimum Price ($)</Label>
                                            <Input
                                                id="minPrice"
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="e.g., 24"
                                                value={priceData.minPrice || ''}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                                    setPriceData(prev => ({ ...prev, minPrice: val ? parseInt(val, 10) : 0 }));
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="maxPrice">Maximum Price ($)</Label>
                                            <Input
                                                id="maxPrice"
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="e.g., 48"
                                                value={priceData.maxPrice || ''}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                                    setPriceData(prev => ({ ...prev, maxPrice: val ? parseInt(val, 10) : 0 }));
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="pricePoints">Number of Price Points: {priceData.pricePoints}</Label>
                                        <input
                                            id="pricePoints"
                                            type="range"
                                            min="3"
                                            max="11"
                                            value={priceData.pricePoints}
                                            onChange={e => setPriceData(prev => ({ ...prev, pricePoints: Number(e.target.value) }))}
                                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {getPricePointsArray().map((price, idx) => (
                                                <Badge key={`price-${idx}-${price}`} variant="secondary">${price}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <Separator />

                            <div className="space-y-2">
                                <Label>Purchase Type</Label>
                                <div className="flex gap-4">
                                    <button
                                        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${priceData.purchaseType === "one-time"
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-muted-foreground"
                                            }`}
                                        onClick={() => setPriceData(prev => ({ ...prev, purchaseType: "one-time" }))}
                                    >
                                        <p className="font-medium">One-Time Purchase</p>
                                        <p className="text-sm text-muted-foreground">Single unit</p>
                                    </button>
                                    <button
                                        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${priceData.purchaseType === "subscription"
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-muted-foreground"
                                            }`}
                                        onClick={() => setPriceData(prev => ({ ...prev, purchaseType: "subscription" }))}
                                    >
                                        <p className="font-medium">Subscription</p>
                                        <p className="text-sm text-muted-foreground">Monthly refill</p>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Price Framing (how price is shown)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: "per-unit", label: "Per Unit", desc: "$29 for one" },
                                        { value: "per-month", label: "Per Month", desc: "$29/month" },
                                        { value: "per-ounce", label: "Per Ounce/ml", desc: "$0.97/oz" },
                                        { value: "bundle", label: "Bundle", desc: "3 for $69" },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            className={`p-3 rounded-lg border-2 text-left transition-colors ${priceData.priceFraming === opt.value
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-muted-foreground"
                                                }`}
                                            onClick={() => setPriceData(prev => ({
                                                ...prev,
                                                priceFraming: opt.value as "per-unit" | "per-month" | "per-ounce" | "bundle"
                                            }))}
                                        >
                                            <p className="font-medium text-sm">{opt.label}</p>
                                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">How price will be framed when presenting to synthetic consumers</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="productSize">Product Size (optional)</Label>
                                <Input
                                    id="productSize"
                                    placeholder="e.g., 30ml, 12oz, 60 count"
                                    value={priceData.productSize}
                                    onChange={e => setPriceData(prev => ({ ...prev, productSize: e.target.value }))}
                                />
                                <p className="text-xs text-muted-foreground">Helps synthetic consumers reason about value</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step: Audience */}
                {currentStep === "audience" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="size-5 text-primary" />
                                    Target Audience
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => setIsBlueprintModalOpen(true)}
                                    >
                                        <FileUp className="size-4" />
                                        Import Blueprint
                                    </Button>
                                    <div className="group relative flex items-center justify-center">
                                        <Info className="size-5 text-muted-foreground hover:text-primary cursor-help" />
                                        <div className="absolute right-0 top-full mt-2 w-80 p-3 bg-popover text-popover-foreground text-xs rounded-lg border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                                            For best results, upload data that describes who your customers are and how they buy: age range (or proxies), budget/price sensitivity, purchase history (AOV, repeat rate), channels (Amazon/DTC/retail), and any survey/interview notes on needs + objections.
                                        </div>
                                    </div>
                                </div>
                            </CardTitle>
                            <CardDescription>
                                Define who we should recruit for this simulation
                            </CardDescription>

                            {/* Blueprint Success Banner */}
                            {audienceData.segments.some(s => s.source === 'file') && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                                    <Check className="size-5 text-green-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-green-800">Blueprint Active</p>
                                        <p className="text-xs text-green-700">
                                            Segments weighted and conditioned using your uploaded data.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Confidence indicator */}
                            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">High confidence</Badge>
                                    <span className="text-sm text-muted-foreground">Age + Budget</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">Exploratory</Badge>
                                    <span className="text-sm text-muted-foreground">Gender / Region</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {audienceData.segments.map(segment => (
                                    <div
                                        key={segment.id}
                                        className={`p-4 rounded-lg border-2 transition-colors ${segment.enabled
                                            ? "border-primary bg-primary/5"
                                            : "border-border"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <button
                                                className="flex items-center gap-3 flex-1 text-left"
                                                onClick={() => toggleSegment(segment.id)}
                                            >
                                                <div className={`size-8 rounded-full flex items-center justify-center ${segment.enabled ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                                    }`}>
                                                    {getSegmentIcon(segment.icon)}
                                                </div>
                                                <div>
                                                    <span className="font-medium">{segment.name}</span>
                                                    {segment.budgetSensitivity && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                {segment.budgetSensitivity === "high" ? "💰 Budget-conscious" :
                                                                    segment.budgetSensitivity === "low" ? "💎 Premium-open" : "⚖️ Value-seeker"}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => cloneSegment(segment)}
                                                    title="Clone segment"
                                                >
                                                    <Copy className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteSegment(segment.id)}
                                                    title="Delete segment"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                                <div className={`size-5 rounded-full border-2 flex items-center justify-center ${segment.enabled ? "border-primary bg-primary" : "border-muted-foreground"
                                                    }`}>
                                                    {segment.enabled && <Check className="size-3 text-white" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Custom Segment Button */}
                            <Sheet open={customSegmentOpen} onOpenChange={setCustomSegmentOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                        <Plus className="size-4 mr-2" />
                                        Create Custom Segment
                                    </Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Create Custom Segment</SheetTitle>
                                        <SheetDescription>
                                            Define a specific consumer persona to simulate
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="space-y-4 mt-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="segmentName">Segment Name *</Label>
                                            <Input
                                                id="segmentName"
                                                placeholder="e.g., Eco-Conscious Millennials"
                                                value={customSegmentForm.name}
                                                onChange={e => setCustomSegmentForm(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="ageRange">Age Range</Label>
                                            <select
                                                id="ageRange"
                                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={customSegmentForm.ageRange}
                                                onChange={e => setCustomSegmentForm(prev => ({ ...prev, ageRange: e.target.value }))}
                                            >
                                                <option value="18-24">18-24 (Gen Z)</option>
                                                <option value="25-34">25-34 (Young Millennials)</option>
                                                <option value="25-45">25-45 (Core Adults)</option>
                                                <option value="35-50">35-50 (Established Adults)</option>
                                                <option value="45-65">45-65 (Mature Adults)</option>
                                                <option value="55+">55+ (Seniors)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Budget / Price Sensitivity</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { value: "low", label: "Low", desc: "Premium-open" },
                                                    { value: "medium", label: "Medium", desc: "Value-seeker" },
                                                    { value: "high", label: "High", desc: "Budget-conscious" },
                                                ].map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setCustomSegmentForm(prev => ({
                                                            ...prev,
                                                            budgetSensitivity: opt.value as "low" | "medium" | "high"
                                                        }))}
                                                        className={`p-3 rounded-lg border-2 text-center ${customSegmentForm.budgetSensitivity === opt.value
                                                            ? "border-primary bg-primary/5"
                                                            : "border-border"
                                                            }`}
                                                    >
                                                        <p className="font-medium text-sm">{opt.label}</p>
                                                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="householdContext">Household Context (optional)</Label>
                                            <Input
                                                id="householdContext"
                                                placeholder="e.g., Parents, Pet owners, Students"
                                                value={customSegmentForm.householdContext}
                                                onChange={e => setCustomSegmentForm(prev => ({ ...prev, householdContext: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Key Needs / Looking For</Label>
                                            {customSegmentForm.needs.map((need, idx) => (
                                                <Input
                                                    key={idx}
                                                    placeholder={`Need ${idx + 1}`}
                                                    value={need}
                                                    onChange={e => {
                                                        const newNeeds = [...customSegmentForm.needs];
                                                        newNeeds[idx] = e.target.value;
                                                        setCustomSegmentForm(prev => ({ ...prev, needs: newNeeds }));
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="channelPreference">Channel Preference</Label>
                                            <select
                                                id="channelPreference"
                                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={customSegmentForm.channelPreference}
                                                onChange={e => setCustomSegmentForm(prev => ({ ...prev, channelPreference: e.target.value }))}
                                            >
                                                <option value="any">Any Channel</option>
                                                <option value="amazon">Amazon</option>
                                                <option value="dtc">Direct-to-Consumer</option>
                                                <option value="retail">Retail (Target, Walmart)</option>
                                                <option value="specialty">Specialty (Sephora, Ulta)</option>
                                            </select>
                                        </div>

                                        <Button onClick={addCustomSegment} className="w-full mt-4" disabled={!customSegmentForm.name}>
                                            Add Segment
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>

                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="respondents">Respondents per Segment: {audienceData.respondentsPerSegment}</Label>
                                <input
                                    id="respondents"
                                    type="range"
                                    min="20"
                                    max="200"
                                    step="10"
                                    value={audienceData.respondentsPerSegment}
                                    onChange={e => setAudienceData(prev => ({ ...prev, respondentsPerSegment: Number(e.target.value) }))}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <p className="text-sm text-muted-foreground">
                                    More respondents = more reliable results. 50+ recommended for actionable insights.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step: Run */}
                {currentStep === "run" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Play className="size-5 text-primary" />
                                Review & Run
                            </CardTitle>
                            <CardDescription>
                                Confirm your concept test settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-lg bg-muted/50 p-4 space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Industry</p>
                                    <p className="font-medium">{INDUSTRIES.find(i => i.id === selectedIndustry)?.name || "Not selected"}</p>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm text-muted-foreground">Product</p>
                                    <p className="font-medium">{productData.name || "Not specified"}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{productData.category}</p>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm text-muted-foreground">Price Points</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {getPricePointsArray().map(price => (
                                            <Badge key={price} variant="secondary">${price}</Badge>
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {priceData.purchaseType === "subscription" ? "Monthly subscription" : "One-time purchase"}
                                        {priceData.productSize && ` • ${priceData.productSize}`}
                                    </p>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm text-muted-foreground">Audience Segments ({enabledSegments.length})</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {enabledSegments.map(s => (
                                            <Badge key={s.id}>{s.name}</Badge>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">Total Simulated Respondents</p>
                                    <p className="text-2xl font-bold text-primary">{totalRespondents.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                                <p className="text-sm font-medium text-primary">Estimated Time: 2-5 minutes</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    You'll see price sensitivity curves, purchase intent by segment, and the top objections to address.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                    <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={stepIndex === 0}
                    >
                        <ArrowLeft className="size-4 mr-2" />
                        Back
                    </Button>

                    {currentStep === "run" ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="shadow-lg shadow-primary/25"
                        >
                            {isSubmitting ? (
                                <>Running Concept Test...</>
                            ) : (
                                <>
                                    Run Concept Test
                                    <Play className="size-4 ml-2" />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={nextStep}
                            disabled={!canContinue()}
                        >
                            Continue
                            <ArrowRight className="size-4 ml-2" />
                        </Button>
                    )}
                </div>
            </main>
        </div >
    );
}
