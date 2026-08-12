import Link from "next/link";
import { formatPrice, type DbEntry, type Product } from "@/lib/draftbase";

export function ProductCard({ product }: { product: DbEntry<Product> }) {
	const { title, slug, price, currency, images, inStock } = product.fields;
	const cover = images?.[0];

	return (
		<li className="product">
			<Link href={`/products/${slug}`}>
				{/* Plain <img>: `output: "export"` has no server to run next/image's optimiser. */}
				{cover?.url && <img src={cover.url} alt={cover.altText ?? title} loading="lazy" />}
				<div className="body">
					<h3>{title}</h3>
					<p className="price">
						{formatPrice(price, currency)}
						{inStock === false && " · Sold out"}
					</p>
				</div>
			</Link>
		</li>
	);
}
