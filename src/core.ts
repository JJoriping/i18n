/* eslint-disable @daldalso/sort-keys */
import type { Lexiconista, ModuleLoader } from "./types.js";
import { type Lexicon, loadingStateSymbol, loadingTaskSymbol } from "./types.js";

export default class I18n{
  private static readonly instanceLoadingTask = new Promise<void>(res => {
    I18n.onInstanceLoaded = res;
  });
  private static readonly instances:Record<string, I18n> = {};
  public static currentInstance:I18n;
  private static onInstanceLoaded:() => void;

  public static createLexiconista<T extends Lexicon>(prefix:string):Lexiconista<T>{
    return { prefix, lexicons: {} };
  }
  public static initialize(locale:string, moduleLoader:ModuleLoader):I18n{
    const R = I18n.instances[locale] ||= new I18n(locale, moduleLoader);

    I18n.currentInstance = R;
    I18n.onInstanceLoaded();
    return R;
  }
  public static loadLexicons(...lexiconistas:Array<Lexiconista<Lexicon>>):void{
    if(!I18n.currentInstance){
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw I18n.instanceLoadingTask;
    }
    I18n.currentInstance.loadLexicons(...lexiconistas);
  }
  public static register<const T extends Lexicon>(
    lexicon:T
  ):T{
    return lexicon;
  }
  public static detectHMR(m:NodeModule, x:object, r:Function):void{
    if(typeof window === "undefined") return;

    // For Next.js Pages Router
    const webpackHotUpdateKey = Object.keys(window).find(k => k.startsWith("webpackHotUpdate")) as `webpackHotUpdate${string}`|undefined;
    if(!webpackHotUpdateKey) return;
    window[`${webpackHotUpdateKey}-original`] ||= window[webpackHotUpdateKey];
    window[webpackHotUpdateKey] = (chunkId, moreModules, runtime) => {
      const affectedLexiconista = Object.entries(I18n.currentInstance.loadedLexiconistas)
        .find(e => chunkId.includes(e[0].slice(2).replace(/\W/g, "_")))
      ;
      if(affectedLexiconista){
        for(const v of Object.values(moreModules)){
          v(m, x, r);
          I18n.currentInstance.mergeLexicon((x as any)['default']);
          affectedLexiconista[1].onReload?.();
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      return window[`${webpackHotUpdateKey}-original`](chunkId, moreModules, runtime);
    };
  }

  public readonly locale:string;
  public readonly loadedLexiconistas:Record<string, Lexiconista<Lexicon>>;
  private readonly moduleLoader:ModuleLoader;
  private readonly mergedLexicon:Lexicon;

  private constructor(locale:string, moduleLoader:ModuleLoader){
    this.locale = locale;
    this.loadedLexiconistas = {};
    this.moduleLoader = moduleLoader;
    this.mergedLexicon = {};
  }
  public mergeLexicon(lexicon:Lexicon):void{
    Object.assign(this.mergedLexicon, lexicon);
  }
  public loadLexicons(...lexiconistas:Array<Lexiconista<Lexicon>>):void{
    const tasks:Array<Promise<void>> = [];

    for(const v of lexiconistas){
      const lexicon = v.lexicons[this.locale] ||= {
        [loadingStateSymbol]: "pending"
      };
      if(lexicon[loadingStateSymbol] instanceof Error) throw lexicon[loadingStateSymbol];
      switch(lexicon[loadingStateSymbol]){
        case "pending":
          lexicon[loadingStateSymbol] = "loading";
          tasks.push(lexicon[loadingTaskSymbol] = this.moduleLoader(v.prefix)
            .then(res => {
              this.loadedLexiconistas[res.href] = v;
              this.mergeLexicon(res.default);
              lexicon[loadingStateSymbol] = "loaded";
            }, error => {
              lexicon[loadingStateSymbol] = error instanceof Error ? error : new Error(String(error));
            })
            .then(() => {
              delete lexicon[loadingTaskSymbol];
            })
          );
          break;
        case "loading":
          lexicon[loadingTaskSymbol] && tasks.push(lexicon[loadingTaskSymbol]);
          break;
      }
    }
    if(tasks.length){
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw Promise.all(tasks);
    }
  }
  public retrieve(key:string, ...args:any[]):any{
    let R = this.mergedLexicon[key];
    if(R === undefined){
      throw Error(`Unknown key: ${key}`);
    }
    if(typeof R === "function"){
      R = R.apply(this.mergedLexicon, args);
    }
    return R;
  }
}