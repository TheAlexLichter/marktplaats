import type { Listing } from "../schemas/Listing.js";
import { BOLD, CYAN, DIM, GREEN, RESET, YELLOW } from "../colors.js";

export function formatPrice(listing: Listing): string {
  const priceType = listing.priceInfo?.priceType;
  if (priceType === "RESERVED") return `${YELLOW}Gereserveerd${RESET}`;
  if (priceType === "SEE_DESCRIPTION") return `${DIM}Zie omschrijving${RESET}`;
  if (priceType === "NOTK") return `${DIM}N.o.t.k.${RESET}`;
  if (priceType === "FREE") return `${GREEN}Gratis${RESET}`;
  if (priceType === "EXCHANGE") return `${YELLOW}Ruilen${RESET}`;
  if (priceType === "MIN_BID") {
    const cents = listing.priceInfo?.priceCents;
    if (cents !== undefined) return `${GREEN}Bieden vanaf €${(cents / 100).toFixed(2)}${RESET}`;
    return `${GREEN}Bieden${RESET}`;
  }

  const cents = listing.priceInfo?.priceCents;
  if (cents !== undefined) {
    return `${GREEN}€${(cents / 100).toFixed(2)}${RESET}`;
  }
  return `${DIM}Prijs onbekend${RESET}`;
}

function parseRelativeDutchDate(dateStr: string): Date | null {
  const lower = dateStr.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (lower === "vandaag") return today;
  if (lower === "gisteren") {
    today.setDate(today.getDate() - 1);
    return today;
  }
  if (lower === "eergisteren") {
    today.setDate(today.getDate() - 2);
    return today;
  }
  return null;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const relative = parseRelativeDutchDate(dateStr);
  if (relative) {
    return relative.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export function formatListingList(
  listings: readonly Listing[],
  options: { page: number; limit: number; totalResults: number },
): string {
  if (listings.length === 0) {
    return "Geen resultaten gevonden.";
  }

  const lines: string[] = [];
  const startIndex = (options.page - 1) * options.limit;

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const num = startIndex + i + 1;
    const title = listing.title ?? "Geen titel";
    const price = formatPrice(listing);
    const location = listing.location?.cityName ?? "";
    const date = formatDate(listing.date);

    lines.push(`${BOLD}${num}.${RESET} ${BOLD}${title}${RESET}`);
    const meta = [price, location, date].filter(Boolean).join("  ");
    lines.push(`   ${meta}`);

    if (listing.vipUrl) {
      lines.push(`   ${DIM}https://www.marktplaats.nl${listing.vipUrl}${RESET}`);
    }
    lines.push("");
  }

  const totalPages = Math.ceil(options.totalResults / options.limit);
  lines.push(
    `${DIM}Showing ${listings.length} of ${options.totalResults} results. Page ${options.page} of ${totalPages}.${RESET}`,
  );
  if (options.page < totalPages) {
    lines.push(`${DIM}Use --page ${options.page + 1} to see more.${RESET}`);
  }

  return lines.join("\n");
}

export function formatListingDetail(listing: Listing): string {
  const lines: string[] = [];

  lines.push(`${BOLD}${listing.title ?? "Geen titel"}${RESET}`);
  lines.push("");
  lines.push(formatPrice(listing));
  lines.push("");

  if (listing.description) {
    lines.push(listing.description);
    lines.push("");
  }

  if (listing.location?.cityName) {
    lines.push(`${CYAN}Locatie:${RESET} ${listing.location.cityName}`);
  }

  if (listing.date) {
    lines.push(`${CYAN}Datum:${RESET} ${formatDate(listing.date)}`);
  }

  if (listing.sellerInformation?.sellerName) {
    lines.push(`${CYAN}Verkoper:${RESET} ${listing.sellerInformation.sellerName}`);
  }

  if (listing.attributes && listing.attributes.length > 0) {
    lines.push("");
    lines.push(`${BOLD}Kenmerken:${RESET}`);
    for (const attr of listing.attributes) {
      if (attr.key && attr.value) {
        lines.push(`  ${attr.key}: ${attr.value}`);
      }
    }
  }

  if (listing.imageUrls && listing.imageUrls.length > 0) {
    lines.push("");
    lines.push(`${BOLD}Afbeeldingen:${RESET}`);
    for (const url of listing.imageUrls) {
      lines.push(`  ${DIM}${url}${RESET}`);
    }
  }

  if (listing.vipUrl) {
    lines.push("");
    lines.push(`${CYAN}Link:${RESET} https://www.marktplaats.nl${listing.vipUrl}`);
  }

  return lines.join("\n");
}

function formatListingForJson(listing: Listing) {
  const cents = listing.priceInfo?.priceCents;
  const priceEur = cents !== undefined ? cents / 100 : null;

  return {
    id: listing.itemId,
    url: listing.vipUrl ? `https://www.marktplaats.nl${listing.vipUrl}` : null,
    title: listing.title ?? null,
    description: listing.description ?? null,
    price: {
      cents: listing.priceInfo?.priceCents ?? null,
      eur: priceEur,
      type: listing.priceInfo?.priceType ?? null,
    },
    location: {
      city: listing.location?.cityName ?? null,
      country: listing.location?.countryName ?? null,
      latitude: listing.location?.latitude ?? null,
      longitude: listing.location?.longitude ?? null,
      distanceMeters: listing.location?.distanceMeters ?? null,
    },
    seller: {
      id: listing.sellerInformation?.sellerId ?? null,
      name: listing.sellerInformation?.sellerName ?? null,
      verified: listing.sellerInformation?.isVerified ?? null,
    },
    date: listing.date ?? null,
    categoryId: listing.categoryId ?? null,
    images:
      listing.pictures?.map((p) => ({
        small: p.extraSmallUrl ?? null,
        medium: p.mediumUrl ?? null,
        large: p.largeUrl ?? null,
        extraLarge: p.extraExtraLargeUrl ?? null,
      })) ??
      listing.imageUrls?.map((url) => ({
        medium: url.startsWith("//") ? `https:${url}` : url,
      })) ??
      [],
    attributes: Object.fromEntries(
      (listing.extendedAttributes ?? listing.attributes ?? [])
        .filter((a) => a.key && a.value)
        .map((a) => [a.key!, a.values && a.values.length > 1 ? a.values : a.value!]),
    ),
    isAd: listing.priorityProduct != null && listing.priorityProduct !== "NONE",
    isReserved: listing.reserved ?? false,
    traits: listing.traits ?? [],
    verticals: listing.verticals ?? [],
  };
}

export function formatAsJson(data: unknown): string {
  if (data && typeof data === "object" && "listings" in data) {
    const response = data as {
      listings: Listing[];
      totalResultCount?: number;
      [k: string]: unknown;
    };
    return JSON.stringify(
      {
        ...Object.fromEntries(Object.entries(response).filter(([k]) => k !== "listings")),
        listings: response.listings.map(formatListingForJson),
      },
      null,
      2,
    );
  }

  if (data && typeof data === "object" && "itemId" in data) {
    return JSON.stringify(formatListingForJson(data as Listing), null, 2);
  }

  return JSON.stringify(data, null, 2);
}
