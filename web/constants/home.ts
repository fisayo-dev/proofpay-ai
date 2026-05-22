export const vendorVerdicts = [
  "Trusted",
  "Caution",
  "Manual Review Needed",
] as const;

export type VendorVerdict = (typeof vendorVerdicts)[number];

type TrustDetails = {
  score: number;
  verdict: VendorVerdict;
  confidence: string;
  reasons: string[];
};

type StoreProduct = {
  id: string;
  image: string;
  vendor: {
    business_name: string;
    category: string;
    social_handle: string;
    completed_transactions: number;
  };
  payment_request: {
    item_name: string;
    amount: number;
    currency: string;
    delivery_method: string;
  };
  trust: TrustDetails;
};

type Vendor = {
  id: string;
  business_name: string;
  category: string;
  social_handle: string;
  profile_picture: string;
  completed_transactions: number;
  score: number;
  verdict: VendorVerdict;
  confidence: string;
  summary: string;
  reasons: string[];
};

export const header_links = [
  {
    link: "/",
    text: "Home",
  },
  {
    link: "#vendors",
    text: "Vendors",
  },
  {
    link: "#store",
    text: "Store",
  },
  {
    link: "https://github.com/fisayo-dev/proofpay-ai/",
    text: "Github",
  },
];

export const store_products: StoreProduct[] = [
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

export const vendors: Vendor[] = [
  {
    id: "favour-fits",
    business_name: "Favour Fits",
    category: "Fashion",
    social_handle: "@favourfits",
    profile_picture:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    completed_transactions: 14,
    score: 95,
    verdict: "Trusted",
    confidence: "High confidence",
    summary: "Fast-moving campus fashion vendor with a consistent payment trail.",
    reasons: [
      "Vendor profile is fully complete",
      "Vendor has 14 completed transactions",
      "No disputes on record",
    ],
  },
  {
    id: "campus-crates",
    business_name: "Campus Crates",
    category: "Groceries",
    social_handle: "@campuscrates",
    profile_picture:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    completed_transactions: 12,
    score: 91,
    verdict: "Trusted",
    confidence: "High confidence",
    summary: "Bulk groceries and hostel essentials with repeat-buyer activity.",
    reasons: [
      "Vendor profile is fully complete",
      "No disputes on record",
      "Payment amount is normal for this vendor category",
    ],
  },
  {
    id: "gadget-hub-ng",
    business_name: "Gadget Hub NG",
    category: "Electronics",
    social_handle: "@gadgethubng",
    profile_picture:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    completed_transactions: 9,
    score: 88,
    verdict: "Trusted",
    confidence: "High confidence",
    summary: "Accessory seller with strong identity checks and stable order values.",
    reasons: [
      "Account name is consistent with business name",
      "Vendor has 9 completed transactions",
      "No disputes on record",
    ],
  },
  {
    id: "hostel-bites",
    business_name: "Hostel Bites",
    category: "Food",
    social_handle: "@hostelbites",
    profile_picture:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    completed_transactions: 7,
    score: 82,
    verdict: "Trusted",
    confidence: "Moderate confidence",
    summary: "Daily meal delivery vendor with good history and low-value orders.",
    reasons: [
      "Vendor profile is mostly complete",
      "Payment amount is normal for this vendor category",
      "No disputes on record",
    ],
  },
  {
    id: "print-lab",
    business_name: "Print Lab",
    category: "Printing",
    social_handle: "@printlab",
    profile_picture:
      "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=400&q=80",
    completed_transactions: 5,
    score: 65,
    verdict: "Caution",
    confidence: "High confidence",
    summary: "Growing print vendor with a workable history but a few review flags.",
    reasons: [
      "Vendor profile is mostly complete",
      "Some disputes on record - review before paying",
      "Payment amount is a large round number - verify item details",
    ],
  },
  {
    id: "swift-rides",
    business_name: "Swift Rides",
    category: "Logistics",
    social_handle: "@swiftrides",
    profile_picture:
      "https://images.unsplash.com/photo-1506863530036-1efeddceb993?auto=format&fit=crop&w=400&q=80",
    completed_transactions: 4,
    score: 58,
    verdict: "Caution",
    confidence: "Moderate confidence",
    summary: "Delivery partner with limited completed orders and variable pricing.",
    reasons: [
      "Vendor has 4 completed transactions - growing history",
      "Payment amount is normal for this vendor category",
      "Review fulfillment details before paying",
    ],
  },
  {
    id: "prime-appliances",
    business_name: "Prime Appliances",
    category: "Home goods",
    social_handle: "@primeappliances",
    profile_picture:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80",
    completed_transactions: 0,
    score: 6,
    verdict: "Manual Review Needed",
    confidence: "Low confidence",
    summary: "New seller requesting a high-value payment without enough history.",
    reasons: [
      "Vendor profile is incomplete - missing key details",
      "Vendor has no completed transactions yet - new seller",
      "Payment amount is unusually high for this category",
    ],
  },
];
