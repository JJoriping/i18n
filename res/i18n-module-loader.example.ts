import type { Lexicon, ModuleOutput } from "@daldalso/i18n/dist/types";
import config from "../../../i18n.config.cjs";

export default function(locale:string):(prefix:string) => Promise<ModuleOutput<Lexicon>>{
  if(!config.locales.includes(locale)){
    console.warn(`Unknown locale: ${locale}`);
    return async () => null!;
  }
  return async prefix => Object.assign(
    await import(`../${locale}/${prefix}.${locale}`),
    { href: `../${locale}/${prefix}.${locale}` }
  );
}