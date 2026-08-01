# Best Sellers Algorithm

**Location**: `Backend/src/services/productService.js`  
**Used In**: Main Page (Best Sellers Carousel), Products Page (`?filter=bestsellers`)

## Overview
The Best Sellers algorithm is designed to surface products that are performing well commercially while balancing customer satisfaction (ratings) and current promotions (discounts). This prevents out-of-stock items or poorly rated but highly sold items from dominating the best-seller lists.

## Algorithm Breakdown (MongoDB Aggregation Pipeline)

1. **Stock Validation (`$match`)**:
   - The algorithm first strictly filters out any products that are completely out of stock.
   - Condition: `"variants.stock": { $gt: 0 }`

2. **Weighted Scoring System (`bestsellerScore`)**:
   A composite score is calculated using the following factors:
   
   - **Sales Volume (60% Weight)**: 
     The primary driver of the score is the raw `salesCount`.
     `{ $multiply: [ "$salesCount", 0.6 ] }`

   - **Rating & Review Volume (30% Weight)**:
     To ensure high-quality products are rewarded, the average `rating` (normalized out of 5) is multiplied by the `totalRatings` (capped at 100 to prevent extremely high-volume reviews from entirely overriding the score).
     `{ $multiply: [ { $divide: ["$rating", 5] }, { $min: ["$totalRatings", 100] }, 0.3 ] }`

   - **Discount Factor (10% Weight)**:
     A slight boost is given to products currently on sale, as these drive conversions.
     `{ $multiply: [ "$discount", 0.1 ] }`

3. **Sorting**:
   - Products are sorted in descending order by their calculated `bestsellerScore`.
   - In the event of a tie, the newest products (`createdAt: -1`) are favored.

## Pipeline Code Snippet
```javascript
{ $match: { ...filterObj, "variants.stock": { $gt: 0 } } },
{ $addFields: {
    bestsellerScore: {
        $add: [
            { $multiply: [{ $ifNull: ["$salesCount", 0] }, 0.6] },
            { $multiply: [ 
                { $divide: [{ $ifNull: ["$rating", 0] }, 5] }, 
                { $min: [{ $ifNull: ["$totalRatings", 0] }, 100] }, 
                0.3 
            ]},
            { $multiply: [{ $ifNull: ["$discount", 0] }, 0.1] }
        ]
    }
}},
{ $sort: { bestsellerScore: -1, createdAt: -1 } }
```
