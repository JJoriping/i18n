import { I18n } from "@daldalso/i18n";
import config from "../../../i18n.config.cjs";
import "./lib/i18n-module-loader";

I18n.moduleLoader = locale => {
  if(!config.locales.includes(locale)){
    console.warn(`Unknown locale: ${locale}`);
    return async () => null!;
  }
  return async prefix => Object.assign(
    await import(`../${locale}/${prefix}.${locale}`),
    { href: `../${locale}/${prefix}.${locale}` }
  );
};