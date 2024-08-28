import I18n from "./core.js";
import type { LFunction, Lexicon, Lexiconista } from "./types.js";

type LexiconsOf<T extends ReadonlyArray<Lexiconista<Lexicon>>> = T extends [ Lexiconista<infer R>, ...infer Rest extends ReadonlyArray<Lexiconista<Lexicon>> ]
  ? [ R, ...LexiconsOf<Rest> ]
  : []
;
const useLexicon = <T extends ReadonlyArray<Lexiconista<Lexicon>>>(...lexiconistas:T) => {
  I18n.loadLexicons(...lexiconistas);
  const l = I18n.currentInstance.retrieve.bind(I18n.currentInstance) as LFunction<LexiconsOf<T>>;

  return { l };
};
export default useLexicon;