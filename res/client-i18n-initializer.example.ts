"use client";

import { I18n } from "@daldalso/i18n";
import type { I18nInitializerProps } from "@daldalso/i18n/dist/types";
import { useEffect, type FC } from "react";
import i18nModuleLoader from "./i18n-module-loader";

const hmrDetector = process.env.NODE_ENV === "development"
? () => useEffect(() => {
    // @ts-expect-error
    if(typeof module !== "undefined" && typeof __webpack_exports__ !== "undefined" && typeof __webpack_require__ !== "undefined") I18n.detectHMR(module, __webpack_exports__, __webpack_require__);
  }, [])
  : () => {}
;
const ClientI18nInitializer:FC<I18nInitializerProps> = ({ locale }) => {
  I18n.initialize(locale, i18nModuleLoader(locale));
  hmrDetector();

  return null;
};
export default ClientI18nInitializer;