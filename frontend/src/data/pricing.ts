export type PricingTierId = 'free' | 'student' | 'professional' | 'enterprise';

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingTier {
  id: PricingTierId;
  name: string;
  price: string;
  priceNote: string;
  storageLimit: number | null; // null for unlimited
  storageText: string;
  description: string;
  features: PricingFeature[];
  highlight?: boolean; // For the shuttle-red card
  studentSelfCertified?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceNote: '/ forever',
    storageLimit: 5,
    storageText: '5 uploads / mo',
    description: 'Perfect for casual users and small personal projects.',
    features: [
      { text: '5 uploads / month', included: true },
      { text: 'Standard Vision AI analysis', included: true },
      { text: 'Basic thread density metrics', included: true },
      { text: 'Model choice (Precision Vision)', included: false },
      { text: 'API access', included: false }
    ],
  },
  {
    id: 'student',
    name: 'Student',
    price: '$19',
    priceNote: '/ mo',
    storageLimit: 100,
    storageText: '100 uploads / mo',
    description: 'Ideal for textile students and academic researchers.',
    features: [
      { text: '100 uploads / month', included: true },
      { text: 'Model choice: Standard & Precision Vision', included: true },
      { text: 'Detailed thread density metrics', included: true },
      { text: 'Export data to JSON/CSV', included: true },
      { text: 'Email support', included: true }
    ],
    studentSelfCertified: true
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$49',
    priceNote: '/ mo',
    storageLimit: 100,
    storageText: '100 uploads / mo',
    description: 'For professional designers and independent manufacturers.',
    features: [
      { text: '100 uploads / month', included: true },
      { text: 'Model choice: Standard & Precision Vision', included: true },
      { text: 'Detailed thread density metrics', included: true },
      { text: 'Export data to JSON/CSV', included: true },
      { text: 'Priority 24/7 support', included: true }
    ],
    highlight: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    priceNote: 'Pricing',
    storageLimit: null,
    storageText: 'Unlimited uploads',
    description: 'Large-scale textile manufacturing and quality control.',
    features: [
      { text: 'Unlimited uploads', included: true },
      { text: 'Custom AI model fine-tuning', included: true },
      { text: 'On-premise deployment options', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Unlimited API access', included: true }
    ]
  }
];
