import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DesignVariation } from "@shared/schema";

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  // Fetch all favorites for the user
  const { data: favorites, isLoading } = useQuery<DesignVariation[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  // Update local state when favorites are loaded
  useEffect(() => {
    if (favorites) {
      setFavoritedIds(new Set(favorites.map(d => d.id)));
    }
  }, [favorites]);

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (designId: string) => {
      return await apiRequest("POST", `/api/favorites/${designId}`);
    },
    onMutate: async (designId: string) => {
      // Optimistic update
      setFavoritedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(designId)) {
          newSet.delete(designId);
        } else {
          newSet.add(designId);
        }
        return newSet;
      });
    },
    onSuccess: () => {
      // Invalidate favorites query to refetch
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: (error, designId) => {
      // Revert optimistic update
      setFavoritedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(designId)) {
          newSet.delete(designId);
        } else {
          newSet.add(designId);
        }
        return newSet;
      });
      
      toast({
        title: "Error",
        description: "Failed to update favorite. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isFavorited = (designId: string) => favoritedIds.has(designId);

  const toggleFavorite = (designId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to favorite designs.",
        variant: "destructive",
      });
      return;
    }
    toggleFavoriteMutation.mutate(designId);
  };

  return {
    favorites,
    isLoading,
    isFavorited,
    toggleFavorite,
  };
}
