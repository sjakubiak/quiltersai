import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PromptFormProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const SIZE_PRESETS = [
  { value: "baby", label: "Baby (36×42\")", width: 36, height: 42 },
  { value: "throw", label: "Throw (54×72\")", width: 54, height: 72 },
  { value: "twin", label: "Twin (60×80\")", width: 60, height: 80 },
  { value: "full", label: "Full/Queen (90×96\")", width: 90, height: 96 },
  { value: "king", label: "King (108×108\")", width: 108, height: 108 },
  { value: "custom", label: "Custom Size", width: null, height: null },
];

const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export function PromptForm({ onGenerate, isGenerating }: PromptFormProps) {
  const [prompt, setPrompt] = useState("");
  const [sizePreset, setSizePreset] = useState("twin");
  const [skillLevel, setSkillLevel] = useState("intermediate");
  const [budget, setBudget] = useState("120");
  const [colors, setColors] = useState("");
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const extractPaletteMutation = useMutation({
    mutationFn: async (imageData: string) => {
      return await apiRequest<{ colors: string[] }>("POST", "/api/palette/extract", { imageData });
    },
    onSuccess: (data) => {
      setExtractedColors(data.colors);
      setColors(data.colors.join(", "));
      toast({
        title: "Colors extracted!",
        description: `Found ${data.colors.length} colors from your image.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to extract colors. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      extractPaletteMutation.mutate(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeExtractedColor = (index: number) => {
    const newColors = extractedColors.filter((_, i) => i !== index);
    setExtractedColors(newColors);
    setColors(newColors.join(", "));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Build enhanced prompt with advanced options
    let enhancedPrompt = prompt;
    
    const selectedSize = SIZE_PRESETS.find(s => s.value === sizePreset);
    if (selectedSize && selectedSize.value !== "custom") {
      enhancedPrompt += `, ${selectedSize.label}`;
    }

    if (skillLevel) {
      enhancedPrompt += `, ${skillLevel} skill level`;
    }

    if (budget) {
      enhancedPrompt += `, budget under $${budget}`;
    }

    if (colors) {
      enhancedPrompt += `, colors: ${colors}`;
    }

    onGenerate(enhancedPrompt);
  };

  const charCount = prompt.length;
  const maxChars = 500;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="prompt" className="text-base font-semibold">
          Describe your quilt
        </Label>
        <Textarea
          id="prompt"
          data-testid="input-prompt"
          placeholder="e.g., Modern twin quilt with teal and charcoal colors, prefer rectangles, no triangles, machine piecing, boho vibe..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-32 resize-none text-base"
          maxLength={maxChars}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Be as specific as you like</span>
          <span>{charCount}/{maxChars}</span>
        </div>
      </div>

      <Accordion type="single" collapsible className="rounded-md border border-border">
        <AccordionItem value="advanced" className="border-none">
          <AccordionTrigger
            data-testid="button-advanced-options"
            className="px-4 py-3 text-sm font-medium hover:no-underline"
          >
            Advanced Options
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="size-preset" className="text-sm">Size Preset</Label>
              <Select value={sizePreset} onValueChange={setSizePreset}>
                <SelectTrigger id="size-preset" data-testid="select-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_PRESETS.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-level" className="text-sm">Skill Level</Label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger id="skill-level" data-testid="select-skill">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="text-sm">Budget (USD)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="budget"
                  data-testid="input-budget"
                  type="number"
                  min="0"
                  step="10"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="colors" className="text-sm">Color Preferences (optional)</Label>
              <div className="space-y-2">
                <Input
                  id="colors"
                  data-testid="input-colors"
                  placeholder="e.g., teal, charcoal, white"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    data-testid="input-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUploadClick}
                    disabled={extractPaletteMutation.isPending}
                    data-testid="button-upload-image"
                  >
                    {extractPaletteMutation.isPending ? (
                      <>
                        <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-3 w-3" />
                        Extract from Image
                      </>
                    )}
                  </Button>
                  {extractedColors.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {extractedColors.length} colors extracted
                    </span>
                  )}
                </div>
                {extractedColors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {extractedColors.map((color, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 px-2 py-1"
                        data-testid={`badge-color-${index}`}
                      >
                        <div
                          className="h-3 w-3 rounded-full border border-border"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs">{color}</span>
                        <button
                          type="button"
                          onClick={() => removeExtractedColor(index)}
                          className="ml-1 hover:text-destructive"
                          data-testid={`button-remove-color-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        data-testid="button-generate"
        type="submit"
        className="w-full"
        size="lg"
        disabled={!prompt.trim() || isGenerating}
      >
        {isGenerating ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Designs
          </>
        )}
      </Button>

      <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
        <p className="font-medium mb-1">💡 Tip</p>
        <p>Include details like size, colors, patterns, skill level, and budget for more accurate results.</p>
      </div>
    </form>
  );
}
