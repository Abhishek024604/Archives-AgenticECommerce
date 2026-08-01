# New Arrivals Algorithm

**Location**: `Backend/src/services/productService.js`  
**Used In**: Main Page (New Arrivals Carousel), Products Page (`?filter=new`)

## Overview
The New Arrivals algorithm identifies the most recently added products, but applies a "Freshness Score" logic commonly used by major e-commerce platforms. This ensures that while recency is the primary factor, highly-rated or strategically discounted new products are boosted to surface slightly faster.

## Algorithm Breakdown (MongoDB Aggregation Pipeline)

1. **Stock Validation (`$match`)**:
   - Out-of-stock items are automatically excluded to prevent frustration.
   - Condition: `"variants.stock": { $gt: 0 }`

2. **Freshness Score (`newnessScore`)**:
   The algorithm calculates a time-equivalent score that converts ratings and discounts into a "time boost", adding them to the base timestamp.
   
   - **Timestamp (Primary Driver)**: 
     The exact milliseconds of the product's creation date (`$toLong: "$createdAt"`).
     
   - **Rating Boost**:
     Every rating point gives the product a "1 Day" (86,400,000 milliseconds) freshness boost. This allows highly-rated new arrivals to jump ahead of 0-rated products added on the same day.
     `{ $multiply: ["$rating", 86400000] }`

   - **Discount Boost**:
     Every 1% of discount gives the product a "1 Hour" (3,600,000 milliseconds) freshness boost.
     `{ $multiply: ["$discount", 3600000] }`

3. **Sorting**:
   - Products are sorted strictly by their computed `newnessScore` in descending order.

## Pipeline Code Snippet
```javascript
{ $match: { ...filterObj, "variants.stock": { $gt: 0 } } },
{ $addFields: {
    newnessScore: {
        $add: [
            { $toLong: "$createdAt" },
            { $multiply: [{ $ifNull: ["$rating", 0] }, 86400000] },
            { $multiply: [{ $ifNull: ["$discount", 0] }, 3600000] }
        ]
    }
}},
{ $sort: { newnessScore: -1 } }
```
