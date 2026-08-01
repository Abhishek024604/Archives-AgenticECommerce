import { Link } from "react-router-dom";

export default function HomeFooter() {
  return (
    <footer className="bg-[#0A0A09] text-stone-300 pt-12 pb-8 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main 5-Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 pb-12 border-b border-stone-800">
          
          {/* Brand Info & Socials */}
          <div className="col-span-2">
            <Link to="/" className="font-headline text-2xl tracking-[0.22em] font-normal uppercase text-white">
              ARCHIVIST
            </Link>
            <p className="mt-3 text-xs text-stone-400 font-light max-w-xs">
              Curated. Conscious. Timeless.
            </p>

            <div className="mt-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-3">
                Stay Connected
              </span>
              <div className="flex items-center gap-4 text-stone-400">
                <a href="#instagram" aria-label="Instagram" className="hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">photo_camera</span>
                </a>
                <a href="#facebook" aria-label="Facebook" className="hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">public</span>
                </a>
                <a href="#pinterest" aria-label="Pinterest" className="hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">push_pin</span>
                </a>
                <a href="#youtube" aria-label="YouTube" className="hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">smart_display</span>
                </a>
                <a href="#email" aria-label="Email" className="hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">mail</span>
                </a>
              </div>
            </div>
          </div>

          {/* SHOP */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-4">
              Shop
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <Link to="/products" className="hover:text-white transition-colors">All Products</Link>
              </li>
              <li>
                <Link to="/products?filter=new" className="hover:text-white transition-colors">New Arrivals</Link>
              </li>
              <li>
                <Link to="/products?filter=bestsellers" className="hover:text-white transition-colors">Best Sellers</Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors">Gift Cards</Link>
              </li>
            </ul>
          </div>

          {/* CUSTOMER CARE */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">Shipping & Returns</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">FAQs</Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors">Size Guide</Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">Track Order</Link>
              </li>
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">About</Link>
              </li>
              <li>
                <Link to="/archives" className="hover:text-white transition-colors">Journal</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">Careers</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">Contact</Link>
              </li>
            </ul>
          </div>

          {/* MORE */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-4">
              More
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <Link to="/seller" className="hover:text-white transition-colors">Become a Seller</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">Affiliate Program</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">Store Locator</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] uppercase tracking-[0.16em] text-stone-500 gap-4">
          <p>© 2026 ARCHIVIST. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-6">
            <Link to="/about" className="hover:text-stone-300 transition-colors">Privacy Policy</Link>
            <Link to="/about" className="hover:text-stone-300 transition-colors">Terms of Service</Link>
            <span className="flex items-center gap-1 text-stone-400">
              India (INR ₹)
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
