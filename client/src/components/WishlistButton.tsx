import { Heart } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { wishlistApi } from "../api/account.api";
import { useAuthStore } from "../store/auth.store";

export default function WishlistButton({ productId, className = "" }: { productId: number; className?: string }) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistApi.list,
    enabled: !!user,
  });

  const items: any[] = data?.data || [];
  const isWishlisted = items.some((i) => i.productId === productId);

  if (!user) return null;

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      await wishlistApi.remove(productId);
    } else {
      await wishlistApi.add(productId);
    }
    qc.invalidateQueries({ queryKey: ["wishlist"] });
  };

  return (
    <button
      onClick={toggle}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`p-2 rounded-full bg-[rgb(var(--c-bg)/0.7)] backdrop-blur hover:bg-[rgb(var(--c-bg))] transition ${className}`}
    >
      <Heart size={16} className={isWishlisted ? "fill-gold text-gold" : "text-[rgb(var(--c-text))]"} />
    </button>
  );
}
