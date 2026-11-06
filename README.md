# Acuity.One landing page

Static page. Open `standalone-experience/index.html` through any static server (e.g. `python3 -m http.server` in that folder). ES modules don't load from `file://`.

## Page structure (`standalone-experience/index.html`)
1. `#track-hero`: the original 360vh Horizon Portal scrub (96 frames, `assets/horizon-portal`). The overlay copy is in `#copy-hero`.
2. `#intro`: what Acuity.One is (research, study, practice, continuity).
3. `#tools`: five tool chapters (`#tool-agent`, `#tool-search`, `#tool-codex`, `#tool-lumennous`, `#tool-myaeon`), each with an HTML/CSS interface vignette.
4. `#journey`: the unified path diagram and the consent model.
5. `#vault`: WisdomVault (Membership).
6. `#pricing`: Free (£0) and Membership (price TBC). Both are marked Coming soon.
7. `#compare`: standalone bring-your-own-key tools vs One Free vs Membership.
8. `#faq`: native `<details>` accordions.
9. `#track-lake`: the original 360vh Milky Way Lake scrub. The overlay is in `#copy-lake` and contains the invitation form. `#invitation` is an anchor at the copy-hold point.
10. `footer.site`: tool links, acuity.institute, Privacy, © 2026.

## Updating
- Copy: edit the text directly in index.html. Prices and allowances appear in `#pricing`, `#compare`, `#faq` and the hero `.sub`. Keep them consistent.
- Scrub timing: `setupScrubSection({... scrubRange, holdStart})` in the module script. Track height: `.track { height: 360vh }`.
- Invitation: the form builds a `mailto:hello@acuity.institute` draft in the visitor's mail app. Nothing is sent by the page. To use a real sign-up endpoint, replace the submit handler at the end of the script.
- Brand tokens: `shared/brand.css` (`:root`). Logo SVG: `HEX_LOGO` in `shared/scroll-clock.js`.
