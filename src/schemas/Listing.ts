import { Schema } from "effect";

export const PriceInfo = Schema.Struct({
  priceCents: Schema.optional(Schema.Number),
  priceType: Schema.optional(Schema.String),
});

export const Location = Schema.Struct({
  cityName: Schema.optional(Schema.String),
  countryName: Schema.optional(Schema.String),
  countryAbbreviation: Schema.optional(Schema.String),
  distanceMeters: Schema.optional(Schema.Number),
  latitude: Schema.optional(Schema.Number),
  longitude: Schema.optional(Schema.Number),
});

export const SellerInformation = Schema.Struct({
  sellerId: Schema.optional(Schema.Number),
  sellerName: Schema.optional(Schema.String),
  showSoiUrl: Schema.optional(Schema.Boolean),
  isVerified: Schema.optional(Schema.Boolean),
});

export const Picture = Schema.Struct({
  extraSmallUrl: Schema.optional(Schema.String),
  mediumUrl: Schema.optional(Schema.String),
  largeUrl: Schema.optional(Schema.String),
  extraExtraLargeUrl: Schema.optional(Schema.String),
});

export const Listing = Schema.Struct({
  itemId: Schema.String,
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  categorySpecificDescription: Schema.optional(Schema.String),
  priceInfo: Schema.optional(PriceInfo),
  location: Schema.optional(Location),
  sellerInformation: Schema.optional(SellerInformation),
  date: Schema.optional(Schema.String),
  imageUrls: Schema.optional(Schema.Array(Schema.String)),
  pictures: Schema.optional(Schema.Array(Picture)),
  vipUrl: Schema.optional(Schema.String),
  categoryId: Schema.optional(Schema.Number),
  attributes: Schema.optional(
    Schema.Array(
      Schema.Struct({
        key: Schema.optional(Schema.String),
        value: Schema.optional(Schema.String),
        values: Schema.optional(Schema.Array(Schema.String)),
      }),
    ),
  ),
  extendedAttributes: Schema.optional(
    Schema.Array(
      Schema.Struct({
        key: Schema.optional(Schema.String),
        value: Schema.optional(Schema.String),
        values: Schema.optional(Schema.Array(Schema.String)),
      }),
    ),
  ),
  priorityProduct: Schema.optional(Schema.String),
  urgencyFeatureActive: Schema.optional(Schema.Boolean),
  napAvailable: Schema.optional(Schema.Boolean),
  videoOnVip: Schema.optional(Schema.Boolean),
  reserved: Schema.optional(Schema.Boolean),
  traits: Schema.optional(Schema.Array(Schema.String)),
  verticals: Schema.optional(Schema.Array(Schema.String)),
});

export type Listing = typeof Listing.Type;
