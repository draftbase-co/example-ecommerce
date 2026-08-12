import Link from "next/link";
import { FaqSection } from "@/components/FaqSection";
import { ProductCard } from "@/components/ProductCard";
import { getCollections, getFaqs, getProducts } from "@/lib/draftbase";
import { SITE_URL } from "@/lib/site";

export default async function HomePage() {
	const [products, collections, faqs] = await Promise.all([
		getProducts(),
		getCollections(),
		getFaqs(),
	]);

	const itemList = {
		"@context": "https://schema.org",
		"@type": "ItemList",
		itemListElement: products.map((product, index) => ({
			"@type": "Product",
			position: index + 1,
			name: product.fields.title,
			url: `${SITE_URL}/products/${product.fields.slug}/`,
			image: product.fields.images?.[0]?.url ?? undefined,
			offers: {
				"@type": "Offer",
				priceCurrency: product.fields.currency ?? "USD",
				price: product.fields.price.toFixed(2),
				availability:
					product.fields.inStock === false
						? "https://schema.org/OutOfStock"
						: "https://schema.org/InStock",
			},
		})),
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
			/>

			<section className="hero">
				<span className="badge">New arrivals</span>
				<h1>Everyday carry, made to last</h1>
				<p>
					Notebooks, organizers, and small goods designed for daily use. Free shipping
					over $50.
				</p>
				<a className="button" href="#shop">
					Shop the collection
				</a>
			</section>

			<section id="shop" className="wrap" style={{ paddingBottom: "48px" }}>
				<h2 className="section-title">Shop</h2>

				{collections.length > 0 && (
					<p style={{ textAlign: "center", marginBottom: "24px" }}>
						{collections.map((collection) => (
							<Link
								key={collection._id}
								className="chip"
								href={`/collections/${collection.fields.slug}`}
							>
								{collection.fields.title}
							</Link>
						))}
					</p>
				)}

				<ul className="grid">
					{products.map((product) => (
						<ProductCard key={product._id} product={product} />
					))}
				</ul>

				{products.length === 0 && (
					<p className="muted">
						No published products yet. Run <code>npm run seed</code>.
					</p>
				)}
			</section>

			<FaqSection faqs={faqs} />
		</>
	);
}
