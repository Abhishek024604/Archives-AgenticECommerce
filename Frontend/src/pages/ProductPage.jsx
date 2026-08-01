import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { API } from "../api/axios";
import { addToCart } from "../api/cart";
import { formatPrice } from "../utils/currency";
import { resolveMediaUrl } from "../utils/media";
import AnnouncementBar from "../components/home/AnnouncementBar";
import HomeNavbar from "../components/home/HomeNavbar";
import HomeFooter from "../components/home/HomeFooter";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [p, setP] = useState(null);
  const [selectedImg, setSelectedImg] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  
  const { wishlist, toggleWishlist } = useWishlist();
  
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [res, reviewsRes] = await Promise.all([
          API.get(`/products/${id}`),
          API.get(`/reviews/product/${id}`).catch(() => ({ data: [] }))
        ]);
        
        setP(res.data);
        setSelectedImg(res.data?.images?.[0] || "");
        setSize(res.data?.variants?.[0]?.size || "");
        
        setReviews(reviewsRes.data || []);
        
        if (user) {
          API.get(`/reviews/can-review/${id}`).then(res => setCanReview(res.data.canReview)).catch(() => setCanReview(false));
        }
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load product details.");
      }
    })();
  }, [id, user]);

  const onAdd = async () => {
    if (!user) {
        navigate("/login");
        return;
    }
    try {
      await addToCart({ productId: p._id, quantity: qty, size });
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to add to bag.");
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    await toggleWishlist(id);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setSubmittingReview(true);
      setReviewError("");
      const res = await API.post("/reviews", {
        product: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      setReviewSuccess(true);
      setReviews([res.data, ...reviews]);
      setCanReview(false);
    } catch (e) {
      setReviewError(e?.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white text-stone-900 font-sans flex flex-col justify-between">
        <AnnouncementBar />
        <HomeNavbar />
        <div className="py-20 text-center text-sm font-medium text-red-600">
          {error}
        </div>
        <HomeFooter />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="min-h-screen bg-white text-stone-900 font-sans flex flex-col justify-between">
        <AnnouncementBar />
        <HomeNavbar />
        <div className="py-20 text-center text-xs font-medium text-stone-500">
          Loading product details...
        </div>
        <HomeFooter />
      </div>
    );
  }

  const allImages = p.images?.length > 0 ? p.images : [
    "/assets/clean_hero4.png"
  ];

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-stone-900 selection:text-white flex flex-col justify-between">
      <AnnouncementBar />
      <HomeNavbar />

      <main className="mx-auto max-w-[1536px] w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[11px] font-medium text-stone-500 uppercase tracking-wider flex-wrap">
          <Link to="/" className="hover:text-stone-900 transition-colors">
            Home
          </Link>
          <span>›</span>
          <Link to="/products" className="hover:text-stone-900 transition-colors">
            Products
          </Link>
          {p.category && (
            <>
              <span>›</span>
              <Link
                to={`/products?category=${p.category}`}
                className="hover:text-stone-900 transition-colors"
              >
                {p.category}
              </Link>
            </>
          )}
          <span>›</span>
          <span className="text-stone-900 font-semibold truncate max-w-xs">{p.productName}</span>
        </nav>

        {/* Product Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Image Gallery */}
          <section className="lg:col-span-5 max-w-md w-full mx-auto lg:mx-0 space-y-4">
            {/* Main Hero Image */}
            <div className="aspect-[4/5] max-h-[520px] w-full overflow-hidden rounded-2xl bg-[#F5F4F0] border border-stone-200 shadow-2xs relative">
              <img
                src={resolveMediaUrl(selectedImg || allImages[0])}
                alt={p.productName}
                className="h-full w-full object-cover object-top transition-all duration-300"
              />
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImg(img)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      (selectedImg || allImages[0]) === img
                        ? "border-stone-950 shadow-xs"
                        : "border-stone-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={resolveMediaUrl(img)}
                      alt={`${p.productName} view ${idx + 1}`}
                      className="h-full w-full object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Right Column: Product Info & Actions */}
          <section className="lg:col-span-7 lg:sticky lg:top-28 space-y-6">
            
            {/* Brand & Category Badge */}
            <div className="border-b border-stone-200 pb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-stone-900 text-white px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-xs">
                  {p.brandName || "ARCHIVIST"}
                </span>
                {p.category && (
                  <span className="bg-stone-100 text-stone-700 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-xs">
                    {p.category}
                  </span>
                )}
              </div>

              <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight text-stone-950 mt-2">
                {p.productName}
              </h1>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-stone-950">
                  {formatPrice(p.price)}
                </span>
                <span className="text-xs text-stone-400 font-light">Taxes included</span>
              </div>
            </div>

            {/* Description Subtext */}
            <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
              {p.description || "Crafted for longevity by premier artisans. Curated with archival care."}
            </p>

            {/* Size Selector */}
            {p.variants?.length > 0 && p.variants.some(v => v.size?.trim() !== "") && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-stone-900">
                    Select Size
                  </span>
                  <button
                    type="button"
                    onClick={() => alert("Standard European sizing. Fits true to size.")}
                    className="text-stone-500 hover:text-stone-950 underline text-[11px]"
                  >
                    Size Guide
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {p.variants.map((v, i) => v.size?.trim() !== "" ? (
                    <button
                      key={v.size || i}
                      type="button"
                      onClick={() => setSize(v.size)}
                      className={`py-3 text-xs font-semibold rounded-lg border transition-all ${
                        size === v.size
                          ? "border-stone-950 bg-stone-950 text-white shadow-xs"
                          : "border-stone-200 bg-white text-stone-800 hover:border-stone-400"
                      }`}
                    >
                      {v.size}
                    </button>
                  ) : null)}
                </div>
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="space-y-3 pt-4 border-t border-stone-200">
              {added && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 text-xs rounded-md text-center font-medium">
                  ✓ Added to your Shopping Bag!
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Quantity Controls */}
                <div className="flex items-center gap-3 border border-stone-300 bg-stone-50 px-4 py-3 rounded-lg text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="text-stone-600 hover:text-stone-950 font-bold px-1"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-stone-950">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(qty + 1)}
                    className="text-stone-600 hover:text-stone-950 font-bold px-1"
                  >
                    +
                  </button>
                </div>

                {/* Add to Bag CTA */}
                <button
                  type="button"
                  onClick={onAdd}
                  className="flex-1 bg-stone-950 text-white py-3.5 px-6 text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-colors rounded-lg shadow-sm"
                >
                  Add to Bag
                </button>

                {/* Wishlist Toggle */}
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className={`flex items-center justify-center h-[46px] w-[46px] rounded-lg border transition-colors ${
                    wishlist?.some(w => w._id === id) ? "border-red-500 text-red-500 bg-red-50" : "border-stone-300 text-stone-500 hover:text-stone-900 bg-white"
                  }`}
                  aria-label="Wishlist"
                >
                  <span className={`material-symbols-outlined text-xl ${wishlist?.some(w => w._id === id) ? "font-variation-settings-'FILL'1" : ""}`}>
                    favorite
                  </span>
                </button>
              </div>
            </div>

            {/* Accordion Detail Sections */}
            <div className="pt-4 border-t border-stone-200 divide-y divide-stone-200 text-xs">
              <AccordionItem title="Shipping & Returns">
                Complimentary express shipping on all orders above ₹4,999. 14-day hassle-free archival returns.
              </AccordionItem>
              <AccordionItem title="Details & Composition">
                100% Premium organic material. Quality checked by our in-house atelier.
              </AccordionItem>
              <AccordionItem title="Authenticity Guarantee">
                All garments on ARCHIVIST are 100% verified for brand authenticity before dispatch.
              </AccordionItem>
            </div>

            {/* Reviews Section */}
            <div className="pt-8 border-t border-stone-200 mt-8">
              <h2 className="font-headline text-2xl font-normal text-stone-900 mb-6">Ratings & Reviews</h2>
              
              {reviews.length === 0 ? (
                <div className="flex flex-col items-center gap-2 mb-8 bg-stone-50 p-6 rounded-lg border border-stone-100 text-center">
                  <p className="text-sm font-medium text-stone-700">no one has rated this product until now</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 bg-stone-50 p-6 rounded-lg border border-stone-100">
                  <div className="text-center sm:pr-6 sm:border-r border-stone-200 w-full sm:w-auto pb-4 sm:pb-0">
                    <div className="text-4xl font-headline font-bold text-stone-950">
                      {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                    </div>
                    <div className="flex text-stone-900 my-1 text-sm justify-center gap-0.5">
                      {"★".repeat(Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length))}
                      {"☆".repeat(5 - Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length))}
                    </div>
                    <div className="text-[10px] text-stone-500 uppercase tracking-widest">{reviews.length} Verified Ratings</div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs text-stone-600 font-light leading-relaxed">
                      Customer reviews and ratings help you make the right choice. Verified buyers can share their experience below to help the community.
                    </p>
                  </div>
                </div>
              )}

              {/* Review Section Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-10 border-t border-stone-200 pt-10">
                
                {/* Write a Review Form - ONLY SHOWN IF PURCHASED */}
                {canReview && (
                  <div className="bg-stone-50 p-6 rounded-lg border border-stone-200 order-2 md:order-1">
                    <h3 className="font-headline text-lg font-bold text-stone-950 mb-4">
                      {reviewSuccess ? "Review Submitted" : "Write a Review"}
                    </h3>
                    
                    {reviewSuccess ? (
                      <div className="text-emerald-800 text-xs font-medium">Thank you for your feedback!</div>
                    ) : (
                      <>
                        {reviewError && <div className="mb-4 text-xs text-red-600">{reviewError}</div>}
                        <div className="mb-4">
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Rating</label>
                          <div className="flex gap-1 text-2xl text-stone-300">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                className={`focus:outline-none transition-colors ${star <= reviewForm.rating ? "text-amber-400" : "hover:text-amber-200"}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Your Review</label>
                          <textarea
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            rows="4"
                            className="w-full bg-white border border-stone-300 rounded-md p-3 text-sm focus:border-stone-900 focus:outline-none"
                            placeholder="Share your thoughts about this product..."
                          />
                        </div>
                        <button
                          onClick={submitReview}
                          disabled={submittingReview || !reviewForm.comment.trim()}
                          className="w-full bg-stone-950 text-white font-bold py-3 text-xs uppercase tracking-[0.16em] rounded transition-colors hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingReview ? "Submitting..." : "Submit Review"}
                        </button>
                      </>
                    )}
                  </div>
                )}

              {/* Review List */}
              <div className={`space-y-6 ${!canReview ? "col-span-1 md:col-span-2" : "order-1 md:order-2"}`}>
                {reviews.length === 0 ? (
                  <div className="text-center py-10 bg-stone-50 rounded-lg border border-stone-100">
                    <span className="material-symbols-outlined text-4xl text-stone-300 mb-2">forum</span>
                    <p className="text-sm text-stone-500">No reviews yet. Be the first to review this product!</p>
                  </div>
                ) : (
                  reviews.map(review => (
                    <div key={review._id} className="border-b border-stone-100 pb-6 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold text-xs uppercase">
                            {review.customer?.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900 flex items-center gap-2">
                              {review.customer?.name || "User"}
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Verified Buyer</span>
                            </p>
                            <div className="flex text-stone-900 text-[10px] mt-0.5 gap-0.5">
                              {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-stone-400 font-medium">{new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className="text-xs text-stone-600 mt-3 ml-12 font-light leading-relaxed">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            </div>
          </section>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}

function AccordionItem({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-3.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left font-bold text-stone-900 uppercase tracking-wider text-[11px]"
      >
        <span>{title}</span>
        <span className="material-symbols-outlined text-base">
          {open ? "remove" : "add"}
        </span>
      </button>
      {open && (
        <p className="mt-2 text-stone-600 font-light text-xs leading-relaxed">
          {children}
        </p>
      )}
    </div>
  );
}
