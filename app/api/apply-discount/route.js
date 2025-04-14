export async function POST(req) {
  const { couponCode, totalPrice } = await req.json();
  const discountCodes = JSON.parse(process.env.DISCOUNT_CODES) || {};
  const discountRate = discountCodes[couponCode.toUpperCase()] || 0;
  const baseDiscountedPrice = totalPrice * (1 - discountRate);
  const discountedPrice = Math.max(baseDiscountedPrice, 0.01).toFixed(2);

  console.log(`Coupon: ${couponCode}, discountRate: ${discountRate}, discountedPrice: ${discountedPrice}`);

  return new Response(JSON.stringify({
    success: true,
    discountedPrice,
    discountRate,
    message: discountRate === 1 ? "Coupon applied! A $0.01 fee applies." : `Coupon applied! You saved ${discountRate * 100}%`,
  }), { status: 200 });
}