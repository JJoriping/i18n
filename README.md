# @daldalso/i18next
Yet another internationalization library for Next.js

## Getting Started
> [!IMPORTANT]
> Currently this library only supports Next.js projects with **Pages router**.

1. `yarn add @daldalso/i18next`
2. `npx i18next init`
3. Call `I18Next.initialize` in your _app file like below.
   ```js
   I18Next.initialize(
     [ "ko", "en" ],
     (locale, prefix) => import(`@/i18n/${locale}/${prefix}.${locale}`)
   );
   ```
4. Wrap your page components with `I18Next.bind`.
5. Call `useLexicon` in any components for i18n.