"use server";

import { cache } from "react";
const SHOPIFY_API_BASE = process.env.SHOPIFY_API_BASE;
const SHOPIFY_HEADERS = {
  "Content-Type": "application/json",
  "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
};

// جلب المنتجات مع كاش لمدة ساعة
export async function fetchProducts() {
  try {
    const response = await fetch(`${SHOPIFY_API_BASE}/products.json`, {
      method: "GET",
      headers: SHOPIFY_HEADERS,
      next: { revalidate: 3600 },
    });

    if (!response.ok)
      throw new Error(
        `Failed to fetch products: ${response.status} - ${response.statusText}`
      );

    const data = await response.json();
    if (!Array.isArray(data.products))
      throw new Error("Invalid products data format");

    const allVariants = data.products.flatMap((p) => p.variants || []);
    const inventoryItemIds = allVariants
      .map((v) => v.inventory_item_id)
      .filter(Boolean);

    const inventoryMap = await fetchInventories(inventoryItemIds);

    const productsWithDetails = await Promise.all(
      data.products.map(async (product) => {
        const metafields = await fetchMetafields(product.id);
        const variantsWithInventory = (product.variants || []).map((variant) => ({
          ...variant,
          inventory:
            inventoryMap.get(variant.inventory_item_id) || "No Inventory Info",
        }));
        return {
          ...product,
          variants: variantsWithInventory,
          inventory: variantsWithInventory.some((v) => v.inventory !== "Out of Stock")
            ? "In Stock"
            : "Out of Stock",
          ...metafields,
        };
      })
    );

    const availableProducts = productsWithDetails.filter(
      (product) => product.inventory !== "Out of Stock"
    );

    return availableProducts;
  } catch (error) {
    console.error("Shopify API Error (fetchProducts):", error);
    return [];
  }
}

// جلب منتج محدد مع كاش لمدة ساعة
export async function fetchProductById(id) {
  try {
    const response = await fetch(`${SHOPIFY_API_BASE}/products/${id}.json`, {
      method: "GET",
      headers: SHOPIFY_HEADERS,
      next: { revalidate: 3600 },
    });

    if (!response.ok)
      throw new Error(
        `Failed to fetch product: ${response.status} - ${response.statusText}`
      );

    const data = await response.json();
    if (!data.product) throw new Error("Product not found");

    const inventoryItemIds = data.product.variants
      .map((v) => v.inventory_item_id)
      .filter(Boolean);

    const inventoryMap = await fetchInventories(inventoryItemIds);
    const metafields = await fetchMetafields(id);

    return {
      ...data.product,
      variants: data.product.variants.map((variant) => ({
        ...variant,
        inventory:
          inventoryMap.get(variant.inventory_item_id) || "No Inventory Info",
      })),
      ...metafields,
    };
  } catch (error) {
    console.error("Shopify API Error (fetchProductById):", error);
    throw error;
  }
}

// جلب المخزون لعدة inventory_item_ids دفعة واحدة
export async function fetchInventories(inventoryItemIds = []) {
  if (!inventoryItemIds.length) return new Map();

  try {
    const idsParam = inventoryItemIds.join(",");
    const response = await fetch(
      `${SHOPIFY_API_BASE}/inventory_levels.json?inventory_item_ids=${idsParam}`,
      {
        method: "GET",
        headers: SHOPIFY_HEADERS,
        next: { revalidate: 60 },
      }
    );

    if (!response.ok)
      throw new Error(
        `Failed to fetch inventory: ${response.status} - ${response.statusText}`
      );

    const data = await response.json();

    const inventoryMap = new Map();
    for (const level of data.inventory_levels || []) {
      inventoryMap.set(
        level.inventory_item_id,
        level.available > 0
          ? `In Stock (${level.available})`
          : "Out of Stock"
      );
    }

    return inventoryMap;
  } catch (error) {
    console.error("Shopify API Error (fetchInventories):", error);
    return new Map();
  }
}

// جلب الـ metafields مع كاش لمدة ساعة
export async function fetchMetafields(productId) {
  try {
    const response = await fetch(
      `${SHOPIFY_API_BASE}/products/${productId}/metafields.json`,
      {
        method: "GET",
        headers: SHOPIFY_HEADERS,
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok)
      throw new Error(
        `Failed to fetch metafields: ${response.status} - ${response.statusText}`
      );

    const data = await response.json();
    const shippingMetafield = data.metafields.find(
      (mf) => mf.namespace === "custom" && mf.key === "shipping_location"
    );

    return {
      shippingLocation: shippingMetafield
        ? tryParseJSON(shippingMetafield.value)
        : "Shipping Info Unavailable",
    };
  } catch (error) {
    console.error("Shopify API Error (fetchMetafields):", error);
    return { shippingLocation: "Shipping Info Unavailable" };
  }
}

// تحليل الـ JSON
function tryParseJSON(value) {
  if (!value || typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// جلب المنتجات المميزة مع كاش لمدة 5 دقايق
export const fetchFeaturedProducts = cache(async () => {
  try {
    console.time("Fetch Featured Products");

    const response = await fetch(
      `${SHOPIFY_API_BASE}/products.json?tags=featured&fields=id,title,images,variants`,
      {
        method: "GET",
        headers: SHOPIFY_HEADERS,
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Failed to fetch products: ${response.status} - ${response.statusText}`
      );
      console.error(`Error details:`, errorBody);
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();
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
