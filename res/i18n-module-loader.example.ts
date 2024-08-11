export default function(locale:string){
  return (prefix:string) => import(`@/i18n/${locale}/${prefix}.${locale}`);
}