# Premium Indian Geocoding & Address Selection Guide

## 📍 Why some places weren't showing up
By default, Mapbox Geocoding searches globally. If a user searches for a common place name (e.g., "Park Street"), it might show results from London or New York instead of Kolkata.

### What we've changed:
1.  **Strict Country Filtering**: All requests now include `country=IN`.
2.  **Proximity Biasing**: Requests are biased toward the center of India (`78.9629, 20.5937`).
3.  **Increased Results Limit**: We increased the limit to 8 to give more visibility to local landmarks.

## 🏗️ Implementing "Step-by-Step" Address Selection
To allow users to go through India's addresses "one by one" (hierarchically), we recommend adding a structured selector:

### ⚡ Proposed Component Architecture:
```tsx
// components/map/IndiaAddressSelector.tsx
// Features: State -> City -> District -> Pincode selection flow.
```

## 📋 Recommended Donor Page Layout
Integrate a "Guided Search" button next to the Mapbox search bar. When clicked, it opens a modal where users can select:
1.  **State** (e.g., Maharashtra)
2.  **City** (e.g., Mumbai)
3.  **Area/Pincode**

This ensures that even if Mapbox search is ambiguous, the donor can manually find their exact location perfectly.
This can be integrated right into `app/(dashboard)/donor/donate/page.tsx` as a secondary way to confirm the address.
