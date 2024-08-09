import type { ReactNode } from "react";

export type Lexicon = Readonly<Record<string, ReactNode|((...args:any[]) => ReactNode)>>;
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
export type Context = {
  locale: string
};