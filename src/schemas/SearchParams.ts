export interface SearchParams {
  readonly query: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly sortBy?: "SORT_INDEX" | "OPTIMIZED" | "DATE" | "PRICE" | "LOCATION";
  readonly sortOrder?: "INCREASING" | "DECREASING";
  readonly postcode?: string;
  readonly distanceMeters?: number;
  readonly l1CategoryId?: number;
  readonly l2CategoryId?: number;
  readonly searchInTitleAndDescription?: boolean;
  readonly minPriceCents?: number;
  readonly maxPriceCents?: number;
}
