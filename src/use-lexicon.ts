import { useCallback } from "react";
import type { LFunction, Lexicon } from "./types";
import I18Next from "./core";

const useLexicon = <T extends readonly Lexicon[]>(...lexicons:T) => {
  I18Next.useContext(...lexicons);
  const l = useCallback<LFunction<T>>((key, ...args) => I18Next.retrieve(key, args), []);

  return { l };
};
export default useLexicon;