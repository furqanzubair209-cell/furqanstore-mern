import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { wishlistApi } from "../api/account.api";
import { cartApi } from "../api/cart.api";

export default function Wishlist() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["wishlist"], queryFn: wishlistApi.list });
  const items = data?.data || [];

  const remove = async (productId: number) => {
    await wishlistApi.remove(productId);
    qc.invalidateQueries({ queryKey: ["wishlist"] });
  };

  const addToCart = async (productId: number) => {
    await cartApi.add(productId, 1);
    qc.invalidateQueries({ queryKey: ["cart"] });
  };

  if (isLoading) return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-[rgb(var(--c-text)/0.5)]">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl mb-8">Your wishlist</h1>
      {items.length === 0 ? (
        <div className="text-center py-20 text-[rgb(var(--c-text)/0.5)]">
          Nothing here yet. <Link to="/products" className="text-gold">Browse products →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item: any) => (
            <div key={item.id} className="group">
              <Link to={`/products/${item.product.id}`}>
                <div className="aspect-square rounded-xl overflow-hidden bg-[rgb(var(--c-surface)/0.05)]">
                  <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <p className="mt-3 text-sm truncate">{item.product.name}</p>
                <p className="text-gold text-sm">Rs. {Number(item.product.price).toLocaleString()}</p>
              </Link>
              <div className="flex flex-col xs:flex-row gap-2 mt-2">
                <button
                  onClick={() => addToCart(item.product.id)}
                  className="flex-1 text-xs border border-[rgb(var(--c-border)/0.2)] rounded-full py-1.5 hover:border-gold transition"
                >
                  Add to cart
                </button>
                <button
                  onClick={() => remove(item.product.id)}
                  className="text-xs text-[rgb(var(--c-text)/0.4)] hover:text-red-400 px-2"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
