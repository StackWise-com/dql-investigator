export interface Price {
  countryCode: string;
  countryName: string;
  currency: string;
  symbol: string;
  amount: number;
  display: string;
}

const COFFEE_BASE_USD = 3;

const COUNTRY_PRICING: Record<string, Price> = {
  US: {
    countryCode: "US",
    countryName: "United States",
    currency: "USD",
    symbol: "$",
    amount: COFFEE_BASE_USD,
    display: "$3",
  },
  IN: {
    countryCode: "IN",
    countryName: "India",
    currency: "INR",
    symbol: "₹",
    amount: 249,
    display: "₹249",
  },
  GB: {
    countryCode: "GB",
    countryName: "United Kingdom",
    currency: "GBP",
    symbol: "£",
    amount: 2.5,
    display: "£2.50",
  },
  EU: {
    countryCode: "EU",
    countryName: "European Union",
    currency: "EUR",
    symbol: "€",
    amount: 2.99,
    display: "€2.99",
  },
  CA: {
    countryCode: "CA",
    countryName: "Canada",
    currency: "CAD",
    symbol: "CA$",
    amount: 4,
    display: "CA$4",
  },
  AU: {
    countryCode: "AU",
    countryName: "Australia",
    currency: "AUD",
    symbol: "A$",
    amount: 4.5,
    display: "A$4.50",
  },
  JP: {
    countryCode: "JP",
    countryName: "Japan",
    currency: "JPY",
    symbol: "¥",
    amount: 450,
    display: "¥450",
  },
  BR: {
    countryCode: "BR",
    countryName: "Brazil",
    currency: "BRL",
    symbol: "R$",
    amount: 15,
    display: "R$15",
  },
  MX: {
    countryCode: "MX",
    countryName: "Mexico",
    currency: "MXN",
    symbol: "MX$",
    amount: 60,
    display: "MX$60",
  },
  SG: {
    countryCode: "SG",
    countryName: "Singapore",
    currency: "SGD",
    symbol: "S$",
    amount: 4,
    display: "S$4",
  },
  AE: {
    countryCode: "AE",
    countryName: "United Arab Emirates",
    currency: "AED",
    symbol: "AED ",
    amount: 11,
    display: "AED 11",
  },
  ZA: {
    countryCode: "ZA",
    countryName: "South Africa",
    currency: "ZAR",
    symbol: "R",
    amount: 55,
    display: "R55",
  },
};

export function getCoffeePriceForCountry(countryCode: string): Price {
  const code = countryCode.toUpperCase();
  return COUNTRY_PRICING[code] ?? COUNTRY_PRICING["US"];
}
