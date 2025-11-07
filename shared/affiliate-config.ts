export interface AffiliateLink {
  name: string;
  category: "fabric" | "batting" | "thread" | "notions" | "tools";
  url: string;
  description: string;
}

export const AFFILIATE_LINKS: Record<string, AffiliateLink[]> = {
  fabric: [
    {
      name: "Fat Quarter Shop",
      category: "fabric",
      url: "https://www.fatquartershop.com/?aff=quiltersai",
      description: "Premium quilting fabrics and pre-cuts"
    },
    {
      name: "Missouri Star Quilt Co",
      category: "fabric",
      url: "https://www.missouriquiltco.com/?aff=quiltersai",
      description: "Wide selection of quilting fabrics"
    },
    {
      name: "Fabric.com",
      category: "fabric",
      url: "https://www.fabric.com/?aff=quiltersai",
      description: "Discount fabric by the yard"
    }
  ],
  batting: [
    {
      name: "Warm & Natural Batting",
      category: "batting",
      url: "https://www.amazon.com/dp/B000YZ7G44?tag=quiltersai-20",
      description: "Popular cotton batting for quilts"
    },
    {
      name: "Pellon Fusible Fleece",
      category: "batting",
      url: "https://www.amazon.com/dp/B000YZ8DVO?tag=quiltersai-20",
      description: "Fusible batting for easier quilting"
    }
  ],
  thread: [
    {
      name: "Aurifil Thread Set",
      category: "thread",
      url: "https://www.amazon.com/dp/B00JQE7L8O?tag=quiltersai-20",
      description: "Professional quilting thread collection"
    },
    {
      name: "Gutermann Thread",
      category: "thread",
      url: "https://www.amazon.com/dp/B000VAUHXI?tag=quiltersai-20",
      description: "All-purpose sewing thread"
    }
  ],
  notions: [
    {
      name: "Rotary Cutter & Mat Set",
      category: "notions",
      url: "https://www.amazon.com/dp/B000YZ7IJI?tag=quiltersai-20",
      description: "Essential quilting cutting tools"
    },
    {
      name: "Quilting Ruler Set",
      category: "notions",
      url: "https://www.amazon.com/dp/B0000CBJES?tag=quiltersai-20",
      description: "Precision rulers for accurate cutting"
    }
  ],
  tools: [
    {
      name: "Sewing Machine",
      category: "tools",
      url: "https://www.amazon.com/s?k=quilting+sewing+machine&tag=quiltersai-20",
      description: "Browse quilting sewing machines"
    }
  ]
};

export interface SocialMediaConfig {
  platform: "pinterest" | "facebook" | "twitter" | "instagram";
  icon: string;
  color: string;
  shareUrlTemplate: string;
  maxCaptionLength?: number;
}

export const SOCIAL_MEDIA_PLATFORMS: SocialMediaConfig[] = [
  {
    platform: "pinterest",
    icon: "pin",
    color: "#E60023",
    shareUrlTemplate: "https://pinterest.com/pin/create/button/?url={url}&description={caption}&media={image}",
    maxCaptionLength: 500
  },
  {
    platform: "facebook",
    icon: "facebook",
    color: "#1877F2",
    shareUrlTemplate: "https://www.facebook.com/sharer/sharer.php?u={url}&quote={caption}",
    maxCaptionLength: 5000
  },
  {
    platform: "twitter",
    icon: "twitter",
    color: "#1DA1F2",
    shareUrlTemplate: "https://twitter.com/intent/tweet?text={caption}&url={url}",
    maxCaptionLength: 280
  }
];

export const QUILTING_HASHTAGS = [
  "#quilting",
  "#quiltersofinstagram",
  "#quiltpattern",
  "#modernquilting",
  "#quiltlove",
  "#handmade",
  "#sewing",
  "#fabriclove",
  "#quiltersai",
  "#quiltdesign"
];

export function generateSocialCaption(designName: string, blockPattern: string, size: string): string {
  const caption = `Just designed "${designName}" - a beautiful ${blockPattern} quilt pattern! ✨\n\nSize: ${size}\nCreated with Quilter's AI 🎨\n\n${QUILTING_HASHTAGS.slice(0, 8).join(" ")}`;
  return caption;
}

export function buildShareUrl(platform: "pinterest" | "facebook" | "twitter", designUrl: string, caption: string, imageUrl?: string): string {
  const config = SOCIAL_MEDIA_PLATFORMS.find(p => p.platform === platform);
  if (!config) return "#";
  
  let url = config.shareUrlTemplate
    .replace("{url}", encodeURIComponent(designUrl))
    .replace("{caption}", encodeURIComponent(caption));
  
  if (imageUrl) {
    url = url.replace("{image}", encodeURIComponent(imageUrl));
  }
  
  return url;
}
