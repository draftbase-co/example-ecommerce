import type { Metadata } from "next";
import Link from "next/link";
import "@draftbase/renderer/styles.css";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: { default: `${SITE_NAME} — everyday carry goods`, template: `%s — ${SITE_NAME}` },
	description: SITE_DESCRIPTION,
	alternates: { canonical: "/" },
	openGraph: {
		type: "website",
		siteName: SITE_NAME,
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
	},
	twitter: { card: "summary_large_image" },
};

const storeSchema = {
	"@context": "https://schema.org",
	"@type": "Store",
	name: SITE_NAME,
	description: SITE_DESCRIPTION,
	url: SITE_URL,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
				/>
				<div className="banner">
					Example project built with{" "}
					<a href="https://draftbase.co" target="_blank" rel="noopener">
						Draftbase CMS
					</a>{" "}
					— a starter you can customize.
				</div>

				<header className="site">
					<div>
						<Link className="brand" href="/">
							{SITE_NAME}
						</Link>
						<nav>
							<Link href="/#shop">Shop</Link>
							<Link href="/#faq">FAQ</Link>
						</nav>
					</div>
				</header>

				<main>{children}</main>

				<footer className="site">
					<p>
						© {new Date().getFullYear()} {SITE_NAME}. Checkout runs on Stripe&apos;s
						hosted pages.
					</p>
					<p>
						Built as an example with{" "}
						<a href="https://draftbase.co" target="_blank" rel="noopener">
							Draftbase CMS
						</a>
					</p>
				</footer>
			</body>
		</html>
	);
}
