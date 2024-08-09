import type { NextPage } from "next";
import React from "react";
import type { Lexicon, Context } from "./types";
import { useRouter } from "next/router";

export default class I18Next{
  public static context:React.Context<Context>;
  
  private static readonly loadedLexicons = new Map<string, Lexicon>();
  private static moduleLoader:(locale:string, prefix:string) => Promise<{ default: Lexicon }>;
  private static globalLexicon:Record<string, Lexicon>;
  private static locales:string[];
  private static clientLoadingTask?:Promise<void>;
  private static clientLoaded = false;
  private static get defaultLocale():string{
    return I18Next.locales[0];
  }

  public static initialize(locales:string[], moduleLoader:typeof I18Next.moduleLoader):void{
    I18Next.locales = locales;
    I18Next.moduleLoader = moduleLoader;
    I18Next.context = React.createContext<Context>({ locale: I18Next.defaultLocale });
    I18Next.globalLexicon = {};
  }
  public static bind<T>(Component:NextPage<T>):NextPage<T&{ lexiconPrefixes: string[] }>{
    if(!I18Next.moduleLoader){
      throw Error("Please call I18Next.initialize in your _app file.");
    }
    // eslint-disable-next-line react/require-optimization
    const R:NextPage<T&{ lexiconPrefixes: string[] }> = React.memo(props => {
      const router = useRouter();
      const value = React.useMemo<Context>(() => {
        const locale = router.locale || router.defaultLocale;
        if(locale === undefined){
          throw Error("Please set i18n.defaultLocale to your Next.js config file.");
        }
        return {
          locale
        };
      }, [ router.defaultLocale, router.locale ]);

      if(typeof window !== "undefined" && !I18Next.clientLoaded && !I18Next.clientLoadingTask){
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw I18Next.clientLoadingTask = (async () => {
          for(const v of props.lexiconPrefixes){
            await I18Next.moduleLoader(value.locale, v);
          }
          I18Next.clientLoaded = true;
          I18Next.clientLoadingTask = undefined;
        })();
      }
      return <I18Next.context.Provider value={value}>
        <Component {...props} />
      </I18Next.context.Provider>;
    });

    R.displayName = "Lex";
    R.getInitialProps = async nextPageContext => {
      const locale = nextPageContext.locale || nextPageContext.defaultLocale || "ko";
      if(!I18Next.locales.includes(locale)){
        throw Error(`Unexpected locale: ${locale}`);
      }
      const pageProps = await Component.getInitialProps?.(nextPageContext) ?? {} as T;
      const lexiconPrefixes:string[] = [];

      for(const [ k, v ] of I18Next.loadedLexicons.entries()){
        lexiconPrefixes.push(k);
        Object.assign(v, await I18Next.moduleLoader(locale, k).then(res => res.default));
      }
      return {
        ...pageProps,
        lexiconPrefixes
      };
    };
    return R;
  }
  public static register<const T extends Lexicon>(
    locale:string,
    lexicon:T
  ):T{
    if(!I18Next.globalLexicon){
      throw Error("Please call I18Next.initialize in your _app file.");
    }
    I18Next.globalLexicon[locale] ??= {};
    for(const [ k, $v ] of Object.entries(lexicon)){
      if(k in I18Next.globalLexicon[locale]){
        throw Error(`Duplicated key: ${k}`);
      }
      Object.assign(I18Next.globalLexicon[locale], { [k]: $v });
    }
    return lexicon;
  }
  public static retrieve(locale:string, key:string, args:any[]):any{
    let R = I18Next.globalLexicon[locale][key];
    if(R === undefined){
      throw Error(`Unknown key: ${key}`);
    }
    if(typeof R === "function"){
      R = R.apply(I18Next.globalLexicon[locale], args);
    }
    return R;
  }
  public static load<T extends readonly Lexicon[]>(prefix:string):T[0]{
    const R:T[0] = {};
    I18Next.loadedLexicons.set(prefix, R);
    return R;
  }
}