export interface Coin2uDashboard {
  Coins: number;
  CurrentQuotation: number;
  DaysToExpire: number;
  ExchangeCoins: number;
  Members?: Coin2uMember[];
  RecentTransactions?: Coin2uTransaction[];
}

export interface Coin2uCredentials {
  email: string;
  userId?: number;
  connected?: boolean;
}

export interface Coin2uMember {
  Value: number;
  Text: string;
}

export interface Coin2uTransaction {
  TransactionId: number;
  Amount: number;
  FromName: string;
  FromId: number;
  ToName: string;
  ToId: number;
  Date: string;
  ShopItemId?: number | null;
  ShopItemName?: string | null;
  Coins?: number | null;
  Message?: string | null;
  GenesisBookId?: number | null;
  ProviderId?: number | null;
  ProviderIdName?: string | null;
}

export interface Coin2uLog {
  Log: Coin2uTransaction[];
}

export interface Coin2uShopCategory {
  Id: number;
  Decription: string;
  BitActive?: boolean;
}

export interface Coin2uShopItem {
  Id: number;
  Name: string;
  Imagem: string | null;
  Price: number;
  PriceInReal: number;
  LastUpdate: string | null;
  Active: boolean;
  Stock: number;
  Description: string;
  PurchaseInstruction: string | null;
  category?: Coin2uShopCategory | null;
}

export interface Coin2uShop {
  Coins: number;
  ShopItems: Coin2uShopItem[];
}

export interface Coin2uTransferRequest {
  To: number;
  Amount: number;
  Message: string;
}

export interface Coin2uBuyItemRequest {
  shopItemId: number;
  price: number;
}

/** Org row as returned by /User/GetOrgList. Kept loose since schema may grow. */
export interface Coin2uOrg {
  id?: number;
  name?: string;
  [key: string]: unknown;
}

/** Full Info object returned by /Login/Authenticate (data.Info). */
export interface Coin2uInfo {
  UserId: number;
  TokenApi: string;
  Email?: string;
  Name?: string;
  [key: string]: unknown;
}
