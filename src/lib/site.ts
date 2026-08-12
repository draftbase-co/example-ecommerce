/** Site-level constants. Safe to import from anywhere — no API key, no SDK. */
export const SITE_NAME = "Fieldnote";
export const SITE_DESCRIPTION =
	"Simple, durable everyday carry goods: notebooks, organizers, pens, and totes. Free shipping over $50.";
/** Set by CI so a fork's canonical URLs point at its own deployment. */
export const SITE_URL = process.env.SITE_URL ?? "https://demo-ecommerce.draftbase.co";
