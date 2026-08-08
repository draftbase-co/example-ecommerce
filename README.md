# Draftbase example — Storefront

A product catalogue with collections, image galleries and real checkout, built with
[Next.js](https://nextjs.org) (`output: "export"`) and [Draftbase](https://draftbase.co).
Everything renders at build time and deploys to GitHub Pages as static HTML.

Checkout runs on **Stripe Payment Links** — hosted pages whose URL is stored on the product
entry. That means no cart server, no Stripe keys anywhere in this repo, and nothing to
secure at runtime.

Step up from [example-blog](https://github.com/draftbase-co/example-blog): this one adds
**list-valued media fields**, a **`json` field**, and the React/RSC side of the renderer.

## Quickstart

```bash
npm install
cp .env.example .env      # add your API keys
npm run seed              # creates the templates + 5 sample products in your org
npm run dev
```

Products seed without a payment link. Paste a Stripe Payment Link into each product's
`stripePaymentLink` field in Draftbase to turn on the Buy button.

## Content model

**`collection`**

| Field | Type | |
| --- | --- | --- |
| `title` | text | required |
| `slug` | text | required, used as the URL |
| `description` | richText | |
| `image` | media | |

**`product`**

| Field | Type | |
| --- | --- | --- |
| `title` | text | required |
| `slug` | text | required, used as the URL |
| `price` | number | required, major units (24.5 = $24.50) |
| `currency` | text | one of USD/EUR/GBP/CAD, formatted with `Intl.NumberFormat` |
| `summary` | text | max 200 chars |
| `description` | richText | |
| `images` | media **list** | resolves to an array; the first is the card image |
| `collection` | reference → `collection` | |
| `stripePaymentLink` | text | a `https://buy.stripe.com/...` URL |
| `inStock` | boolean | false renders a disabled Sold out button |
| `options` | json | `[{ "name": "Size", "values": ["S","M","L"] }]` |

## How it works

- [`src/lib/draftbase.ts`](src/lib/draftbase.ts) imports `server-only`, so importing it from
  a Client Component is a **build error** — that is the guardrail keeping the key server-side.
- `generateStaticParams()` enumerates every product and collection page; `output: "export"`
  requires it and will not fall back to on-demand rendering.
- Rich text is rendered with `<MDXContent>` from `@draftbase/renderer`, a React Server
  Component. Pass a `components` map to render your own MDX components.
- Images use plain `<img>`: `next/image`'s optimiser needs a server, which a static export
  does not have.

## Why Payment Links instead of a cart

A cart needs somewhere to hold state and something holding a Stripe **secret** key to create
a session. Both mean a server, which means hosting cost and an attack surface. Payment Links
move all of that to Stripe: the URL on the entry is public by design, and the money never
touches this site.

The trade-off is real — one product per checkout, and the `options` shown on the product
page are display-only. When you need multi-item carts, inventory or per-variant pricing,
move to Stripe Checkout Sessions behind a serverless function and drop `output: "export"`.

## Security — this repo is public

- The delivery key is read as `process.env.DRAFTBASE_API_KEY` in server code only. Next
  inlines `NEXT_PUBLIC_*` variables into the browser bundle — **do not rename it to
  `NEXT_PUBLIC_DRAFTBASE_API_KEY`.**
- Use a **delivery-scoped** key: read-only, published entries only. Drafts are invisible to
  it, so an unpublished product cannot leak into a build.
- The **management** key is only for `npm run seed`. Keep it in your local `.env` and out of
  CI — it can write and delete content.
- No Stripe key of any kind belongs in this repo. Payment Links are URLs, not credentials.
- `.env` is gitignored; only the empty `.env.example` is committed.

Verify after a build: `grep -r "$(grep DRAFTBASE_API_KEY .env | cut -d= -f2)" out/` should
find nothing.

## Deploying

1. Settings → Pages → Source: **GitHub Actions**.
2. Settings → Secrets and variables → Actions → add `DRAFTBASE_API_KEY` (delivery-scoped).
3. Optional: on the same page, add a repository **variable** `DRAFTBASE_ENVIRONMENT` if your
   content lives in an environment other than `production`.
4. Push to `main`.

If your repo isn't named `example-ecommerce`, update `basePath` in
[`next.config.mjs`](next.config.mjs). On a custom domain, remove `basePath` and
`trailingSlash`.

### Rebuild when content is published

Add a Draftbase webhook pointing at:

```
POST https://api.github.com/repos/<owner>/example-ecommerce/dispatches
{ "event_type": "draftbase-publish" }
```

with an `Authorization: Bearer <fine-grained PAT>` header scoped to this repo with
**Contents: read and write**. That token lives in Draftbase's webhook config — never here.

## Not included

- **Cart, inventory counts, per-variant pricing, orders, accounts** — all need a server. See
  the trade-off section above.
- **Search** — see [example-course](https://github.com/draftbase-co/example-course) for a
  build-time index.
- **Draft previews** — need a running server.
