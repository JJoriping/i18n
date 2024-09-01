/* eslint-disable no-var */
import type { Webpack } from "./src/types.ts";

declare global{
  var destructI18nServerHMR:(() => void)|undefined;

  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface Window{
    [key:`webpackHotUpdate${string}`]:(
      chunkId:string,
      moreModules:Record<string, Webpack.Loader>,
      runtime:unknown
    ) => void;
  }
}
export {};