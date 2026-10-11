export const criteria = [
  ['reef', 'Hausriff & Schnorcheln'], ['beach', 'Strandzugang'], ['wind', 'Windschutz im Dezember'],
  ['pool', 'Beheizter Pool'], ['couples', 'Paar-Eignung'], ['food', 'Essen'], ['rooms', 'Zimmer'],
  ['service', 'Service'], ['distance', 'Nähe zum Strand'], ['allInclusive', 'All Inclusive'], ['value', 'Preis-Leistung']
];

export function weightedRating(ratings, weights) {
  const used = criteria.filter(([key]) => Number(weights[key]) > 0);
  if (!used.length) return 0;
  const totalWeight = used.reduce((sum, [key]) => sum + Number(weights[key]), 0);
  return used.reduce((sum, [key]) => sum + ratings[key] * Number(weights[key]), 0) / totalWeight;
}

export function bestPrice(prices, query = {}) {
  return prices
    .filter(p => !query.maxPrice || p.amount <= Number(query.maxPrice))
    .filter(p => !query.operator || p.operator.toLocaleLowerCase('de').includes(query.operator.toLocaleLowerCase('de')))
    .filter(p => !query.departureAfter || p.outbound.slice(11, 16) >= query.departureAfter)
    .filter(p => !query.returnBefore || p.inbound.slice(11, 16) <= query.returnBefore)
    .filter(p => !query.dateFrom || p.outbound.slice(0, 10) >= query.dateFrom)
    .filter(p => !query.dateTo || p.inbound.slice(0, 10) <= query.dateTo)
    .filter(p => !query.duration || Math.round((new Date(p.inbound) - new Date(p.outbound)) / 86400000) === Number(query.duration))
    .sort((a, b) => a.amount - b.amount)[0] || null;
}

export function rankHotels(hotels, weights, query = {}) {
  const candidates = hotels.map(hotel => ({ ...hotel, rating: weightedRating(hotel.ratings, weights), price: bestPrice(hotel.prices || [], query) }));
  const priced = candidates.filter(h => h.price);
  const min = Math.min(...priced.map(h => h.price.amount));
  const max = Math.max(...priced.map(h => h.price.amount));
  return candidates.map(hotel => {
    const priceScore = hotel.price ? (max === min ? 10 : 10 - ((hotel.price.amount - min) / (max - min)) * 5) : 0;
    return { ...hotel, score: hotel.rating * .75 + priceScore * .25 };
  });
}
