# Trending Blogs Algorithm

**Location**: `Backend/src/services/blogService.js`  
**Used In**: Main Page (Journal Section), Blogs Page (`?filter=trending`)

## Overview
The Trending Blogs algorithm aims to highlight editorial content (Journal entries) that generates high engagement. Instead of relying purely on chronological order or views, the algorithm considers actual time spent reading the content alongside the raw view count.

## Algorithm Breakdown (MongoDB Aggregation Pipeline)

1. **Engagement Scoring (`trendingScore`)**:
   The score combines read counts and the actual duration readers spend on the article.
   
   - **Reads Count (Primary Engagement)**: 
     Every raw view/read is given a high base weight.
     `{ $multiply: ["$readsCount", 10] }`

   - **Time Spent (Quality Indicator)**:
     The cumulative time spent by users reading the article (tracked in seconds) is converted to minutes and added to the score. This penalizes clickbait and rewards deep, engaging content.
     `{ $divide: ["$totalTimeSpent", 60] }`

2. **Sorting**:
   - Blogs are sorted descending by `trendingScore`.
   - In case of a tie, newer blogs (`createdAt: -1`) win.

3. **Fallback Mechanism**:
   - If no blogs have been read yet (e.g., brand new database where the highest `trendingScore` is 0), the algorithm defaults to returning a random sample of blogs to ensure the Journal section remains visually populated.

## Pipeline Code Snippet
```javascript
{ 
    $addFields: {
        trendingScore: { 
            $add: [
                { $multiply: ["$readsCount", 10] },
                { $divide: ["$totalTimeSpent", 60] }
            ]
        }
    }
},
{ $sort: { trendingScore: -1, createdAt: -1 } }
```
