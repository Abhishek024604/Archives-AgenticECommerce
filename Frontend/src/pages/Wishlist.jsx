import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../api/axios";
import { addToCart } from "../api/cart";
import { formatPrice } from "../utils/currency";
import { resolveMediaUrl } from "../utils/media";
import HomeNavbar from "../components/home/HomeNavbar";
import HomeFooter from "../components/home/HomeFooter";
import { useWishlist } from "../context/WishlistContext";

export default function Wishlist() {
  const { wishlist, loading, toggleWishlist } = useWishlist();



  const removeFromWishlist = async (productId) => {
    try {
      await toggleWishlist(productId);
    } catch (error) {
      alert("Failed to remove from wishlist");
    }
  };

  const moveToBag = async (product) => {
    try {
      const size = product.variants?.[0]?.size || "M";
      await addToCart({ productId: product._id, quantity: 1, size });
      await removeFromWishlist(product._id);
      // alert("Added to bag!");
    } catch (error) {
      alert("Failed to move to bag.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col">
      <HomeNavbar />
      
      <main className="flex-1 mx-auto max-w-[1200px] w-full px-4 sm:px-6 py-8">
        <h1 className="text-xl font-bold mb-2">My Wishlist <span className="text-stone-500 font-normal">{wishlist.length} items</span></h1>
        
        {loading ? (
          <div className="py-20 text-center text-sm font-medium text-stone-500">
            Loading wishlist...
          </div>
        ) : wishlist.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-md border border-stone-200 mt-4">
            <span className="material-symbols-outlined text-6xl text-stone-300 mb-4">favorite_border</span>
            <h2 className="text-xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-stone-500 mb-6 text-sm">Save items that you like in your wishlist. Review them anytime and easily move them to the bag.</p>
            <Link to="/products" className="border border-stone-800 text-stone-800 px-8 py-3 rounded hover:bg-stone-50 font-bold uppercase tracking-wider text-xs transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
            {wishlist.map((item) => (
              <div key={item._id} className="relative group bg-white border border-stone-200 hover:shadow-md transition-shadow flex flex-col h-full rounded overflow-hidden">
                {/* Remove button (X) */}
                <button
                  onClick={() => removeFromWishlist(item._id)}
                  className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-white/80 rounded-full hover:bg-stone-100 hover:text-red-500 transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>

                {/* Product Image */}
                <Link to={`/product/${item._id}`} className="aspect-[3/4] block overflow-hidden bg-stone-100">
                  <img
                    src={resolveMediaUrl(item.images?.[0])}
                    alt={item.productName}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>

                {/* Product Details */}
                <div className="p-3 flex-1 flex flex-col text-sm border-b border-stone-100">
                  <h3 className="font-bold truncate text-stone-800">{item.brandName || "Brand"}</h3>
                  <p className="text-stone-500 truncate text-xs mt-0.5 font-light">{item.productName}</p>
                  
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-bold text-stone-900">{formatPrice(item.price)}</span>
                    {item.discount > 0 && (
                      <span className="text-xs text-orange-500 font-bold">({item.discount}% OFF)</span>
                    )}
                  </div>
                </div>

                {/* Move to Bag Action */}
                <button
                  onClick={() => moveToBag(item)}
                  className="w-full py-3 text-center font-bold text-xs uppercase tracking-wider text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
                >
                  Move to Bag
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <HomeFooter />
    </div>
  );
}
