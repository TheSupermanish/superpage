// Shopify Types
export type ShopifyVariant = {
    id: string;
    title: string;
    price: string | { amount: string; currencyCode: string };
    imageUrl?: string | null;
    sku?: string | null;
    inventoryQuantity?: number | null;
  };
  
  export type ShopifyProduct = {
    id: string;
    title: string;
    handle?: string | null;
    imageUrl?: string | null;
    variants: ShopifyVariant[];
    descriptionHtml?: string | null;
  };
  
  // Store Types
  export type StoreInput = {
    name?: string;
    url: string;
    adminAccessToken: string;
    description?: string;
    currency?: string;
    networks?: string[];
    asset?: string;
    agentMetadata?: any;
  };
  
  export type Store = {
    id: string;
    name: string;
    currency: string;
    networks: string[];
    asset: string;
    description?: string;
    agentMetadata?: any;
  };
  
  // Product Types
  export type ProductInput = {
    id: string; // variant id
    name: string;
    description?: string | null;
    image?: string | null;
    price: string;
    currency: string;
    inventory?: number | null;
    metadata?: Record<string, any> | null;
  };
  
  export type Product = {
    _id?: string; // MongoDB ObjectId (for deletion)
    id: string;
    storeId?: string; // Added for when fetching all products
    name: string;
    description: string | null;
    image: string | null;
    price: string;
    currency: string;
    inventory: number | null;
    metadata: Record<string, any> | null;
  };
  
  // Checkout Types
  export type CheckoutItem = { productId: string; quantity: number };
  export type ShippingAddress = {
    name: string;
    address1: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  
  export type CheckoutRequest = {
    storeId: string;
    items: CheckoutItem[];
    shippingAddress: ShippingAddress;
    email: string;
    clientReferenceId?: string;
    orderIntentId?: string;
  };
  
  export type Amounts = {
    subtotal: string;
    shipping: string;
    tax: string;
    total: string;
    currency: string;
  };
  
  // API Response Types
  export type ApiErrorResponse = {
    error: string;
    details?: any;
    status?: number;
  };
  
  export type ApiSuccessResponse<T> = T;
  