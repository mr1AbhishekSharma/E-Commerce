export interface Slide {
  id: number;
  caption1: string;
  caption2: string;
  link: string;
  image: string;
  is_active: boolean;
}

export interface Category {
  id: number;
  title: string;
  slug: string;
  description: string;
  image: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  discount_price: number | null;
  category: number;
  category_title: string;
  category_slug: string;
  label: 'S' | 'N' | 'P';
  slug: string;
  stock_no: string;
  description_short: string;
  description_long: string;
  image: string;
  is_active: boolean;
}

export interface OrderItem {
  id: number;
  item: Product;
  quantity: number;
  final_price: number;
  total_item_price: number;
  amount_saved: number;
}

export interface BillingAddress {
  street_address: string;
  apartment_address?: string;
  country: string;
  zip: string;
}

export interface CartOrder {
  id: number;
  ref_code: string;
  items: OrderItem[];
  total: number;
  ordered_date?: string;
  ordered?: boolean;
  coupon?: {
    code: string;
    amount: number;
  };
  billing_address?: BillingAddress;
  being_delivered?: boolean;
  received?: boolean;
  refund_requested?: boolean;
  refund_granted?: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface LocalCartItem {
  product: Product;
  quantity: number;
}
