(() => {
  "use strict";

  /* =========================================================
     MARTINS CONFEITARIA
     SCRIPT COMPATÍVEL COM O index.html ATUAL
     ========================================================= */

  const DEFAULTS = window.MARTINS_DEFAULTS || {};
  const CONFIG = window.MARTINS_CONFIG || {};

  let state = JSON.parse(
    JSON.stringify(DEFAULTS)
  );

  let currentCategory = "";

  /* =========================================================
     HELPERS
     ========================================================= */

  const $ = (selector) =>
    document.querySelector(selector);

  const money = (value) => {
    const number = Number(value || 0);

    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const escapeHTML = (value) => {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char])
    );
  };

  /* =========================================================
     SUPABASE
     ========================================================= */

  function getSupabase() {
    if (
      !window.supabase ||
      !CONFIG.SUPABASE_URL ||
      !CONFIG.SUPABASE_ANON_KEY
    ) {
      return null;
    }

    try {
      return window.supabase.createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_ANON_KEY
      );
    } catch (error) {
      console.warn(
        "Erro ao iniciar o Supabase:",
        error
      );

      return null;
    }
  }

  /* =========================================================
     CARREGAR DADOS
     ========================================================= */

  async function loadData() {
    /*
      Primeiro renderiza os dados locais.
      Assim o site nunca fica esperando o Supabase.
    */

    render();

    const client = getSupabase();

    if (!client) {
      return;
    }

    try {
      const [settingsResult, productsResult] =
        await Promise.all([
          client
            .from("settings")
            .select("value")
            .eq("key", "site")
            .maybeSingle(),

          client
            .from("products")
            .select("*")
            .order("sort", {
              ascending: true
            })
        ]);

      /* -----------------------------
         CONFIGURAÇÕES
      ----------------------------- */

      if (
        settingsResult &&
        settingsResult.data &&
        settingsResult.data.value
      ) {
        state = {
          ...state,
          ...settingsResult.data.value
        };
      }

      /* -----------------------------
         PRODUTOS
      ----------------------------- */

      if (
        productsResult &&
        Array.isArray(productsResult.data)
      ) {
        state.products =
          productsResult.data.map(
            (product) => ({
              ...product
            })
          );
      }

    } catch (error) {
      console.warn(
        "Não foi possível carregar os dados do Supabase:",
        error
      );
    }

    /*
      Renderiza novamente caso o Supabase
      tenha fornecido dados novos.
    */

    render();
  }

  /* =========================================================
     RENDER GERAL
     ========================================================= */

  function render() {
    renderMenu();
    renderYear();
  }

  /* =========================================================
     ANO DO RODAPÉ
     ========================================================= */

  function renderYear() {
    const year =
      $("#current-year");

    if (year) {
      year.textContent =
        new Date().getFullYear();
    }
  }

  /* =========================================================
     CATEGORIAS
     ========================================================= */

  function getCategories() {
    const products =
      Array.isArray(state.products)
        ? state.products
        : [];

    /*
      Se defaults.js tiver categorias
      específicas para o cardápio,
      usamos elas primeiro.
    */

    if (
      state.categoriesByArea &&
      Array.isArray(
        state.categoriesByArea.cardapio
      ) &&
      state.categoriesByArea.cardapio.length
    ) {
      return [
        ...state.categoriesByArea.cardapio
      ];
    }

    /*
      Caso exista uma lista geral de categorias.
    */

    if (
      Array.isArray(state.categories) &&
      state.categories.length
    ) {
      return [
        ...state.categories
      ];
    }

    /*
      Caso contrário, monta as categorias
      diretamente a partir dos produtos.
    */

    return [
      ...new Set(
        products
          .filter((product) => {
            return (
              !product.area ||
              product.area === "cardapio"
            );
          })
          .map(
            (product) =>
              product.category
          )
          .filter(Boolean)
      )
    ];
  }

  /* =========================================================
     PRODUTOS DO CARDÁPIO
     ========================================================= */

  function getMenuProducts() {
    const products =
      Array.isArray(state.products)
        ? state.products
        : [];

    return products
      .filter((product) => {
        const isMenuProduct =
          !product.area ||
          product.area === "cardapio";

        const sameCategory =
          !currentCategory ||
          product.category ===
            currentCategory;

        return (
          isMenuProduct &&
          sameCategory
        );
      })
      .sort((a, b) => {
        return (
          Number(a.sort || 0) -
          Number(b.sort || 0)
        );
      });
  }

  /* =========================================================
     CARDÁPIO
     ========================================================= */

  function renderMenu() {
    const categories =
      $("#menu-categories");

    const products =
      $("#menu-products");

    /*
      O index.html atual possui
      exatamente esses dois IDs.
    */

    if (
      !categories ||
      !products
    ) {
      return;
    }

    const categoryList =
      getCategories();

    /*
      Mantém a categoria atual válida.
    */

    if (
      !currentCategory ||
      !categoryList.includes(
        currentCategory
      )
    ) {
      currentCategory =
        categoryList[0] || "";
    }

    /* -----------------------------
       CATEGORIAS
    ----------------------------- */

    if (!categoryList.length) {
      categories.innerHTML = "";
    } else {
      categories.innerHTML =
        categoryList
          .map((category) => {
            const active =
              category ===
              currentCategory;

            return `
              <button
                type="button"
                class="menu-category ${
                  active
                    ? "active"
                    : ""
                }"
                data-category="${escapeHTML(
                  category
                )}"
              >
                ${escapeHTML(
                  category
                )}
              </button>
            `;
          })
          .join("");
    }

    /*
      Eventos das categorias.
    */

    categories
      .querySelectorAll(
        "[data-category]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            currentCategory =
              button.dataset.category ||
              "";

            renderMenu();
          }
        );
      });

    /* -----------------------------
       PRODUTOS
    ----------------------------- */

    const menuProducts =
      getMenuProducts();

    if (!menuProducts.length) {
      products.innerHTML = `
        <div class="menu-empty">
          <p>
            Nenhum produto disponível
            nesta categoria no momento.
          </p>
        </div>
      `;

      return;
    }

    products.innerHTML =
      menuProducts
        .map((product) => {
          const available =
            product.available !== false;

          const image =
            product.image
              ? `
                <img
                  src="${escapeHTML(
                    product.image
                  )}"
                  alt="${escapeHTML(
                    product.name
                  )}"
                  loading="lazy"
                >
              `
              : `
                <div class="product-placeholder">
                  <span>🧁</span>
                </div>
              `;

          const description =
            product.description ||
            "";

          return `
            <article class="product-card">

              <div class="product-img">
                ${image}
              </div>

              <div class="product-body">

                ${
                  product.category
                    ? `
                      <span class="product-tag">
                        ${escapeHTML(
                          product.category
                        )}
                      </span>
                    `
                    : ""
                }

                <h3>
                  ${escapeHTML(
                    product.name ||
                    "Produto"
                  )}
                </h3>

                ${
                  description
                    ? `
                      <p>
                        ${escapeHTML(
                          description
                        )}
                      </p>
                    `
                    : ""
                }

                <div class="product-footer">

                  <strong class="product-price">
                    ${money(
                      product.price
                    )}
                  </strong>

                  ${
                    available
                      ? `
                        <a
                          href="encomendas.html"
                          class="btn primary product-order-btn"
                        >
                          Encomendar
                        </a>
                      `
                      : `
                        <span class="product-unavailable">
                          Indisponível
                        </span>
                      `
                  }

                </div>

              </div>

            </article>
          `;
        })
        .join("");
  }

  /* =========================================================
     PROTEÇÃO CONTRA ERROS
     ========================================================= */

  window.addEventListener(
    "error",
    (event) => {
      console.warn(
        "Erro no site:",
        event.error ||
        event.message
      );
    }
  );

  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  function init() {
    renderYear();
    loadData();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})();
