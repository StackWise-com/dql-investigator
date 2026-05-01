export interface Price {
  countryCode: string;
  countryName: string;
  currency: string;
  symbol: string;
  amount: number;
  display: string;
}

const BASE_PRICE_USD = 9.99;

export const COUNTRY_PRICING: Record<string, Price> = {
  US: {
    countryCode: "US",
    countryName: "United States",
    currency: "USD",
    symbol: "$",
    amount: BASE_PRICE_USD,
    display: "$9.99",
  },
  IN: {
    countryCode: "IN",
    countryName: "India",
    currency: "INR",
    symbol: "₹",
    amount: 799,
    display: "₹799",
  },
  GB: {
    countryCode: "GB",
    countryName: "United Kingdom",
    currency: "GBP",
    symbol: "£",
    amount: 7.99,
    display: "£7.99",
  },
  EU: {
    countryCode: "EU",
    countryName: "European Union",
    currency: "EUR",
    symbol: "€",
    amount: 8.99,
    display: "€8.99",
  },
  CA: {
    countryCode: "CA",
    countryName: "Canada",
    currency: "CAD",
    symbol: "CA$",
    amount: 12.99,
    display: "CA$12.99",
  },
  AU: {
    countryCode: "AU",
    countryName: "Australia",
    currency: "AUD",
    symbol: "A$",
    amount: 14.99,
    display: "A$14.99",
  },
  JP: {
    countryCode: "JP",
    countryName: "Japan",
    currency: "JPY",
    symbol: "¥",
    amount: 1499,
    display: "¥1,499",
  },
  BR: {
    countryCode: "BR",
    countryName: "Brazil",
    currency: "BRL",
    symbol: "R$",
    amount: 49.99,
    display: "R$49.99",
  },
  MX: {
    countryCode: "MX",
    countryName: "Mexico",
    currency: "MXN",
    symbol: "MX$",
    amount: 199,
    display: "MX$199",
  },
  SG: {
    countryCode: "SG",
    countryName: "Singapore",
    currency: "SGD",
    symbol: "S$",
    amount: 13.99,
    display: "S$13.99",
  },
  AE: {
    countryCode: "AE",
    countryName: "United Arab Emirates",
    currency: "AED",
    symbol: "AED ",
    amount: 36.99,
    display: "AED 36.99",
  },
  ZA: {
    countryCode: "ZA",
    countryName: "South Africa",
    currency: "ZAR",
    symbol: "R",
    amount: 179.99,
    display: "R179.99",
  },
};

export function getPriceForCountry(countryCode: string): Price {
  const code = countryCode.toUpperCase();
  return COUNTRY_PRICING[code] ?? COUNTRY_PRICING["US"];
}

export function getCoffeePriceForCountry(countryCode: string): Price {
  const premium = getPriceForCountry(countryCode);
  const coffeeAmount = Math.max(1, Math.round(premium.amount * 0.3));
  return {
    ...premium,
    amount: coffeeAmount,
    display: `${premium.symbol}${coffeeAmount}`,
  };
}
