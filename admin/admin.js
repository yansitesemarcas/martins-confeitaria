/* =========================================================
   MARTINS CONFEITARIA
   PAINEL ADMINISTRATIVO
   ADMIN.JS
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     CONFIGURAÇÃO
  ========================================================= */

  const CFG = window.MARTINS_CONFIG || {};
  const DEF = window.MARTINS_DEFAULTS || {};

  const SUPABASE_URL =
    CFG.SUPABASE_URL ||
    "https://grdyxoflbqilmgpzlrzm.supabase.co";

  const SUPABASE_ANON_KEY =
    CFG.SUPABASE_ANON_KEY || "";

  const WHATSAPP = "5585981563070";

  const $ = (selector) =>
    document.querySelector(selector);

  const $$ = (selector) =>
    [...document.querySelectorAll(selector)];

  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[char]
    );

  const brl = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const clone = (value) =>
    JSON.parse(JSON.stringify(value));

  /* =========================================================
     CLIENTE SUPABASE
  ========================================================= */

  let db = null;

  if (
    window.supabase &&
    SUPABASE_URL &&
    SUPABASE_ANON_KEY
  ) {
    db = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }

  /* =========================================================
     ESTADO
  ========================================================= */

  const S = {
    on: false,
    view: "dashboard",

    site: {},

    products: [],

    readyOrders: [],

    customOrders: [],

    editId: null,

    image: undefined,

    enc: null
  };

  /* =========================================================
     STATUS
  ========================================================= */

  const STATUS = [
    "novo",
    "em andamento",
    "confirmado",
    "concluído",
    "cancelado"
  ];

  const STATUS_LABEL = {
    novo: "Novo",
    "em andamento": "Em andamento",
    confirmado: "Confirmado",
    concluído: "Concluído",
    cancelado: "Cancelado"
  };

  /* =========================================================
     TÍTULOS
  ========================================================= */

  const TITLES = {
    dashboard: "Dashboard",

    "prod-ready":
      "Produtos — Pronta Entrega",

    "prod-orders":
      "Produtos — Encomendas",

    "ord-ready":
      "Pedidos — Pronta Entrega",

    "ord-orders":
      "Pedidos — Encomendas",

    settings:
      "Configurações"
  };

  /* =========================================================
     CONFIGURAÇÃO PADRÃO DE ENCOMENDAS
  ========================================================= */

  const DEFAULT_ENC = {
    cakes: [
      {
        name: "Naked Cake",

        options: [
          "06/08 pessoas",
          "10/12 pessoas",
          "15/20 pessoas",
          "20/25 pessoas",
          "25/30 pessoas",
          "30/40 pessoas",
          "40/50 pessoas",
          "50/60 pessoas"
        ],

        prices: [
          45,
          70,
          98,
          115,
          145,
          188,
          240,
          280
        ],

        active: true
      },

      {
        name: "Chantininho",

        options: [
          "06/08 pessoas",
          "10/12 pessoas",
          "15/20 pessoas",
          "20/25 pessoas",
          "25/30 pessoas",
          "30/40 pessoas",
          "40/50 pessoas",
          "50/60 pessoas"
        ],

        prices: [
          60,
          80,
          120,
          140,
          170,
          220,
          260,
          300
        ],

        active: true
      }
    ],

    /* =======================================================
       DECORAÇÕES / TOPO
    ======================================================= */

    topes: [
      [
        "Chantininho clássico",
        0
      ],

      [
        "Decoração personalizada",
        25
      ],

      [
        "Decoração especial",
        40
      ]
    ],

    /* =======================================================
       MASSAS
    ======================================================= */

    masses: [
      "Amanteigado",
      "Ninho",
      "Chocolate",
      "Baunilha",
      "Coco",
      "Limão"
    ],

    /* =======================================================
       RECHEIOS
    ======================================================= */

    fillings: [
      "Ninho",
      "Brigadeiro",
      "Leite condensado",
      "Oreo",
      "Beijinho",
      "Doce de leite",
      "Limão"
    ],

    /* =======================================================
       ADICIONAIS
    ======================================================= */

    extras: [
      [
        "Abacaxi",
        10
      ],

      [
        "Morango",
        16
      ],

      [
        "Crocante de Castanha",
        10
      ],

      [
        "Kit Kat",
        12
      ],

      [
        "Geleia de Morango",
        16
      ],

      [
        "Ouro Branco",
        10
      ],

      [
        "Nutella",
        16
      ],

      [
        "Kinder Bueno",
        16
      ]
    ],

    /* =======================================================
       PERSONALIZAÇÕES
    ======================================================= */

    personalizations: [
      [
        "Topo simples",
        20
      ],

      [
        "Topo 3D",
        30
      ],

      [
        "Flores naturais",
        70
      ]
    ],

    /* =======================================================
       BRIGADEIROS
    ======================================================= */

    brigadeiros: {
      classica: [
        "Brigadeiro Tradicional",
        "Brigadeiro Branco Ninho",
        "Casadinho",
        "Limão",
        "Beijinho",
        "Doce de Leite"
      ],

      premium: [
        "Ninho com Nutella",
        "Moça Cremoso",
        "Surpresa de Uva",
        "Belga ao Leite",
        "Belga Amargo",
        "Creme Bruleé",
        "Brigadeiro com Castanha",
        "Doce de Leite com Castanha",
        "Kit Kat",
        "Oreo"
      ],

      classicaPrices: [
        62.5,
        125
      ],

      premiumPrices: [
        72.5,
        145
      ],

      flavorLimit50: 2,

      flavorLimit100: 4
    },

    /* =======================================================
       OUTROS ITENS
    ======================================================= */

    otherItems: [
      {
        name: "Petit Brownie",
        active: true,
        price: 0
      },

      {
        name: "Mini Brownie Recheado",
        active: true,
        price: 0
      },

      {
        name: "Bem Casado",
        active: true,
        price: 0
      },

      {
        name: "Cupcakes",
        active: true,
        price: 35
      }
    ],

    /* =======================================================
       KITS
    ======================================================= */

    kits: [
      {
        id: "k1",
        name: "Kit Festa 01",
        price: 150,
        cake: "Chantininho 10/15 Pessoas",
        docinhos: 20,
        items: [
          "04 Cupcakes",
          "20 Petit Brownie",
          "20 Docinhos"
        ],
        active: true
      },

      {
        id: "k2",
        name: "Kit Festa 02",
        price: 200,
        cake: "Chantininho 15/20 Pessoas",
        docinhos: 30,
        items: [
          "05 Cupcakes",
          "30 Petit Brownie",
          "30 Docinhos"
        ],
        active: true
      },

      {
        id: "k3",
        name: "Kit Festa 03",
        price: 250,
        cake: "Chantininho 20/25 Pessoas",
        docinhos: 50,
        items: [
          "08 Cupcakes",
          "50 Petit Brownie",
          "50 Docinhos"
        ],
        active: true
      },

      {
        id: "k4",
        name: "Kit Festa 04",
        price: 430,
        cake: "Chantininho 30/40 Pessoas",
        docinhos: 60,
        items: [
          "10 Cupcakes",
          "60 Petit Brownie",
          "60 Docinhos"
        ],
        active: true
      },

      {
        id: "k5",
        name: "Kit Festa 05",
        price: 500,
        cake: "Chantininho 40/50 Pessoas",
        docinhos: 70,
        items: [
          "12 Cupcakes",
          "70 Petit Brownie",
          "70 Docinhos"
        ],
        active: true
      }
    ]
  };

  /* =========================================================
     MESCLAGEM SEGURA DA CONFIGURAÇÃO
  ========================================================= */

  function mergeEnc(value) {
    const base = clone(DEFAULT_ENC);

    if (
      !value ||
      typeof value !== "object"
    ) {
      return base;
    }

    return {
      ...base,
      ...value,

      brigadeiros: {
        ...base.brigadeiros,
        ...(value.brigadeiros || {})
      }
    };
  }

  /* =========================================================
     TOAST
  ========================================================= */

  function toast(
    message,
    type = "ok"
  ) {
    const el = $("#toast");

    if (!el) {
      alert(message);
      return;
    }

    el.className = type;
    el.textContent = message;

    el.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
      el.classList.remove("show");
    }, 2800);
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  async function checkSession() {
    if (!db) {
      return false;
    }

    const {
      data,
      error
    } = await db.auth.getSession();

    if (error) {
      console.error(error);
      return false;
    }

    return !!data?.session;
  }

  async function login(
    email,
    password
  ) {
    if (!db) {
      throw new Error(
        "Supabase não foi configurado."
      );
    }

    const {
      error
    } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    S.on = true;

    $("#login")?.classList.add(
      "hidden"
    );

    $("#app")?.classList.remove(
      "hidden"
    );

    await start();
  }

  async function logout() {
    try {
      if (db) {
        await db.auth.signOut();
      }
    } catch (error) {
      console.error(error);
    }

    S.on = false;

    $("#app")?.classList.add(
      "hidden"
    );

    $("#login")?.classList.remove(
      "hidden"
    );
  }

  /* =========================================================
     LOAD SITE
  ========================================================= */

  async function loadSite() {
    if (!db) {
      S.site = {};
      return;
    }

    const {
      data,
      error
    } = await db
      .from("settings")
      .select("value")
      .eq("key", "site")
      .maybeSingle();

    if (error) {
      console.warn(
        "Erro ao carregar site:",
        error.message
      );

      S.site = {};
      return;
    }

    S.site =
      data?.value &&
      typeof data.value === "object"
        ? data.value
        : {};
  }

  /* =========================================================
     SAVE SITE
  ========================================================= */

  async function saveSite(
    patch
  ) {
    if (!db) {
      throw new Error(
        "Supabase não conectado."
      );
    }

    S.site = {
      ...(S.site || {}),
      ...(patch || {})
    };

    const {
      error
    } = await db
      .from("settings")
      .upsert(
        {
          key: "site",
          value: S.site
        },
        {
          onConflict: "key"
        }
      );

    if (error) {
      throw error;
    }
  }

  /* =========================================================
     LOAD ENCOMENDAS
  ========================================================= */

  async function loadEnc() {
    if (!db) {
      S.enc = clone(
        DEFAULT_ENC
      );

      return;
    }

    const {
      data,
      error
    } = await db
      .from("settings")
      .select("value")
      .eq("key", "encomendas")
      .maybeSingle();

    if (error) {
      console.warn(
        "Erro ao carregar configuração de encomendas:",
        error.message
      );

      S.enc = clone(
        DEFAULT_ENC
      );

      return;
    }

    S.enc =
      mergeEnc(
        data?.value
      );
  }

  /* =========================================================
     SAVE ENCOMENDAS
  ========================================================= */

  async function saveEnc() {
    if (!db) {
      throw new Error(
        "Supabase não conectado."
      );
    }

    const {
      error
    } = await db
      .from("settings")
      .upsert(
        {
          key: "encomendas",
          value: S.enc
        },
        {
          onConflict: "key"
        }
      );

    if (error) {
      throw error;
    }
  }

  /* =========================================================
     LOAD PRODUCTS
  ========================================================= */

  async function loadProducts() {
    if (!db) {
      S.products = [];
      return;
    }

    const {
      data,
      error
    } = await db
      .from("products")
      .select("*")
      .order("sort_order", {
        ascending: true
      })
      .order("created_at", {
        ascending: true
      });

    if (error) {
      console.warn(
        "Erro ao carregar produtos:",
        error.message
      );

      S.products = [];

      return;
    }

    S.products =
      Array.isArray(data)
        ? data
        : [];
  }

  /* =========================================================
     LOAD PEDIDOS
  ========================================================= */

  async function loadOrders() {
    S.readyOrders = [];
    S.customOrders = [];

    if (!db) {
      return;
    }

    /* =======================================================
       PRONTA ENTREGA
    ======================================================= */

    try {
      const {
        data,
        error
      } = await db
        .from("orders")
        .select("*")
        .order("created_at", {
          ascending: false
        });

      if (error) {
        console.warn(
          "Tabela orders:",
          error.message
        );
      } else {
        S.readyOrders =
          Array.isArray(data)
            ? data
            : [];
      }
    } catch (error) {
      console.warn(error);
    }

    /* =======================================================
       ENCOMENDAS
    ======================================================= */

    try {
      const {
        data,
        error
      } = await db
        .from("custom_cakes")
        .select("*")
        .order("created_at", {
          ascending: false
        });

      if (error) {
        console.warn(
          "Tabela custom_cakes:",
          error.message
        );
      } else {
        S.customOrders =
          Array.isArray(data)
            ? data
            : [];
      }
    } catch (error) {
      console.warn(error);
    }
  }

  /* =========================================================
     ÁREA DO PRODUTO
  ========================================================= */

  function productArea(
    product
  ) {
    const area =
      String(
        product?.area ||
        product?.tipo ||
        product?.type ||
        ""
      )
        .trim()
        .toLowerCase();

    if (
      area === "encomendas" ||
      area === "encomenda" ||
      area === "order" ||
      area === "orders"
    ) {
      return "encomendas";
    }

    return "pronta";
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  function dashboardView() {
    const readyProducts =
      S.products.filter(
        (p) =>
          productArea(p) ===
          "pronta"
      );

    const orderProducts =
      S.products.filter(
        (p) =>
          productArea(p) ===
          "encomendas"
      );

    const readyOrders =
      S.readyOrders.length;

    const customOrders =
      S.customOrders.length;

    const pending =
      [
        ...S.readyOrders,
        ...S.customOrders
      ].filter(
        (o) =>
          String(
            o?.status ||
              "novo"
          ).toLowerCase() ===
          "novo"
      ).length;

    return `
      <div class="stats">

        <div class="stat-card">
          <span>Pronta Entrega</span>
          <strong>${readyProducts.length}</strong>
          <small>produtos</small>
        </div>

        <div class="stat-card">
          <span>Encomendas</span>
          <strong>${orderProducts.length}</strong>
          <small>produtos cadastrados</small>
        </div>

        <div class="stat-card">
          <span>Pedidos</span>
          <strong>${readyOrders + customOrders}</strong>
          <small>pedidos registrados</small>
        </div>

        <div class="stat-card">
          <span>Novos</span>
          <strong>${pending}</strong>
          <small>aguardando atendimento</small>
        </div>

      </div>

      <div class="panel">

        <div class="panel-head">

          <div>
            <h2>Resumo</h2>

            <p class="muted">
              Visão geral do painel da Martins Confeitaria.
            </p>
          </div>

        </div>

        <div class="dashboard-actions">

          <button
            class="btn primary"
            data-view="prod-ready"
          >
            🍰 Pronta Entrega
          </button>

          <button
            class="btn primary"
            data-view="prod-orders"
          >
            🎂 Encomendas
          </button>

          <button
            class="btn soft"
            data-view="ord-ready"
          >
            🛒 Pedidos Pronta Entrega
          </button>

          <button
            class="btn soft"
            data-view="ord-orders"
          >
            📋 Pedidos Encomendas
          </button>

        </div>

      </div>
    `;
  }

  /* =========================================================
     PRODUTOS
  ========================================================= */

  function productsView(
    kind
  ) {
    const isReady =
      kind === "ready";

    const products =
      S.products.filter(
        (product) =>
          productArea(product) ===
          (
            isReady
              ? "pronta"
              : "encomendas"
          )
      );

    return `
      <div class="panel">

        <div class="panel-head">

          <div>

            <h2>
              ${
                isReady
                  ? "Pronta Entrega"
                  : "Encomendas"
              }
            </h2>

            <p class="muted">
              ${
                isReady
                  ? "Produtos disponíveis para venda imediata."
                  : "Produtos utilizados na área de encomendas."
              }
            </p>

          </div>

          <button
            class="btn primary"
            data-act="new-product"
            data-area="${
              isReady
                ? "pronta"
                : "encomendas"
            }"
          >
            + Novo produto
          </button>

        </div>

        ${
          products.length
            ? `
              <div class="product-grid">

                ${products
                  .map(
                    productCard
                  )
                  .join("")}

              </div>
            `
            : `
              <div class="empty">
                Nenhum produto cadastrado nesta área.
              </div>
            `
        }

      </div>

      ${
        !isReady
          ? encomendasConfigView()
          : ""
      }
    `;
  }

  /* =========================================================
     CARD DE PRODUTO
  ========================================================= */

  function productCard(
    product
  ) {
    const image =
      product.image_url ||
      product.image ||
      "";

    const active =
      product.active !== false;

    const area =
      productArea(product);

    return `
      <article class="product-card">

        ${
          image
            ? `
              <div class="product-image">

                <img
                  src="${esc(image)}"
                  alt="${esc(
                    product.name ||
                    "Produto"
                  )}"
                >

              </div>
            `
            : `
              <div class="product-image empty-image">
                <span>Sem foto</span>
              </div>
            `
        }

        <div class="product-body">

          <div class="product-top">

            <h3>
              ${esc(
                product.name ||
                "Produto"
              )}
            </h3>

            <span class="badge ${
              active
                ? "ok"
                : "off"
            }">

              ${
                active
                  ? "Ativo"
                  : "Inativo"
              }

            </span>

          </div>

          <small class="muted">
            Área:
            ${
              area === "pronta"
                ? "Pronta Entrega"
                : "Encomendas"
            }
          </small>

          ${
            product.category
              ? `
                <small class="muted">
                  Classificação:
                  ${esc(
                    product.category
                  )}
                </small>
              `
              : ""
          }

          ${
            product.description
              ? `
                <p class="muted">
                  ${esc(
                    product.description
                  )}
                </p>
              `
              : ""
          }

          <strong class="product-price">
            ${brl(
              product.price
            )}
          </strong>

          ${
            Number(
              product.discount || 0
            ) > 0
              ? `
                <small>
                  Desconto:
                  ${Number(
                    product.discount
                  )}%
                </small>
              `
              : ""
          }

          <div class="product-actions">

            <button
              class="btn soft"
              data-act="edit-product"
              data-id="${esc(
                product.id
              )}"
            >
              Editar
            </button>

            <button
              class="btn danger"
              data-act="delete-product"
              data-id="${esc(
                product.id
              )}"
            >
              Excluir
            </button>

          </div>

        </div>

      </article>
    `;
  }

  /* =========================================================
     CONFIGURAÇÃO DE ENCOMENDAS
  ========================================================= */

  function encomendasConfigView() {
    const enc =
      S.enc ||
      clone(DEFAULT_ENC);

    return `
      <div class="panel enc-config">

        <div class="panel-head">

          <div>

            <h2>
              Configuração das Encomendas
            </h2>

            <p class="muted">
              Tudo abaixo alimenta a página
              <strong>encomendas.html</strong>.
            </p>

          </div>

          <button
            class="btn primary"
            data-act="save-enc"
          >
            💾 Salvar alterações
          </button>

        </div>

        ${renderCakeConfig(enc)}

        ${renderSimpleList(
          "Decoração / Topo",
          "topes",
          enc.topes
        )}

        ${renderSimpleStringList(
          "Massas",
          "masses",
          enc.masses
        )}

        ${renderSimpleStringList(
          "Recheios",
          "fillings",
          enc.fillings
        )}

        ${renderPriceList(
          "Adicionais",
          "extras",
          enc.extras
        )}

        ${renderPriceList(
          "Personalizações",
          "personalizations",
          enc.personalizations
        )}

        ${renderBrigadeiroConfig(
          enc.brigadeiros
        )}

        ${renderOtherItems(
          enc.otherItems
        )}

        ${renderKits(
          enc.kits
        )}

      </div>
    `;
  }

  /* =========================================================
     BOLOS
  ========================================================= */

  function renderCakeConfig(
    enc
  ) {
    return `
      <div class="enc-section">

        <div class="enc-section-head">

          <div>

            <h3>Bolos</h3>

            <p class="muted">
              Tipos, tamanhos e preços.
            </p>

          </div>

        </div>

        <div class="enc-list">

          ${(
            enc.cakes || []
          )
            .map(
              (
                cake,
                index
              ) => `
                <div
                  class="enc-card"
                  data-cake-index="${index}"
                >

                  <div class="enc-card-head">

                    <div>
                      <strong>
                        ${esc(
                          cake.name
                        )}
                      </strong>
                    </div>

                    <label class="switch-row">

                      <input
                        type="checkbox"
                        data-enc-cake-active="${index}"
                        ${
                          cake.active !== false
                            ? "checked"
                            : ""
                        }
                      >

                      Ativo

                    </label>

                  </div>

                  <div class="enc-options">

                    ${(
                      cake.options ||
                      []
                    )
                      .map(
                        (
                          option,
                          optionIndex
                        ) => `
                          <div class="enc-row">

                            <input
                              type="text"
                              data-cake-name="${index}"
                              data-option="${optionIndex}"
                              value="${esc(
                                option
                              )}"
                            >

                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              data-cake-price="${index}"
                              data-option="${optionIndex}"
                              value="${Number(
                                cake.prices?.[
                                  optionIndex
                                ] || 0
                              )}"
                            >

                          </div>
                        `
                      )
                      .join("")}

                  </div>

                </div>
              `
            )
            .join("")}

        </div>

      </div>
    `;
  }

  /* =========================================================
     LISTA SIMPLES COM PREÇO
  ========================================================= */

  function renderSimpleList(
    title,
    key,
    items
  ) {
    return `
      <div class="enc-section">

        <div class="enc-section-head">

          <h3>
            ${esc(title)}
          </h3>

          <button
            class="btn soft"
            data-act="add-enc-item"
            data-key="${key}"
          >
            + Adicionar
          </button>

        </div>

        <div class="enc-list">

          ${(items || [])
            .map(
              (
                item,
                index
              ) => `
                <div class="enc-row">

                  <input
                    type="text"
                    data-simple-key="${key}"
                    data-simple-index="${index}"
                    value="${esc(
                      Array.isArray(item)
                        ? item[0]
                        : item
                    )}"
                  >

                  ${
                    Array.isArray(
                      item
                    )
                      ? `
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          data-price-key="${key}"
                          data-price-index="${index}"
                          value="${Number(
                            item[1] || 0
                          )}"
                        >
                      `
                      : ""
                  }

                  <button
                    class="btn danger"
                    data-act="remove-enc-item"
                    data-key="${key}"
                    data-index="${index}"
                  >
                    ×
                  </button>

                </div>
              `
            )
            .join("")}

        </div>

      </div>
    `;
  }

  /* =========================================================
     LISTA DE TEXTOS
  ========================================================= */

  function renderSimpleStringList(
    title,
    key,
    items
  ) {
    return `
      <div class="enc-section">

        <div class="enc-section-head">

          <h3>
            ${esc(title)}
          </h3>

          <button
            class="btn soft"
            data-act="add-enc-item"
            data-key="${key}"
          >
            + Adicionar
          </button>

        </div>

        <div class="enc-list">

          ${(items || [])
            .map(
              (
                item,
                index
              ) => `
                <div class="enc-row">

                  <input
                    type="text"
                    data-simple-key="${key}"
                    data-simple-index="${index}"
                    value="${esc(
                      item
                    )}"
                  >

                  <button
                    class="btn danger"
                    data-act="remove-enc-item"
                    data-key="${key}"
                    data-index="${index}"
                  >
                    ×
                  </button>

                </div>
              `
            )
            .join("")}

        </div>

      </div>
    `;
  }

  /* =========================================================
     LISTA DE PREÇOS
  ========================================================= */

  function renderPriceList(
    title,
    key,
    items
  ) {
    return `
      <div class="enc-section">

        <div class="enc-section-head">

          <h3>
            ${esc(title)}
          </h3>

          <button
            class="btn soft"
            data-act="add-enc-item"
            data-key="${key}"
          >
            + Adicionar
          </button>

        </div>

        <div class="enc-list">

          ${(items || [])
            .map(
              (
                item,
                index
              ) => `
                <div class="enc-row">

                  <input
                    type="text"
                    data-price-name="${key}"
                    data-price-index="${index}"
                    value="${esc(
                      item?.[0]
                    )}"
                  >

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    data-price-value="${key}"
                    data-price-index="${index}"
                    value="${Number(
                      item?.[1] || 0
                    )}"
                  >

                  <button
                    class="btn danger"
                    data-act="remove-enc-item"
                    data-key="${key}"
                    data-index="${index}"
                  >
                    ×
                  </button>

                </div>
              `
            )
            .join("")}

        </div>

      </div>
    `;
  }

  /* =========================================================
     BRIGADEIROS
  ========================================================= */

  function renderBrigadeiroConfig(
    brigadeiros
  ) {
    const b =
      brigadeiros ||
      DEFAULT_ENC.brigadeiros;

    return `
      <div class="enc-section">

        <div class="enc-section-head">

          <div>

            <h3>Brigadeiros</h3>

            <p class="muted">
              Sabores e valores das caixas de
              50 e 100 unidades.
            </p>

          </div>

        </div>

        <div class="enc-card">

          <h4>Clássicos</h4>

          <div class="enc-list">

            ${(b.classica || [])
              .map(
                (
                  name,
                  index
                ) => `
                  <div class="enc-row">

                    <input
                      type="text"
                      data-brig-classic="${index}"
                      value="${esc(
                        name
                      )}"
                    >

                    <button
                      class="btn danger"
                      data-act="remove-brig"
                      data-type="classica"
                      data-index="${index}"
                    >
                      ×
                    </button>

                  </div>
                `
              )
              .join("")}

          </div>

          <button
            class="btn soft"
            data-act="add-brig"
            data-type="classica"
          >
            + Adicionar sabor
          </button>

        </div>

        <div class="enc-card">

          <h4>Premium</h4>

          <div class="enc-list">

            ${(b.premium || [])
              .map(
                (
                  name,
                  index
                ) => `
                  <div class="enc-row">

                    <input
                      type="text"
                      data-brig-premium="${index}"
                      value="${esc(
                        name
                      )}"
                    >

                    <button
                      class="btn danger"
                      data-act="remove-brig"
                      data-type="premium"
                      data-index="${index}"
                    >
                      ×
                    </button>

                  </div>
                `
              )
              .join("")}

          </div>

          <button
            class="btn soft"
            data-act="add-brig"
            data-type="premium"
          >
            + Adicionar sabor
          </button>

        </div>

        <div class="enc-card">

          <h4>Valores</h4>

          <div class="enc-row">

            <label>
              Clássicos — 50 unidades

              <input
                type="number"
                min="0"
                step="0.01"
                data-brig-price="classica"
                data-brig-size="0"
                value="${Number(
                  b.classicaPrices?.[0] || 0
                )}"
              >

            </label>

            <label>
              Clássicos — 100 unidades

              <input
                type="number"
                min="0"
                step="0.01"
                data-brig-price="classica"
                data-brig-size="1"
                value="${Number(
                  b.classicaPrices?.[1] || 0
                )}"
              >

            </label>

          </div>

          <div class="enc-row">

            <label>
              Premium — 50 unidades

              <input
                type="number"
                min="0"
                step="0.01"
                data-brig-price="premium"
                data-brig-size="0"
                value="${Number(
                  b.premiumPrices?.[0] || 0
                )}"
              >

            </label>

            <label>
              Premium — 100 unidades

              <input
                type="number"
                min="0"
                step="0.01"
                data-brig-price="premium"
                data-brig-size="1"
                value="${Number(
                  b.premiumPrices?.[1] || 0
                )}"
              >

            </label>

          </div>

        </div>

        <div class="enc-card">

          <h4>Limite de sabores</h4>

          <div class="enc-row">

            <label>
              Limite para 50 unidades

              <input
                type="number"
                min="1"
                step="1"
                data-brig-limit="50"
                value="${Number(
                  b.flavorLimit50 || 2
                )}"
              >

            </label>

            <label>
              Limite para 100 unidades

              <input
                type="number"
                min="1"
                step="1"
                data-brig-limit="100"
                value="${Number(
                  b.flavorLimit100 || 4
                )}"
              >

            </label>

          </div>

        </div>

      </div>
    `;
  }

  /* =========================================================
     OUTROS ITENS
  ========================================================= */

  function renderOtherItems(
    items
  ) {
    return `
      <div class="enc-section">

        <div class="enc-section-head">

          <div>

            <h3>Outros itens</h3>

            <p class="muted">
              Itens mostrados em
              “Outros itens” na encomenda.
            </p>

          </div>

          <button
            class="btn soft"
            data-act="add-other-item"
          >
            + Adicionar
          </button>

        </div>

        <div class="enc-list">

          ${(items || [])
            .map(
              (
                item,
                index
              ) => `
                <div class="enc-row">

                  <input
                    type="text"
                    data-other-name="${index}"
                    value="${esc(
                      item.name
                    )}"
                  >

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    data-other-price="${index}"
                    value="${Number(
                      item.price || 0
                    )}"
                  >

                  <label class="switch-row">

                    <input
                      type="checkbox"
                      data-other-active="${index}"
                      ${
                        item.active !== false
                          ? "checked"
                          : ""
                      }
                    >

                    Ativo

                  </label>

                  <button
                    class="btn danger"
                    data-act="remove-other-item"
                    data-index="${index}"
                  >
                    ×
                  </button>

                </div>
              `
            )
            .join("")}

        </div>

      </div>
    `;
  }

  /* =========================================================
     KITS
  ========================================================= */

  function renderKits(
    kits
  ) {
    return `
      <div class="enc-section">

        <div class="enc-section-head">

          <div>

            <h3>Kits</h3>

            <p class="muted">
              Os kits possuem bolo e docinhos
              inclusos conforme definido abaixo.
            </p>

          </div>

          <button
            class="btn soft"
            data-act="add-kit"
          >
            + Novo kit
          </button>

        </div>

        <div class="enc-list">

          ${(kits || [])
            .map(
              (
                kit,
                index
              ) => `
                <div class="enc-card">

                  <div class="enc-card-head">

                    <strong>
                      Kit ${index + 1}
                    </strong>

                    <label class="switch-row">

                      <input
                        type="checkbox"
                        data-kit-active="${index}"
                        ${
                          kit.active !== false
                            ? "checked"
                            : ""
                        }
                      >

                      Ativo

                    </label>

                  </div>

                  <div class="enc-row">

                    <label>
                      Nome

                      <input
                        type="text"
                        data-kit-name="${index}"
                        value="${esc(
                          kit.name
                        )}"
                      >

                    </label>

                    <label>
                      Preço

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        data-kit-price="${index}"
                        value="${Number(
                          kit.price || 0
                        )}"
                      >

                    </label>

                  </div>

                  <div class="enc-row">

                    <label>
                      Bolo incluso

                      <input
                        type="text"
                        data-kit-cake="${index}"
                        value="${esc(
                          kit.cake
                        )}"
                      >

                    </label>

                    <label>
                      Docinhos

                      <input
                        type="number"
                        min="0"
                        step="1"
                        data-kit-docinhos="${index}"
                        value="${Number(
                          kit.docinhos || 0
                        )}"
                      >

                    </label>

                  </div>

                  <label>
                    Itens inclusos

                    <textarea
                      rows="4"
                      data-kit-items="${index}"
                      placeholder="Um item por linha"
                    >${esc(
                      (
                        kit.items ||
                        []
                      ).join("\n")
                    )}</textarea>

                  </label>

                  <div class="product-actions">

                    <button
                      class="btn danger"
                      data-act="remove-kit"
                      data-index="${index}"
                    >
                      Excluir kit
                    </button>

                  </div>

                </div>
              `
            )
            .join("")}

        </div>

      </div>
    `;
  }

  /* =========================================================
     PEDIDOS
  ========================================================= */

  function ordersView(
    kind
  ) {
    const isReady =
      kind === "ready";

    const orders =
      isReady
        ? S.readyOrders
        : S.customOrders;

    return `
      <div class="panel">

        <div class="panel-head">

          <div>

            <h2>
              ${
                isReady
                  ? "Pedidos — Pronta Entrega"
                  : "Pedidos — Encomendas"
              }
            </h2>

            <p class="muted">
              ${
                isReady
                  ? "Pedidos recebidos pela área de pronta entrega."
                  : "Pedidos recebidos pelo formulário de encomendas."
              }
            </p>

          </div>

          <button
            class="btn soft"
            data-act="refresh-orders"
          >
            ↻ Atualizar
          </button>

        </div>

        ${
          orders.length
            ? `
              <div class="orders-list">

                ${orders
                  .map(
                    (
                      order
                    ) =>
                      orderCard(
                        order,
                        isReady
                          ? "ready"
                          : "custom"
                      )
                  )
                  .join("")}

              </div>
            `
            : `
              <div class="empty">
                Nenhum pedido registrado.
              </div>
            `
        }

      </div>
    `;
  }

  /* =========================================================
     NORMALIZAR PEDIDO DE ENCOMENDA
  ========================================================= */

  function normalizeCustomOrder(
    order
  ) {
    const data =
      order?.data &&
      typeof order.data === "object"
        ? order.data
        : {};

    return {
      id: order?.id,

      status:
        order?.status ||
        "novo",

      created_at:
        order?.created_at ||
        data.created_at ||
        data.criado_em ||
        null,

      cliente:
        data.customer ||
        data.cliente ||
        data.nome ||
        order?.cliente ||
        "",

      whatsapp:
        data.whatsapp ||
        data.telefone ||
        order?.whatsapp ||
        "",

      data_desejada:
        data.date ||
        data.data_desejada ||
        data.data ||
        "",

      kit:
        data.kit ||
        null,

      bolo:
        data.cake ||
        data.bolo ||
        null,

      massa:
        data.mass ||
        data.massa ||
        null,

      recheio:
        data.filling ||
        data.recheio ||
        null,

      topo:
        data.topo ||
        data.decoracao ||
        data.decoration ||
        null,

      adicionais:
        Array.isArray(
          data.extras
        )
          ? data.extras
          : Array.isArray(
              data.adicionais
            )
            ? data.adicionais
            : [],

      personalizacao:
        Array.isArray(
          data.personalization
        )
          ? data.personalization
          : Array.isArray(
              data.personalizacao
            )
            ? data.personalizacao
            : [],

      personalizacao_text:
        data.personalization_text ||
        data.personalizacao_text ||
        data.custom_text ||
        "",

      brigadeiros:
        Array.isArray(
          data.brigadeiros
        )
          ? data.brigadeiros
          : [],

      outros:
        Array.isArray(
          data.otherItems
        )
          ? data.otherItems
          : Array.isArray(
              data.outros
            )
            ? data.outros
            : [],

      observacoes:
        data.notes ||
        data.observacoes ||
        "",

      total_estimado:
        data.estimatedTotal ??
        data.total_estimado ??
        "",

      raw: data
    };
  }

  /* =========================================================
     NORMALIZAR PEDIDO PRONTA ENTREGA
  ========================================================= */

  function normalizeReadyOrder(
    order
  ) {
    const data =
      order?.data &&
      typeof order.data === "object"
        ? order.data
        : {};

    return {
      id: order?.id,

      status:
        order?.status ||
        "novo",

      created_at:
        order?.created_at ||
        data.criado_em ||
        null,

      cliente:
        data.cliente ||
        data.customer ||
        data.nome ||
        "",

      whatsapp:
        data.whatsapp ||
        data.telefone ||
        "",

      recebimento:
        data.recebimento ||
        data.receiving ||
        data.entrega ||
        "",

      endereco:
        data.endereco ||
        data.address ||
        "",

      pagamento:
        data.pagamento ||
        data.payment ||
        "",

      observacoes:
        data.observacoes ||
        data.notes ||
        "",

      itens:
        Array.isArray(
          data.itens
        )
          ? data.itens
          : Array.isArray(
              data.items
            )
            ? data.items
            : [],

      total:
        data.total ??
        data.total_price ??
        0,

      raw: data
    };
  }

  /* =========================================================
     FORMATAR DATA
  ========================================================= */

  function formatDate(
    value
  ) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return esc(value);
    }

    return date.toLocaleString(
      "pt-BR"
    );
  }

  /* =========================================================
     FORMATAR DATA SIMPLES
  ========================================================= */

  function formatSimpleDate(
    value
  ) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(
        `${value}T00:00:00`
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return esc(value);
    }

    return date.toLocaleDateString(
      "pt-BR"
    );
  }

  /* =========================================================
     PEDIDO CARD
  ========================================================= */

  function orderCard(
    order,
    type
  ) {
    const custom =
      type === "custom";

    const data =
      custom
        ? normalizeCustomOrder(
            order
          )
        : normalizeReadyOrder(
            order
          );

    const status =
      String(
        data.status ||
          "novo"
      ).toLowerCase();

    return `
      <article class="order-card">

        <div class="order-head">

          <div>

            <span class="order-type">
              ${
                custom
                  ? "ENCOMENDA"
                  : "PRONTA ENTREGA"
              }
            </span>

            <h3>
              ${esc(
                data.cliente ||
                "Cliente"
              )}
            </h3>

            <small>
              Recebido:
              ${formatDate(
                data.created_at
              )}
            </small>

          </div>

          <span class="badge">

            ${esc(
              STATUS_LABEL[
                status
              ] ||
                status
            )}

          </span>

        </div>

        ${
          custom
            ? customOrderDetails(
                data
              )
            : readyOrderDetails(
                data
              )
        }

        <div class="order-actions">

          <label>
            Status

            <select
              data-status-id="${esc(
                order.id
              )}"
              data-status-type="${type}"
            >

              ${STATUS.map(
                (
                  item
                ) => `
                  <option
                    value="${esc(
                      item
                    )}"
                    ${
                      item ===
                      status
                        ? "selected"
                        : ""
                    }
                  >
                    ${esc(
                      STATUS_LABEL[
                        item
                      ]
                    )}
                  </option>
                `
              ).join("")}

            </select>

          </label>

          <button
            class="btn soft"
            data-act="print-order"
            data-id="${esc(
              order.id
            )}"
            data-type="${type}"
          >
            🖨 Imprimir
          </button>

        </div>

      </article>
    `;
  }

  /* =========================================================
     DETALHES ENCOMENDA
  ========================================================= */

  function customOrderDetails(
    data
  ) {
    return `
      <div class="order-details">

        ${detail(
          "WhatsApp",
          data.whatsapp
        )}

        ${detail(
          "Data desejada",
          formatSimpleDate(
            data.data_desejada
          )
        )}

        ${detail(
          "Kit",
          formatComplexValue(
            data.kit
          )
        )}

        ${detail(
          "Bolo",
          formatComplexValue(
            data.bolo
          )
        )}

        ${detail(
          "Massa",
          formatComplexValue(
            data.massa
          )
        )}

        ${detail(
          "Recheio",
          formatComplexValue(
            data.recheio
          )
        )}

        ${detail(
          "Decoração",
          formatComplexValue(
            data.topo
          )
        )}

        ${
          data.adicionais.length
            ? detail(
                "Adicionais",
                formatArray(
                  data.adicionais
                )
              )
            : ""
        }

        ${
          data.personalizacao.length
            ? detail(
                "Personalização",
                formatArray(
                  data.personalizacao
                )
              )
            : ""
        }

        ${
          data.personalizacao_text
            ? detail(
                "Texto da personalização",
                data.personalizacao_text
              )
            : ""
        }

        ${
          data.brigadeiros.length
            ? `
              <div class="detail full">

                <span>
                  Brigadeiros
                </span>

                <strong>
                  ${data.brigadeiros
                    .map(
                      (
                        item
                      ) =>
                        formatBrigadeiro(
                          item
                        )
                    )
                    .join(
                      "<br>"
                    )}
                </strong>

              </div>
            `
            : ""
        }

        ${
          data.outros.length
            ? `
              <div class="detail full">

                <span>
                  Outros itens
                </span>

                <strong>
                  ${data.outros
                    .map(
                      (
                        item
                      ) =>
                        formatOtherItem(
                          item
                        )
                    )
                    .join(
                      "<br>"
                    )}
                </strong>

              </div>
            `
            : ""
        }

        ${
          data.observacoes
            ? detail(
                "Observações",
                data.observacoes
              )
            : ""
        }

        ${
          data.total_estimado !==
            "" &&
          data.total_estimado !==
            null &&
          data.total_estimado !==
            undefined
            ? detail(
                "Total estimado",
                formatMoneyValue(
                  data.total_estimado
                )
              )
            : ""
        }

      </div>
    `;
  }

  /* =========================================================
     DETALHES PRONTA ENTREGA
  ========================================================= */

  function readyOrderDetails(
    data
  ) {
    return `
      <div class="order-details">

        ${detail(
          "WhatsApp",
          data.whatsapp
        )}

        ${detail(
          "Forma de recebimento",
          data.recebimento
        )}

        ${data.endereco
          ? detail(
              "Endereço",
              data.endereco
            )
          : ""}

        ${detail(
          "Pagamento",
          data.pagamento
        )}

        ${
          data.itens.length
            ? `
              <div class="detail full">

                <span>
                  Itens do pedido
                </span>

                <strong>
                  ${data.itens
                    .map(
                      (
                        item
                      ) =>
                        formatReadyItem(
                          item
                        )
                    )
                    .join(
                      "<br>"
                    )}
                </strong>

              </div>
            `
            : ""
        }

        ${
          data.observacoes
            ? detail(
                "Observações",
                data.observacoes
              )
            : ""
        }

        ${
          data.total
            ? detail(
                "Total",
                brl(
                  data.total
                )
              )
            : ""
        }

      </div>
    `;
  }

  /* =========================================================
     FORMATADORES
  ========================================================= */

  function formatComplexValue(
    value
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "";
    }

    if (
      typeof value ===
      "string"
    ) {
      return value;
    }

    if (
      typeof value ===
      "number"
    ) {
      return String(value);
    }

    if (
      Array.isArray(value)
    ) {
      return formatArray(
        value
      );
    }

    if (
      typeof value ===
      "object"
    ) {
      const preferred =
        [
          "name",
          "nome",
          "label",
          "title",
          "cake",
          "bolo",
          "type",
          "tipo",
          "value",
          "valor"
        ];

      for (
        const key of preferred
      ) {
        if (
          value[key] !==
            undefined &&
          value[key] !==
            null &&
          value[key] !==
            ""
        ) {
          return String(
            value[key]
          );
        }
      }

      return JSON.stringify(
        value
      );
    }

    return String(value);
  }

  function formatArray(
    value
  ) {
    if (
      !Array.isArray(value)
    ) {
      return formatComplexValue(
        value
      );
    }

    return value
      .map(
        (
          item
        ) =>
          formatComplexValue(
            item
          )
      )
      .filter(Boolean)
      .join(", ");
  }

  function formatBrigadeiro(
    item
  ) {
    if (
      typeof item ===
      "string"
    ) {
      return item;
    }

    if (
      !item ||
      typeof item !==
        "object"
    ) {
      return "";
    }

    const type =
      item.type ||
      item.tipo ||
      item.category ||
      "";

    const name =
      item.flavor ||
      item.sabor ||
      item.name ||
      item.nome ||
      "";

    const quantity =
      item.quantity ??
      item.quantidade ??
      item.qty ??
      "";

    const parts = [];

    if (type) {
      parts.push(
        type
      );
    }

    if (name) {
      parts.push(
        name
      );
    }

    if (
      quantity !==
        "" &&
      quantity !==
        null &&
      quantity !==
        undefined
    ) {
      parts.push(
        `${quantity} un.`
      );
    }

    return (
      parts.join(
        " — "
      ) ||
      JSON.stringify(
        item
      )
    );
  }

  function formatOtherItem(
    item
  ) {
    if (
      typeof item ===
      "string"
    ) {
      return item;
    }

    if (
      !item ||
      typeof item !==
        "object"
    ) {
      return "";
    }

    const name =
      item.item ||
      item.name ||
      item.nome ||
      "";

    const quantity =
      item.quantity ??
      item.quantidade ??
      item.qty ??
      "";

    if (
      quantity !==
        "" &&
      quantity !==
        null &&
      quantity !==
        undefined
    ) {
      return `${name} — ${quantity} un.`;
    }

    return (
      name ||
      JSON.stringify(
        item
      )
    );
  }

  function formatReadyItem(
    item
  ) {
    if (
      typeof item ===
      "string"
    ) {
      return item;
    }

    if (
      !item ||
      typeof item !==
        "object"
    ) {
      return "";
    }

    const name =
      item.name ||
      item.nome ||
      item.product_name ||
      "Produto";

    const quantity =
      item.quantity ??
      item.quantidade ??
      1;

    const unitPrice =
      item.unit_price ??
      item.preco_unitario ??
      item.price ??
      null;

    const total =
      item.total ??
      item.subtotal ??
      null;

    let result =
      `${name} — ${quantity} un.`;

    if (
      unitPrice !==
        null &&
      unitPrice !==
        undefined
    ) {
      result +=
        ` — ${brl(
          unitPrice
        )}/un.`;
    }

    if (
      total !==
        null &&
      total !==
        undefined
    ) {
      result +=
        ` — ${brl(
          total
        )}`;
    }

    if (
      item.appointment_required
    ) {
      result +=
        " — Agendamento";
    }

    return result;
  }

  function formatMoneyValue(
    value
  ) {
    if (
      typeof value ===
      "number"
    ) {
      return brl(value);
    }

    if (
      typeof value ===
      "string"
    ) {
      const normalized =
        value
          .replace(
            /R\$\s*/gi,
            ""
          )
          .replace(
            /\./g,
            ""
          )
          .replace(
            ",",
            "."
          );

      const number =
        Number(
          normalized
        );

      if (
        Number.isFinite(
          number
        )
      ) {
        return brl(
          number
        );
      }
    }

    return value;
  }

  /* =========================================================
     DETAIL
  ========================================================= */

  function detail(
    label,
    value
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "";
    }

    return `
      <div class="detail">

        <span>
          ${esc(label)}
        </span>

        <strong>
          ${esc(value)}
        </strong>

      </div>
    `;
  }

  /* =========================================================
     ATUALIZAR STATUS
  ========================================================= */

  async function setStatus(
    id,
    type,
    status
  ) {
    if (!db) {
      toast(
        "Supabase não conectado.",
        "error"
      );

      return;
    }

    const table =
      type === "custom"
        ? "custom_cakes"
        : "orders";

    const {
      error
    } = await db
      .from(table)
      .update({
        status
      })
      .eq(
        "id",
        id
      );

    if (error) {
      toast(
        "Não foi possível atualizar o status.",
        "error"
      );

      console.error(
        error
      );

      return;
    }

    toast(
      "Status atualizado."
    );

    await loadOrders();

    render();
  }

  /* =========================================================
     SALVAR PRODUTO
  ========================================================= */

  async function saveProduct(
    event
  ) {
    event.preventDefault();

    if (!db) {
      toast(
        "Supabase não conectado.",
        "error"
      );

      return;
    }

    const name =
      $("#f-name")
        ?.value
        .trim() ||
      "";

    if (!name) {
      toast(
        "Digite o nome do produto.",
        "error"
      );

      $("#f-name")
        ?.focus();

      return;
    }

    const id =
      S.editId;

    const area =
      $("#f-area")
        ?.value ||
      "pronta";

    const payload = {
      name,

      description:
        $("#f-desc")
          ?.value
          .trim() ||
        "",

      price:
        Number(
          $("#f-price")
            ?.value ||
            0
        ),

      discount:
        Number(
          $("#f-disc")
            ?.value ||
            0
        ),

      sort_order:
        Number(
          $("#f-sort")
            ?.value ||
            0
        ),

      gramatura:
        Number(
          $("#f-gram")
            ?.value ||
            0
        ),

      serve_people:
        Number(
          $("#f-serve")
            ?.value ||
            0
        ),

      active:
        $("#f-avail")
          ?.checked !==
        false,

      featured:
        $("#f-feat")
          ?.checked ===
        true,

      appointment_required:
        $("#f-appt")
          ?.checked ===
        true,

      area:
        area ===
        "encomendas"
          ? "encomendas"
          : "cardapio",

      category:
        $("#f-cat")
          ?.value ||
        null
    };

    /*
     * Se S.image for:
     * undefined = não alterou a imagem
     * string = nova imagem
     * null = removeu a imagem
     */
    if (
      S.image !==
      undefined
    ) {
      payload.image_url =
        S.image;
    }

    try {
      let result;

      if (id) {
        result =
          await db
            .from(
              "products"
            )
            .update(
              payload
            )
            .eq(
              "id",
              id
            )
            .select()
            .maybeSingle();
      } else {
        result =
          await db
            .from(
              "products"
            )
            .insert(
              payload
            )
            .select()
            .maybeSingle();
      }

      if (
        result?.error
      ) {
        throw result.error;
      }

      if (
        !result?.data &&
        !id
      ) {
        console.warn(
          "Produto inserido, mas o Supabase não retornou o registro."
        );
      }

      toast(
        id
          ? "Produto atualizado com sucesso."
          : "Produto criado com sucesso."
      );

      closeModal();

      await loadProducts();

      render();

    } catch (
      error
    ) {
      console.error(
        "Erro ao salvar produto:",
        error
      );

      toast(
        error?.message ||
          "Erro ao salvar produto.",
        "error"
      );
    }
  }

  /* =========================================================
     EXCLUIR PRODUTO
  ========================================================= */

  async function deleteProduct(
    id
  ) {
    if (!db) {
      toast(
        "Supabase não conectado.",
        "error"
      );

      return;
    }

    const product =
      S.products.find(
        (
          item
        ) =>
          String(
            item.id
          ) ===
          String(id)
      );

    if (!product) {
      return;
    }

    const confirmed =
      confirm(
        `Excluir o produto "${product.name}"?`
      );

    if (!confirmed) {
      return;
    }

    const {
      error
    } = await db
      .from("products")
      .delete()
      .eq(
        "id",
        id
      );

    if (error) {
      toast(
        "Não foi possível excluir.",
        "error"
      );

      console.error(
        error
      );

      return;
    }

    toast(
      "Produto excluído."
    );

    await loadProducts();

    render();
  }

  /* =========================================================
     MODAL
  ========================================================= */

  function openProductModal(
    id = null,
    area = "pronta"
  ) {
    S.editId =
      id;

    S.image =
      undefined;

    const product =
      id
        ? S.products.find(
            (
              item
            ) =>
              String(
                item.id
              ) ===
              String(id)
          )
        : null;

    const title =
      $("#mtitle");

    if (title) {
      title.textContent =
        product
          ? "Editar produto"
          : "Novo produto";
    }

    const areaField =
      $("#f-area");

    if (areaField) {
      areaField.value =
        product
          ? productArea(
              product
            )
          : area;
    }

    $("#f-name").value =
      product?.name ||
      "";

    $("#f-price").value =
      product?.price ??
      "";

    $("#f-disc").value =
      product?.discount ??
      0;

    $("#f-sort").value =
      product?.sort_order ??
      0;

    $("#f-gram").value =
      product?.gramatura ??
      0;

    $("#f-serve").value =
      product?.serve_people ??
      0;

    $("#f-desc").value =
      product?.description ||
      "";

    $("#f-avail").checked =
      product?.active !==
      false;

    $("#f-feat").checked =
      product?.featured ===
      true;

    $("#f-appt").checked =
      product?.appointment_required ===
      true;

    S.image =
      product?.image_url ||
      product?.image ||
      undefined;

    const preview =
      $("#prev");

    const removeButton =
      $("#rmimg");

    if (
      S.image &&
      preview
    ) {
      preview.src =
        S.image;

      preview.classList.remove(
        "hidden"
      );

      removeButton?.classList.remove(
        "hidden"
      );
    } else {
      if (preview) {
        preview.src =
          "";

        preview.classList.add(
          "hidden"
        );
      }

      removeButton?.classList.add(
        "hidden"
      );
    }

    populateCategories(
      product?.category ||
      ""
    );

    $("#modal")
      ?.classList.remove(
        "hidden"
      );
  }

  /* =========================================================
     FECHAR MODAL
  ========================================================= */

  function closeModal() {
    $("#modal")
      ?.classList.add(
        "hidden"
      );

    S.editId =
      null;

    S.image =
      undefined;

    $("#pform")
      ?.reset();

    $("#prev")
      ?.classList.add(
        "hidden"
      );

    $("#rmimg")
      ?.classList.add(
        "hidden"
      );

    if (
      $("#prev")
    ) {
      $("#prev").src =
        "";
    }

    if (
      $("#f-photo")
    ) {
      $("#f-photo").value =
        "";
    }
  }

  /* =========================================================
     CATEGORIAS
  ========================================================= */

  function getCategories() {
    const categories =
      S.site?.categories;

    if (
      Array.isArray(
        categories
      ) &&
      categories.length
    ) {
      return categories;
    }

    return [
      "Bolos",
      "Doces",
      "Salgados",
      "Brownies",
      "Cupcakes",
      "Outros"
    ];
  }

  function populateCategories(
    selected = ""
  ) {
    const select =
      $("#f-cat");

    if (!select) {
      return;
    }

    const categories =
      getCategories();

    select.innerHTML =
      `
        <option value="">
          Sem classificação
        </option>
      ` +
      categories
        .map(
          (
            category
          ) =>
            `
              <option
                value="${esc(
                  category
                )}"
                ${
                  category ===
                  selected
                    ? "selected"
                    : ""
                }
              >
                ${esc(
                  category
                )}
              </option>
            `
        )
        .join("");
  }

  /* =========================================================
     IMAGEM
  ========================================================= */

  async function imageToDataURL(
    file
  ) {
    if (!file) {
      return null;
    }

    return new Promise(
      (
        resolve,
        reject
      ) => {
        const reader =
          new FileReader();

        reader.onload = () =>
          resolve(
            reader.result
          );

        reader.onerror =
          reject;

        reader.readAsDataURL(
          file
        );
      }
    );
  }

  /* =========================================================
     LER FORMULÁRIO DE ENCOMENDAS
  ========================================================= */

  function readEncForm() {
    const enc =
      clone(
        S.enc ||
          DEFAULT_ENC
      );

    /* =======================================================
       BOLOS
    ======================================================= */

    enc.cakes =
      (
        enc.cakes ||
        []
      ).map(
        (
          cake,
          cakeIndex
        ) => {
          cake.active =
            $(
              `[data-enc-cake-active="${cakeIndex}"]`
            )
              ?.checked !==
            false;

          cake.options =
            (
              cake.options ||
              []
            ).map(
              (
                option,
                optionIndex
              ) =>
                $(
                  `[data-cake-name="${cakeIndex}"][data-option="${optionIndex}"]`
                )
                  ?.value ||
                option
            );

          cake.prices =
            (
              cake.prices ||
              []
            ).map(
              (
                price,
                optionIndex
              ) =>
                Number(
                  $(
                    `[data-cake-price="${cakeIndex}"][data-option="${optionIndex}"]`
                  )
                    ?.value ||
                    price ||
                    0
                )
            );

          return cake;
        }
      );

    /* =======================================================
       LISTAS SIMPLES
    ======================================================= */

    [
      "masses",
      "fillings"
    ].forEach(
      (
        key
      ) => {
        enc[key] =
          $$(
            `[data-simple-key="${key}"]`
          )
            .map(
              (
                input
              ) =>
                input.value
                  .trim()
            )
            .filter(
              Boolean
            );
      }
    );

    /* =======================================================
       TOPOS
    ======================================================= */

    enc.topes =
      $$(
        `[data-simple-key="topes"]`
      )
        .map(
          (
            input
          ) => {
            const index =
              Number(
                input
                  .dataset
                  .simpleIndex
              );

            const priceInput =
              $(
                `[data-price-key="topes"][data-price-index="${index}"]`
              );

            return [
              input.value
                .trim(),

              Number(
                priceInput
                  ?.value ||
                  0
              )
            ];
          }
        )
        .filter(
          (
            item
          ) =>
            item[0]
        );

    /* =======================================================
       ADICIONAIS
       PERSONALIZAÇÕES
    ======================================================= */

    [
      "extras",
      "personalizations"
    ].forEach(
      (
        key
      ) => {
        const names =
          $$(
            `[data-price-name="${key}"]`
          );

        enc[key] =
          names
            .map(
              (
                input
              ) => {
                const index =
                  Number(
                    input
                      .dataset
                      .priceIndex
                  );

                const priceInput =
                  $(
                    `[data-price-value="${key}"][data-price-index="${index}"]`
                  );

                return [
                  input.value
                    .trim(),

                  Number(
                    priceInput
                      ?.value ||
                      0
                  )
                ];
              }
            )
            .filter(
              (
                item
              ) =>
                item[0]
            );
      }
    );

    /* =======================================================
       BRIGADEIROS
    ======================================================= */

    enc.brigadeiros =
      enc.brigadeiros ||
      {};

    enc.brigadeiros.classica =
      $$(
        "[data-brig-classic]"
      )
        .map(
          (
            input
          ) =>
            input.value
              .trim()
        )
        .filter(
          Boolean
        );

    enc.brigadeiros.premium =
      $$(
        "[data-brig-premium]"
      )
        .map(
          (
            input
          ) =>
            input.value
              .trim()
        )
        .filter(
          Boolean
        );

    enc.brigadeiros.classicaPrices =
      [
        0,
        1
      ].map(
        (
          index
        ) =>
          Number(
            $(
              `[data-brig-price="classica"][data-brig-size="${index}"]`
            )
              ?.value ||
            0
          )
      );

    enc.brigadeiros.premiumPrices =
      [
        0,
        1
      ].map(
        (
          index
        ) =>
          Number(
            $(
              `[data-brig-price="premium"][data-brig-size="${index}"]`
            )
              ?.value ||
            0
          )
      );

    enc.brigadeiros.flavorLimit50 =
      Number(
        $(
          `[data-brig-limit="50"]`
        )
          ?.value ||
        2
      );

    enc.brigadeiros.flavorLimit100 =
      Number(
        $(
          `[data-brig-limit="100"]`
        )
          ?.value ||
        4
      );

    /* =======================================================
       OUTROS ITENS
    ======================================================= */

    enc.otherItems =
      (
        enc.otherItems ||
        []
      ).map(
        (
          item,
          index
        ) => ({
          ...item,

          name:
            $(
              `[data-other-name="${index}"]`
            )
              ?.value
              .trim() ||
            item.name,

          price:
            Number(
              $(
                `[data-other-price="${index}"]`
              )
                ?.value ||
                0
            ),

          active:
            $(
              `[data-other-active="${index}"]`
            )
              ?.checked !==
            false
        })
      );

    /* =======================================================
       KITS
    ======================================================= */

    enc.kits =
      (
        enc.kits ||
        []
      ).map(
        (
          kit,
          index
        ) => ({
          ...kit,

          name:
            $(
              `[data-kit-name="${index}"]`
            )
              ?.value
              .trim() ||
            kit.name,

          price:
            Number(
              $(
                `[data-kit-price="${index}"]`
              )
                ?.value ||
                0
            ),

          cake:
            $(
              `[data-kit-cake="${index}"]`
            )
              ?.value
              .trim() ||
            kit.cake,

          docinhos:
            Number(
              $(
                `[data-kit-docinhos="${index}"]`
              )
                ?.value ||
                0
            ),

          items:
            String(
              $(
                `[data-kit-items="${index}"]`
              )
                ?.value ||
              ""
            )
              .split(
                "\n"
              )
              .map(
                (
                  item
                ) =>
                  item.trim()
              )
              .filter(
                Boolean
              ),

          active:
            $(
              `[data-kit-active="${index}"]`
            )
              ?.checked !==
            false
        })
      );

    return enc;
  }

  /* =========================================================
     ADICIONAR ITEM DE CONFIGURAÇÃO
  ========================================================= */

  function addEncItem(
    key
  ) {
    if (!S.enc) {
      S.enc =
        clone(
          DEFAULT_ENC
        );
    }

    if (
      !Array.isArray(
        S.enc[key]
      )
    ) {
      S.enc[key] =
        [];
    }

    if (
      key === "extras" ||
      key ===
        "personalizations" ||
      key === "topes"
    ) {
      S.enc[key].push([
        "Novo item",
        0
      ]);
    } else {
      S.enc[key].push(
        "Novo item"
      );
    }

    render();
  }

  /* =========================================================
     REMOVER ITEM DE CONFIGURAÇÃO
  ========================================================= */

  function removeEncItem(
    key,
    index
  ) {
    if (
      !S.enc ||
      !Array.isArray(
        S.enc[key]
      )
    ) {
      return;
    }

    S.enc[key].splice(
      Number(index),
      1
    );

    render();
  }

  /* =========================================================
     ADICIONAR BRIGADEIRO
  ========================================================= */

  function addBrigadeiro(
    type
  ) {
    if (!S.enc) {
      S.enc =
        clone(
          DEFAULT_ENC
        );
    }

    S.enc.brigadeiros =
      S.enc.brigadeiros ||
      {};

    S.enc.brigadeiros[type] =
      S.enc.brigadeiros[type] ||
      [];

    S.enc.brigadeiros[type].push(
      "Novo sabor"
    );

    render();
  }

  /* =========================================================
     REMOVER BRIGADEIRO
  ========================================================= */

  function removeBrigadeiro(
    type,
    index
  ) {
    if (
      !S.enc?.brigadeiros?.[
        type
      ]
    ) {
      return;
    }

    S.enc.brigadeiros[
      type
    ].splice(
      Number(index),
      1
    );

    render();
  }

  /* =========================================================
     ADICIONAR OUTRO ITEM
  ========================================================= */

  function addOtherItem() {
    if (!S.enc) {
      S.enc =
        clone(
          DEFAULT_ENC
        );
    }

    S.enc.otherItems =
      S.enc.otherItems ||
      [];

    S.enc.otherItems.push({
      name: "Novo item",
      price: 0,
      active: true
    });

    render();
  }

  /* =========================================================
     REMOVER OUTRO ITEM
  ========================================================= */

  function removeOtherItem(
    index
  ) {
    if (
      !S.enc?.otherItems
    ) {
      return;
    }

    S.enc.otherItems.splice(
      Number(index),
      1
    );

    render();
  }

  /* =========================================================
     ADICIONAR KIT
  ========================================================= */

  function addKit() {
    if (!S.enc) {
      S.enc =
        clone(
          DEFAULT_ENC
        );
    }

    S.enc.kits =
      S.enc.kits ||
      [];

    const number =
      S.enc.kits.length +
      1;

    S.enc.kits.push({
      id:
        `k${Date.now()}`,

      name:
        `Kit Festa ${String(
          number
        ).padStart(
          2,
          "0"
        )}`,

      price: 0,

      cake:
        "Chantininho",

      docinhos: 0,

      items: [],

      active: true
    });

    render();
  }

  /* =========================================================
     REMOVER KIT
  ========================================================= */

  function removeKit(
    index
  ) {
    if (
      !S.enc?.kits
    ) {
      return;
    }

    const kit =
      S.enc.kits[
        Number(index)
      ];

    if (!kit) {
      return;
    }

    if (
      !confirm(
        `Excluir "${kit.name}"?`
      )
    ) {
      return;
    }

    S.enc.kits.splice(
      Number(index),
      1
    );

    render();
  }

  /* =========================================================
     CONFIGURAÇÕES DO SITE
  ========================================================= */

  function settingsView() {
    const site =
      S.site || {};

    const contact =
      site.contact ||
      {};

    const hours =
      Array.isArray(
        site.hours
      )
        ? site.hours
        : [];

    const about =
      site.about ||
      {};

    return `
      <div class="panel">

        <div class="panel-head">

          <div>

            <h2>
              Configurações
            </h2>

            <p class="muted">
              Informações exibidas no site.
            </p>

          </div>

          <button
            class="btn primary"
            data-act="save-settings"
          >
            💾 Salvar alterações
          </button>

        </div>

        <div class="settings-grid">

          <div class="setting-card">

            <h3>Contato</h3>

            <label>
              WhatsApp

              <input
                id="set-whatsapp"
                value="${esc(
                  contact.whatsapp ||
                  WHATSAPP
                )}"
              >

            </label>

            <label>
              Instagram

              <input
                id="set-instagram"
                value="${esc(
                  contact.instagram ||
                  ""
                )}"
              >

            </label>

            <label>
              Endereço

              <textarea
                id="set-address"
                rows="3"
              >${esc(
                contact.address ||
                "Rua 1018, 65, Conjunto Ceará II, Fortaleza-CE 60532-690"
              )}</textarea>

            </label>

          </div>

          <div class="setting-card">

            <h3>
              Sobre a empresa
            </h3>

            <label>
              Título

              <input
                id="set-about-title"
                value="${esc(
                  about.title ||
                  "Um pouco da nossa história"
                )}"
              >

            </label>

            <label>
              Texto

              <textarea
                id="set-about-text"
                rows="7"
              >${esc(
                about.text ||
                ""
              )}</textarea>

            </label>

          </div>

        </div>

        <div class="setting-card">

          <h3>Horários</h3>

          <div class="hours-admin">

            ${renderHoursSettings(
              hours
            )}

          </div>

        </div>

      </div>
    `;
  }

  /* =========================================================
     HORÁRIOS
  ========================================================= */

  function renderHoursSettings(
    hours
  ) {
    const defaultDays = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado"
    ];

    return defaultDays
      .map(
        (
          day,
          index
        ) => {
          const current =
            hours.find(
              (
                item
              ) =>
                Number(
                  item.dayIndex ??
                  item.index ??
                  -1
                ) ===
                index
            ) ||
            hours[index] ||
            {};

          return `
            <div class="hours-row">

              <strong>
                ${day}
              </strong>

              <select
                data-hours-status="${index}"
              >

                <option
                  value="open"
                  ${
                    current.s ===
                      "open" ||
                    current.status ===
                      "open"
                      ? "selected"
                      : ""
                  }
                >
                  Aberto
                </option>

                <option
                  value="closed"
                  ${
                    current.s ===
                      "closed" ||
                    current.status ===
                      "closed"
                      ? "selected"
                      : ""
                  }
                >
                  Fechado
                </option>

                <option
                  value="tbd"
                  ${
                    current.s ===
                      "tbd" ||
                    current.status ===
                      "tbd"
                      ? "selected"
                      : ""
                  }
                >
                  A confirmar
                </option>

              </select>

              <input
                type="time"
                data-hours-open="${index}"
                value="${esc(
                  current.o ||
                  ""
                )}"
              >

              <input
                type="time"
                data-hours-close="${index}"
                value="${esc(
                  current.c ||
                  ""
                )}"
              >

            </div>
          `;
        }
      )
      .join("");
  }

  /* =========================================================
     SALVAR CONFIGURAÇÕES
  ========================================================= */

  async function saveSettings() {
    const site =
      clone(
        S.site || {}
      );

    site.contact =
      site.contact ||
      {};

    site.about =
      site.about ||
      {};

    site.contact.whatsapp =
      $("#set-whatsapp")
        ?.value
        .trim() ||
      WHATSAPP;

    site.contact.instagram =
      $("#set-instagram")
        ?.value
        .trim() ||
      "";

    site.contact.address =
      $("#set-address")
        ?.value
        .trim() ||
      "";

    site.about.title =
      $("#set-about-title")
        ?.value
        .trim() ||
      "";

    site.about.text =
      $("#set-about-text")
        ?.value
        .trim() ||
      "";

    site.hours =
      [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ].map(
        (
          index
        ) => ({
          dayIndex:
            index,

          s:
            $(
              `[data-hours-status="${index}"]`
            )
              ?.value ||
            "closed",

          o:
            $(
              `[data-hours-open="${index}"]`
            )
              ?.value ||
            "",

          c:
            $(
              `[data-hours-close="${index}"]`
            )
              ?.value ||
            ""
        })
      );

    try {
      await saveSite(
        site
      );

      toast(
        "Configurações salvas."
      );

    } catch (
      error
    ) {
      console.error(
        error
      );

      toast(
        error.message ||
          "Erro ao salvar configurações.",
        "error"
      );
    }
  }

  /* =========================================================
     IMPRESSÃO
  ========================================================= */

  function printOrder(
    id,
    type
  ) {
    const list =
      type === "custom"
        ? S.customOrders
        : S.readyOrders;

    const order =
      list.find(
        (
          item
        ) =>
          String(
            item.id
          ) ===
          String(id)
      );

    if (!order) {
      toast(
        "Pedido não encontrado.",
        "error"
      );

      return;
    }

    const custom =
      type === "custom";

    const data =
      custom
        ? normalizeCustomOrder(
            order
          )
        : normalizeReadyOrder(
            order
          );

    const customer =
      data.cliente ||
      "Cliente";

    const html =
      custom
        ? printableCustomOrder(
            data
          )
        : printableReadyOrder(
            data
          );

    const win =
      window.open(
        "",
        "_blank",
        "width=900,height=800"
      );

    if (!win) {
      toast(
        "O navegador bloqueou a janela de impressão.",
        "error"
      );

      return;
    }

    win.document.write(`
      <!DOCTYPE html>

      <html lang="pt-BR">

      <head>

        <meta charset="UTF-8">

        <title>
          Pedido — Martins Confeitaria
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            font-family:
              Arial,
              sans-serif;

            margin: 0;

            padding: 30px;

            color: #222;

            background: #fff;
          }

          h1 {
            margin:
              0 0 5px;
          }

          h2 {
            margin-top:
              30px;

            border-bottom:
              1px solid #ddd;

            padding-bottom:
              8px;
          }

          .head {
            border-bottom:
              2px solid #67b0cb;

            padding-bottom:
              15px;
          }

          .muted {
            color: #777;
          }

          .row {
            display:
              flex;

            gap:
              20px;

            padding:
              8px 0;

            border-bottom:
              1px solid #eee;
          }

          .label {
            width:
              190px;

            min-width:
              190px;

            font-weight:
              bold;
          }

          .value {
            flex:
              1;

            white-space:
              pre-wrap;
          }

          .items {
            margin-top:
              15px;

            border:
              1px solid #ddd;

            border-radius:
              8px;

            overflow:
              hidden;
          }

          .item {
            display:
              flex;

            justify-content:
              space-between;

            gap:
              20px;

            padding:
              10px 12px;

            border-bottom:
              1px solid #eee;
          }

          .item:last-child {
            border-bottom:
              0;
          }

          .item-name {
            flex:
              1;
          }

          .item-price {
            white-space:
              nowrap;

            font-weight:
              bold;
          }

          .total {
            margin-top:
              25px;

            padding:
              15px;

            background:
              #f4f8fa;

            font-size:
              20px;

            font-weight:
              bold;

            border-radius:
              8px;
          }

          @media print {

            body {
              padding:
                10px;
            }

          }

        </style>

      </head>

      <body>

        <div class="head">

          <h1>
            Martins Confeitaria
          </h1>

          <div class="muted">
            ${
              custom
                ? "Pedido de Encomenda"
                : "Pedido de Pronta Entrega"
            }
          </div>

          <div class="muted">
            Cliente:
            ${esc(
              customer
            )}
          </div>

          <div class="muted">
            Recebido:
            ${formatDate(
              data.created_at
            )}
          </div>

        </div>

        ${html}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        <\/script>

      </body>

      </html>
    `);

    win.document.close();
  }

  /* =========================================================
     IMPRESSÃO ENCOMENDA
  ========================================================= */

  function printableCustomOrder(
    data
  ) {
    const rows = [];

    function add(
      label,
      value
    ) {
      if (
        value !== null &&
        value !==
          undefined &&
        value !== ""
      ) {
        rows.push(`
          <div class="row">

            <div class="label">
              ${esc(label)}
            </div>

            <div class="value">
              ${esc(value)}
            </div>

          </div>
        `);
      }
    }

    add(
      "WhatsApp",
      data.whatsapp
    );

    add(
      "Data desejada",
      formatSimpleDate(
        data.data_desejada
      )
    );

    add(
      "Kit",
      formatComplexValue(
        data.kit
      )
    );

    add(
      "Bolo",
      formatComplexValue(
        data.bolo
      )
    );

    add(
      "Massa",
      formatComplexValue(
        data.massa
      )
    );

    add(
      "Recheio",
      formatComplexValue(
        data.recheio
      )
    );

    add(
      "Decoração",
      formatComplexValue(
        data.topo
      )
    );

    add(
      "Adicionais",
      formatArray(
        data.adicionais
      )
    );

    add(
      "Personalização",
      formatArray(
        data.personalizacao
      )
    );

    add(
      "Texto da personalização",
      data.personalizacao_text
    );

    if (
      data.brigadeiros.length
    ) {
      add(
        "Brigadeiros",
        data.brigadeiros
          .map(
            formatBrigadeiro
          )
          .filter(Boolean)
          .join(
            " | "
          )
      );
    }

    if (
      data.outros.length
    ) {
      add(
        "Outros itens",
        data.outros
          .map(
            formatOtherItem
          )
          .filter(Boolean)
          .join(
            " | "
          )
      );
    }

    add(
      "Observações",
      data.observacoes
    );

    return `
      <h2>
        Detalhes da encomenda
      </h2>

      ${rows.join("")}

      ${
        data.total_estimado !==
          "" &&
        data.total_estimado !==
          null &&
        data.total_estimado !==
          undefined
          ? `
            <div class="total">
              Total estimado:
              ${esc(
                formatMoneyValue(
                  data.total_estimado
                )
              )}
            </div>
          `
          : ""
      }
    `;
  }

  /* =========================================================
     IMPRESSÃO PRONTA ENTREGA
  ========================================================= */

  function printableReadyOrder(
    data
  ) {
    const rows = [];

    function add(
      label,
      value
    ) {
      if (
        value !== null &&
        value !==
          undefined &&
        value !== ""
      ) {
        rows.push(`
          <div class="row">

            <div class="label">
              ${esc(label)}
            </div>

            <div class="value">
              ${esc(value)}
            </div>

          </div>
        `);
      }
    }

    add(
      "WhatsApp",
      data.whatsapp
    );

    add(
      "Recebimento",
      data.recebimento
    );

    add(
      "Endereço",
      data.endereco
    );

    add(
      "Pagamento",
      data.pagamento
    );

    if (
      data.itens.length
    ) {
      const itemsHtml =
        data.itens
          .map(
            (
              item
            ) => `
              <div class="item">

                <div class="item-name">
                  ${esc(
                    formatReadyItem(
                      item
                    )
                  )}
                </div>

              </div>
            `
          )
          .join("");

      rows.push(`
        <h2>
          Itens do pedido
        </h2>

        <div class="items">
          ${itemsHtml}
        </div>
      `);
    }

    add(
      "Observações",
      data.observacoes
    );

    return `
      <h2>
        Detalhes do pedido
      </h2>

      ${rows.join("")}

      ${
        data.total !==
          null &&
        data.total !==
          undefined &&
        data.total !==
          ""
          ? `
            <div class="total">
              Total:
              ${esc(
                brl(
                  data.total
                )
              )}
            </div>
          `
          : ""
      }
    `;
  }

  /* =========================================================
     RENDER
  ========================================================= */

  function render() {
    const view =
      $("#view");

    if (!view) {
      return;
    }

    const title =
      TITLES[
        S.view
      ] ||
      "Dashboard";

    if (
      $("#title")
    ) {
      $("#title")
        .textContent =
        title;
    }

    $$(".nav").forEach(
      (
        button
      ) => {
        button.classList.toggle(
          "active",
          button.dataset.view ===
            S.view
        );
      }
    );

    if (
      S.view ===
      "dashboard"
    ) {
      view.innerHTML =
        dashboardView();

      return;
    }

    if (
      S.view ===
      "prod-ready"
    ) {
      view.innerHTML =
        productsView(
          "ready"
        );

      return;
    }

    if (
      S.view ===
      "prod-orders"
    ) {
      view.innerHTML =
        productsView(
          "orders"
        );

      return;
    }

    if (
      S.view ===
      "ord-ready"
    ) {
      view.innerHTML =
        ordersView(
          "ready"
        );

      return;
    }

    if (
      S.view ===
      "ord-orders"
    ) {
      view.innerHTML =
        ordersView(
          "custom"
        );

      return;
    }

    if (
      S.view ===
      "settings"
    ) {
      view.innerHTML =
        settingsView();

      return;
    }
  }

  /* =========================================================
     NAVEGAÇÃO
  ========================================================= */

  async function go(
    view
  ) {
    S.view =
      view ||
      "dashboard";

    if (
      view ===
      "prod-orders"
    ) {
      await loadEnc();
    }

    if (
      view ===
      "ord-ready" ||
      view ===
      "ord-orders"
    ) {
      await loadOrders();
    }

    render();

    $("#side")
      ?.classList.remove(
        "open"
      );

    $("#shade")
      ?.classList.remove(
        "show"
      );
  }

  /* =========================================================
     START
  ========================================================= */

  async function start() {
    await Promise.all([
      loadSite(),
      loadProducts(),
      loadEnc(),
      loadOrders()
    ]);

    S.on = true;

    $("#login")
      ?.classList.add(
        "hidden"
      );

    $("#app")
      ?.classList.remove(
        "hidden"
      );

    render();
  }

  /* =========================================================
     EVENTOS — CLIQUES
  ========================================================= */

  document.addEventListener(
    "click",
    async (
      event
    ) => {
      const target =
        event.target.closest(
          "[data-act], [data-view], [data-close]"
        );

      if (!target) {
        return;
      }

      /* =====================================================
         NAVEGAÇÃO
      ===================================================== */

      if (
        target.dataset.view
      ) {
        await go(
          target.dataset.view
        );

        return;
      }

      /* =====================================================
         FECHAR
      ===================================================== */

      if (
        target.hasAttribute(
          "data-close"
        )
      ) {
        closeModal();

        return;
      }

      const action =
        target.dataset.act;

      if (!action) {
        return;
      }

      /* =====================================================
         NOVO PRODUTO
      ===================================================== */

      if (
        action ===
        "new-product"
      ) {
        openProductModal(
          null,
          target.dataset.area ||
            "pronta"
        );

        return;
      }

      /* =====================================================
         EDITAR PRODUTO
      ===================================================== */

      if (
        action ===
        "edit-product"
      ) {
        openProductModal(
          target.dataset.id
        );

        return;
      }

      /* =====================================================
         EXCLUIR PRODUTO
      ===================================================== */

      if (
        action ===
        "delete-product"
      ) {
        await deleteProduct(
          target.dataset.id
        );

        return;
      }

      /* =====================================================
         SALVAR ENCOMENDAS
      ===================================================== */

      if (
        action ===
        "save-enc"
      ) {
        try {
          S.enc =
            readEncForm();

          await saveEnc();

          toast(
            "Configurações de encomendas salvas."
          );

          render();

        } catch (
          error
        ) {
          console.error(
            error
          );

          toast(
            error.message ||
              "Erro ao salvar encomendas.",
            "error"
          );
        }

        return;
      }

      /* =====================================================
         ADICIONAR CONFIGURAÇÃO
      ===================================================== */

      if (
        action ===
        "add-enc-item"
      ) {
        /*
         * Antes de adicionar,
         * preservamos tudo que o usuário
         * acabou de digitar.
         */
        S.enc =
          readEncForm();

        addEncItem(
          target.dataset.key
        );

        return;
      }

      /* =====================================================
         REMOVER CONFIGURAÇÃO
      ===================================================== */

      if (
        action ===
        "remove-enc-item"
      ) {
        S.enc =
          readEncForm();

        removeEncItem(
          target.dataset.key,
          target.dataset.index
        );

        return;
      }

      /* =====================================================
         ADICIONAR BRIGADEIRO
      ===================================================== */

      if (
        action ===
        "add-brig"
      ) {
        S.enc =
          readEncForm();

        addBrigadeiro(
          target.dataset.type
        );

        return;
      }

      /* =====================================================
         REMOVER BRIGADEIRO
      ===================================================== */

      if (
        action ===
        "remove-brig"
      ) {
        S.enc =
          readEncForm();

        removeBrigadeiro(
          target.dataset.type,
          target.dataset.index
        );

        return;
      }

      /* =====================================================
         ADICIONAR OUTRO ITEM
      ===================================================== */

      if (
        action ===
        "add-other-item"
      ) {
        S.enc =
          readEncForm();

        addOtherItem();

        return;
      }

      /* =====================================================
         REMOVER OUTRO ITEM
      ===================================================== */

      if (
        action ===
        "remove-other-item"
      ) {
        S.enc =
          readEncForm();

        removeOtherItem(
          target.dataset.index
        );

        return;
      }

      /* =====================================================
         ADICIONAR KIT
      ===================================================== */

      if (
        action ===
        "add-kit"
      ) {
        S.enc =
          readEncForm();

        addKit();

        return;
      }

      /* =====================================================
         REMOVER KIT
      ===================================================== */

      if (
        action ===
        "remove-kit"
      ) {
        S.enc =
          readEncForm();

        removeKit(
          target.dataset.index
        );

        return;
      }

      /* =====================================================
         ATUALIZAR PEDIDOS
      ===================================================== */

      if (
        action ===
        "refresh-orders"
      ) {
        await loadOrders();

        render();

        toast(
          "Pedidos atualizados."
        );

        return;
      }

      /* =====================================================
         IMPRIMIR
      ===================================================== */

      if (
        action ===
        "print-order"
      ) {
        printOrder(
          target.dataset.id,
          target.dataset.type
        );

        return;
      }

      /* =====================================================
         SALVAR CONFIGURAÇÕES
      ===================================================== */

      if (
        action ===
        "save-settings"
      ) {
        await saveSettings();

        return;
      }
    }
  );

  /* =========================================================
     FORMULÁRIO DE LOGIN
  ========================================================= */

  $("#loginForm")
    ?.addEventListener(
      "submit",
      async (
        event
      ) => {
        event.preventDefault();

        const email =
          $("#email")
            ?.value
            .trim() ||
          "";

        const password =
          $("#password")
            ?.value ||
          "";

        const msg =
          $("#loginMsg");

        if (msg) {
          msg.textContent =
            "Entrando...";
        }

        try {
          await login(
            email,
            password
          );

          if (msg) {
            msg.textContent =
              "";
          }

        } catch (
          error
        ) {
          console.error(
            error
          );

          if (msg) {
            msg.textContent =
              error.message ||
              "E-mail ou senha inválidos.";
          }
        }
      }
    );

  /* =========================================================
     LOGOUT
  ========================================================= */

  $("#logout")
    ?.addEventListener(
      "click",
      logout
    );

  /* =========================================================
     ATUALIZAR PAINEL
  ========================================================= */

  $("#refresh")
    ?.addEventListener(
      "click",
      async () => {
        try {
          await Promise.all([
            loadSite(),
            loadProducts(),
            loadEnc(),
            loadOrders()
          ]);

          render();

          toast(
            "Painel atualizado."
          );

        } catch (
          error
        ) {
          console.error(
            error
          );

          toast(
            "Não foi possível atualizar o painel.",
            "error"
          );
        }
      }
    );

  /* =========================================================
     UPLOAD DA FOTO
  ========================================================= */

  $("#f-photo")
    ?.addEventListener(
      "change",
      async (
        event
      ) => {
        const file =
          event.target.files?.[0];

        if (!file) {
          return;
        }

        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          toast(
            "Selecione uma imagem válida.",
            "error"
          );

          event.target.value =
            "";

          return;
        }

        try {
          const data =
            await imageToDataURL(
              file
            );

          S.image =
            data;

          const preview =
            $("#prev");

          if (preview) {
            preview.src =
              data;

            preview.classList.remove(
              "hidden"
            );
          }

          $("#rmimg")
            ?.classList.remove(
              "hidden"
            );

        } catch (
          error
        ) {
          console.error(
            error
          );

          toast(
            "Não foi possível carregar a foto.",
            "error"
          );
        }
      }
    );

  /* =========================================================
     REMOVER FOTO
  ========================================================= */

  $("#rmimg")
    ?.addEventListener(
      "click",
      () => {
        S.image =
          null;

        const preview =
          $("#prev");

        if (preview) {
          preview.src =
            "";

          preview.classList.add(
            "hidden"
          );
        }

        $("#rmimg")
          ?.classList.add(
            "hidden"
          );

        const photo =
          $("#f-photo");

        if (photo) {
          photo.value =
            "";
        }
      }
    );

  /* =========================================================
     FORM PRODUTO
  ========================================================= */

  $("#pform")
    ?.addEventListener(
      "submit",
      saveProduct
    );

  /*
   * Segurança extra:
   * caso o formulário seja recriado ou o listener
   * direto não esteja disponível, o submit continua
   * sendo capturado aqui.
   */
  document.addEventListener(
    "submit",
    async (
      event
    ) => {
      if (
        event.target?.id ===
        "pform"
      ) {
        event.preventDefault();

        /*
         * O listener direto normalmente já executa.
         * Este bloco só existe para garantir que
         * o formulário nunca fique sem tratamento.
         */
      }
    }
  );

  /* =========================================================
     MODAL CLICANDO FORA
  ========================================================= */

  $("#modal")
    ?.addEventListener(
      "click",
      (
        event
      ) => {
        if (
          event.target ===
          $("#modal")
        ) {
          closeModal();
        }
      }
    );

  /* =========================================================
     STATUS DOS PEDIDOS
  ========================================================= */

  document.addEventListener(
    "change",
    async (
      event
    ) => {
      const element =
        event.target.closest(
          "[data-status-id]"
        );

      if (!element) {
        return;
      }

      await setStatus(
        element.dataset.statusId,
        element.dataset.statusType,
        element.value
      );
    }
  );

  /* =========================================================
     MENU MOBILE
  ========================================================= */

  $("#burger")
    ?.addEventListener(
      "click",
      () => {
        $("#side")
          ?.classList.toggle(
            "open"
          );

        $("#shade")
          ?.classList.toggle(
            "show"
          );
      }
    );

  $("#shade")
    ?.addEventListener(
      "click",
      () => {
        $("#side")
          ?.classList.remove(
            "open"
          );

        $("#shade")
          ?.classList.remove(
            "show"
          );
      }
    );

  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  (async () => {
    try {
      const logged =
        await checkSession();

      if (logged) {
        await start();
      } else {
        $("#login")
          ?.classList.remove(
            "hidden"
          );

        $("#app")
          ?.classList.add(
            "hidden"
          );
      }

    } catch (
      error
    ) {
      console.error(
        "Erro ao iniciar painel:",
        error
      );

      $("#login")
        ?.classList.remove(
          "hidden"
        );

      $("#app")
        ?.classList.add(
          "hidden"
        );
    }
  })();

})();
