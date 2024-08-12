import { Lexicon, ModuleLoader } from "./types";

declare global{
  var i18nModuleLoader:ModuleLoader;
  var i18nGlobalLexicon:Lexicon;
}