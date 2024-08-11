import { I18Next } from "@daldalso/i18next";
import type { I18nInitializerProps } from "@daldalso/i18next/dist/types";
import React from "react";
import ClientI18nInitializer from "./client-i18n-initializer";
import i18nModuleLoader from "./i18n-module-loader";

const I18nInitializer = (props:I18nInitializerProps) => {
  I18Next.initialize(i18nModuleLoader(props.locale));
  return <ClientI18nInitializer {...props} />;
};
export default I18nInitializer;