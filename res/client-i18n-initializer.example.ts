"use client";

import { I18Next } from "@daldalso/i18next";
import type { I18nInitializerProps } from "@daldalso/i18next/dist/types";
import i18nModuleLoader from "./i18n-module-loader";

const ClientI18nInitializer = ({ locale }:I18nInitializerProps) => {
  I18Next.initialize(i18nModuleLoader(locale));
  return null;
};
export default ClientI18nInitializer;