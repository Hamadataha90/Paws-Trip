// app/actions/mainActions.js
import { cache } from "react";

export const fetchFeaturedProducts = cache(async () => {
  try {
    console.time("Fetch Featured Products");

   'use server';

const response = await fetch(
  `${process.env.SHOPIFY_API_BASE}/products.json?tags=featured&fields=id,title,images,variants`,
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
    },
    next: { revalidate: 300 }, // زيادة الوقت لـ 5 دقايق
  }
);


    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Failed to fetch products: ${response.status} - ${response.statusText}`);
      console.error(`Error details:`, errorBody);
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    console.time("Parse JSON");
    const data = await response.json();
    console.timeEnd("Parse JSON");

    if (!data.products || !Array.isArray(data.products)) {
      console.warn("Invalid products data received", data);
      return [];
    }

    console.timeEnd("Fetch Featured Products");

    return data.products;
  } catch (error) {
    console.error("Shopify API Error:", error.message);
    return [];
  }
});
