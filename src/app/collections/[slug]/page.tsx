import { notFound } from "next/navigation";
import { MDXContent } from "@draftbase/renderer";
import { ProductCard } from "@/components/ProductCard";
import { getCollections, getProducts } from "@/lib/draftbase";

// Enumerates every page to emit. Required by `output: "export"`.
export async function generateStaticParams() {
	const collections = await getCollections();
	return collections.map((collection) => ({ slug: collection.fields.slug }));
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const [collections, products] = await Promise.all([getCollections(), getProducts()]);
	const collection = collections.find((entry) => entry.fields.slug === slug);
	if (!collection) notFound();

	const inCollection = products.filter(
		(product) => product.fields.collection?._id === collection._id,
	);

	return (
		<>
			<h1>{collection.fields.title}</h1>
			<MDXContent source={collection.fields.description ?? ""} />
			<ul className="grid" style={{ marginTop: "2rem" }}>
				{inCollection.map((product) => (
					<ProductCard key={product._id} product={product} />
				))}
			</ul>
		</>
	);
}
