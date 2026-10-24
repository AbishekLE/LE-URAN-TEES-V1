export const SHOP = {
  name: 'LE URBAN TEES',
  /** Shown in two colours in the header, matching the logo (white + lime). */
  nameWhite: 'LE URBAN',
  nameAccent: 'TEES',
  address: 'MaraiMalai Nagar, Tamil Nadu',
  instagram: 'le_urban_tees',
  tagline: 'Normal is boring',
} as const;

export const PRODUCTS = [
  'Collar Tshirt',
  'Round Neck Tshirt',
  'Overside Round Neck Tshirt',
  'Shirt',
  'Full Sleve Tshirt',
  'Acid Wash',
  'Nylon Tshirt',
  'Recycle Tshirt',
  'Delivery Fee',
] as const;

/** Colour name -> swatch used only for the small dot in the editor. */
export const COLORS: Record<string, string> = {
  White: '#ffffff',
  Red: '#d62828',
  'Light Blue': '#8ecae6',
  'Royal Blue': '#2457d6',
  'Navy Blue': '#14213d',
  Maroon: '#7b1e2b',
  Beige: '#e0d3b8',
  Black: '#111111',
  Orange: '#f77f00',
  Yellow: '#ffd60a',
  'Light Grey': '#cfcfcf',
  'Charcoal Grey': '#36454f',
  Green: '#2d9d4b',
  Purple: '#7b3fa0',
  Lime: '#9ae600',
  Rose: '#e8758f',
  /** Not applicable (e.g. for Delivery Fee). Empty swatch = striped placeholder. */
  NA: '',
};

export const COLOR_NAMES = Object.keys(COLORS);

export const PAYMENT_TYPES = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'] as const;

export const STORAGE_KEYS = {
  draft: 'leut.invoice.draft.v1',
  lastSeq: 'leut.invoice.lastSeq.v1',
} as const;

export const INVOICE_PREFIX = 'INV-';
