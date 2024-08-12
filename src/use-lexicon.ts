import { useCallback } from "react";
import type { LFunction, Lexicon } from "./types";
import I18n from "./core";

const useLexicon = <T extends readonly Lexicon[]>(...lexicons:T) => {
  I18n.useContext(...lexicons);
  const l = useCallback<LFunction<T>>((key, ...args) => I18n.retrieve(key, args), []);

  return { l };
};
export default useLexicon;