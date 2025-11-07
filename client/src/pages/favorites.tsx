import { useState } from "react";
import { Link } from "wouter";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesignCard } from "@/components/design-card";
import { DesignDetail } from "@/components/design-detail";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { DesignWithDetails } from "@shared/schema";

export default function Favorites() {
  const { user } = useAuth();
  const { favorites, isLoading, isFavorited, toggleFavorite } = useFavorites();
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

  const { data: selectedDesign } = useQuery<DesignWithDetails>({
    queryKey: ["/api/designs", selectedDesignId],
    enabled: !!selectedDesignId,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">Login Required</h1>
            <p className="text-muted-foreground mb-6">
              Please log in to view your favorite designs.
            </p>
            <Link href="/">
              <Button data-testid="button-back-home">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-home">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Generator
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold" data-testid="text-page-title">
              My Favorites
            </h1>
          </div>
          <p className="text-muted-foreground">
            {isLoading ? (
              "Loading your favorite designs..."
            ) : (
              <>
                {favorites?.length || 0} {favorites?.length === 1 ? "design" : "designs"} saved
              </>
            )}
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading favorites...</p>
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                onClick={() => setSelectedDesignId(design.id)}
                isFavorited={isFavorited(design.id)}
                onToggleFavorite={() => toggleFavorite(design.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">
              Start favoriting designs by clicking the heart icon on any design card.
            </p>
            <Link href="/">
              <Button data-testid="button-start-generating">
                Start Generating Designs
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Design Detail Modal */}
      {selectedDesign && (
        <DesignDetail
          design={selectedDesign}
          onClose={() => setSelectedDesignId(null)}
        />
      )}
    </div>
  );
}
