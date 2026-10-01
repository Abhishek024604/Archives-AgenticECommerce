import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/currency';
import { resolveMediaUrl } from '../utils/media';
import { addToCart } from '../api/cart';

/**
 * Deterministic Product Grid for Agent & Visual Copilot results.
 * Renders structured product data returned by the search_products tool.
 * Prevents LLM price and card hallucinations while maintaining rich luxury styling.
 */
export default function ProductGrid({ 
    products = [], 
    onProductClick,
    onAddToCartSuccess,
    className = "" 
}) {
    const navigate = useNavigate();
    const [addingMap, setAddingMap] = useState({});
    const [addedMap, setAddedMap] = useState({});

    if (!products || !Array.isArray(products) || products.length === 0) {
        return null;
    }

    const handleCardClick = (product, e) => {
        if (e) e.stopPropagation();
        const id = product._id || product.id;
        if (onProductClick) {
            onProductClick(product);
        } else if (id) {
            navigate(`/product/${id}`);
        }
    };

    const handleQuickAdd = async (product, e) => {
        if (e) e.stopPropagation();
        const id = product._id || product.id;
        if (!id) return;

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const chosenSize = product.availableSizes?.[0] || 'M';

        setAddingMap(prev => ({ ...prev, [id]: true }));
        try {
            await addToCart({ productId: id, quantity: 1, size: chosenSize });
            setAddedMap(prev => ({ ...prev, [id]: true }));
            if (onAddToCartSuccess) onAddToCartSuccess(product);
            setTimeout(() => {
                setAddedMap(prev => ({ ...prev, [id]: false }));
            }, 2500);
        } catch (error) {
            console.error('Quick add to cart failed:', error);
            alert(error?.response?.data?.message || 'Failed to add item to bag.');
        } finally {
            setAddingMap(prev => ({ ...prev, [id]: false }));
        }
    };

    return (
        <div className={`mt-3 w-full space-y-2 font-sans ${className}`}>
            {/* Header / Product Count Indicator */}
            <div className="flex items-center justify-between px-1 text-[11px] font-mono text-stone-400">
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-amber-400">grid_view</span>
                    <span className="text-stone-300 font-medium">Catalog Results ({products.length})</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-stone-500">Live Inventory</span>
            </div>

            {/* Horizontal Snap Strip / Responsive Product Cards */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 px-0.5 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent snap-x">
                {products.map((product, idx) => {
                    const id = product._id || product.id || `prod_${idx}`;
                    const imgUrl = resolveMediaUrl(product.image || product.images?.[0]);
                    const hasDiscount = product.discount && product.discount > 0;
                    const originalPrice = hasDiscount
                        ? Math.round((product.price * 100) / (100 - product.discount))
                        : null;
                    const isAdding = !!addingMap[id];
                    const isAdded = !!addedMap[id];

                    return (
                        <div
                            key={id}
                            data-agent-product={id}
                            onClick={(e) => handleCardClick(product, e)}
                            className="w-[170px] flex-shrink-0 snap-start bg-stone-900/90 border border-stone-800 hover:border-amber-400/50 rounded-xl overflow-hidden shadow-lg transition-all duration-200 group flex flex-col cursor-pointer"
                        >
                            {/* Product Image Container */}
                            <div className="relative aspect-[4/5] w-full bg-stone-950 overflow-hidden">
                                {imgUrl ? (
                                    <img
                                        src={imgUrl}
                                        alt={product.productName || 'Product'}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-stone-900 text-stone-600">
                                        <span className="material-symbols-outlined text-3xl">image</span>
                                    </div>
                                )}

                                {/* Top Left Badges (Discount / Category) */}
                                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                                    {hasDiscount && (
                                        <span className="bg-red-900/90 border border-red-700/80 text-white px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded">
                                            -{product.discount}%
                                        </span>
                                    )}
                                    {product.subCategory && (
                                        <span className="bg-stone-950/80 border border-stone-800 text-stone-300 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded">
                                            {product.subCategory}
                                        </span>
                                    )}
                                </div>

                                {/* Top Right Rating Badge */}
                                {product.rating > 0 && (
                                    <div className="absolute top-2 right-2 bg-stone-950/85 border border-stone-800 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-0.5 z-10">
                                        <span className="material-symbols-outlined text-[11px]">star</span>
                                        <span>{Number(product.rating).toFixed(1)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5 bg-stone-900">
                                <div>
                                    <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90 truncate">
                                        {product.brandName || 'Archivist'}
                                    </div>
                                    <div 
                                        className="text-xs font-medium text-stone-100 line-clamp-1 group-hover:text-amber-200 transition-colors"
                                        title={product.productName}
                                    >
                                        {product.productName || 'Untitled Item'}
                                    </div>
                                </div>

                                {/* Price block */}
                                <div className="flex items-baseline gap-1.5 pt-0.5">
                                    <span className="text-xs font-bold text-stone-100">
                                        {formatPrice(product.price)}
                                    </span>
                                    {originalPrice && (
                                        <span className="text-[10px] text-stone-500 line-through">
                                            {formatPrice(originalPrice)}
                                        </span>
                                    )}
                                </div>

                                {/* Size / Stock status */}
                                {product.availableSizes && product.availableSizes.length > 0 && (
                                    <div className="text-[9px] font-mono text-stone-400 truncate">
                                        Sizes: {product.availableSizes.join(', ')}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="pt-1.5 flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={(e) => handleCardClick(product, e)}
                                        className="flex-1 py-1 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-mono text-center transition-colors border border-stone-700/60"
                                    >
                                        View Item
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleQuickAdd(product, e)}
                                        disabled={isAdding || isAdded}
                                        title="Quick add to bag"
                                        className={`p-1 rounded-lg border text-[10px] flex items-center justify-center transition-colors ${
                                            isAdded
                                                ? 'bg-emerald-950 border-emerald-700 text-emerald-400'
                                                : 'bg-amber-400 hover:bg-amber-300 border-amber-300 text-stone-950 font-bold'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[14px]">
                                            {isAdding ? 'hourglass_top' : isAdded ? 'check' : 'add_shopping_cart'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
