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

export interface CartOrder {
  id: number;
  ref_code: string;
  items: OrderItem[];
  total: number;
  ordered_date?: string;
  ordered?: boolean;
}
