import { useCallback, useContext } from "react";
import type { LFunction, Lexicon } from "./types";
import I18Next from "./core";

const useLexicon = <T extends readonly Lexicon[]>(...lexicons:T) => {
  const { locale } = useContext(I18Next.context);
  const l = useCallback<LFunction<T>>((key, ...args) => I18Next.retrieve(locale, key, args), [ locale ]);

  void lexicons;
  return { l };
};
export default useLexicon;