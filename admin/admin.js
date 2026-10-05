/* =========================
   CATEGORIES
========================= */

/*
  CATEGORIAS OFICIAIS DO CATÁLOGO

  O painel trabalha somente com estas
  seis categorias.

  Categorias antigas como:
  - Kit festa
  - Para sua festa
  - Personalização
  - Recheio
  - Massa
  - Kit
  - Sobremesas

  não podem mais aparecer no seletor.
*/

const PRODUCT_CLASSIFICATIONS = [
  "Bolos",
  "Brownies",
  "Bolos no pote",
  "Copos de felicidade",
  "Brigadeiros clássicos",
  "Brigadeiros premium"
];

const BLOCKED_CATEGORIES = [
  "kit festa",
  "kit festas",
  "kits festa",
  "kits festas",
  "para sua festa",
  "personalização",
  "personalizacao",
  "recheio",
  "recheios",
  "massa",
  "massas",
  "kit",
  "kits",
  "sobremesa",
  "sobremesas",
  "encomenda",
  "encomendas",
  "delivery",
  "pronta entrega",
  "pronta-entrega"
];

function isBlockedCategory(category) {
  return BLOCKED_CATEGORIES.includes(
    normalize(category)
  );
}

function isAllowedCategory(category) {
  const value =
    normalize(category);

  return PRODUCT_CLASSIFICATIONS.some(
    (item) =>
      normalize(item) === value
  );
}

function getCategories() {
  return [
    ...PRODUCT_CLASSIFICATIONS
  ];
}

function addCategory(category) {
  const value =
    String(category || "").trim();

  if (!value) {
    return false;
  }

  if (!isAllowedCategory(value)) {
    return false;
  }

  if (!Array.isArray(S.categories)) {
    S.categories = [];
  }

  const exists =
    S.categories.some(
      (item) =>
        normalize(item) ===
        normalize(value)
    );

  if (!exists) {
    S.categories.push(value);
  }

  return true;
}
