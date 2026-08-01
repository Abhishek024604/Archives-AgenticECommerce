import Footer from "./components/layout/Footer";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Products from "./pages/Products";
import ProductPage from "./pages/ProductPage";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Communities from "./pages/Communities";
import AllCommunities from "./pages/AllCommunities";
import MyOrders from "./pages/MyOrders";
import Archives from "./pages/Archives";
import JournalVolumes from "./pages/JournalVolumes";
import BlogDetail from "./pages/BlogDetail";
import About from "./pages/About";
import SellerDashboard from "./seller/SellerDashboard";
import SellerOrders from "./seller/SellerOrders";
import SellerOrderDetail from "./seller/SellerOrderDetail";
import SellerCustomers from "./seller/SellerCustomers";
import SellerAnalytics from "./seller/SellerAnalytics";
import SellerPayouts from "./seller/SellerPayouts";
import SellerDiscounts from "./seller/SellerDiscounts";
import SellerReviews from "./seller/SellerReviews";
import AddProduct from "./seller/AddProduct";
import EditProduct from "./seller/EditProduct";
import MyProducts from "./seller/MyProducts";
import ProtectedRoute from "./components/ProtectedRoute";
import LucasSeller from "./components/LucasSeller";
import SellerDashboardButton from "./components/SellerDashboardButton";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-white text-stone-950">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductPage />} />

          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/communities/all" element={<AllCommunities />} />
          <Route path="/archives" element={<Archives />} />
          <Route path="/archives/volumes" element={<JournalVolumes />} />
          <Route path="/archives/:slug" element={<BlogDetail />} />
          <Route path="/about" element={<About />} />

          <Route path="/seller" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
          <Route path="/seller/orders" element={<ProtectedRoute><SellerOrders /></ProtectedRoute>} />
          <Route path="/seller/orders/:orderId" element={<ProtectedRoute><SellerOrderDetail /></ProtectedRoute>} />
          <Route path="/seller/customers" element={<ProtectedRoute><SellerCustomers /></ProtectedRoute>} />
          <Route path="/seller/analytics" element={<ProtectedRoute><SellerAnalytics /></ProtectedRoute>} />
          <Route path="/seller/payouts" element={<ProtectedRoute><SellerPayouts /></ProtectedRoute>} />
          <Route path="/seller/discounts" element={<ProtectedRoute><SellerDiscounts /></ProtectedRoute>} />
          <Route path="/seller/reviews" element={<ProtectedRoute><SellerReviews /></ProtectedRoute>} />
          <Route path="/seller/add" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
          <Route path="/seller/products/:id/edit" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
          <Route path="/seller/my-products" element={<ProtectedRoute><MyProducts /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <LucasSeller />
      <SellerDashboardButton />
    </div>
  );
}

