declare global{
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface Window{
    [key:`webpackHotUpdate${string}`]:(
      chunkId:string,
      moreModules:Record<string, (module:NodeModule, exports:object, require:Function) => void>,
      runtime:unknown
    ) => void;
  }
}
export {};