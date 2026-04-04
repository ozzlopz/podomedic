export type StoreProduct = {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  activeInStore?: boolean;
};

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string;
  price: number;
  quantity: number;
};
