import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import SellerLayout from "./components/SellerLayout";

export default function MyProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  useEffect(() => {
    if (!user?._id || user.role !== "seller") return;

    let cancelled = false;

    const loadInventory = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get("/products");
        const mine = (res.data || []).filter((product) => {
          const sellerId = typeof product.seller === "string" ? product.seller : product.seller?._id;
          return sellerId === user._id;
        });

        if (!cancelled) setProducts(mine);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load inventory");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadInventory();

    return () => {
      cancelled = true;
    };
  }, [user?._id, user?.role]);

  const { totalProducts, totalUnits, lowStockCount, outOfStockCount, inventoryData } = useMemo(() => {
    let tProducts = 0;
    let tUnits = 0;
    let lStock = 0;
    let oStock = 0;

    const processedData = products.map((product) => {
      tProducts++;
      const variants = product.variants || [];
      const totalStock = variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);
      
      tUnits += totalStock;

      let status = "In Stock";
      let statusColor = "bg-green-100 text-green-700";

      if (totalStock === 0) {
        status = "Out of Stock";
        statusColor = "bg-red-100 text-red-700";
        oStock++;
      } else if (totalStock <= 5) {
        status = "Low Stock";
        statusColor = "bg-orange-100 text-orange-700";
        lStock++;
      }

      return {
        ...product,
        totalStock,
        status,
        statusColor,
        variantCount: variants.length,
      };
    });

    return { totalProducts: tProducts, totalUnits: tUnits, lowStockCount: lStock, outOfStockCount: oStock, inventoryData: processedData };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return inventoryData.filter(p => 
      p.productName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventoryData, searchQuery]);

  const currentProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

  return (
    <SellerLayout activeTab="inventory">
      {/* Header */}
      <header className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline text-4xl font-bold leading-tight tracking-tight text-stone-950 md:text-5xl">
            Inventory
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            Track and manage your stock across all products and variants.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-5 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-black">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Inventory
          </button>
          <Link
            to="/seller/add"
            className="flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-[11px] font-bold text-stone-700 transition-colors hover:bg-stone-50"
          >
            Add New Product
            <span className="material-symbols-outlined text-sm">add</span>
          </Link>
        </div>
      </header>

      {/* Metrics Row */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon="layers"
          title="TOTAL PRODUCTS"
          value={totalProducts}
          hint="Across all collections"
          actionLabel="View products"
        />
        <MetricCard
          icon="layers"
          title="TOTAL UNITS IN STOCK"
          value={totalUnits.toLocaleString()}
          hint="Across all variants"
          actionLabel="View stock"
        />
        <MetricCard
          icon="error"
          title="LOW STOCK ITEMS"
          value={lowStockCount}
          hint="Needs your attention"
          actionLabel="View low stock"
          valueColor="text-orange-500"
          iconColor="text-orange-500"
          iconBg="bg-orange-50 border-orange-100"
        />
        <MetricCard
          icon="close"
          title="OUT OF STOCK ITEMS"
          value={outOfStockCount}
          hint="Currently unavailable"
          actionLabel="View out of stock"
          valueColor="text-red-500"
          iconColor="text-red-500"
          iconBg="bg-red-50 border-red-100"
        />
      </section>

      {/* Data Table Section */}
      <section className="rounded-2xl border border-stone-200 bg-white">
        {/* Filters Row */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-stone-200 p-4 md:flex-row">
          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 focus-within:border-stone-950 focus-within:bg-white md:w-64">
              <span className="material-symbols-outlined text-stone-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search by product, category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent text-xs text-stone-950 outline-none placeholder:text-stone-400"
              />
            </div>
            <FilterSelect label="Category" />
            <FilterSelect label="Status" />
            <FilterSelect label="Stock Status" />
            <button className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              More Filters
            </button>
          </div>
          
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-stone-300 bg-stone-50 p-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-stone-950 shadow-sm border border-stone-200">
              <span className="material-symbols-outlined text-sm">grid_view</span>
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-stone-400 hover:text-stone-950">
              <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50/50">
                <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-stone-300 text-stone-900 focus:ring-stone-900" /></th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-stone-400">Loading inventory...</td>
                </tr>
              ) : currentProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-stone-400">No products found.</td>
                </tr>
              ) : (
                currentProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-stone-300 text-stone-900 focus:ring-stone-900" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-stone-100 border border-stone-200">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.productName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-stone-300">
                              <span className="material-symbols-outlined text-lg">image</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-950">{product.productName}</p>
                          <p className="mt-0.5 text-[10px] text-stone-500">{product.variantCount} Variants</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-stone-600">{product.category}</td>
                    <td className="px-6 py-4 text-xs font-medium text-stone-950">{formatPrice(product.price)}</td>
                    <td className="px-6 py-4 text-xs font-medium text-stone-600">{product.totalStock} units</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${product.statusColor}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-stone-400">
                        <Link to={`/seller/products/${product._id}/edit`} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-stone-100 hover:text-stone-950 transition-colors" title="Edit Product">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </Link>
                        <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-stone-100 hover:text-stone-950 transition-colors" title="More Actions">
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filteredProducts.length > 0 && (
          <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4">
            <p className="text-xs text-stone-500">
              Showing {(currentPage - 1) * productsPerPage + 1} to {Math.min(currentPage * productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
            </p>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-50 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                const pageNum = idx + 1; // Simplistic pagination display for now
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold ${
                      currentPage === pageNum ? "bg-[#EFE9E0] text-stone-950 border border-[#E5DFD6]" : "text-stone-500 hover:bg-stone-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              
              {totalPages > 5 && <span className="px-2 text-xs text-stone-400">...</span>}
              {totalPages > 5 && (
                <button 
                  onClick={() => setCurrentPage(totalPages)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold ${
                    currentPage === totalPages ? "bg-[#EFE9E0] text-stone-950 border border-[#E5DFD6]" : "text-stone-500 hover:bg-stone-50"
                  }`}
                >
                  {totalPages}
                </button>
              )}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-50 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </SellerLayout>
  );
}

function MetricCard({ icon, title, value, hint, actionLabel, valueColor = "text-stone-950", iconColor = "text-stone-500", iconBg = "bg-stone-50 border-stone-100" }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full border ${iconBg} ${iconColor}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <p className={`text-[9px] font-bold uppercase tracking-widest ${valueColor !== "text-stone-950" ? valueColor : "text-stone-500"}`}>{title}</p>
        <p className={`mt-1 font-headline text-3xl font-bold ${valueColor}`}>{value}</p>
        <p className="mt-2 text-[11px] text-stone-500">{hint}</p>
      </div>
      <div className="mt-6 pt-4 border-t border-stone-100">
        <Link to="#" className="flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-950">
          {actionLabel} <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}

function FilterSelect({ label }) {
  return (
    <button className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50">
      {label}
      <span className="material-symbols-outlined text-sm text-stone-400">expand_more</span>
    </button>
  );
}
