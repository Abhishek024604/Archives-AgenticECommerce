import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SellerLayout from "./components/SellerLayout";
import { getSellerReviews, updateReviewStatus } from "../api/review";

export default function SellerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getSellerReviews();
        setReviews(data);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Calculate metrics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : "0.0";
  const positiveReviews = reviews.filter(r => r.rating >= 4).length;
  const neutralReviews = reviews.filter(r => r.rating === 3).length;
  const negativeReviews = reviews.filter(r => r.rating <= 2).length;

  const positivePercent = totalReviews > 0 ? ((positiveReviews / totalReviews) * 100).toFixed(1) : "0";
  const neutralPercent = totalReviews > 0 ? ((neutralReviews / totalReviews) * 100).toFixed(1) : "0";
  const negativePercent = totalReviews > 0 ? ((negativeReviews / totalReviews) * 100).toFixed(1) : "0";

  // Ratings distribution
  const ratingsCount = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => ratingsCount[r.rating] = (ratingsCount[r.rating] || 0) + 1);

  const getStatusBadge = (status) => {
    switch(status) {
      case "Published": return "bg-green-50 text-green-700 border-green-200";
      case "Pending": return "bg-orange-50 text-orange-700 border-orange-200";
      case "Hidden": return "bg-stone-100 text-stone-500 border-stone-200";
      default: return "bg-stone-50 text-stone-600";
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateReviewStatus(id, newStatus);
      setReviews(reviews.map(r => r._id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <SellerLayout activeTab="reviews">
      {/* Header */}
      <header className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline text-4xl font-bold leading-tight tracking-tight text-stone-950 md:text-5xl">
            Reviews
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            Manage product reviews and customer feedback<br/>to build trust and improve your store.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-5 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-black">
            <span className="material-symbols-outlined text-sm">send</span>
            Request Review
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-5 py-2.5 text-[11px] font-bold text-stone-950 transition-colors hover:bg-stone-50">
            Review Settings
            <span className="material-symbols-outlined text-sm">settings</span>
          </button>
        </div>
      </header>

      {/* Top Metrics Row */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {/* Average Rating */}
        <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-stone-100 bg-yellow-50 text-yellow-600">
              <span className="material-symbols-outlined text-[18px]">star</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">AVERAGE RATING</p>
            <div className="mt-1 flex items-baseline gap-1">
              <p className="font-headline text-3xl font-bold text-stone-950">{averageRating}</p>
              <p className="text-sm font-bold text-stone-400">/ 5</p>
            </div>
            <div className="mt-2 flex gap-1 text-yellow-400">
              {[1,2,3,4,5].map(star => (
                <span key={star} className={`material-symbols-outlined text-[16px] ${star <= Math.round(averageRating) ? 'filled-icon text-yellow-400' : 'text-stone-200'}`}>star</span>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-stone-500">Based on {totalReviews} reviews</p>
          </div>
          <div className="mt-6 pt-4 border-t border-stone-100">
            <Link to="#" className="flex items-center gap-1 text-[11px] font-bold hover:underline text-stone-950">
              View rating trends <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Total Reviews */}
        <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-stone-100 bg-stone-50 text-stone-500">
              <span className="material-symbols-outlined text-[18px]">chat</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">TOTAL REVIEWS</p>
            <p className="mt-1 font-headline text-3xl font-bold text-stone-950">{totalReviews}</p>
            <p className="mt-1 text-[11px] text-stone-500">All time</p>
          </div>
          <div className="mt-6 pt-4 border-t border-stone-100">
            <Link to="#" className="flex items-center gap-1 text-[11px] font-bold hover:underline text-stone-950">
              View all reviews <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Positive Reviews */}
        <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-stone-100 bg-green-50 text-green-600">
              <span className="material-symbols-outlined text-[18px]">thumb_up</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">POSITIVE REVIEWS</p>
            <p className="mt-1 font-headline text-3xl font-bold text-stone-950">{positiveReviews}</p>
            <p className="mt-1 text-[11px] text-stone-950 font-bold">{positivePercent}% <span className="text-stone-500 font-normal">of total</span></p>
          </div>
          <div className="mt-6 pt-4 border-t border-stone-100">
            <Link to="#" className="flex items-center gap-1 text-[11px] font-bold hover:underline text-blue-600">
              View positive <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Neutral Reviews */}
        <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-stone-100 bg-orange-50 text-orange-500">
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">NEUTRAL REVIEWS</p>
            <p className="mt-1 font-headline text-3xl font-bold text-stone-950">{neutralReviews}</p>
            <p className="mt-1 text-[11px] text-stone-950 font-bold">{neutralPercent}% <span className="text-stone-500 font-normal">of total</span></p>
          </div>
          <div className="mt-6 pt-4 border-t border-stone-100">
            <Link to="#" className="flex items-center gap-1 text-[11px] font-bold hover:underline text-orange-500">
              View neutral <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Negative Reviews */}
        <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-stone-100 bg-red-50 text-red-500">
              <span className="material-symbols-outlined text-[18px]">thumb_down</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">NEGATIVE REVIEWS</p>
            <p className="mt-1 font-headline text-3xl font-bold text-stone-950">{negativeReviews}</p>
            <p className="mt-1 text-[11px] text-stone-950 font-bold">{negativePercent}% <span className="text-stone-500 font-normal">of total</span></p>
          </div>
          <div className="mt-6 pt-4 border-t border-stone-100">
            <Link to="#" className="flex items-center gap-1 text-[11px] font-bold hover:underline text-red-500">
              View negative <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Middle Section: Overview */}
      <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-1">
        {/* Rating Overview */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-[15px] font-bold text-stone-950">Rating Overview</h3>
          </div>
          
          <div className="mb-4 flex items-center gap-3">
            <p className="font-headline text-3xl font-bold text-stone-950">{averageRating}</p>
          </div>

          <div className="flex-1 space-y-2 text-[10px]">
             <p className="text-[10px] text-stone-500 mb-3">Ratings distribution</p>
             {[5,4,3,2,1].map(star => {
                 const count = ratingsCount[star];
                 const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                 return (
                    <div key={star} className="flex items-center gap-2">
                        <span className="w-4 font-bold text-stone-600 flex items-center">{star} <span className="material-symbols-outlined text-[10px] filled-icon ml-0.5">star</span></span>
                        <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                            <div className="h-full bg-[#B4966E] rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="w-16 text-right font-medium text-stone-950">{count} <span className="text-stone-400 font-normal">({pct.toFixed(1)}%)</span></span>
                    </div>
                 )
             })}
          </div>
        </div>
      </section>

      {/* Data Table Section */}
      <section className="mb-8 rounded-2xl border border-stone-200 bg-white">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-stone-200 p-4 lg:flex-row">
          <div className="relative w-full max-w-xs">
            <input 
              type="text" 
              placeholder="Search reviews..." 
              className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-4 text-xs focus:border-[#B4966E] focus:outline-none focus:ring-1 focus:ring-[#B4966E]"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-stone-400">search</span>
          </div>
          <div className="flex w-full items-center gap-3 lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            <FilterSelect label="Rating" />
            <FilterSelect label="Status" />
            <FilterSelect label="Product" />
            <FilterSelect label="Has Media" />
            <button className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 ml-2">
                <span className="material-symbols-outlined text-[16px]">filter_list</span>
                More Filters
            </button>
            <div className="ml-auto flex items-center gap-1 border-l border-stone-200 pl-3">
              <button className="flex h-8 w-8 items-center justify-center rounded bg-stone-100 text-stone-950">
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded text-stone-400 hover:bg-stone-50">
                <span className="material-symbols-outlined text-[18px]">list</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 pt-4 text-xs font-bold text-stone-500 border-b border-stone-100">
            <button className="flex items-center gap-1.5 pb-3 border-b-2 border-stone-950 text-stone-950">
                 <span className="material-symbols-outlined text-[16px]">all_inbox</span> All Reviews ({totalReviews})
            </button>
            <button className="flex items-center gap-1.5 pb-3 border-b-2 border-transparent hover:text-stone-700">
                 <span className="material-symbols-outlined text-[16px]">pending</span> Pending (1)
            </button>
            <button className="flex items-center gap-1.5 pb-3 border-b-2 border-transparent hover:text-stone-700">
                 <span className="material-symbols-outlined text-[16px]">task_alt</span> Published ({reviews.filter(r=>r.status==='Published').length})
            </button>
            <button className="flex items-center gap-1.5 pb-3 border-b-2 border-transparent hover:text-stone-700">
                 <span className="material-symbols-outlined text-[16px]">visibility_off</span> Hidden ({reviews.filter(r=>r.status==='Hidden').length})
            </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-8 text-center text-stone-500 text-sm">Loading reviews...</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                <tr className="border-b border-stone-100 text-[9px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50/50">
                    <th className="px-6 py-4 w-10"><input type="checkbox" className="rounded border-stone-300 text-[#B4966E] focus:ring-[#B4966E] w-3 h-3" /></th>
                    <th className="px-4 py-4 w-[400px]">REVIEW</th>
                    <th className="px-4 py-4">PRODUCT</th>
                    <th className="px-4 py-4">RATING</th>
                    <th className="px-4 py-4">CUSTOMER</th>
                    <th className="px-4 py-4">DATE</th>
                    <th className="px-4 py-4">STATUS</th>
                    <th className="px-6 py-4 text-center">ACTION</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                {reviews.map((review) => (
                    <tr key={review._id} className="hover:bg-stone-50/50 transition-colors align-top">
                        <td className="px-6 py-4"><input type="checkbox" className="rounded border-stone-300 text-[#B4966E] focus:ring-[#B4966E] w-3 h-3" /></td>
                        
                        {/* Review Content */}
                        <td className="px-4 py-4 whitespace-normal">
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-600 text-[11px] font-bold">
                                    {review.customer?.name ? review.customer.name.substring(0, 2).toUpperCase() : 'US'}
                                </div>
                                <div className="max-w-xs">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-[11px] font-bold text-stone-950">{review.customer?.name || 'Unknown User'}</p>
                                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[8px] font-bold text-green-700 bg-green-50 border border-green-200">
                                            Verified Buyer
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-stone-600 leading-relaxed mb-2">{review.comment}</p>
                                    {review.media && review.media.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            {review.media.map((img, i) => (
                                                <img key={i} src={img} alt="review media" className="w-10 h-10 object-cover rounded-md border border-stone-200" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </td>

                        {/* Product */}
                        <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 shrink-0 rounded-md bg-stone-100 overflow-hidden border border-stone-200">
                                    {review.product?.images?.[0] ? (
                                        <img src={review.product.images[0]} alt={review.product.productName} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center"><span className="material-symbols-outlined text-[16px] text-stone-400">image</span></div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-stone-950 truncate max-w-[120px]">{review.product?.productName || 'Deleted Product'}</p>
                                    <p className="text-[9px] text-stone-500">ID: {review.product?._id.toString().slice(-6)}</p>
                                </div>
                            </div>
                        </td>

                        {/* Rating */}
                        <td className="px-4 py-4">
                            <div className="flex gap-0.5 text-yellow-400">
                                {[1,2,3,4,5].map(star => (
                                    <span key={star} className={`material-symbols-outlined text-[14px] ${star <= review.rating ? 'filled-icon text-yellow-400' : 'text-stone-200'}`}>star</span>
                                ))}
                            </div>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-4">
                            <p className="text-[11px] font-bold text-stone-950">#{review.customer?._id.toString().slice(-6).toUpperCase()}</p>
                            <p className="text-[9px] text-stone-500">1 order</p>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-4 text-[11px] text-stone-600">
                            {formatDate(review.createdAt)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-bold ${getStatusBadge(review.status)}`}>
                                {review.status}
                            </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                                <button className="rounded border border-stone-300 px-3 py-1 text-[10px] font-bold text-stone-950 hover:bg-stone-50">
                                    Reply
                                </button>
                                <div className="relative group">
                                    <button className="text-stone-400 hover:text-stone-950 transition-colors">
                                        <span className="material-symbols-outlined text-[16px]">more_vert</span>
                                    </button>
                                    {/* Action Dropdown Mock */}
                                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block w-32 rounded-md border border-stone-200 bg-white shadow-lg z-10 py-1">
                                        <button onClick={() => handleStatusChange(review._id, "Published")} className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-stone-50">Publish</button>
                                        <button onClick={() => handleStatusChange(review._id, "Hidden")} className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-stone-50 text-orange-600">Hide</button>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4">
          <p className="text-xs text-stone-500">
            Showing 1 to {totalReviews} of {totalReviews} reviews
          </p>
          <div className="flex items-center gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-stone-300 disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md bg-[#EFE9E0] text-xs font-bold text-stone-950 border border-[#E5DFD6]">1</button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-stone-300 disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Bottom Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-[#EFE9E0] flex items-center shadow-sm">
        <div className="p-8 md:p-10 w-full max-w-lg z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm mb-6">
            <span className="material-symbols-outlined text-2xl">mail</span>
          </div>
          <h4 className="font-headline text-xl font-bold text-stone-950">Collect more reviews</h4>
          <p className="mt-3 text-sm text-stone-600 leading-relaxed max-w-sm">
            Send automated review requests to recent customers and grow your ratings.
          </p>
          <Link to="#" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-stone-950 hover:underline">
            Send review requests <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-90 hidden md:block">
          <img src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80" alt="Review Box" className="h-full w-full object-cover opacity-60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#EFE9E0] to-transparent"></div>
        </div>
      </section>
    </SellerLayout>
  );
}

function FilterSelect({ label, icon = "expand_more" }) {
  return (
    <button className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50">
      {label}
      <span className="material-symbols-outlined text-sm text-stone-400">{icon}</span>
    </button>
  );
}

function HighlightItem({ icon, title, desc, mentions }) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600">
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
            </div>
            <div>
                <p className="text-[11px] font-bold text-stone-950 mb-0.5">{title}</p>
                <p className="text-[10px] text-stone-500 mb-1">{desc}</p>
                <p className="text-[9px] font-bold text-[#B4966E]">{mentions}</p>
            </div>
        </div>
    );
}

function CategoryRating({ name, score }) {
    return (
        <div className="flex items-center justify-between">
            <p className="text-[11px] text-stone-600">{name}</p>
            <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-stone-950">{score}</span>
                <span className="material-symbols-outlined text-[12px] filled-icon text-yellow-400">star</span>
            </div>
        </div>
    );
}
