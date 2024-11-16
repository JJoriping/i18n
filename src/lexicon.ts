import { useState } from "react";
import I18n from "./core.js";
import type { LFunction, Lexicon, Lexiconista, LexiconsOf } from "./types.js";

const lexicon = <T extends ReadonlyArray<Lexiconista<Lexicon>>>(...lexiconistas:T):LFunction<LexiconsOf<T>> => {
  const R = I18n.loadLexicons(...lexiconistas);

  if(R instanceof Promise){
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw R;
  }
  if(typeof window !== "undefined"){
    // eslint-disable-next-line react-hooks/rules-of-hooks, react/hook-use-state
    const [ , setCounter ] = useState(0);

    for(const v of lexiconistas){
      v.onReload = () => {
        setCounter(prev => prev + 1);
      };
    }
  }
  return R.retrieve.bind(R);
};
export default lexicon;