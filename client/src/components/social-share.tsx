import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, Copy, Check } from "lucide-react";
import { SiFacebook, SiPinterest } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateSocialCaption, buildShareUrl } from "@shared/affiliate-config";

interface SocialShareProps {
  designName: string;
  blockPattern: string;
  sizeCategory: string;
  designId: string;
}

export function SocialShare({ designName, blockPattern, sizeCategory, designId }: SocialShareProps) {
  const { toast } = useToast();
  const [copiedCaption, setCopiedCaption] = useState(false);
  
  const designUrl = `${window.location.origin}/?design=${designId}`;
  const caption = generateSocialCaption(designName, blockPattern, sizeCategory);
  
  const handleShare = (platform: "pinterest" | "facebook" | "twitter") => {
    const shareUrl = buildShareUrl(platform, designUrl, caption);
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaption(true);
      toast({
        title: "Caption copied!",
        description: "Paste it into your social media post",
      });
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the text manually",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(designUrl);
      toast({
        title: "Link copied!",
        description: "Share this design with others",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="button-share">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Design</DialogTitle>
          <DialogDescription>
            Share this quilt pattern on social media and inspire others!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Social Media Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleShare("pinterest")}
              data-testid="button-share-pinterest"
            >
              <SiPinterest className="h-5 w-5" style={{ color: "#E60023" }} />
              <span className="hidden sm:inline">Pinterest</span>
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleShare("facebook")}
              data-testid="button-share-facebook"
            >
              <SiFacebook className="h-5 w-5" style={{ color: "#1877F2" }} />
              <span className="hidden sm:inline">Facebook</span>
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleShare("twitter")}
              data-testid="button-share-twitter"
            >
              <FaXTwitter className="h-5 w-5" />
              <span className="hidden sm:inline">Twitter</span>
            </Button>
          </div>

          {/* Pre-generated Caption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Ready-to-use caption</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCaption}
                className="gap-1"
                data-testid="button-copy-caption"
              >
                {copiedCaption ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Card className="p-3 bg-muted">
              <p className="text-sm whitespace-pre-wrap">{caption}</p>
            </Card>
          </div>

          {/* Direct Link */}
          <div>
            <label className="text-sm font-medium mb-2 block">Direct link to this design</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={designUrl}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                data-testid="input-design-url"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                data-testid="button-copy-link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Sharing helps support Quilter's AI and inspires the quilting community! 💖
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
