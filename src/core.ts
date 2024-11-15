/* eslint-disable @daldalso/sort-keys */
import { log, warning } from "@daldalso/logger";
import type { Lexicon, Lexiconista, ModuleLoader, ModuleOutput, Webpack } from "./types.js";

export default class I18n{
  private static readonly instances:Record<string, I18n> = {};
  public static currentInstance:I18n;
  private static onInstanceLoaded?:() => void;
  private static serverHMRTargets:Record<string, string> = {};

  public static createLexiconista<T extends ModuleOutput<any>['default']>(prefix:string):Lexiconista<T extends ModuleOutput<infer R>['default'] ? R : never>{
    return { prefix, lexicons: {} };
  }
  public static initialize(locale:string, moduleLoader:ModuleLoader):I18n{
    const R = I18n.instances[locale] ||= new I18n(locale, moduleLoader);

    I18n.currentInstance = R;
    I18n.onInstanceLoaded?.();
    delete I18n.onInstanceLoaded;
    return R;
  }
  public static loadLexicons(...lexiconistas:Array<Lexiconista<Lexicon>>):void{
    if(!I18n.currentInstance){
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw new Promise<void>(res => {
        I18n.onInstanceLoaded = res;
      });
    }
    I18n.currentInstance.loadLexicons(...lexiconistas);
  }
  public static async loadLexiconsAsync(...lexiconistas:Array<Lexiconista<Lexicon>>):Promise<void>{
    if(!I18n.currentInstance){
      await new Promise<void>(res => {
        I18n.onInstanceLoaded = res;
      });
    }
    this.loadLexicons(...lexiconistas);
  }
  public static register<const T extends Lexicon>(
    lexicon:T
  ):ModuleOutput<T>['default']{
    // NOTE Since Next.js HMR wraps a lexicon into a lazy-loading component which causes an error,
    //      we wrap the lexicon in a function component.
    return ref => {
      ref.current = lexicon;
      return null;
    };
  }
  public static async retrieve<const T extends Lexicon, U extends keyof T>(locale:string, lexiconista:Lexiconista<T>, key:U, ...args:any[]):Promise<T[U]>{
    try{
      I18n.instances[locale].loadLexicons(lexiconista);
    }catch(error){
      if(error instanceof Promise){
        await error;
      }else{
        throw error;
      }
    }
    return I18n.instances[locale].retrieve(key as string, ...args);
  }
  public static async detectServerHMR(context:{ 'locale': string, 'r': Webpack.Require }):Promise<any>{
    if(typeof window !== "undefined") return;
    if(global.destructI18nServerHMR === null) return;
    global.destructI18nServerHMR?.();
    global.destructI18nServerHMR = null!;
    const cwd = process.cwd();
    const { resolve, relative } = await import(/* webpackIgnore: true */ "node:path");
    const { watch, existsSync } = await import(/* webpackIgnore: true */ "node:fs");
    const target = [ "i18n", "src/i18n" ].find(v => existsSync(resolve(cwd, v)));
    if(!target){
      warning("Could not find i18n directory");
      return;
    }
    const destructors:Array<() => void> = [];
    const watcher = watch(target, { recursive: true }, (type, name) => {
      if(type !== "change" || !name) return;
      const chunk = name.replace(/\\/g, "/").match(/^(\w+)\/(.+)\.\1\.tsx?$/);
      if(!chunk) return;
      I18n.serverHMRTargets[`${chunk[1]}/${chunk[2]}`] = relative(cwd, resolve(target, name));
    });
    destructors.push(() => watcher.close());

    // Next.js dependent section
    try{
      const { store } = await import(/* webpackIgnore: true */ "next/dist/build/output/store.js");
      const isAppRouter = existsSync(resolve(cwd, ".next/server/app-paths-manifest.json"));
      const webpackRequire = context.r.f.require;

      context.r.f.require = (chunkId, _, injected) => {
        if(!injected) return webpackRequire(chunkId);
        return context.r.C(chunkId);
      };
      destructors.push(store.subscribe(async state => {
        if(!('loading' in state) || state.loading){
          return;
        }
        const entries = Object.entries(I18n.serverHMRTargets);
        if(!entries.length){
          return;
        }
        for(const [ k, v ] of entries){
          const [ locale ] = k.split('/');
          const instance = I18n.instances[locale];
          let nextJsChunkPath = resolve(cwd, ".next/server", `${v.replace(/\W/g, "_")}.js`);
          const nextJsChunkPathRear = nextJsChunkPath.split(/[/\\]/).at(-1)!;
          if(isAppRouter) nextJsChunkPath = nextJsChunkPath.replace(nextJsChunkPathRear, `_ssr_${nextJsChunkPathRear}`);
          const nextJsChunk = await import(/* webpackIgnore: true */ `file:${nextJsChunkPath}?${Date.now()}`);

          context.r.f.require(nextJsChunk, null, true);
          for(const l in nextJsChunk['modules']){
            const fakeModule:NodeModule = { exports: {} } as NodeModule;
            context.r.m[l](fakeModule, fakeModule.exports, context.r);
            const lexicon = await (fakeModule.exports as ReturnType<typeof instance.moduleLoader>);
            instance?.mergeLexicon(lexicon.default);
          }
        }
        log("I18n file updated", ...entries.map(v => v[0]));
        I18n.serverHMRTargets = {};
      }));
    }catch(error){
      void error;
    }
    global.destructI18nServerHMR = () => {
      for(const v of destructors) v();
    };
  }
  public static detectClientHMR(m:NodeModule, x:object, r:Webpack.Require):void{
    if(typeof window === "undefined") return;

    // Next.js dependent section
    {
      const webpackHotUpdateKey = Object.keys(window).find(k => k.startsWith("webpackHotUpdate")) as `webpackHotUpdate${string}`|undefined;
      if(!webpackHotUpdateKey) return;
      window[`${webpackHotUpdateKey}-original`] ||= window[webpackHotUpdateKey];
      window[webpackHotUpdateKey] = (chunkId, moreModules, runtime) => {
        // TODO Update instance with its locale
        const affectedLexiconista = Object.entries(I18n.currentInstance.loadedLexiconistas)
          .find(e => chunkId.includes(e[0].slice(2).replace(/\W/g, "_")))
        ;
        if(affectedLexiconista){
          for(const v of Object.values(moreModules)){
            v(m, x, r);
            r.c[v.name].hot.accept();
            I18n.currentInstance.mergeLexicon((x as ModuleOutput<Lexicon>).default);
            affectedLexiconista[1].onReload?.();
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
        return window[`${webpackHotUpdateKey}-original`](chunkId, moreModules, runtime);
      };
    }
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
  private mergeLexicon(wrappedLexicon:ModuleOutput<Lexicon>['default']):void{
    const ref = { current: null! as Lexicon };
    wrappedLexicon(ref);
    Object.assign(this.mergedLexicon, ref.current);
  }
  public loadLexicons(...lexiconistas:Array<Lexiconista<Lexicon>>):void{
    const tasks:Array<Promise<void>> = [];
    const loadedPrefixes = Object.values(this.loadedLexiconistas).reduce((pv, v) => {
      pv[v.prefix] = true;
      return pv;
    }, {} as Record<string, true>);

    for(const v of lexiconistas){
      if(v.prefix in loadedPrefixes) continue;
      if(v.task){
        tasks.push(v.task);
        continue;
      }
      tasks.push(v.task = this.moduleLoader(v.prefix)
        .then(res => {
          this.loadedLexiconistas[res.href] = v;
          this.mergeLexicon(res.default);
          delete v.task;
        })
      );
    }
    if(tasks.length){
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw Promise.all(tasks);
    }
  }
  public retrieve(key:string, ...args:any[]):any{
    let R = this.mergedLexicon[key];
    if(R === undefined){
      return `<<${key}>>`;
    }
    if(typeof R === "function"){
      R = R.apply(this.mergedLexicon, args);
    }
    return R;
  }
}