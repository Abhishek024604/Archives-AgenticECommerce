# Lucas Seller Operating System

Lucas is a seller-only, read-only business operations assistant. The browser
sends conversation messages to the backend, and the backend runs Groq tool
calling against seller-scoped MongoDB queries.

## Configuration

Add these values to `Backend/.env`:

```env
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

`GROQ_MODEL` is configurable so the deployment can select any Groq model that
supports tool use. The API key must never be exposed through Vite or frontend
environment variables.

## Available Tools

- `getSellerOverview`
- `searchProducts`
- `getInventory`
- `getOrders`
- `getRevenue`
- `getCustomers`
- `getCommunities`

Every tool derives the seller identity from the authenticated access token.
The model cannot provide or override a seller ID.

## Current Boundaries

- Lucas can read live data but cannot mutate products, inventory, or orders.
- Product rating aggregates are available, but written reviews are not modeled.
- Seller dispatch state is available, but carrier-level tracking is not modeled.
- Conversation history is held in the browser for the current page session.
