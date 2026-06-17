// src/seller/SellerLayout.jsx
import { Link } from "react-router-dom";

export default function SellerLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-surface text-on-background">

      {/* Sidebar */}
      <div className="w-64 border-r border-outline-variant/20 bg-surface-container-lowest p-6">
        <h2 className="text-lg font-semibold mb-6">Seller Panel</h2>

        <div className="flex flex-col gap-4 text-sm">
          <Link to="/seller">My Products</Link>
          <Link to="/seller/add">Add Product</Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-background p-8">
        {children}
      </div>
    </div>
  );
}
