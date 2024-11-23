# @daldalso/i18n
Yet another internationalization library for React.js

<p style="text-align: center;">English | <a href="README.ko.md">한국어</a></p>

## Getting Started
1. `yarn add @daldalso/i18n`
2. `npx i18n init`
3. Add `I18nInitializer` component in your root component. `I18nInitializer` have to be the first child.
4. Call `lexicon` in any components for i18n.

## Features
### File Separation
You can construct your own directory structure by separating lexicon files like below:
```
🗀 i18n
├ 🗀 en
│ ├ common.ts
│ ├ index.ts
│ ├ sign-in.ts
│ └ sign-up.ts
└ 🗀 ko
  ├ common.ts
  ├ index.ts
  ├ sign-in.ts
  └ sign-up.ts
```

### JSX Support
You can put strings, JSX elements, arrays of them, and functions that returns one of them.
```tsx
//: src/i18n/en/l.index.en.tsx
import { I18n } from "@daldalso/i18n";

export default I18n.register({
  foo: "Hello, World!",
  bar: <>Hello, <u>World</u>!</>,
  baz: (value:number) => (
    <b>{value.toLocaleString()}</b>
  ),
  levels: [ "Level 1", "Level 2", "Level 3" ]
});
```

```tsx
//: app/page.tsx
import { lexicon } from "@daldalso/i18n";
import lIndex from "@/i18n/l.index";

export default function Index(){
  const l = lexicon(lIndex);

  return <ul>
    <li>
      {l('foo')}
    </li>
    <li>
      {l('bar')}
    </li>
    <li>
      {l('baz') /* causes a type error */}
      {l('baz', 123)}
    </li>
    <li>
      {l('levels')[1]}
    </li>
  </ul>;
}
```

## Caveat
You must use `await lexiconAsync(...)` instead of `lexicon(...)` if the execution of your component __precedes__ the execution of `I18nInitializer`.
This often happens when it's called directly in a page component.