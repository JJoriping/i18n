import { I18n } from "@daldalso/i18n";
import type { I18nInitializerProps } from "@daldalso/i18n/dist/types";
import ClientI18nInitializer from "./client-i18n-initializer";
import i18nModuleLoader from "./i18n-module-loader";

const I18nInitializer = (props:I18nInitializerProps) => {
  I18n.initialize(props.locale, i18nModuleLoader(props.locale));
  return <ClientI18nInitializer {...props} />;
};
export default I18nInitializer;