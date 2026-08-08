import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { getCollections, getProducts } from "@/lib/draftbase";

export default async function HomePage() {
	const [products, collections] = await Promise.all([getProducts(), getCollections()]);

	return (
		<>
			<h1>Everything for a day outside</h1>
			<p className="muted">
				{products.length} product{products.length === 1 ? "" : "s"}, published from
				Draftbase and rendered at build time.
			</p>

			{collections.length > 0 && (
				<p style={{ marginBottom: "2rem" }}>
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
		</>
	);
}
