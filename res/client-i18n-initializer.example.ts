"use client";

import { I18n } from "@daldalso/i18n";
import type { I18nInitializerProps } from "@daldalso/i18n/dist/types";
import i18nModuleLoader from "./i18n-module-loader";

const ClientI18nInitializer = ({ locale }:I18nInitializerProps) => {
  I18n.initialize(locale, i18nModuleLoader(locale));
  return null;
};
export default ClientI18nInitializer;