import I18n from "@daldalso/i18n";
import type { I18nInitializerProps } from "@daldalso/i18n/types";
import ClientI18nInitializer from "./client-i18n-initializer";

const hmrDetector = process.env.NODE_ENV === "development"
  ? () => {
    // @ts-expect-error
    if(typeof __webpack_require__ !== "undefined") I18n.detectServerHMR({ r: __webpack_require__ });
  }
  : () => {}
;
const I18nInitializer = (props:I18nInitializerProps) => {
  I18n.initialize(props);
  hmrDetector();

  return <ClientI18nInitializer {...props} />;
};
export default I18nInitializer;