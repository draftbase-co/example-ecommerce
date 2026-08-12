import "server-only";
import { createClient, type Entry } from "@draftbase/sdk";

const apiKey = process.env.DRAFTBASE_API_KEY;
if (!apiKey) {
	throw new Error(
		"DRAFTBASE_API_KEY is not set. Copy .env.example to .env and add a delivery-scoped key.",
	);
}

// `server-only` above makes this a build error if a Client Component ever imports this file,
// which is what keeps the API key out of the browser bundle.
const client = createClient({
	apiKey,
	baseUrl: process.env.DRAFTBASE_API_URL ?? "https://api.draftbase.co",
	environment: process.env.DRAFTBASE_ENVIRONMENT ?? "production",
	cacheTtlMs: 60_000,
});

/** The API returns entry-level `tags`; the SDK's `Entry` type doesn't declare them yet. */
export type DbEntry<Fields> = Entry<Fields> & { tags: string[] };

/**
 * All published entries of one template, following cursor pagination to the end.
 * `templateId` is the template's key (e.g. "product"), not a database id.
 */
export async function getAll<Fields>(templateId: string, include = 1): Promise<DbEntry<Fields>[]> {
	const all: DbEntry<Fields>[] = [];
	let after: string | undefined;
	do {
		// The SDK's option is named `contentTypeId`, but the API's query param is `templateId`.
		const page = await client.getEntries<Fields>({ templateId, after, limit: 100, include });
		all.push(...(page.entries as DbEntry<Fields>[]));
		after = page.nextCursor ?? undefined;
	} while (after);
	return all;
}

export const getProducts = () => getAll<Product>("product");
export const getCollections = () => getAll<Collection>("collection");

/** Home-page FAQ, sorted by the entry's `order` field. Also feeds FAQPage JSON-LD. */
export async function getFaqs(): Promise<DbEntry<Faq>[]> {
	const faqs = await getAll<Faq>("faq");
	return faqs.sort((a, b) => (a.fields.order ?? 0) - (b.fields.order ?? 0));
}

export function formatPrice(amount: number, currency = "USD"): string {
	return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export interface Media {
	url?: string | null;
	altText?: string;
}

export interface Faq {
	question: string;
	answer: string;
	order?: number;
}

export interface Collection {
	title: string;
	slug: string;
	description: string;
	image?: Media | null;
}

export interface Product {
	title: string;
	slug: string;
	/** Major units (e.g. 24.5 = $24.50). Kept as a number so it can be formatted per locale. */
	price: number;
	currency?: string;
	summary: string;
	description: string;
	/** A `list: true` media field resolves to an array of assets. */
	images?: Media[] | null;
	collection?: { _id: string; fields: Collection } | null;
	/** A Stripe Payment Link URL. Public by design — it is just a hosted checkout page. */
	stripePaymentLink?: string;
	inStock?: boolean;
	/** Free-form `json` field: [{ name: "Size", values: ["S", "M", "L"] }] */
	options?: { name: string; values: string[] }[];
}
