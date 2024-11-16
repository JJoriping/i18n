import type { ReactNode } from "react";

export type I18nInitializerProps = {
  'locale': string
};
export type ModuleOutput<T extends Lexicon> = { 'default': (ref:{ 'current': T }) => null, 'href': string };
export type ModuleLoader = (prefix:string) => Promise<ModuleOutput<Lexicon>>;
export type Lexicon = Readonly<Record<string, ReactNode|((...args:any[]) => ReactNode)>>;
export type Lexiconista<T extends Lexicon> = {
  'prefix': string,
  'lexicons': Record<string, T>,
  'task'?: Promise<void>,
  'onReload'?: () => void
};
export type MergedLexicon<T extends readonly Lexicon[]> = T extends [ infer R, ...infer Rest extends readonly Lexicon[] ]
  ? R&MergedLexicon<Rest>
  : unknown
;
export type LFunction<T extends readonly Lexicon[]> = <K extends T extends readonly [] ? never : Extract<keyof MergedLexicon<T>, string>>(
  ...args:MergedLexicon<T>[K] extends (...args:infer R) => any
    ? [key:K, ...args:R]
    : [key:K]
) => MergedLexicon<T>[K] extends (...args:any) => infer R
  ? R
  : MergedLexicon<T>[K]
;
export type LexiconsOf<T extends ReadonlyArray<Lexiconista<Lexicon>>> = T extends [ Lexiconista<infer R>, ...infer Rest extends ReadonlyArray<Lexiconista<Lexicon>> ]
  ? [ R, ...LexiconsOf<Rest> ]
  : []
;
export namespace Webpack{
  export type Loader = (module:NodeModule, exports:object, require:Require) => void;
  export type Require = {
    'm': Record<string, Loader>,
    'f': {
      'require': (chunkId:string, promises?:unknown, injected?:boolean) => unknown
    },
    'C': (script:string) => unknown,
    'c': Record<string, NodeModule&{hot: {accept: () => void}}>
  };
}