import { useState } from "react";
import I18n from "./core.js";
import type { LFunction, Lexicon, Lexiconista } from "./types.js";

type LexiconsOf<T extends ReadonlyArray<Lexiconista<Lexicon>>> = T extends [ Lexiconista<infer R>, ...infer Rest extends ReadonlyArray<Lexiconista<Lexicon>> ]
  ? [ R, ...LexiconsOf<Rest> ]
  : []
;
const useLexicon = <T extends ReadonlyArray<Lexiconista<Lexicon>>>(...lexiconistas:T) => {
  I18n.loadLexicons(...lexiconistas);
  if(typeof window !== "undefined"){
    // eslint-disable-next-line react-hooks/rules-of-hooks, react/hook-use-state
    const [ , setCounter ] = useState(0);

    for(const v of lexiconistas){
      v.onReload = () => {
        setCounter(prev => prev + 1);
      };
    }
  }
  const l = I18n.currentInstance.retrieve.bind(I18n.currentInstance) as LFunction<LexiconsOf<T>>;

  return { l };
};
export default useLexicon;