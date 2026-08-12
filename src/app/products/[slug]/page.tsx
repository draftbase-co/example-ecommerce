import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXContent } from "@draftbase/renderer";
import { formatPrice, getProducts } from "@/lib/draftbase";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export async function generateStaticParams() {
	const products = await getProducts();
	return products.map((product) => ({ slug: product.fields.slug }));
}

async function findProduct(slug: string) {
	const products = await getProducts();
	return products.find((product) => product.fields.slug === slug);
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const product = await findProduct(slug);
	const image = product?.fields.images?.[0]?.url ?? undefined;
	return {
		title: product?.fields.title,
		description: product?.fields.summary,
		alternates: { canonical: `/products/${slug}/` },
		openGraph: {
			type: "website",
			title: product?.fields.title,
			description: product?.fields.summary,
			images: image,
		},
	};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const product = await findProduct(slug);
	if (!product) notFound();

	const {
		title,
		price,
		currency,
		summary,
		description,
		images,
		options,
		collection,
		inStock,
		stripePaymentLink,
	} = product.fields;
	const available = inStock !== false && Boolean(stripePaymentLink);
	const canonical = `${SITE_URL}/products/${slug}/`;

	const schema = [
		{
			"@context": "https://schema.org",
			"@type": "Product",
			name: title,
			description: summary,
			image: images?.map((image) => image.url).filter(Boolean),
			brand: { "@type": "Brand", name: SITE_NAME },
			offers: {
				"@type": "Offer",
				url: canonical,
				priceCurrency: currency ?? "USD",
				price: price.toFixed(2),
				availability:
					inStock === false
						? "https://schema.org/OutOfStock"
						: "https://schema.org/InStock",
			},
		},
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Shop", item: `${SITE_URL}/` },
				{ "@type": "ListItem", position: 2, name: title, item: canonical },
			],
		},
	];

	return (
		<div className="detail">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
			/>

			<div className="gallery">
				{images?.map((image, index) => (
					<img
						key={image.url ?? index}
						src={image.url ?? ""}
						alt={image.altText ?? title}
						loading={index === 0 ? "eager" : "lazy"}
					/>
				))}
			</div>

			<div>
				{collection && (
					<Link className="chip" href={`/collections/${collection.fields.slug}`}>
						{collection.fields.title}
					</Link>
				)}
				<h1 style={{ fontSize: "var(--text-3xl)", margin: "12px 0 8px" }}>{title}</h1>
				<p className="price" style={{ fontSize: "var(--text-xl)", color: "inherit" }}>
					{formatPrice(price, currency)}
				</p>
				<p className="muted">{summary}</p>

				{options && options.length > 0 && (
					<ul className="options">
						{options.map((option) => (
							<li key={option.name}>
								<strong>{option.name}:</strong>{" "}
								{option.values.map((value) => (
									<span key={value} className="chip">
										{value}
									</span>
								))}
							</li>
						))}
					</ul>
				)}

				{/* Checkout is a Stripe Payment Link stored on the entry — a hosted page, so no
				    keys, no cart state and no server of our own. Options above are display-only
				    for the same reason; see the README. */}
				<a
					className="buy"
					href={stripePaymentLink ?? "#"}
					aria-disabled={!available}
					rel="noopener noreferrer"
				>
					{inStock === false
						? "Sold out"
						: stripePaymentLink
							? "Buy now"
							: "Checkout not configured"}
				</a>

				<div className="db-content">
					<MDXContent source={description ?? ""} />
				</div>
			</div>
		</div>
	);
}
