# LE URBAN TEES – Billing & Invoice App

A responsive, fully client-side billing app for **LE URBAN TEES**
(MaraiMalai Nagar, Tamil Nadu · Instagram `@le_urban_tees`).

- Runs entirely in the browser: no backend, no database.
- Creates A4 portrait PDF invoices (jsPDF + jspdf-autotable). Long invoices flow onto extra pages.
- Works on phones, tablets, laptops and desktops from one codebase.
- Deploys to GitHub Pages with GitHub Actions.

Stack: React 18, TypeScript, Vite 5, jsPDF, Vitest.

---

## 1. Run it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install        # install dependencies
npm run dev        # start the dev server (prints a http://localhost:5173 URL)
```

Other commands:

```bash
npm run build      # type-check, then build the site into dist/
npm run preview    # serve the built site locally to check it
npm test           # run the unit tests (calculations, validation, amount in words)
npm run typecheck  # TypeScript check only
```

After the first `npm install`, a `package-lock.json` file appears. **Commit it**; the
deploy workflow uses it for fast, reproducible installs.

## 2. Deploy to GitHub Pages

1. Create a new repository on GitHub (any name) and push this project to its **main** branch:

   ```bash
   git init
   git add .
   git commit -m "LE URBAN TEES billing app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. In the repository open **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Open the **Actions** tab. The workflow **Deploy to GitHub Pages** starts on every push to
   `main` (you can also run it by hand with **Run workflow**). It installs, tests, builds and deploys.
5. When it turns green, the live address is shown:
   - in the **deploy** job of the workflow run (under `github-pages`), and
   - in **Settings → Pages**.

   It looks like `https://<your-username>.github.io/<your-repo>/`.

No repository name needs to be configured anywhere: `vite.config.ts` uses `base: './'`, so the
built files use relative paths and work under any Pages address.

> If your repository is private, GitHub Pages for private repos needs a paid GitHub plan.
> A public repository works on the free plan.

## 3. How the app behaves

| Area | Behaviour |
| --- | --- |
| Invoice number | Auto-generated (`INV-0001`, `INV-0002`, …). Editable. The counter is stored in the browser, and manually typing a higher number moves the counter past it. |
| Invoice date | Defaults to today; editable for back-dated invoices. Shown as `DD/MM/YYYY` in the PDF. |
| Bill To | Customer details plus an optional phone number (7 to 15 digits). Both appear on the PDF. |
| Items | Add/remove rows, S.No renumbers itself, line total = Qty × Amount/Qty. At least one row always exists. |
| Grand Total | Sum of all lines in ₹ (Indian digit grouping) plus the amount in words (Thousand / Lakh / Crore / Paise). |
| Payment | Pending = Grand Total − Advance (never below 0). Status: Paid / Partially Paid / Pending. |
| Validation | No negative numbers; advance cannot exceed the Grand Total; invoice number and date required; product, color, qty and amount are required before exporting. |
| New Invoice | Asks for confirmation if anything was entered, then resets and issues the next number. Shop details never change. |
| Saving | The current invoice and the number counter are kept in `localStorage`, so a refresh does not lose work. Data stays on that browser/device only. |
| PDF | Always A4 portrait, whatever the device. The file is named like `LE_URBAN_TEES_INV-0001.pdf`. |

**Note:** drafts and the invoice counter live in the browser of the device you use. Using the app on a
phone and a laptop keeps two separate counters.

## 4. Project structure

```
.github/workflows/deploy.yml   GitHub Actions: test, build, deploy to Pages
index.html
vite.config.ts                 base: './' for GitHub Pages
src/
  main.tsx, App.tsx            app shell and state
  constants.ts                 shop details, product list, colors, payment types
  types.ts
  components/                  Header, InvoiceDetails, ItemsTable, PaymentSection,
                               ActionBar, ConfirmDialog, PreviewModal, fields
  lib/
    invoice.ts                 calculations, validation, helpers
    currency.ts                ₹ formatting (en-IN)
    numberToWords.ts           amount in words (Indian system)
    storage.ts                 localStorage + invoice numbering
    pdf.ts                     A4 invoice layout (jsPDF + autotable)
    pdfExport.ts               loads fonts, downloads / previews the PDF
    *.test.ts                  unit tests
  assets/logo.png              brand logo shown in the app header and on the PDF
  assets/fonts/                DejaVu Sans (regular + bold), subset – contains the ₹ glyph
  styles/app.css               responsive styles
```

## 5. Customising

- **Shop name, address, Instagram, tagline:** `src/constants.ts`.
- **Product and color lists:** `src/constants.ts` (`PRODUCTS`, `COLORS`). The product list uses the
  spelling `Full Sleve Tshirt` exactly as requested; change it there if you want `Sleeve`.
- **Brand colors:** CSS variables at the top of `src/styles/app.css` and the `LIME` / `INK`
  constants at the top of `src/lib/pdf.ts`.
- **Invoice prefix:** `INVOICE_PREFIX` in `src/constants.ts`.

## 6. Fonts

The PDF embeds a small subset of **DejaVu Sans** (regular and bold) so the ₹ symbol prints
correctly; the standard PDF fonts do not contain it. DejaVu fonts are free to use and
redistribute under their own license (derived from Bitstream Vera), see
<https://dejavu-fonts.github.io/License.html>.
