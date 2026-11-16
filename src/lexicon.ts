import { useState } from "react";
import I18n from "./core.js";
import type { LFunction, Lexicon, Lexiconista, LexiconsOf } from "./types.js";

type Lexiconistas = ReadonlyArray<Lexiconista<Lexicon>>;

// NOTE A leading string argument is an explicit locale; see `I18n.loadLexiconsOf`.
const load = (args:readonly [string, ...Lexiconistas]|Lexiconistas):ReturnType<typeof I18n.loadLexicons> => {
  if(typeof args[0] === "string"){
    const [ locale, ...lexiconistas ] = args as readonly [string, ...Lexiconistas];

    return I18n.loadLexiconsOf(locale, ...lexiconistas);
  }
  return I18n.loadLexicons(...args as Lexiconistas);
};

function lexicon<T extends Lexiconistas>(...lexiconistas:T):LFunction<LexiconsOf<T>>;
function lexicon<T extends Lexiconistas>(locale:string, ...lexiconistas:T):LFunction<LexiconsOf<T>>;
function lexicon(...args:[string, ...Lexiconistas]|Lexiconistas):unknown{
  const R = load(args);
  const lexiconistas = (typeof args[0] === "string" ? args.slice(1) : args) as Lexiconistas;

  if(R instanceof Promise){
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw R;
  }
  if(typeof window !== "undefined") try{
    // eslint-disable-next-line react-hooks/rules-of-hooks, react/hook-use-state
    const [ , setCounter ] = useState(0);

    for(const v of lexiconistas){
      v.onReload = () => {
        setCounter(prev => prev + 1);
      };
    }
  }catch(error){
    console.warn(error);
  }
  return R.retrieve;
}
export default lexicon;

export function lexiconAsync<T extends Lexiconistas>(...lexiconistas:T):Promise<LFunction<LexiconsOf<T>>>;
export function lexiconAsync<T extends Lexiconistas>(locale:string, ...lexiconistas:T):Promise<LFunction<LexiconsOf<T>>>;
export async function lexiconAsync(...args:[string, ...Lexiconistas]|Lexiconistas):Promise<unknown>{
  const R = await load(args);

  return R.retrieve;
}