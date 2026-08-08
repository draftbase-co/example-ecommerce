import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXContent } from "@draftbase/renderer";
import { formatPrice, getProducts } from "@/lib/draftbase";

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
  const product = await findProduct((await params).slug);
  return {
    title: product?.fields.title,
    description: product?.fields.summary,
    openGraph: { images: product?.fields.images?.[0]?.url ?? undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await findProduct((await params).slug);
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

  return (
    <div className="detail">
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
        <h1 style={{ marginBottom: "0.25rem" }}>{title}</h1>
        <p className="price" style={{ fontSize: "1.25rem", margin: 0 }}>
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

        <MDXContent source={description ?? ""} />
      </div>
    </div>
  );
}
