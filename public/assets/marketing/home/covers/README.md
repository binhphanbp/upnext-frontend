# Company cover photos — "Công ty công nghệ tiêu biểu" section

Drop the featured company **cover/banner photos** here. The spotlight card in
`src/pages/FeaturedCompanies.tsx` loads them by exact filename:

| File        | Company      |
| ----------- | ------------ |
| `fpt.jpg`   | FPT Software |
| `vnpay.jpg` | VNPAY        |

## Guidelines

- **Format:** JPG or PNG (photo of the office / building / team works best).
- **Aspect ratio:** wide / landscape (the cover area is ~360×180, `object-fit: cover`).
- **Size:** ~800×400px or larger for crisp rendering.
- **Fallback:** until a file exists, the cover shows a brand-color gradient
  automatically — nothing breaks if a cover is missing.

A gradient scrim fades the bottom of the photo into the card's dark navy body,
so any photo blends smoothly. To add covers for more featured companies, set the
`cover` field in the `pages` array in `FeaturedCompanies.tsx`.
