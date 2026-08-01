# Product Search & Relevance Algorithm

**Location**: `Backend/src/services/productService.js`  
**Used In**: Global Navigation Search Bar, Products Page (Search queries)

## Overview
The Product Search algorithm leverages MongoDB Atlas Search to provide fuzzy, typo-tolerant, and highly relevant search results. It uses a compound query structure that balances exact phrase matching with partial and fuzzy text matching across product names and brands.

## Algorithm Breakdown (MongoDB Atlas Search Pipeline)

The search pipeline uses a `$search` stage with a `compound` operator, allowing multiple search rules to be evaluated simultaneously using a `should` clause (meaning results matching any of the rules are returned, but results matching multiple rules score higher).

1. **Exact Phrase Match (Highest Priority)**:
   - Matches the exact phrase in the `productName` with a slop of 1 (allows for 1 word in between).
   - **Boost**: 12 (Maximum relevance)
   
2. **Autocomplete Matching (High Priority)**:
   - Matches sequential prefixes in the `productName` (e.g., typing "T-Sh" matches "T-Shirt").
   - Fuzzy matching allows for up to 1 typo (maxEdits: 1).
   - **Boost**: 9

3. **Brand Autocomplete Matching (Medium Priority)**:
   - Similar to product name autocomplete, but targets the `brandName` field.
   - **Boost**: 6

4. **Broad Fuzzy Text Matching (Low/Fallback Priority)**:
   - Uses standard text matching on `productName` with higher tolerance for typos (maxEdits: 2).
   - **Boost**: 5

5. **Broad Brand Text Matching (Lowest Priority)**:
   - Uses standard text matching on `brandName` with standard typo tolerance (maxEdits: 1).
   - **Boost**: 3

## Post-Search Sorting
After Atlas Search assigns a `searchScore` to each document based on the criteria above, the results are sorted.
- **Primary**: `searchScore` (Descending) - Most relevant first.
- **Secondary**: `rating` (Descending) - Higher rated products win ties.
- **Tertiary**: `totalRatings` (Descending) - More reviewed products win ties.

## Pipeline Code Snippet
```javascript
{
    $search: {
        index: PRODUCT_SEARCH_INDEX,
        compound: {
            should: [
                {
                    phrase: {
                        query, path: "productName", slop: 1,
                        score: { boost: { value: 12 } }
                    }
                },
                {
                    autocomplete: {
                        query, path: "productName", tokenOrder: "sequential",
                        fuzzy: { maxEdits: 1, prefixLength: 2 },
                        score: { boost: { value: 9 } }
                    }
                },
                // ... (brand and text matching omitted for brevity)
            ],
            minimumShouldMatch: 1
        }
    }
}
```
