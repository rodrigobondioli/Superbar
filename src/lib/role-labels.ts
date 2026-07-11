/**
 * Mapa canônico de role → label em português.
 * Fonte única — importe daqui em vez de redefinir localmente.
 */
export const ROLE_LABEL: Record<string, string> = {
  dono:        "Dono",
  bar_manager: "Bar Manager",
  gerente:     "Bar Manager", // legado — consolidado em bar_manager
  bartender:   "Bartender",
  garcom:      "Garçom",
  caixa:       "Caixa",
};
