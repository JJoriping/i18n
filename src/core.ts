/* eslint-disable @daldalso/sort-keys */
import { log, warning } from "@daldalso/logger";
import type { I18nInitializerProps, Lexicon, Lexiconista, ModuleLoader, ModuleOutput, Webpack } from "./types.js";

export default class I18n{
  public static locale:string;
  public static moduleLoaderBuilder:(locale:string) => ModuleLoader;

  private static initializationResolve:(() => void)|null;
  private static initializationTask:Promise<void>|null = new Promise<void>(res => {
    I18n.initializationResolve = res;
  });
  private static readonly instances:Record<string, I18n> = {};
  private static serverHMRTargets:Record<string, string> = {};

  public static initialize(props:I18nInitializerProps):void{
    I18n.locale = props.locale;
    I18n.initializationTask = null;
    I18n.initializationResolve?.();
    I18n.initializationResolve = null;
  }
  public static createLexiconista<T extends ModuleOutput<any>['default']>(prefix:string):Lexiconista<T extends ModuleOutput<infer R>['default'] ? R : never>{
    return { prefix, lexicons: {} };
  }
  public static loadLexicons(...lexiconistas:Array<Lexiconista<Lexicon>>):Promise<I18n>|I18n{
    if(I18n.initializationTask){
      return I18n.initializationTask.then(() => I18n.loadLexicons(...lexiconistas));
    }
    const R = I18n.instances[I18n.locale] ||= new I18n(I18n.locale);
    const task = R.loadLexicons(...lexiconistas);

    if(task){
      return task.then(() => R);
    }
    return R;
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
  public static async detectServerHMR(context:{ 'r': Webpack.Require }):Promise<any>{
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
            const lexicon = await (fakeModule.exports as ReturnType<ModuleLoader>);
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
        for(const v of Object.values(I18n.instances)){
          const affectedLexiconista = Object.entries(v.loadedLexiconistas)
            .find(f => chunkId.includes(f[0].slice(2).replace(/\W/g, "_")))
          ;
          if(affectedLexiconista){
            for(const w of Object.values(moreModules)){
              w(m, x, r);
              r.c[w.name].hot.accept();
              v.mergeLexicon((x as ModuleOutput<Lexicon>).default);
              affectedLexiconista[1].onReload?.();
            }
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

  private constructor(locale:string){
    this.locale = locale;
    this.loadedLexiconistas = {};
    this.moduleLoader = I18n.moduleLoaderBuilder(locale);
    this.mergedLexicon = {};
  }
  private mergeLexicon(wrappedLexicon:ModuleOutput<Lexicon>['default']):void{
    const ref = { current: null! as Lexicon };
    wrappedLexicon(ref);
    Object.assign(this.mergedLexicon, ref.current);
  }
  public loadLexicons(...lexiconistas:Array<Lexiconista<Lexicon>>):Promise<void[]>|void{
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
      return Promise.all(tasks);
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