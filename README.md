# ARCHIVIST

**ARCHIVIST** is a premium, high-end luxury lifestyle and e-commerce platform designed for discerning customers who value high-quality craftsmanship in fashion, accessories, and curated design culture. 

Far beyond a traditional storefront, ARCHIVIST integrates a curated retail experience with a rich editorial journal, an interactive social community layer, and a fully functional multi-vendor seller portal.

## 🌟 Core Features

### 🛍️ The Storefront
- **Dynamic Hero Carousel:** A premium sliding carousel showcasing high-end collections with customizable HTML text overlays and animated typography.
- **Advanced Product Discovery:** 
  - **New Arrivals & Best Sellers:** Powered by intelligent backend aggregation algorithms (`new_arrivals_algorithm`, `bestsellers_algorithm`) that dynamically score and rank products based on real order velocity and user ratings.
  - **Categorized Shopping:** Extensive filtering and sorting across Women, Men, Accessories, Shoes, Bags, Perfumes, and Lifestyle.
  - **Product Deep Dives:** Split-screen detail pages featuring high-resolution visuals, size guides, stock statuses, and detailed craftsmanship storytelling.
  - **Integrated Discount Engine:** Real-time application of active discount codes at checkout.

### 🏛️ The Archivist Guild (Communities)
An exclusive, members-only interactive social layer for style enthusiasts. 
- Explore and join featured circles (e.g., Streetwear, Western Dresses, Minimalistic Lovers, Classical Indian).
- Engage in real-time community discussions (powered by Socket.io).
- Secure, authenticated access ensuring high-quality, curated interactions.

### 📖 Editorial Journal (Archives)
A clean, minimal editorial aesthetic resembling a literary review.
- Dive into cultural and design essays (e.g., "Silk's Aura", "Monochrome Matters").
- Explore journal volumes categorized by themes, supported by robust search capabilities.
- Integrated `trending_blogs_algorithm` to curate community content based on views, engagement, and recency.

### 💼 Seller Portal (Multi-Vendor System)
A comprehensive backend dashboard empowering sellers to manage their own mini-storefronts within ARCHIVIST.
- **Product Management:** Full CRUD capabilities for adding, updating, and removing product listings with multi-image support and variant tracking.
- **Order Fulfillment:** Live tracking of seller-specific orders. Sellers can view real-time shipping addresses and mark orders as "Processed" or "Dispatched," seamlessly syncing with the global inventory.
- **Analytics & Revenue Tracking:** High-level metrics showing gross sales, average order value, active discount utilization, and total revenue calculated from real order data.
- **Payouts Dashboard:** Automated tracking of pending vs. processed payouts from the platform to the seller.
- **Discount Configuration:** Sellers can create and activate specific discount codes, incentivizing buyers and monitoring discount-driven revenue.
- **Customer CRM:** An aggregated view of unique customers who have purchased the seller's items, enabling better relationship management.

### 🤖 Lucas: AI Business Assistant
An integrated AI assistant tailored for business and operational oversight.
- Instantly query store metrics directly from the interface.
- Check low stock items, total revenue, recent orders, and daily overviews.
- Interactive chat interface for seamless store management.

## 💻 Technology Stack

**Frontend**
- **React.js (Vite)**
- **Tailwind CSS:** For premium, glassmorphic UI, responsive layouts, and smooth micro-animations.
- **React Router DOM:** Fluid client-side routing across the store, journal, communities, and seller dashboard.
- **Puppeteer:** Comprehensive E2E UI testing suite.

**Backend**
- **Node.js & Express:** Robust REST API architecture.
- **MongoDB & Mongoose:** Scalable document-based data storage utilizing complex aggregation pipelines for search and ranking algorithms.
- **Socket.io:** Enabling real-time chat in The Archivist Guild.
- **Authentication:** Secure user and seller auth using JWT and bcrypt.
- **Axios:** Comprehensive API integration testing.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (Local instance or MongoDB Atlas cluster)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd Backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd Frontend
   npm install
   ```

### Environment Configuration

Create a `.env` file in the `Backend` directory and add the following:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_ACCESS_SECRET=your_jwt_access_secret
```

### Seeding the Database

Ensure the storefront and communities are populated with structured, premium data:

```bash
cd Backend
npm run seed:products
node scripts/syncCommunityMemberships.js
```
*(Ensure your MongoDB instance is running before executing seed scripts).*

### Running the Application

**Start the Backend Server:**
```bash
cd Backend
npm run dev
```

**Start the Frontend Development Server:**
```bash
cd Frontend
npm run dev
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000`

## 🧪 Testing

ARCHIVIST comes with a comprehensive testing suite simulating a production-grade environment.

**Frontend UI Testing**
Using Puppeteer to verify all static and dynamic React routes:
```bash
cd Frontend
node test-ui-routes.js
```

**Backend API Testing**
Using Axios to programmatically verify GET and POST mutations, ensuring Auth boundaries and status codes remain pristine:
```bash
cd Backend
node test-api-routes.js
```

## 🎨 Design Philosophy

ARCHIVIST prioritizes **visual excellence** and **premium aesthetics**:
- Use of clean typography and harmonious color palettes (deep stone grays, crisp whites, and glassmorphic overlays).
- Smooth transitions, horizontal scrollable carousels, and interactive hover states.
- Seamless blend of e-commerce utility with high-end editorial storytelling.

## 📄 License

This project is licensed under the MIT License.
