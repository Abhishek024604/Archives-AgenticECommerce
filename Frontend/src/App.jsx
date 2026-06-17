import Footer from "./components/layout/Footer";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Products from "./pages/Products";
import ProductPage from "./pages/ProductPage";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Communities from "./pages/Communities";
import MyOrders from "./pages/MyOrders";
import Archives from "./pages/Archives";
import JournalVolumes from "./pages/JournalVolumes";
import BlogDetail from "./pages/BlogDetail";
import About from "./pages/About";
import SellerDashboard from "./seller/SellerDashboard";
import AddProduct from "./seller/AddProduct";
import EditProduct from "./seller/EditProduct";
import MyProducts from "./seller/MyProducts";
import ProtectedRoute from "./components/ProtectedRoute";
import LucasSeller from "./components/LucasSeller";

export default function App() {
  const location = useLocation();
  const hideNavbar =
    location.pathname === "/signup" ||
    location.pathname === "/" ||
    location.pathname === "/about";

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-surface text-on-background">
      {!hideNavbar && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductPage />} />

          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/archives" element={<Archives />} />
          <Route path="/archives/volumes" element={<JournalVolumes />} />
          <Route path="/archives/:slug" element={<BlogDetail />} />
          <Route path="/about" element={<About />} />

          <Route path="/seller" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
          <Route path="/seller/add" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
          <Route path="/seller/products/:id/edit" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
          <Route path="/seller/my-products" element={<ProtectedRoute><MyProducts /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <Footer />
      <LucasSeller />
    </div>
  );
}
