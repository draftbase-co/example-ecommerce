import type { Metadata } from "next";
import Link from "next/link";
import "@draftbase/renderer/styles.css";
import "./globals.css";

export const metadata: Metadata = {
	title: { default: "Field Supply Co.", template: "%s — Field Supply Co." },
	description: "A statically generated storefront powered by Draftbase and Stripe Payment Links.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<div className="wrap">
					<header className="site">
						<Link className="brand" href="/">
							Field Supply Co.
						</Link>
						<Link href="/">Shop</Link>
					</header>
					{children}
					<footer className="site">
						<span>
							Demo store — checkout runs on Stripe&apos;s hosted pages. Content
							managed in <a href="https://draftbase.co">Draftbase</a>.
						</span>
					</footer>
				</div>
			</body>
		</html>
	);
}
