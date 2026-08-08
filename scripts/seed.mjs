/**
 * Creates this example's templates and a few published entries in your Draftbase org.
 *
 * Run locally only — it needs a MANAGEMENT-scoped key, which can write and delete content.
 * Never put that key in CI or in a hosting provider's environment.
 *
 *   cp .env.example .env   # add DRAFTBASE_MANAGEMENT_API_KEY
 *   npm run seed
 *
 * Safe to re-run: existing templates are left alone and entries are matched by title.
 * Products are seeded without a Stripe Payment Link — add your own in the Draftbase UI.
 */
const BASE_URL = process.env.DRAFTBASE_API_URL ?? "https://api.draftbase.co";
const API_KEY = process.env.DRAFTBASE_MANAGEMENT_API_KEY;
const ENV_ID = process.env.DRAFTBASE_ENVIRONMENT ?? "production";
const LOCALE = "en-US";

if (!API_KEY) {
	console.error("Set DRAFTBASE_MANAGEMENT_API_KEY in .env (see .env.example).");
	process.exit(1);
}

async function api(path, { method = "GET", body } = {}) {
	const res = await fetch(new URL(path, BASE_URL), {
		method,
		headers: {
			Authorization: `Bearer ${API_KEY}`,
			...(body ? { "Content-Type": "application/json" } : {}),
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
	return res.status === 204 ? null : res.json();
}

/** A template's key is derived from its name ("Blog Post" -> "blogPost"), and is what
 *  entries and the delivery API refer to as `templateId`. */
async function ensureTemplate(template) {
	const existing = await api(`/templates?envId=${ENV_ID}`);
	const match = existing.find((t) => t._id === template.key);
	if (match) {
		console.log(`template ${template.key} already exists`);
		return match._id;
	}
	const { key, ...body } = template;
	const created = await api("/templates", { method: "POST", body: { ...body, envId: ENV_ID } });
	console.log(`template ${created._id ?? key} created`);
	return created._id ?? key;
}

/** Downloads a remote image and pushes it through Draftbase's presigned-upload flow. */
async function uploadImage(url, fileName, altText) {
	const file = await fetch(url);
	if (!file.ok) throw new Error(`could not download ${url}`);
	const contentType = file.headers.get("content-type") ?? "image/jpeg";
	const blob = await file.blob();

	const upload = await api("/media/upload-url", {
		method: "POST",
		body: { fileName, contentType, envId: ENV_ID },
	});
	const form = new FormData();
	for (const [name, value] of Object.entries(upload.fields)) form.append(name, value);
	form.append("file", blob, fileName);
	const put = await fetch(upload.url, { method: "POST", body: form });
	if (!put.ok) throw new Error(`storage upload failed: ${put.status} ${await put.text()}`);

	const { id } = await api("/media/confirm", {
		method: "POST",
		body: { storageKey: upload.storageKey, contentType, envId: ENV_ID, altText },
	});
	return id;
}

async function ensureEntry(templateId, titleField, fields, tags = []) {
	const list = await api(`/entries?envId=${ENV_ID}&templateId=${templateId}&limit=100`);
	const match = list.items.find((e) => e.fields[titleField] === fields[titleField]);
	if (match) {
		console.log(`entry "${fields[titleField]}" already exists`);
		return match._id;
	}
	const { id } = await api("/entries", {
		method: "POST",
		body: { templateId, locale: LOCALE, envId: ENV_ID, fields, tags },
	});
	await api(`/entries/${id}/status`, { method: "PATCH", body: { status: "published" } });
	console.log(`entry "${fields[titleField]}" created and published`);
	return id;
}

const templates = [
	{
		key: "collection",
		name: "Collection",
		titleField: "title",
		fields: [
			{ key: "title", label: "Title", type: "text", required: true },
			{ key: "slug", label: "Slug", type: "text", required: true, isSlug: true },
			{ key: "description", label: "Description", type: "richText" },
			{ key: "image", label: "Image", type: "media" },
		],
	},
	{
		key: "product",
		name: "Product",
		titleField: "title",
		fields: [
			{ key: "title", label: "Title", type: "text", required: true },
			{ key: "slug", label: "Slug", type: "text", required: true, isSlug: true },
			{ key: "price", label: "Price", type: "number", required: true, min: 0 },
			{
				key: "currency",
				label: "Currency",
				type: "text",
				defaultValue: "USD",
				options: ["USD", "EUR", "GBP", "CAD"],
			},
			{ key: "summary", label: "Summary", type: "text", multiline: true, maxLength: 200 },
			{ key: "description", label: "Description", type: "richText" },
			// `list: true` stores several assets; include resolves them to an array.
			{ key: "images", label: "Images", type: "media", list: true },
			{
				key: "collection",
				label: "Collection",
				type: "reference",
				referenceTemplateId: "collection",
			},
			{
				key: "stripePaymentLink",
				label: "Stripe Payment Link",
				type: "text",
				helpText:
					"A https://buy.stripe.com/... URL. Public by design — it is a hosted checkout page, not a key.",
			},
			{ key: "inStock", label: "In stock", type: "boolean", defaultValue: true },
			{
				key: "options",
				label: "Options",
				type: "json",
				helpText: '[{ "name": "Size", "values": ["S", "M", "L"] }]',
			},
		],
	},
];

const collections = [
	{
		title: "Everyday Carry",
		slug: "everyday-carry",
		image: "https://picsum.photos/seed/edc/1200/675",
		description:
			"The things that live in a pocket or a bag and get used without thinking about them.",
	},
	{
		title: "Camp Kitchen",
		slug: "camp-kitchen",
		image: "https://picsum.photos/seed/campkitchen/1200/675",
		description: "Cooking gear that packs flat, cleans easily and survives a tailgate.",
	},
];

const products = [
	{
		title: "Machined Pocket Knife",
		slug: "machined-pocket-knife",
		price: 89,
		collection: "everyday-carry",
		summary: "A four-piece knife with a steel frame lock and no branding on the blade.",
		images: ["https://picsum.photos/seed/knife1/900/900", "https://picsum.photos/seed/knife2/900/900"],
		options: [{ name: "Finish", values: ["Raw", "Stonewashed", "Black"] }],
		description: `Four parts, two screws, one blade. There is nothing in here that exists
to be mentioned on a spec sheet.

## Materials

- 14C28N stainless steel blade, 58–60 HRC
- 6061 aluminium frame
- Titanium clip, reversible for left-hand carry

## Care

Wipe it dry. That is the entire maintenance schedule.`,
	},
	{
		title: "Waxed Canvas Tote",
		slug: "waxed-canvas-tote",
		price: 128,
		collection: "everyday-carry",
		summary: "18 oz waxed canvas, leather handles, and a flat bottom that stands up on its own.",
		images: ["https://picsum.photos/seed/tote/900/900"],
		options: [{ name: "Colour", values: ["Field Tan", "Slate", "Olive"] }],
		description: `The wax finish keeps rain out and picks up creases where you use it, which
is either patina or wear depending on how you feel about it.

## Dimensions

16" wide, 14" tall, 6" deep. Fits a 15" laptop upright with room for a lunch.`,
	},
	{
		title: "Enamel Camp Mug",
		slug: "enamel-camp-mug",
		price: 24,
		collection: "camp-kitchen",
		summary: "12 oz of steel and enamel. Chips eventually. Never cracks.",
		images: ["https://picsum.photos/seed/mug/900/900"],
		options: [{ name: "Colour", values: ["White", "Navy", "Speckled Grey"] }],
		description: `Enamelware has been the same for a century because it was right the first
time. Oven safe, fire safe, dishwasher safe, and it will outlive the tent.`,
	},
	{
		title: "Folding Camp Stove",
		slug: "folding-camp-stove",
		price: 165,
		inStock: false,
		collection: "camp-kitchen",
		summary: "Packs to the size of a paperback. Boils a litre in four minutes.",
		images: ["https://picsum.photos/seed/stove/900/900"],
		description: `A stainless burner with folding pot supports and a windscreen that actually
attaches instead of blowing across the campsite.

## Fuel

Standard screw-thread isobutane canisters, available anywhere that sells camping gear.`,
	},
	{
		title: "Nesting Cook Set",
		slug: "nesting-cook-set",
		price: 96,
		collection: "camp-kitchen",
		summary: "Two pots, a lid that doubles as a pan, and a handle that grips all three.",
		images: ["https://picsum.photos/seed/cookset/900/900"],
		description: `Hard-anodised aluminium, which is the compromise everyone lands on: lighter
than steel, tougher than bare aluminium, and not precious about the heat source.`,
	},
];

async function main() {
	for (const template of templates) await ensureTemplate(template);

	const collectionIds = {};
	for (const { image, ...collection } of collections) {
		const cover = await uploadImage(
			image,
			`${collection.slug}.jpg`,
			`${collection.title} collection`,
		);
		collectionIds[collection.slug] = await ensureEntry("collection", "title", {
			...collection,
			image: cover,
		});
	}

	for (const { images, collection, ...product } of products) {
		const uploaded = [];
		for (const [index, image] of images.entries()) {
			uploaded.push(
				await uploadImage(image, `${product.slug}-${index}.jpg`, `${product.title}`),
			);
		}
		await ensureEntry("product", "title", {
			currency: "USD",
			inStock: true,
			...product,
			images: uploaded,
			collection: collectionIds[collection],
		});
	}

	console.log(
		"\nSeed complete. Add a Stripe Payment Link to each product in Draftbase to enable checkout, then run `npm run dev`.",
	);
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
