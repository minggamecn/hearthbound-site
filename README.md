# Hearthbound website

The public site for Hearthbound, served by GitHub Pages at
<https://minggamecn.github.io/hearthbound-site/>. Plain HTML and CSS: no build step, no
JavaScript framework, no external services, no cookies, no analytics.

The game itself lives in the `sims` repository (Cocos Creator project). Its design documents
are the source of truth for anything the site says about the game: `docs/GDD.md`, and
`docs/TRIAL.md` for the free year and the full game.

| Route | Page |
| --- | --- |
| `/`, `/zh/` | Homepage: the game, its settlers, valleys and events, and the price |
| `/support/`, `/zh/support/` | Support: the free year, buying and restoring, refunds, saves, settings, contact |
| `/privacy/`, `/zh/privacy/` | Privacy policy (the URL for Play Console) |
| `/terms/`, `/zh/terms/` | Terms of use |

## Files

```
index.html          Homepage, English (sends Chinese-language browsers to zh/)
zh/index.html       Homepage, 简体中文
support/ privacy/ terms/           English pages (one index.html each)
zh/support/ zh/privacy/ zh/terms/  Chinese pages
styles.css          Shared stylesheet: dark wood homepage, parchment document pages (with a dark variant)
404.html            Bilingual not-found page (GitHub serves it for any unknown URL)
assets/             Images, all made from the game's own art (see below)
tools/make-images.py  Makes assets/ from the game repository
.nojekyll           Tells GitHub Pages to serve the files as they are
```

## Images

Everything in `assets/` comes from the game repository:

- `hero.webp`, `og-image.jpg`: `store/art/store_feature_graphic.png`.
- `icon-*.png`, `apple-touch-icon.png`, `favicon-32.png`: `store/art/app_icon.png`.
- `shots/*.webp`: smoke-test screenshots (`build/smoke/*-iphone-390x844-*.png`), 600 px wide.
  The `-zh` shots are the Chinese build's; the homestead and defence shots exist only in English.
- `shots/autumn*.webp`, `shots/winter*.webp`: the store colony (`tools/store/colony.ts` in the game) in autumn
  and winter, captured by `tools/season-shots.mjs` with the game's `?season=` preview into the game's `build/site/`.
- `settlers/settler-NN.webp`: the first (content) frame of `por_settler_NN`.
- `art/*.webp`: the `ill_biome_*`, `ill_event_*` and `ill_chronicle_*` banners.

Rebuild them after the art or the screenshots change (needs Pillow; the screenshots come from
the game's last `npm run smoke`):

```sh
node tools/season-shots.mjs              # after a web build and tools/store/colony.ts in the game
python tools/make-images.py            # reads ../sims; or pass the game repository's path
```

It overwrites `assets/` with the same file names, so the pages pick the new images up.

## Editing

Every page exists once per language: edit the English file and its `zh/` counterpart together,
and keep each page's `<link rel="alternate" hreflang=…>` pair pointing at the other. The header,
navigation and footer are repeated in every file.

- Settler names stay in Latin letters in Chinese too, as in the game (names are identity).
- Game terms in Chinese follow the game's catalog (`assets/resources/i18n/zh-Hans.json`):
  聚落, 方针, 提议, 教训, 阅历, 贤者, 宪章, 开拓者, 传家宝, 传承堂, 编年史, 解锁完整版, 指派.
- Links between pages are relative, so the site works under the repository path and under a
  custom domain. `404.html` is the exception: GitHub serves it from any URL, so it uses absolute
  `/hearthbound-site/` paths.
- The English homepage has a three-line script that sends Chinese-language browsers to `zh/`.
  English links back to the homepage carry `?lang=en`, which the script honours.

The support address `ming.life@foxmail.com` and the operator name (Ming Zhu) appear in the
privacy, terms and support pages of both languages. Search for them when either changes; they
must match the developer name and contact email in Play Console.

### When the game launches

The homepage shows a "Coming soon to Google Play" badge (a plain `<span>`, not a link). When the
listing is public, turn it into a link in both homepages:

```html
<a class="store-badge" href="https://play.google.com/store/apps/details?id=com.mz.htbd">
  <span><small>Get it on</small><strong>Google Play</strong></span></a>
```

(Chinese: `<small>前往</small>`.) Google's official badge artwork may be used instead, under
Google's brand guidelines.

### When the policies change

Update "Last updated" / "更新日期" in both languages. Move the effective date only when the change
alters what readers agree to. The privacy policy promises that the game sends nothing off the
phone except through Google Play Billing: any feature that changes that (analytics, cloud saves,
crash reporting, ads) needs the policy updated before that version ships, and the Play Console
Data safety form with it.

## Preview

Serve the parent folder so the `/hearthbound-site/` path works like on GitHub Pages:

```sh
cd ..
python -m http.server 3000     # http://localhost:3000/hearthbound-site/
```

Check both languages, the language switches, a narrow phone width and a desktop width, and
the 404 page under `/hearthbound-site/`.

## Deploy

GitHub Pages serves the `main` branch root (**Settings → Pages → Source: Deploy from a branch**,
branch `main`, folder `/`). Every push is live within about a minute.

Play Console URLs:

- Privacy policy: `https://minggamecn.github.io/hearthbound-site/privacy/`
- Website (store listing contact details): `https://minggamecn.github.io/hearthbound-site/`

To use a custom domain, add a `CNAME` file, update the canonical, alternate and `og:` URLs at the
top of every page, and change the absolute paths in `404.html`.
