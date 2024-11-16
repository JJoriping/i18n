import I18n from "./core.js";
import type { LFunction, Lexicon, Lexiconista, LexiconsOf } from "./types.js";

const lexiconAsync = async <T extends ReadonlyArray<Lexiconista<Lexicon>>>(...lexiconistas:T):Promise<LFunction<LexiconsOf<T>>> => {
  const R = await I18n.loadLexicons(...lexiconistas);

  return R.retrieve.bind(R);
};
export default lexiconAsync;