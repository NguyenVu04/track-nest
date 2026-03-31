export type AppLanguage = "English" | "Vietnamese";

export const isAppLanguage = (value: string): value is AppLanguage => {
  return value === "English" || value === "Vietnamese";
};
