import { useState, useEffect } from "react";
import AnnouncementBar from "../components/home/AnnouncementBar";
import HomeNavbar from "../components/home/HomeNavbar";
import HeroSection from "../components/home/HeroSection";
import CategoryGrid from "../components/home/CategoryGrid";
import ProductCarouselSection from "../components/home/ProductCarouselSection";
import CampaignBanners from "../components/home/CampaignBanners";
import PlatformHeroSection from "../components/home/PlatformHeroSection";
import PlatformProcessSection from "../components/home/PlatformProcessSection";
import PlatformCommunitiesSection from "../components/home/PlatformCommunitiesSection";
import PlatformFeaturesSection from "../components/home/PlatformFeaturesSection";
import PlatformNewsletterSection from "../components/home/PlatformNewsletterSection";
import ValueBadges from "../components/home/ValueBadges";
import HomeFooter from "../components/home/HomeFooter";
import { fetchProducts } from "../api/productApi";
import { resolveMediaUrl } from "../utils/media";

export default function Home() {
  const [wishlist, setWishlist] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);

  const toggleWishlist = (id) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [newRes, bestRes, allRes] = await Promise.all([
          fetchProducts({ filter: "new", limit: 6 }),
          fetchProducts({ filter: "bestsellers", limit: 6 }),
          fetchProducts({ limit: 50 }) // Fetch a larger pool to ensure we have fallback images
        ]);

        // Gather all valid images from the larger pool to use as fallbacks by category
        const categoryImages = {};
        const allValidImages = [];
        const extractImages = (res) => {
            const dataArr = res.data?.data || res.data;
            if (dataArr && Array.isArray(dataArr)) {
                dataArr.forEach(p => {
                    const cat = p.category || 'default';
                    if (!categoryImages[cat]) categoryImages[cat] = [];
                    if (p.images && p.images.length > 0) {
                        const valid = p.images.filter(img => typeof img === 'string' && img.trim().length > 5);
                        if (valid.length > 0) {
                           categoryImages[cat].push(...valid);
                           allValidImages.push(...valid);
                        }
                    }
                });
            }
        };
        // Use allRes to build the robust fallback pool
        extractImages(allRes);

        const getRandomFallbackImage = (category) => {
            const cat = category || 'default';
            let pool = categoryImages[cat];
            
            // If this category has no images, fallback to any valid image from the database
            if (!pool || pool.length === 0) {
                pool = allValidImages;
            }
            
            // If the database has absolutely zero images across all products, return a safe string
            if (!pool || pool.length === 0) return null;
            
            const randomIndex = Math.floor(Math.random() * pool.length);
            return pool[randomIndex];
        };

        const formatProduct = (p) => {
          let imageUrl = p.images?.[0];
          if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim().length < 5) {
              imageUrl = getRandomFallbackImage(p.category);
          }

          return {
            id: p._id,
            name: p.productName,
            price: p.price,
            image: resolveMediaUrl(imageUrl),
            colors: ["#111111"] // placeholder
          };
        };

        const newData = newRes.data?.data || newRes.data;
        if (newData && Array.isArray(newData)) {
            setNewArrivals(newData.map(formatProduct));
        }
        
        const bestData = bestRes.data?.data || bestRes.data;
        if (bestData && Array.isArray(bestData)) {
            setBestSellers(bestData.map(formatProduct));
        }
      } catch (err) {
        console.error("Failed to load products for home:", err);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      <div className="sticky top-0 z-50 w-full bg-white shadow-sm transition-all duration-300">
        {/* 1. Announcement Bar */}
        <AnnouncementBar />

        {/* 2. Header & Main Category Navigation */}
        <HomeNavbar wishlistCount={wishlist.length} />
      </div>

      {/* 3. Hero Editorial Section */}
      <HeroSection />

      {/* 4. Icon Category Grid */}
      <CategoryGrid />

      {/* 5. New Arrivals Carousel */}
      {newArrivals.length > 0 && (
        <ProductCarouselSection
          title="NEW ARRIVALS"
          viewAllLink="/products"
          products={newArrivals}
          wishlist={wishlist}
          onToggleWishlist={toggleWishlist}
        />
      )}

      {/* 6. Campaign Editorial Banners */}
      <CampaignBanners />

      {/* 7. Best Sellers Carousel */}
      {bestSellers.length > 0 && (
        <ProductCarouselSection
          title="BEST SELLERS"
          viewAllLink="/products"
          products={bestSellers}
          wishlist={wishlist}
          onToggleWishlist={toggleWishlist}
        />
      )}

      {/* 8. Value Propositions & Trust Badges */}
      <ValueBadges />

      {/* 9. Seller Spotlight / Platform Hero */}
      <PlatformHeroSection />

      {/* 10. Seller Process / Activities */}
      <PlatformProcessSection />

      {/* 11. Built For You / Features & Lucas Stylist */}
      <PlatformFeaturesSection />

      {/* 12. Communities */}
      <PlatformCommunitiesSection />

      {/* 13. Platform Newsletter */}
      <PlatformNewsletterSection />

      {/* 12. Complete Luxury Footer */}
      <HomeFooter />
    </div>
  );
}
