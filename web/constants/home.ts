export const header_links = [
  {
    link: "/",
    text: "Home",
  },
  {
    link: "#store",
    text: "Store",
  },
  {
    link: "/vendors",
    text: "Vendors",
  },
  {
    link: "https://github.com/fisayo-dev/proofpay-ai/",
    text: "Github",
  },
];

export const store_products = [
  {
    id: "favour-fits-black-hoodie",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
    vendor: {
      business_name: "Favour Fits",
      category: "Fashion",
      social_handle: "@favourfits",
      completed_transactions: 14,
    },
    payment_request: {
      item_name: "Black hoodie",
      amount: 7500,
      currency: "NGN",
      delivery_method: "CU hostel delivery",
    },
    trust: {
      score: 95,
      verdict: "Trusted",
      confidence: "High confidence",
      reasons: [
        "Vendor profile is fully complete",
        "No disputes on record",
      ],
    },
  },
  {
    id: "favour-fits-denim-jacket",
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80",
    vendor: {
      business_name: "Favour Fits",
      category: "Fashion",
      social_handle: "@favourfits",
      completed_transactions: 14,
    },
    payment_request: {
      item_name: "Oversized denim jacket",
      amount: 12000,
      currency: "NGN",
      delivery_method: "Campus pickup",
    },
    trust: {
      score: 92,
      verdict: "Trusted",
      confidence: "High confidence",
      reasons: [
        "Pricing fits previous fashion orders",
        "Account identity matches the vendor profile",
      ],
    },
  },
  {
    id: "favour-fits-essential-tee",
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
    vendor: {
      business_name: "Favour Fits",
      category: "Fashion",
      social_handle: "@favourfits",
      completed_transactions: 14,
    },
    payment_request: {
      item_name: "Essential white tee",
      amount: 4500,
      currency: "NGN",
      delivery_method: "Same-day hostel dropoff",
    },
    trust: {
      score: 90,
      verdict: "Trusted",
      confidence: "High confidence",
      reasons: [
        "Consistent delivery history",
        "Low-risk order amount for this vendor",
      ],
    },
  },
];
