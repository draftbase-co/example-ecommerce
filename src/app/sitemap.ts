import type { MetadataRoute } from "next";
import { getCollections, getProducts } from "@/lib/draftbase";
import { SITE_URL } from "@/lib/site";

// `output: "export"` writes this to /sitemap.xml at build time, from the same entries the
// pages are built from — so a published product is in the sitemap the moment it ships.
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [products, collections] = await Promise.all([getProducts(), getCollections()]);

	return [
		{ url: `${SITE_URL}/`, priority: 1 },
		...collections.map((collection) => ({
			url: `${SITE_URL}/collections/${collection.fields.slug}/`,
			lastModified: collection.updatedAt,
		})),
		...products.map((product) => ({
			url: `${SITE_URL}/products/${product.fields.slug}/`,
			lastModified: product.updatedAt,
		})),
	];
}
