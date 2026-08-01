import { createContext, useContext, useState, useEffect } from "react";
import { API } from "../api/axios";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      API.get("/wishlist")
        .then((res) => {
          if (isMounted) {
            // We store only the IDs or the whole objects? 
            // Better to store just IDs for fast lookups in UI, 
            // but the Wishlist page needs full objects.
            // Let's store full objects so Wishlist.jsx can just read from context!
            setWishlist(res.data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setWishlist([]);
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  const toggleWishlist = async (productId) => {
    if (!user) return false;
    
    try {
      const res = await API.post(`/wishlist/toggle/${productId}`);
      
      if (res.data.wishlisted) {
        // Since we only get 'wishlisted: true' from the API, 
        // to have the full object we either need the API to return it or we fetch again.
        // It's cleaner to just fetch the whole wishlist again if an item is added,
        // or the API should return the populated wishlist.
        // Let's just fetch it again to be safe and simple.
        const updated = await API.get("/wishlist");
        setWishlist(updated.data);
        return true;
      } else {
        // Removing is easy to do locally
        setWishlist((prev) => prev.filter((item) => item._id !== productId));
        return false;
      }
    } catch (e) {
      console.error("Failed to toggle wishlist", e);
      throw e;
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, loading, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
