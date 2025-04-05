"use server";

const SHOPIFY_API_BASE = "https://humidityzone.myshopify.com/admin/api/2023-10";
const SHOPIFY_HEADERS = {
  "Content-Type": "application/json",
  "X-Shopify-Access-Token": process.env.NEXT_PUBLIC_SHOPIFY_ADMIN_API_ACCESS_TOKEN, // متغير سري
};

// جلب المنتجات مع كاش لمدة ساعة
export async function fetchProducts() {
  try {
    const response = await fetch(`${SHOPIFY_API_BASE}/products.json`, {
      method: "GET",
      headers: SHOPIFY_HEADERS,
      next: { revalidate: 3600 }, // ساعة واحدة لأن بيانات المنتجات الأساسية مش بتتغير كتير
    });

    if (!response.ok) throw new Error(`Failed to fetch products: ${response.status} - ${response.statusText}`);

    const data = await response.json();
    if (!Array.isArray(data.products)) throw new Error("Invalid products data format");

    const productsWithDetails = await Promise.all(
      data.products.map(async (product) => {
        const inventoryItemId = product.variants?.[0]?.inventory_item_id;
        const inventory = inventoryItemId ? await fetchInventory(inventoryItemId) : "No Inventory Info";
        const metafields = await fetchMetafields(product.id);

        return { ...product, inventory, ...metafields };
      })
    );

    return productsWithDetails;
  } catch (error) {
    console.error("Shopify API Error (fetchProducts):", error);
    return [];
  }
}

// جلب المخزون مع كاش لمدة 5 دقايق
export async function fetchInventory(inventoryItemId) {
  try {
    const response = await fetch(
      `${SHOPIFY_API_BASE}/inventory_levels.json?inventory_item_ids=${inventoryItemId}`,
      {
        method: "GET",
        headers: SHOPIFY_HEADERS,
        next: { revalidate: 300 }, // 5 دقايق لأن المخزون بيتغير بسرعة
      }
    );

    if (!response.ok) throw new Error(`Failed to fetch inventory: ${response.status} - ${response.statusText}`);

    const data = await response.json();
    return data.inventory_levels?.[0]?.available > 0
      ? `In Stock (${data.inventory_levels[0].available})`
      : "Out of Stock";
  } catch (error) {
    console.error("Shopify API Error (fetchInventory):", error);
    return "Stock Info Unavailable";
  }
}

// جلب الـ metafields مع كاش لمدة ساعة
export async function fetchMetafields(productId) {
  try {
    const response = await fetch(`${SHOPIFY_API_BASE}/products/${productId}/metafields.json`, {
      method: "GET",
      headers: SHOPIFY_HEADERS,
      next: { revalidate: 3600 }, // ساعة لأن الـ metafields مش بتتغير كتير
    });

    if (!response.ok) throw new Error(`Failed to fetch metafields: ${response.status} - ${response.statusText}`);

    const data = await response.json();
    const shippingMetafield = data.metafields.find((mf) => mf.namespace === "custom" && mf.key === "shipping_location");

    return {
      shippingLocation: shippingMetafield ? tryParseJSON(shippingMetafield.value) : "Shipping Info Unavailable",
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

// جلب منتج محدد مع كاش لمدة ساعة
export async function fetchProductById(id) {
  try {
    const response = await fetch(`${SHOPIFY_API_BASE}/products/${id}.json`, {
      method: "GET",
      headers: SHOPIFY_HEADERS,
      next: { revalidate: 3600 }, // ساعة لأن بيانات المنتج مش بتتغير كتير
    });

    if (!response.ok) throw new Error(`Failed to fetch product: ${response.status} - ${response.statusText}`);

    const data = await response.json();
    if (!data.product) throw new Error("Product not found");

    const inventoryItemId = data.product.variants?.[0]?.inventory_item_id;
    const inventory = inventoryItemId ? await fetchInventory(inventoryItemId) : "No Inventory Info";
    const metafields = await fetchMetafields(id);

    return { ...data.product, inventory, ...metafields };
  } catch (error) {
    console.error("Shopify API Error (fetchProductById):", error);
    throw error;
  }
}
