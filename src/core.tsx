import React from "react";
import { type Context, type Lexicon, loadingStateSymbol, loadingTaskSymbol, ModuleLoader, prefixSymbol } from "./types";

export default class I18n{
  public static context:React.Context<Context>;
  public static initialized:boolean = false;
  public static get lexiconPrefixes():string[]{
    return Array.from(I18n.loadedLexicons.keys());
  }
  
  private static readonly loadedLexicons = new Map<string, Lexicon>();
  private static get global():typeof globalThis{
    return typeof window === "undefined" ? global : window;
  }

  public static async initialize(moduleLoader:ModuleLoader):Promise<void>{
    I18n.global.i18nModuleLoader = moduleLoader;
    I18n.global.i18nGlobalLexicon ||= {};
  }
  public static useContext(...lexicons:Lexicon[]):Context{
    const tasks:Array<Promise<void>> = [];

    for(const v of lexicons){
      const prefix = v[prefixSymbol];
      if(!prefix) continue;
      if(v[loadingStateSymbol] instanceof Error){
        throw v[loadingStateSymbol];
      }
      switch(v[loadingStateSymbol]){
        case "pending":
          v[loadingStateSymbol] = "loading";
          tasks.push(v[loadingTaskSymbol] = I18n.global.i18nModuleLoader(prefix)
            .then(() => {
              v[loadingStateSymbol] = "loaded";
              delete v[loadingTaskSymbol];
            })
            .catch(error => {
              v[loadingStateSymbol] = error instanceof Error ? error : new Error(error);
              delete v[loadingTaskSymbol];
            })
          );
          break;
        case "loading":
          v[loadingTaskSymbol] && tasks.push(v[loadingTaskSymbol]);
          break;
      }
    }
    if(tasks.length){
      throw Promise.all(tasks);
    }
    return {};
  }
  public static register<const T extends Lexicon>(
    lexicon:T
  ):T{
    for(const [ k, $v ] of Object.entries(lexicon)){
      Object.assign(I18n.global.i18nGlobalLexicon, { [k]: $v });
    }
    return lexicon;
  }
  public static retrieve(key:string, args:any[]):any{
    let R = I18n.global.i18nGlobalLexicon[key];
    if(R === undefined){
      throw Error(`Unknown key: ${key}`);
    }
    if(typeof R === "function"){
      R = R.apply(I18n.global.i18nGlobalLexicon, args);
    }
    return R;
  }
  public static load<T extends Lexicon>(prefix:string):T{
    const R = { [prefixSymbol]: prefix, [loadingStateSymbol]: "pending" as const };
    I18n.loadedLexicons.set(prefix, R);
    return R as T;
  }
}