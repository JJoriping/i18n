export default function(locale:string){
  return (prefix:string) => import(`../${locale}/${prefix}.${locale}`);
}