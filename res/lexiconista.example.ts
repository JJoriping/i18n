import I18n from "@daldalso/i18n";
import type lCAPITALIZED_LOCALE from "./LOCALE/PREFIX.LOCALE";
import "./lib/i18n-module-loader";

export default I18n.createLexiconista<typeof lCAPITALIZED_LOCALE>("PREFIX");