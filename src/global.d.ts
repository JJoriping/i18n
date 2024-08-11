import { Lexicon, ModuleLoader } from "./types";

declare global{
  var i18nextModuleLoader:ModuleLoader;
  var i18nextGlobalLexicon:Lexicon;
}