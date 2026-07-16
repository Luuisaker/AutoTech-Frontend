export type Locale = "es" | "en";

export type TranslationValue = string | NestedTranslations;
export type NestedTranslations = { [key: string]: TranslationValue };

export type Translations = {
  [K: string]: TranslationValue;
};
