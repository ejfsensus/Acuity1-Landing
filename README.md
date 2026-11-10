# Acuity.One — membership presentation

An editorial redesign of the supplied 6 November 2026 landing-page draft. The Horizon Portal hero and Milky Way Lake closing sequence retain their original assets, 360vh scroll tracks and scrub timings. The site footer is retained.

## Run

Serve `dist/` with any static server. No build or package installation is needed. For the GitHub layout, serve `standalone-experience/` instead. ES modules need HTTP rather than opening the HTML as a local file.

## Design

The middle sections use Acuity's near-black `#09090f`, warm gold `#d4a843` / `#e8c96a`, faint violet atmosphere, fine geometry and restrained glass. Inter carries the main copy, Cormorant Garamond provides the editorial accent and IBM Plex Mono provides navigation and figure labels. The original cinematic overlays keep their type treatment.

- `shared/membership.css`: responsive design system, scoped to the middle sections.
- `shared/membership.js`: accessible tool tabs, search-scope concept, visual quiet moment, invitation-plan selection and decorative chart spokes.
- `assets/membership/inquiry-book.webp`: custom generated book / portal artwork.
- `assets/membership/wisdom-vault.webp`: custom generated cryptex artwork.
- `shared/brand.css` and `shared/scroll-clock.js`: retained original foundations.

The product interfaces are explicitly labelled illustrative concepts. They are HTML/CSS, not screenshots or connected member functionality. Source links open the public reading room.

## Grounding and open decisions

Reviewed the `ejfsensus/Acuity.One` `gitbot/platform-foundation` README and `docs/STATUS.md`, the live `acuity.institute` homepage, and the homepage/library source in `ejfsensus/acuity.institute-landing`.

The page promotes the planned membership. It does not imply that integration is complete. The supplied draft's five free tasks and unlimited membership direction are retained as a proposed offer, with pending final terms.

Before a public launch, confirm:

1. Subscription price and billing frequency.
2. Launch date and invitation process.
3. What counts as a task, fair-use terms and specialist audio/media allowances.
4. Final Free and Membership entitlements, and cross-tool parity.
5. Subscription signup, billing, and consent/privacy copy. Invitation requests are separate from a membership account.

The invitation form posts a schema 1.0 enquiry to the existing Acuity Institute capture workflow. The page sends it to `/api/invitation`, and the server forwards that body to the n8n webhook. It does not subscribe or bill. The form's name-field access reads the input rather than the HTML form's own name property. Plan buttons preselect the requested tier.

## Delivery checks

- Browser review at desktop width and embedded 390px, 834px and 320px responsive viewports; no page-level horizontal overflow after correcting the tablet artwork.
- All five tool tabs, arrow/Home keyboard navigation, search-scope control, quiet-moment start/reset, invitation-tier selection and empty-email validation checked.
- Comparison accordion opened on mobile; table scroll remains within its container.
- JavaScript syntax and static resource/anchor checks passed.
- Original film frames retained byte-for-byte. Closing frames load as the visitor approaches, and failed individual frames retain their timeline positions.
- Reduced-motion and no-JavaScript fallback paths retained and inspected in source. Real iPhone/iPad, assistive-technology and production signup testing remain outstanding.

No application backend, Acuity production deployment, database or billing system was changed.
