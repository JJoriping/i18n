"use client";

import { I18n } from "@daldalso/i18n";
import type { I18nInitializerProps } from "@daldalso/i18n/dist/types";
import { useEffect } from "react";

const hmrDetector = process.env.NODE_ENV === "development"
  ? () => useEffect(() => {
    // @ts-expect-error
    if(typeof module !== "undefined" && typeof __webpack_exports__ !== "undefined" && typeof __webpack_require__ !== "undefined") I18n.detectClientHMR(module, __webpack_exports__, __webpack_require__);
  }, [])
  : () => {}
;
const ClientI18nInitializer = (props:I18nInitializerProps) => {
  I18n.initialize(props);
  hmrDetector();

  return null;
};
export default ClientI18nInitializer;