# @daldalso/i18n
React.js를 위한 국제화(i18n) 라이브러리

<p align="center"><a href="README.md">English</a> | 한국어</p>

## 시작하기
1. `yarn add @daldalso/i18n`
2. `npx i18n init`
3. 루트 컴포넌트에 `I18nInitializer` 컴포넌트를 추가하세요. `I18nInitializer`는 반드시 첫 번째 자식이어야 합니다.
4. i18n 기능을 사용하고 싶은 컴포넌트에서 `lexicon`을 호출하세요.

## 주요 기능
### 파일 분리
Lexicon 파일만 분리해 디렉토리를 구성할 수 있습니다:
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

### JSX 지원
문자열, JSX 요소, JSX 요소들의 배열, 또는 이를 반환하는 함수도 사용할 수 있습니다.
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

## 주의 사항
`I18nInitializer`가 실행되기 전에 컴포넌트가 실행되는 경우, `lexicon(...)` 대신 `await lexiconAsync(...)`를 사용해야 합니다. 
__주로__ 페이지 컴포넌트에서 직접 호출될 때 발생합니다.

### 여러 언어를 서버에서 렌더링할 때
`I18nInitializer`는 언어를 전역 값 하나에 저장합니다. 서로 다른 언어의 요청을 동시에 렌더링하는 서버(예: `/en/...`과 `/ko/...`를 둔 Next.js App Router)에서는 컴포넌트가 기다리는 동안 다른 요청이 그 전역 값을 덮어써서, 다른 언어가 나올 수 있습니다.
이때는 현재 요청의 언어를 첫 번째 인자로 넘기세요:
```tsx
//: app/[locale]/page.tsx
export default async function Index({ params }:{ params: Promise<{ locale: string }> }){
  const { locale } = await params;
  const l = await lexiconAsync(locale, lIndex);

  return <h1>{l('foo')}</h1>;
}
```
`lexicon(locale, ...)`도 같은 방식으로 쓸 수 있습니다.