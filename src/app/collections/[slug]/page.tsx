import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXContent } from "@draftbase/renderer";
import { ProductCard } from "@/components/ProductCard";
import { getCollections, getProducts } from "@/lib/draftbase";
import { SITE_URL } from "@/lib/site";

// Enumerates every page to emit. Required by `output: "export"`.
export async function generateStaticParams() {
	const collections = await getCollections();
	return collections.map((collection) => ({ slug: collection.fields.slug }));
}

async function findCollection(slug: string) {
	const collections = await getCollections();
	return collections.find((entry) => entry.fields.slug === slug);
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const collection = await findCollection(slug);
	return {
		title: collection?.fields.title,
		description: collection?.fields.description?.slice(0, 160),
		alternates: { canonical: `/collections/${slug}/` },
	};
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const [collection, products] = await Promise.all([findCollection(slug), getProducts()]);
	if (!collection) notFound();

	const inCollection = products.filter(
		(product) => product.fields.collection?._id === collection._id,
	);

	const schema = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: collection.fields.title,
		url: `${SITE_URL}/collections/${slug}/`,
		mainEntity: {
			"@type": "ItemList",
			itemListElement: inCollection.map((product, index) => ({
				"@type": "ListItem",
				position: index + 1,
				name: product.fields.title,
				url: `${SITE_URL}/products/${product.fields.slug}/`,
			})),
		},
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
			/>
			<section className="hero" style={{ paddingBottom: "24px" }}>
				<h1 style={{ fontSize: "var(--text-4xl)" }}>{collection.fields.title}</h1>
				<div className="db-content muted">
					<MDXContent source={collection.fields.description ?? ""} />
				</div>
			</section>
			<section className="wrap" style={{ paddingBottom: "64px" }}>
				<ul className="grid">
					{inCollection.map((product) => (
						<ProductCard key={product._id} product={product} />
					))}
				</ul>
			</section>
		</>
	);
}
