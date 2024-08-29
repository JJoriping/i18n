import config from "CONFIG_IMPORT_SOURCE";

export default function(locale:string):(prefix:string) => Promise<any>{
  if(!config.locales.includes(locale)){
    console.warn(`Unknown locale: ${locale}`);
    return async () => {};
  }
  return async prefix => Object.assign(
    await import(`../${locale}/${prefix}.${locale}`),
    { href: `../${locale}/${prefix}.${locale}` }
  );
}