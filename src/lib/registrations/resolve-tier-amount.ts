export function resolveTierAmount(
  priceTiers: { id: string; price: number }[],
  flatPrice: number,
  submittedTierId: string,
): number {
  const tier = submittedTierId ? priceTiers.find((t) => t.id === submittedTierId) : undefined;
  return tier ? tier.price : flatPrice;
}
