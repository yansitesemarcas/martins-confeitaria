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
      "Baunilha",
      "Chocolate",
      "Red Velvet",
      "Cenoura"
    ],

    /* =======================================================
       RECHEIOS
    ======================================================= */

    fillings: [
      "Brigadeiro",
      "Brigadeiro Branco",
      "Doce de Leite",
      "Ninho",
      "Ninho com Morango",
      "Ninho com Nutella",
      "Prestígio",
      "Dois Amores"
    ],

    /* =======================================================
       ADICIONAIS
    ======================================================= */

    extras: [
      [
        "Morangos",
        15
      ],

      [
        "Uvas",
        15
      ],

      [
        "Frutas",
        20
      ],

      [
        "Nutella",
        15
      ]
    ],

    /* =======================================================
       PERSONALIZAÇÃO
    ======================================================= */

    personalization: [
      [
        "Sem personalização",
        0
      ],

      [
        "Nome / frase",
        10
      ],

      [
        "Tema personalizado",
        20
      ]
    ],

    /* =======================================================
       BRIGADEIROS
    ======================================================= */

    brigadeiros: {
      classicos: [
        "Brigadeiro",
        "Brigadeiro Branco",
        "Beijinho",
        "Cajuzinho"
      ],

      premium: [
        "Ninho com Nutella",
        "Ferrero",
        "Pistache",
        "Oreo"
      ]
    },

    /* =======================================================
       OUTROS ITENS
    ======================================================= */

    otherItems: [
      {
        name: "Petit Brownie",
        price: 0,
        active: true
      },

      {
        name: "Mini Brownie Recheado",
        price: 0,
        active: true
      },

      {
        name: "Bem Casado",
        price: 0,
        active: true
      },

      {
        name: "Cupcakes",
        price: 35,
        active: true
      }
    ],

    /* =======================================================
       KITS
    ======================================================= */

    kits: [
      {
        id: "k1",
        name: "Kit 1",
        price: 150,
        cake: "Naked Cake 06/08 Pessoas",
        docinhos: 30,
        items: [
          "30 Docinhos"
        ],
        active: true
      },

      {
        id: "k2",
        name: "Kit 2",
        price: 200,
        cake: "Naked Cake 10/12 Pessoas",
        docinhos: 50,
        items: [
          "50 Docinhos"
        ],
        active: true
      },

      {
        id: "k3",
        name: "Kit 3",
        price: 250,
        cake: "Chantininho 15/20 Pessoas",
        docinhos: 70,
        items: [
          "70 Docinhos"
        ],
        active: true
      },

      {
        id: "k4",
        name: "Kit 4",
        price: 430,
        cake: "Chantininho 30/40 Pessoas",
        docinhos: 70,
        items: [
          "12 Cupcakes",
          "70 Petit Brownie",
          "70 Docinhos"
        ],
        active: true
      },

      {
        id: "k5",
        name: "Kit 5",
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
       /* =========================================================
     VERIFICAÇÃO DA SESSÃO
  ========================================================= */

  if (!db) {
    S.on = false;
    return false;
  }

  try {
    const {
      data,
      error
    } = await db.auth.getSession();

    if (error) {
      console.warn(
        "Erro ao verificar sessão:",
        error.message
      );

      S.on = false;
      return false;
    }

    S.on = !!data?.session;

    return S.on;
  } catch (error) {
    console.warn(
      "Erro ao verificar sessão:",
      error
    );

    S.on = false;

    return false;
  }
}

/* =========================================================
   LOGIN
========================================================= */

async function login(event) {
  event?.preventDefault();

  if (!db) {
    toast(
      "Supabase não conectado.",
      "error"
    );

    return false;
  }

  const email =
    $("#login-email")?.value?.trim() ||
    "";

  const password =
    $("#login-password")?.value ||
    "";

  if (!email) {
    toast(
      "Digite seu e-mail.",
      "error"
    );

    $("#login-email")?.focus();

    return false;
  }

  if (!password) {
    toast(
      "Digite sua senha.",
      "error"
    );

    $("#login-password")?.focus();

    return false;
  }

  const button =
    $("#login-submit");

  if (button) {
    button.disabled = true;
    button.dataset.oldText =
      button.textContent;

    button.textContent =
      "Entrando...";
  }

  try {
    const {
      data,
      error
    } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    if (!data?.session) {
      throw new Error(
        "Não foi possível iniciar a sessão."
      );
    }

    S.on = true;

    showApp();

    await initApp();

    toast(
      "Login realizado com sucesso."
    );

    return true;
  } catch (error) {
    console.error(
      "Erro no login:",
      error
    );

    toast(
      error?.message ||
        "E-mail ou senha incorretos.",
      "error"
    );

    return false;
  } finally {
    if (button) {
      button.disabled = false;

      button.textContent =
        button.dataset.oldText ||
        "Entrar";
    }
  }
}

/* =========================================================
   LOGOUT
========================================================= */

async function logout() {
  try {
    if (db) {
      await db.auth.signOut();
    }
  } catch (error) {
    console.warn(
      "Erro ao sair:",
      error
    );
  }

  S.on = false;

  showLogin();

  toast(
    "Sessão encerrada."
  );
}

/* =========================================================
   EXIBIÇÃO LOGIN / PAINEL
========================================================= */

function showLogin() {
  const login =
    $("#login-screen");

  const app =
    $("#app");

  if (login) {
    login.hidden = false;
    login.style.display = "";
  }

  if (app) {
    app.hidden = true;
    app.style.display = "none";
  }
}

function showApp() {
  const login =
    $("#login-screen");

  const app =
    $("#app");

  if (login) {
    login.hidden = true;
    login.style.display = "none";
  }

  if (app) {
    app.hidden = false;
    app.style.display = "";
  }
}

/* =========================================================
   CARREGAR CONFIGURAÇÕES DO SITE
========================================================= */

async function loadSite() {
  if (!db) {
    S.site = {};
    return;
  }

  try {
    const {
      data,
      error
    } = await db
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(
        "Erro ao carregar configurações do site:",
        error.message
      );

      S.site = {};
      return;
    }

    S.site =
      data && typeof data === "object"
        ? data
        : {};
  } catch (error) {
    console.warn(
      "Erro ao carregar site:",
      error
    );

    S.site = {};
  }
}

/* =========================================================
   CARREGAR CONFIGURAÇÃO DE ENCOMENDAS
========================================================= */

async function loadEnc() {
  const fallback =
    mergeEnc(
      DEF.encomendas ||
      DEF.enc ||
      DEF.orders ||
      null
    );

  if (!db) {
    S.enc = fallback;
    return;
  }

  try {
    const {
      data,
      error
    } = await db
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(
        "Erro ao carregar encomendas:",
        error.message
      );

      S.enc = fallback;
      return;
    }

    let remote = null;

    if (data) {
      remote =
        data.encomendas ||
        data.encomenda ||
        data.custom_cakes ||
        data.custom_cake ||
        null;
    }

    S.enc =
      mergeEnc(
        remote || fallback
      );
  } catch (error) {
    console.warn(
      "Erro ao carregar configuração de encomendas:",
      error
    );

    S.enc = fallback;
  }
}

/* =========================================================
   SALVAR CONFIGURAÇÃO DE ENCOMENDAS
========================================================= */

async function saveEnc() {
  if (!db) {
    toast(
      "Supabase não conectado.",
      "error"
    );

    return false;
  }

  if (!S.enc) {
    S.enc = mergeEnc(null);
  }

  try {
    const {
      data: current,
      error: readError
    } = await db
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    const payload = {
      ...(current || {}),
      encomendas: S.enc
    };

    let result;

    if (current?.id) {
      result = await db
        .from("site_settings")
        .update({
          encomendas: S.enc
        })
        .eq("id", current.id);
    } else {
      result = await db
        .from("site_settings")
        .insert(payload);
    }

    if (result?.error) {
      throw result.error;
    }

    toast(
      "Alterações salvas com sucesso."
    );

    return true;
  } catch (error) {
    console.error(
      "Erro ao salvar encomendas:",
      error
    );

    toast(
      error?.message ||
        error?.details ||
        "Erro ao salvar alterações.",
      "error"
    );

    return false;
  }
}

/* =========================================================
   CARREGAR PRODUTOS
========================================================= */

async function loadProducts() {
  if (!db) {
    S.products = [];
    return;
  }

  try {
    const {
      data,
      error
    } = await db
      .from("products")
      .select("*")
      .order(
        "sort_order",
        {
          ascending: true
        }
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );

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
  } catch (error) {
    console.warn(
      "Erro ao carregar produtos:",
      error
    );

    S.products = [];
  }
}

/* =========================================================
   IDENTIFICAR ÁREA DO PRODUTO
========================================================= */

function productArea(product) {
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
   FILTRAR PRODUTOS
========================================================= */

function productsView(kind) {
  const products =
    Array.isArray(S.products)
      ? S.products
      : [];

  if (kind === "orders") {
    return products.filter(
      (product) =>
        productArea(product) ===
        "encomendas"
    );
  }

  return products.filter(
    (product) =>
      productArea(product) ===
      "pronta"
  );
}

/* =========================================================
   CATEGORIAS
========================================================= */

function getCategories() {
  const defaults = [
    "Bolos",
    "Doces",
    "Salgados",
    "Brownies",
    "Cupcakes",
    "Outros"
  ];

  const categories =
    Array.isArray(
      DEF.categories
    )
      ? DEF.categories
      : defaults;

  return [
    ...new Set(
      categories
        .map((item) =>
          String(item || "").trim()
        )
        .filter(Boolean)
    )
  ];
}

/* =========================================================
   POPULAR CATEGORIAS
========================================================= */

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

  const current =
    String(
      selected || ""
    ).trim();

  if (
    current &&
    !categories.includes(current)
  ) {
    categories.push(current);
  }

  select.innerHTML =
    `<option value="">Sem categoria</option>` +
    categories
      .map(
        (category) =>
          `<option value="${esc(
            category
          )}">${esc(
            category
          )}</option>`
      )
      .join("");

  select.value = current;
}

/* =========================================================
   ENCONTRAR PRODUTO
========================================================= */

function getProduct(id) {
  if (!id) {
    return null;
  }

  return (
    S.products.find(
      (product) =>
        String(product.id) ===
        String(id)
    ) ||
    null
  );
}

/* =========================================================
   FORMATAR DATA
========================================================= */

function formatDate(value) {
  if (!value) {
    return "—";
  }

  try {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return date.toLocaleString(
      "pt-BR",
      {
        dateStyle: "short",
        timeStyle: "short"
      }
    );
  } catch {
    return String(value);
  }
}

/* =========================================================
   NORMALIZAR STATUS
========================================================= */

function normalizeStatus(value) {
  const status =
    String(
      value || "novo"
    )
      .trim()
      .toLowerCase();

  return STATUS.includes(status)
    ? status
    : "novo";
}

/* =========================================================
   NORMALIZAR PEDIDO DE ENCOMENDA
========================================================= */

function normalizeCustomOrder(
  order
) {
  const source =
    order?.data &&
    typeof order.data === "object"
      ? order.data
      : order || {};

  return {
    id:
      order?.id ||
      source?.id ||
      null,

    status:
      normalizeStatus(
        order?.status ||
        source?.status
      ),

    customer:
      source.customer ||
      source.cliente ||
      source.nome ||
      "",

    whatsapp:
      source.whatsapp ||
      source.telefone ||
      "",

    date:
      source.date ||
      source.data_desejada ||
      source.data ||
      "",

    kit:
      source.kit ||
      null,

    cake:
      source.cake ||
      source.bolo ||
      null,

    mass:
      source.mass ||
      source.massa ||
      null,

    filling:
      source.filling ||
      source.recheio ||
      null,

    decoration:
      source.topo ||
      source.decoracao ||
      source.decoration ||
      null,

    extras:
      source.extras ||
      source.adicionais ||
      [],

    personalization:
      source.personalization ||
      source.personalizacao ||
      null,

    personalization_text:
      source.personalization_text ||
      source.personalizacao_text ||
      source.custom_text ||
      "",

    brigadeiros:
      source.brigadeiros ||
      [],

    otherItems:
      source.otherItems ||
      source.outros ||
      [],

    notes:
      source.notes ||
      source.observacoes ||
      "",

    estimatedTotal:
      source.estimatedTotal ??
      source.total_estimado ??
      source.total ??
      0,

    created_at:
      order?.created_at ||
      source?.criado_em ||
      source?.created_at ||
      null,

    raw:
      order
  };
}

/* =========================================================
   NORMALIZAR PEDIDO PRONTA ENTREGA
========================================================= */

function normalizeReadyOrder(
  order
) {
  const source =
    order?.data &&
    typeof order.data === "object"
      ? order.data
      : order || {};

  return {
    id:
      order?.id ||
      source?.id ||
      null,

    status:
      normalizeStatus(
        order?.status ||
        source?.status
      ),

    customer:
      source.cliente ||
      source.customer ||
      source.nome ||
      "",

    whatsapp:
      source.whatsapp ||
      source.telefone ||
      "",

    receiving:
      source.recebimento ||
      source.delivery ||
      source.entrega ||
      "",

    address:
      source.endereco ||
      source.address ||
      "",

    payment:
      source.pagamento ||
      source.payment ||
      "",

    observations:
      source.observacoes ||
      source.notes ||
      "",

    items:
      Array.isArray(
        source.itens
      )
        ? source.itens
        : Array.isArray(
            source.items
          )
          ? source.items
          : [],

    total:
      Number(
        source.total ||
        0
      ),

    created_at:
      order?.created_at ||
      source?.criado_em ||
      source?.created_at ||
      null,

    raw:
      order
  };
}

/* =========================================================
   CARREGAR PEDIDOS PRONTA ENTREGA
========================================================= */

async function loadReadyOrders() {
  if (!db) {
    S.readyOrders = [];
    return;
  }

  try {
    const {
      data,
      error
    } = await db
      .from("orders")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

    if (error) {
      console.warn(
        "Erro ao carregar pedidos de pronta entrega:",
        error.message
      );

      S.readyOrders = [];

      return;
    }

    S.readyOrders =
      Array.isArray(data)
        ? data.map(
            normalizeReadyOrder
          )
        : [];
  } catch (error) {
    console.warn(
      "Erro ao carregar pedidos:",
      error
    );

    S.readyOrders = [];
  }
}

/* =========================================================
   CARREGAR PEDIDOS DE ENCOMENDAS
========================================================= */

async function loadCustomOrders() {
  if (!db) {
    S.customOrders = [];
    return;
  }

  try {
    const {
      data,
      error
    } = await db
      .from("custom_cakes")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

    if (error) {
      console.warn(
        "Erro ao carregar encomendas:",
        error.message
      );

      S.customOrders = [];

      return;
    }

    S.customOrders =
      Array.isArray(data)
        ? data.map(
            normalizeCustomOrder
          )
        : [];
  } catch (error) {
    console.warn(
      "Erro ao carregar encomendas:",
      error
    );

    S.customOrders = [];
  }
}

/* =========================================================
   CARREGAR TUDO
========================================================= */

async function loadAll() {
  await Promise.all([
    loadSite(),
    loadEnc(),
    loadProducts(),
    loadReadyOrders(),
    loadCustomOrders()
  ]);
}

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function initApp() {
  await loadAll();

  render();

  bindEvents();
}

/* =========================================================
   FIM DA PARTE 2
========================================================= */
 /* =========================================================
   NAVEGAÇÃO DO PAINEL
========================================================= */

function setView(view) {
  if (!view) {
    view = "dashboard";
  }

  S.view = view;

  $$(".nav-item").forEach((item) => {
    item.classList.toggle(
      "active",
      item.dataset.view === view
    );
  });

  const title =
    $("#page-title");

  if (title) {
    title.textContent =
      TITLES[view] ||
      "Painel Administrativo";
  }

  render();
}

/* =========================================================
   ABRIR SITE
========================================================= */

function openSite() {
  const url =
    CFG.SITE_URL ||
    "https://yansitesemarcas.github.io/martins-confeitaria/";

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}

/* =========================================================
   MODAL DE PRODUTO
========================================================= */

function openProductModal(
  id = null
) {
  const modal =
    $("#product-modal");

  const form =
    $("#pform");

  if (!modal || !form) {
    toast(
      "Formulário de produto não encontrado.",
      "error"
    );

    return;
  }

  S.editId = id;
  S.image = undefined;

  form.reset();

  const product =
    id
      ? getProduct(id)
      : null;

  if (product) {
    $("#f-name").value =
      product.name || "";

    $("#f-desc").value =
      product.description || "";

    $("#f-price").value =
      product.price ?? "";

    $("#f-disc").value =
      product.discount ?? "";

    $("#f-sort").value =
      product.sort_order ?? 0;

    $("#f-gram").value =
      product.gramatura ?? "";

    $("#f-serve").value =
      product.serve_people ?? "";

    $("#f-area").value =
      productArea(product) ===
      "encomendas"
        ? "encomendas"
        : "pronta";

    $("#f-avail").checked =
      product.active !== false;

    $("#f-feat").checked =
      product.featured === true;

    $("#f-appt").checked =
      product.appointment_required === true;

    S.image =
      product.image_url ??
      product.image ??
      null;

    populateCategories(
      product.category || ""
    );

    showImagePreview(
      S.image
    );
  } else {
    S.image = undefined;

    $("#f-area").value =
      "pronta";

    $("#f-avail").checked =
      true;

    $("#f-feat").checked =
      false;

    $("#f-appt").checked =
      false;

    populateCategories();

    hideImagePreview();
  }

  const title =
    $("#product-modal-title");

  if (title) {
    title.textContent =
      product
        ? "Editar produto"
        : "Novo produto";
  }

  modal.hidden = false;
  modal.classList.add("show");

  setTimeout(() => {
    $("#f-name")?.focus();
  }, 50);
}

/* =========================================================
   FECHAR MODAL
========================================================= */

function closeModal() {
  const modal =
    $("#product-modal");

  const form =
    $("#pform");

  if (modal) {
    modal.classList.remove("show");
    modal.hidden = true;
  }

  S.editId = null;
  S.image = undefined;

  if (form) {
    form.reset();
  }

  hideImagePreview();

  const file =
    $("#f-image");

  if (file) {
    file.value = "";
  }
}

/* =========================================================
   PREVIEW DA IMAGEM
========================================================= */

function showImagePreview(
  image
) {
  const preview =
    $("#image-preview");

  const remove =
    $("#remove-image");

  if (!preview) {
    return;
  }

  if (!image) {
    hideImagePreview();
    return;
  }

  preview.src = image;
  preview.hidden = false;

  if (remove) {
    remove.hidden = false;
  }
}

/* =========================================================
   ESCONDER PREVIEW
========================================================= */

function hideImagePreview() {
  const preview =
    $("#image-preview");

  const remove =
    $("#remove-image");

  if (preview) {
    preview.src = "";
    preview.hidden = true;
  }

  if (remove) {
    remove.hidden = true;
  }
}

/* =========================================================
   LER IMAGEM
========================================================= */

function handleImageChange(
  event
) {
  const file =
    event.target?.files?.[0];

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

    event.target.value = "";

    return;
  }

  const reader =
    new FileReader();

  reader.onload = () => {
    S.image =
      reader.result;

    showImagePreview(
      S.image
    );
  };

  reader.onerror = () => {
    toast(
      "Não foi possível ler a imagem.",
      "error"
    );
  };

  reader.readAsDataURL(
    file
  );
}

/* =========================================================
   REMOVER IMAGEM
========================================================= */

function removeImage() {
  S.image = null;

  hideImagePreview();

  const file =
    $("#f-image");

  if (file) {
    file.value = "";
  }
}

/* =========================================================
   SALVAR PRODUTO
========================================================= */

async function saveProduct(
  event
) {
  event?.preventDefault();

  if (!db) {
    toast(
      "Supabase não conectado. Verifique a configuração.",
      "error"
    );

    return false;
  }

  const form =
    $("#pform");

  if (!form) {
    toast(
      "Formulário de produto não encontrado.",
      "error"
    );

    return false;
  }

  const name =
    $("#f-name")?.value?.trim() ||
    "";

  if (!name) {
    toast(
      "Digite o nome do produto.",
      "error"
    );

    $("#f-name")?.focus();

    return false;
  }

  const areaField =
    $("#f-area")?.value ||
    "pronta";

  const storedArea =
    areaField === "encomendas"
      ? "encomendas"
      : "cardapio";

  const toNumber = (
    selector,
    fallback = 0
  ) => {
    const raw =
      $(selector)?.value;

    if (
      raw === "" ||
      raw == null
    ) {
      return fallback;
    }

    const value =
      Number(raw);

    return Number.isFinite(
      value
    )
      ? value
      : fallback;
  };

  const payload = {
    name,

    description:
      $("#f-desc")?.value?.trim() ||
      "",

    price:
      toNumber("#f-price"),

    discount:
      toNumber("#f-disc"),

    sort_order:
      Math.trunc(
        toNumber("#f-sort")
      ),

    gramatura:
      Math.trunc(
        toNumber("#f-gram")
      ),

    serve_people:
      Math.trunc(
        toNumber("#f-serve")
      ),

    active:
      $("#f-avail")?.checked !==
      false,

    featured:
      $("#f-feat")?.checked ===
      true,

    appointment_required:
      $("#f-appt")?.checked ===
      true,

    area:
      storedArea,

    category:
      $("#f-cat")?.value?.trim() ||
      null
  };

  /*
   * S.image:
   *
   * undefined = não alterou a imagem
   * string    = nova imagem
   * null      = removeu a imagem
   */

  if (
    S.image !== undefined
  ) {
    payload.image_url =
      S.image;
  }

  const id =
    S.editId;

  const saveButton =
    form.querySelector(
      'button[type="submit"]'
    );

  if (saveButton) {
    saveButton.disabled = true;

    saveButton.dataset.oldText =
      saveButton.textContent;

    saveButton.textContent =
      "Salvando...";
  }

  try {
    let result;

    if (id) {
      result =
        await db
          .from("products")
          .update(payload)
          .eq("id", id);
    } else {
      result =
        await db
          .from("products")
          .insert(payload);
    }

    if (result?.error) {
      throw result.error;
    }

    toast(
      id
        ? "Produto atualizado com sucesso."
        : "Produto criado com sucesso."
    );

    closeModal();

    await loadProducts();

    render();

    return true;
  } catch (error) {
    console.error(
      "Erro ao salvar produto:",
      error
    );

    toast(
      error?.message ||
        error?.details ||
        error?.hint ||
        "Erro ao salvar produto.",
      "error"
    );

    return false;
  } finally {
    if (saveButton) {
      saveButton.disabled =
        false;

      saveButton.textContent =
        saveButton.dataset.oldText ||
        "Salvar";
    }
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

    return false;
  }

  const product =
    getProduct(id);

  if (!product) {
    toast(
      "Produto não encontrado.",
      "error"
    );

    return false;
  }

  const confirmed =
    window.confirm(
      `Excluir o produto "${product.name}"?`
    );

  if (!confirmed) {
    return false;
  }

  try {
    const {
      error
    } = await db
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    toast(
      "Produto excluído com sucesso."
    );

    await loadProducts();

    render();

    return true;
  } catch (error) {
    console.error(
      "Erro ao excluir produto:",
      error
    );

    toast(
      error?.message ||
        "Erro ao excluir produto.",
      "error"
    );

    return false;
  }
}

/* =========================================================
   ATIVAR / DESATIVAR PRODUTO
========================================================= */

async function toggleProduct(
  id
) {
  if (!db) {
    toast(
      "Supabase não conectado.",
      "error"
    );

    return false;
  }

  const product =
    getProduct(id);

  if (!product) {
    return false;
  }

  try {
    const {
      error
    } = await db
      .from("products")
      .update({
        active:
          product.active === false
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    await loadProducts();

    render();

    return true;
  } catch (error) {
    console.error(
      "Erro ao alterar produto:",
      error
    );

    toast(
      error?.message ||
        "Erro ao alterar produto.",
      "error"
    );

    return false;
  }
}

/* =========================================================
   CARD DO PRODUTO
========================================================= */

function productCard(
  product
) {
  const area =
    productArea(
      product
    );

  const image =
    product.image_url ||
    product.image ||
    "";

  const active =
    product.active !== false;

  const price =
    Number(
      product.price || 0
    );

  const discount =
    Number(
      product.discount || 0
    );

  const finalPrice =
    discount > 0
      ? price -
        price *
          (discount / 100)
      : price;

  return `
    <article
      class="product-card ${
        active
          ? ""
          : "is-inactive"
      }"
      data-product-id="${esc(
        product.id
      )}"
    >

      <div class="product-card-image">

        ${
          image
            ? `
              <img
                src="${esc(image)}"
                alt="${esc(
                  product.name
                )}"
              >
            `
            : `
              <div class="product-no-image">
                Sem imagem
              </div>
            `
        }

        <span class="product-area-badge">
          ${
            area === "encomendas"
              ? "Encomendas"
              : "Pronta Entrega"
          }
        </span>

      </div>

      <div class="product-card-body">

        <div class="product-card-top">

          <h3>
            ${esc(
              product.name
            )}
          </h3>

          <span
            class="product-status ${
              active
                ? "active"
                : "inactive"
            }"
          >
            ${
              active
                ? "Ativo"
                : "Inativo"
            }
          </span>

        </div>

        ${
          product.category
            ? `
              <div class="product-category">
                ${esc(
                  product.category
                )}
              </div>
            `
            : ""
        }

        ${
          product.description
            ? `
              <p class="product-description">
                ${esc(
                  product.description
                )}
              </p>
            `
            : ""
        }

        <div class="product-price">

          ${
            discount > 0
              ? `
                <span class="old-price">
                  ${brl(price)}
                </span>

                <strong>
                  ${brl(
                    finalPrice
                  )}
                </strong>

                <small>
                  -${discount}%
                </small>
              `
              : `
                <strong>
                  ${brl(price)}
                </strong>
              `
          }

        </div>

        <div class="product-actions">

          <button
            type="button"
            class="btn btn-primary"
            data-action="edit-product"
            data-id="${esc(
              product.id
            )}"
          >
            Editar
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            data-action="toggle-product"
            data-id="${esc(
              product.id
            )}"
          >
            ${
              active
                ? "Desativar"
                : "Ativar"
            }
          </button>

          <button
            type="button"
            class="btn btn-danger"
            data-action="delete-product"
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
   RENDERIZAR PRODUTOS
========================================================= */

function renderProducts(
  kind
) {
  const container =
    $("#products-list");

  if (!container) {
    return;
  }

  const products =
    productsView(
      kind
    );

  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>
          Nenhum produto cadastrado
        </strong>

        <span>
          Cadastre um produto para
          começar.
        </span>
      </div>
    `;

    return;
  }

  container.innerHTML =
    products
      .map(productCard)
      .join("");
}

/* =========================================================
   FIM DA PARTE 3
========================================================= */
 /* =========================================================
   PEDIDOS — PRONTA ENTREGA
========================================================= */

function readyOrderCard(order) {
  const status =
    normalizeStatus(
      order?.status
    );

  const customer =
    order?.customer ||
    "Cliente não informado";

  const whatsapp =
    order?.whatsapp ||
    "";

  const receiving =
    order?.receiving ||
    "Não informado";

  const total =
    Number(
      order?.total || 0
    );

  const items =
    Array.isArray(
      order?.items
    )
      ? order.items
      : [];

  const itemCount =
    items.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.quantity || 1
        ),
      0
    );

  return `
    <article
      class="order-card"
      data-order-id="${esc(
        order?.id
      )}"
    >

      <div class="order-card-header">

        <div>

          <span class="order-type">
            Pronta Entrega
          </span>

          <h3>
            ${esc(customer)}
          </h3>

        </div>

        <select
          class="order-status"
          data-action="change-order-status"
          data-type="ready"
          data-id="${esc(
            order?.id
          )}"
        >

          ${STATUS.map(
            (item) => `
              <option
                value="${esc(item)}"
                ${
                  item === status
                    ? "selected"
                    : ""
                }
              >
                ${esc(
                  STATUS_LABEL[item] ||
                    item
                )}
              </option>
            `
          ).join("")}

        </select>

      </div>

      <div class="order-card-info">

        <div>
          <strong>
            Recebido:
          </strong>

          <span>
            ${esc(
              formatDate(
                order?.created_at
              )
            )}
          </span>
        </div>

        <div>
          <strong>
            Recebimento:
          </strong>

          <span>
            ${esc(
              receiving
            )}
          </span>
        </div>

        <div>
          <strong>
            WhatsApp:
          </strong>

          <span>
            ${esc(
              whatsapp || "—"
            )}
          </span>
        </div>

        <div>
          <strong>
            Itens:
          </strong>

          <span>
            ${itemCount}
          </span>
        </div>

        <div>
          <strong>
            Total:
          </strong>

          <span>
            ${brl(total)}
          </span>
        </div>

      </div>

      <div class="order-card-actions">

        <button
          type="button"
          class="btn btn-primary"
          data-action="view-ready-order"
          data-id="${esc(
            order?.id
          )}"
        >
          Ver pedido
        </button>

        <button
          type="button"
          class="btn btn-secondary"
          data-action="print-ready-order"
          data-id="${esc(
            order?.id
          )}"
        >
          Imprimir
        </button>

      </div>

    </article>
  `;
}

/* =========================================================
   DETALHES — PRONTA ENTREGA
========================================================= */

function readyOrderDetails(
  order
) {
  const items =
    Array.isArray(
      order?.items
    )
      ? order.items
      : [];

  const itemsHtml =
    items.length
      ? `
        <div class="order-detail-section">

          <h4>
            Itens do pedido
          </h4>

          <div class="order-items">

            ${items
              .map(
                (item) => {
                  const quantity =
                    Number(
                      item?.quantity || 1
                    );

                  const unitPrice =
                    Number(
                      item?.unit_price ||
                      item?.price ||
                      0
                    );

                  const itemTotal =
                    Number(
                      item?.total ??
                      quantity *
                        unitPrice
                    );

                  return `
                    <div
                      class="order-item"
                    >

                      <div>

                        <strong>
                          ${esc(
                            item?.name ||
                              "Produto"
                          )}
                        </strong>

                        ${
                          item?.appointment_required
                            ? `
                              <small>
                                Requer agendamento
                              </small>
                            `
                            : ""
                        }

                      </div>

                      <div>

                        <span>
                          ${quantity} ×
                          ${brl(
                            unitPrice
                          )}
                        </span>

                        <strong>
                          ${brl(
                            itemTotal
                          )}
                        </strong>

                      </div>

                    </div>
                  `;
                }
              )
              .join("")}

          </div>

        </div>
      `
      : `
        <div class="order-detail-section">

          <h4>
            Itens do pedido
          </h4>

          <p>
            Nenhum item informado.
          </p>

        </div>
      `;

  return `
    <div class="order-details">

      <div class="order-detail-section">

        <h4>
          Cliente
        </h4>

        <p>
          <strong>
            Nome:
          </strong>

          ${esc(
            order?.customer ||
              "Não informado"
          )}
        </p>

        <p>
          <strong>
            WhatsApp:
          </strong>

          ${esc(
            order?.whatsapp ||
              "Não informado"
          )}
        </p>

      </div>

      <div class="order-detail-section">

        <h4>
          Recebimento
        </h4>

        <p>
          <strong>
            Forma:
          </strong>

          ${esc(
            order?.receiving ||
              "Não informado"
          )}
        </p>

        <p>
          <strong>
            Endereço:
          </strong>

          ${esc(
            order?.address ||
              "Não informado"
          )}
        </p>

        <p>
          <strong>
            Pagamento:
          </strong>

          ${esc(
            order?.payment ||
              "Não informado"
          )}
        </p>

      </div>

      ${itemsHtml}

      <div class="order-detail-section">

        <h4>
          Observações
        </h4>

        <p>
          ${esc(
            order?.observations ||
              "Nenhuma observação."
          )}
        </p>

      </div>

      <div class="order-detail-total">

        <span>
          Total do pedido
        </span>

        <strong>
          ${brl(
            order?.total || 0
          )}
        </strong>

      </div>

    </div>
  `;
}

/* =========================================================
   MODAL DE PEDIDO
========================================================= */

function showOrderDetails(
  type,
  id
) {
  let order = null;

  if (
    type === "ready"
  ) {
    order =
      S.readyOrders.find(
        (item) =>
          String(item.id) ===
          String(id)
      );
  } else {
    order =
      S.customOrders.find(
        (item) =>
          String(item.id) ===
          String(id)
      );
  }

  if (!order) {
    toast(
      "Pedido não encontrado.",
      "error"
    );

    return;
  }

  const modal =
    $("#order-modal");

  const title =
    $("#order-modal-title");

  const body =
    $("#order-modal-body");

  if (!modal || !body) {
    toast(
      "Área de detalhes do pedido não encontrada.",
      "error"
    );

    return;
  }

  if (title) {
    title.textContent =
      type === "ready"
        ? "Pedido — Pronta Entrega"
        : "Pedido — Encomenda";
  }

  body.innerHTML =
    type === "ready"
      ? readyOrderDetails(
          order
        )
      : customOrderDetails(
          order
        );

  modal.hidden = false;

  modal.classList.add(
    "show"
  );
}

/* =========================================================
   FECHAR MODAL DE PEDIDO
========================================================= */

function closeOrderModal() {
  const modal =
    $("#order-modal");

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "show"
  );

  modal.hidden = true;
}

/* =========================================================
   ALTERAR STATUS DO PEDIDO
========================================================= */

async function updateOrderStatus(
  type,
  id,
  status
) {
  if (!db) {
    toast(
      "Supabase não conectado.",
      "error"
    );

    return false;
  }

  const normalized =
    normalizeStatus(
      status
    );

  const table =
    type === "ready"
      ? "orders"
      : "custom_cakes";

  try {
    const {
      error
    } = await db
      .from(table)
      .update({
        status:
          normalized
      })
      .eq(
        "id",
        id
      );

    if (error) {
      throw error;
    }

    toast(
      "Status atualizado."
    );

    if (
      type === "ready"
    ) {
      await loadReadyOrders();
    } else {
      await loadCustomOrders();
    }

    render();

    return true;
  } catch (error) {
    console.error(
      "Erro ao atualizar status:",
      error
    );

    toast(
      error?.message ||
        "Não foi possível atualizar o status.",
      "error"
    );

    return false;
  }
}

/* =========================================================
   IMPRIMIR PEDIDO — PRONTA ENTREGA
========================================================= */

function printableReadyOrder(
  order
) {
  const items =
    Array.isArray(
      order?.items
    )
      ? order.items
      : [];

  const itemsHtml =
    items
      .map(
        (item) => {
          const quantity =
            Number(
              item?.quantity || 1
            );

          const unitPrice =
            Number(
              item?.unit_price ||
              item?.price ||
              0
            );

          const total =
            Number(
              item?.total ??
              quantity *
                unitPrice
            );

          return `
            <tr>

              <td>
                ${esc(
                  item?.name ||
                    "Produto"
                )}
              </td>

              <td>
                ${quantity}
              </td>

              <td>
                ${brl(
                  unitPrice
                )}
              </td>

              <td>
                ${brl(
                  total
                )}
              </td>

            </tr>
          `;
        }
      )
      .join("");

  return `
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
      margin: 0;
      padding: 30px;
      font-family:
        Arial,
        Helvetica,
        sans-serif;
      color: #222;
      background: #fff;
    }

    .print-page {
      max-width: 850px;
      margin: 0 auto;
    }

    .header {
      border-bottom:
        3px solid #67b0cb;
      padding-bottom: 18px;
      margin-bottom: 25px;
    }

    .header h1 {
      margin: 0 0 5px;
      color: #2b7896;
      font-size: 28px;
    }

    .header p {
      margin: 0;
      font-size: 13px;
    }

    .section {
      margin-bottom: 24px;
    }

    .section h2 {
      margin: 0 0 10px;
      padding-bottom: 6px;
      border-bottom:
        1px solid #ddd;
      color: #2b7896;
      font-size: 18px;
    }

    .info {
      line-height: 1.7;
      font-size: 14px;
    }

    table {
      width: 100%;
      border-collapse:
        collapse;
      margin-top: 10px;
    }

    th,
    td {
      padding: 9px;
      border:
        1px solid #ddd;
      text-align: left;
      font-size: 13px;
    }

    th {
      background: #67b0cb;
      color: #fff;
    }

    .total {
      margin-top: 18px;
      padding: 14px;
      background: #f3b7bb;
      display: flex;
      justify-content:
        space-between;
      font-size: 20px;
      font-weight: bold;
    }

    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top:
        1px solid #ddd;
      font-size: 11px;
      color: #666;
    }

    @media print {

      body {
        padding: 0;
      }

      .print-page {
        max-width: none;
      }

    }

  </style>

</head>

<body>

  <div class="print-page">

    <div class="header">

      <h1>
        Martins Confeitaria
      </h1>

      <p>
        Pedido de Pronta Entrega
      </p>

      <p>
        Recebido em:
        ${esc(
          formatDate(
            order?.created_at
          )
        )}
      </p>

    </div>

    <div class="section">

      <h2>
        Cliente
      </h2>

      <div class="info">

        <strong>
          Nome:
        </strong>

        ${esc(
          order?.customer ||
            "Não informado"
        )}

        <br>

        <strong>
          WhatsApp:
        </strong>

        ${esc(
          order?.whatsapp ||
            "Não informado"
        )}

      </div>

    </div>

    <div class="section">

      <h2>
        Recebimento
      </h2>

      <div class="info">

        <strong>
          Forma:
        </strong>

        ${esc(
          order?.receiving ||
            "Não informado"
        )}

        <br>

        <strong>
          Endereço:
        </strong>

        ${esc(
          order?.address ||
            "Não informado"
        )}

        <br>

        <strong>
          Pagamento:
        </strong>

        ${esc(
          order?.payment ||
            "Não informado"
        )}

      </div>

    </div>

    <div class="section">

      <h2>
        Itens
      </h2>

      <table>

        <thead>

          <tr>
            <th>
              Produto
            </th>

            <th>
              Qtd.
            </th>

            <th>
              Unitário
            </th>

            <th>
              Total
            </th>
          </tr>

        </thead>

        <tbody>

          ${
            itemsHtml ||
            `
              <tr>
                <td colspan="4">
                  Nenhum item informado.
                </td>
              </tr>
            `
          }

        </tbody>

      </table>

    </div>

    <div class="section">

      <h2>
        Observações
      </h2>

      <div class="info">

        ${esc(
          order?.observations ||
            "Nenhuma observação."
        )}

      </div>

    </div>

    <div class="total">

      <span>
        Total
      </span>

      <span>
        ${brl(
          order?.total || 0
        )}
      </span>

    </div>

    <div class="footer">

      Martins Confeitaria
      <br>
      WhatsApp:
      ${WHATSAPP}

    </div>

  </div>

  <script>
    window.onload = function () {
      window.print();
    };
  </script>

</body>

</html>
  `;
}

/* =========================================================
   ABRIR IMPRESSÃO
========================================================= */

function printReadyOrder(
  id
) {
  const order =
    S.readyOrders.find(
      (item) =>
        String(item.id) ===
        String(id)
    );

  if (!order) {
    toast(
      "Pedido não encontrado.",
      "error"
    );

    return;
  }

  const html =
    printableReadyOrder(
      order
    );

  const printWindow =
    window.open(
      "",
      "_blank",
      "width=900,height=800"
    );

  if (!printWindow) {
    toast(
      "O navegador bloqueou a janela de impressão.",
      "error"
    );

    return;
  }

  printWindow.document.open();

  printWindow.document.write(
    html
  );

  printWindow.document.close();
}

/* =========================================================
   RENDERIZAR PEDIDOS PRONTA ENTREGA
========================================================= */

function renderReadyOrders() {
  const container =
    $("#orders-list");

  if (!container) {
    return;
  }

  const orders =
    Array.isArray(
      S.readyOrders
    )
      ? S.readyOrders
      : [];

  if (!orders.length) {
    container.innerHTML = `
      <div class="empty-state">

        <strong>
          Nenhum pedido de pronta entrega
        </strong>

        <span>
          Os pedidos realizados
          pelo cardápio aparecerão
          aqui.
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML =
    orders
      .map(
        readyOrderCard
      )
      .join("");
}

/* =========================================================
   FIM DA PARTE 4
========================================================= */
 /* =========================================================
   PEDIDOS — ENCOMENDAS
========================================================= */

function customOrderCard(order) {
  const status =
    normalizeStatus(
      order?.status
    );

  const customer =
    order?.customer ||
    "Cliente não informado";

  const whatsapp =
    order?.whatsapp ||
    "";

  const date =
    order?.date ||
    "Não informada";

  const total =
    Number(
      order?.estimatedTotal || 0
    );

  return `
    <article
      class="order-card"
      data-order-id="${esc(
        order?.id
      )}"
    >

      <div class="order-card-header">

        <div>

          <span class="order-type">
            Encomenda
          </span>

          <h3>
            ${esc(customer)}
          </h3>

        </div>

        <select
          class="order-status"
          data-action="change-order-status"
          data-type="custom"
          data-id="${esc(
            order?.id
          )}"
        >

          ${STATUS.map(
            (item) => `
              <option
                value="${esc(item)}"
                ${
                  item === status
                    ? "selected"
                    : ""
                }
              >
                ${esc(
                  STATUS_LABEL[item] ||
                    item
                )}
              </option>
            `
          ).join("")}

        </select>

      </div>

      <div class="order-card-info">

        <div>

          <strong>
            Recebido:
          </strong>

          <span>
            ${esc(
              formatDate(
                order?.created_at
              )
            )}
          </span>

        </div>

        <div>

          <strong>
            Data desejada:
          </strong>

          <span>
            ${esc(date)}
          </span>

        </div>

        <div>

          <strong>
            WhatsApp:
          </strong>

          <span>
            ${esc(
              whatsapp || "—"
            )}
          </span>

        </div>

        <div>

          <strong>
            Total estimado:
          </strong>

          <span>
            ${brl(total)}
          </span>

        </div>

      </div>

      <div class="order-card-actions">

        <button
          type="button"
          class="btn btn-primary"
          data-action="view-custom-order"
          data-id="${esc(
            order?.id
          )}"
        >
          Ver encomenda
        </button>

        <button
          type="button"
          class="btn btn-secondary"
          data-action="print-custom-order"
          data-id="${esc(
            order?.id
          )}"
        >
          Imprimir
        </button>

      </div>

    </article>
  `;
}

/* =========================================================
   DETALHES DA ENCOMENDA
========================================================= */

function customOrderDetails(
  order
) {
  const brigadeiros =
    Array.isArray(
      order?.brigadeiros
    )
      ? order.brigadeiros
      : [];

  const otherItems =
    Array.isArray(
      order?.otherItems
    )
      ? order.otherItems
      : [];

  const extras =
    Array.isArray(
      order?.extras
    )
      ? order.extras
      : [];

  const listHtml = (
    items
  ) => {
    if (!items.length) {
      return `
        <span>
          Nenhum item informado.
        </span>
      `;
    }

    return `
      <ul class="order-detail-list">

        ${items
          .map(
            (item) => `
              <li>
                ${esc(
                  typeof item ===
                    "string"
                    ? item
                    : item?.name ||
                      item?.label ||
                      JSON.stringify(
                        item
                      )
                )}
              </li>
            `
          )
          .join("")}

      </ul>
    `;
  };

  return `
    <div class="order-details">

      <!-- CLIENTE -->

      <div class="order-detail-section">

        <h4>
          Cliente
        </h4>

        <p>

          <strong>
            Nome:
          </strong>

          ${esc(
            order?.customer ||
              "Não informado"
          )}

        </p>

        <p>

          <strong>
            WhatsApp:
          </strong>

          ${esc(
            order?.whatsapp ||
              "Não informado"
          )}

        </p>

        <p>

          <strong>
            Data desejada:
          </strong>

          ${esc(
            order?.date ||
              "Não informada"
          )}

        </p>

      </div>

      <!-- KIT -->

      <div class="order-detail-section">

        <h4>
          Kit
        </h4>

        <p>

          ${esc(
            typeof order?.kit ===
              "string"
              ? order.kit
              : order?.kit?.name ||
                order?.kit?.label ||
                "Nenhum kit selecionado"
          )}

        </p>

      </div>

      <!-- BOLO -->

      <div class="order-detail-section">

        <h4>
          Bolo
        </h4>

        <p>

          <strong>
            Tipo:
          </strong>

          ${esc(
            typeof order?.cake ===
              "string"
              ? order.cake
              : order?.cake?.name ||
                order?.cake?.label ||
                "Não informado"
          )}

        </p>

      </div>

      <!-- MASSA -->

      <div class="order-detail-section">

        <h4>
          Massa
        </h4>

        <p>

          ${esc(
            typeof order?.mass ===
              "string"
              ? order.mass
              : order?.mass?.name ||
                order?.mass?.label ||
                "Não informada"
          )}

        </p>

      </div>

      <!-- RECHEIO -->

      <div class="order-detail-section">

        <h4>
          Recheio
        </h4>

        <p>

          ${esc(
            typeof order?.filling ===
              "string"
              ? order.filling
              : order?.filling?.name ||
                order?.filling?.label ||
                "Não informado"
          )}

        </p>

      </div>

      <!-- DECORAÇÃO -->

      <div class="order-detail-section">

        <h4>
          Topo / Decoração
        </h4>

        <p>

          ${esc(
            typeof order?.decoration ===
              "string"
              ? order.decoration
              : order?.decoration?.name ||
                order?.decoration?.label ||
                "Não informado"
          )}

        </p>

      </div>

      <!-- ADICIONAIS -->

      <div class="order-detail-section">

        <h4>
          Adicionais
        </h4>

        ${listHtml(
          extras
        )}

      </div>

      <!-- PERSONALIZAÇÃO -->

      <div class="order-detail-section">

        <h4>
          Personalização
        </h4>

        <p>

          ${esc(
            typeof order?.personalization ===
              "string"
              ? order.personalization
              : order?.personalization?.name ||
                order?.personalization?.label ||
                "Não informada"
          )}

        </p>

        ${
          order?.personalization_text
            ? `
              <p>

                <strong>
                  Texto:
                </strong>

                ${esc(
                  order.personalization_text
                )}

              </p>
            `
            : ""
        }

      </div>

      <!-- BRIGADEIROS -->

      <div class="order-detail-section">

        <h4>
          Brigadeiros
        </h4>

        ${listHtml(
          brigadeiros
        )}

      </div>

      <!-- OUTROS ITENS -->

      <div class="order-detail-section">

        <h4>
          Outros Itens
        </h4>

        ${listHtml(
          otherItems
        )}

      </div>

      <!-- OBSERVAÇÕES -->

      <div class="order-detail-section">

        <h4>
          Observações
        </h4>

        <p>

          ${esc(
            order?.notes ||
              "Nenhuma observação."
          )}

        </p>

      </div>

      <!-- TOTAL -->

      <div class="order-detail-total">

        <span>
          Total estimado
        </span>

        <strong>
          ${brl(
            order?.estimatedTotal ||
              0
          )}
        </strong>

      </div>

    </div>
  `;
}

/* =========================================================
   IMPRIMIR ENCOMENDA
========================================================= */

function printableCustomOrder(
  order
) {
  const arrayOrEmpty = (
    value
  ) =>
    Array.isArray(value)
      ? value
      : [];

  const extras =
    arrayOrEmpty(
      order?.extras
    );

  const brigadeiros =
    arrayOrEmpty(
      order?.brigadeiros
    );

  const otherItems =
    arrayOrEmpty(
      order?.otherItems
    );

  const list = (
    items
  ) => {
    if (!items.length) {
      return "Nenhum item informado.";
    }

    return items
      .map(
        (item) =>
          typeof item ===
          "string"
            ? item
            : item?.name ||
              item?.label ||
              JSON.stringify(
                item
              )
      )
      .join(", ");
  };

  const value = (
    item
  ) =>
    typeof item ===
    "string"
      ? item
      : item?.name ||
        item?.label ||
        "Não informado";

  return `
<!DOCTYPE html>
<html lang="pt-BR">

<head>

  <meta charset="UTF-8">

  <title>
    Encomenda — Martins Confeitaria
  </title>

  <style>

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 30px;
      font-family:
        Arial,
        Helvetica,
        sans-serif;
      color: #222;
      background: #fff;
    }

    .print-page {
      max-width: 850px;
      margin: 0 auto;
    }

    .header {
      border-bottom:
        3px solid #67b0cb;
      padding-bottom: 18px;
      margin-bottom: 25px;
    }

    .header h1 {
      margin: 0 0 5px;
      color: #2b7896;
      font-size: 28px;
    }

    .header p {
      margin: 4px 0;
      font-size: 13px;
    }

    .section {
      margin-bottom: 20px;
    }

    .section h2 {
      margin: 0 0 9px;
      padding-bottom: 6px;
      border-bottom:
        1px solid #ddd;
      color: #2b7896;
      font-size: 17px;
    }

    .info {
      line-height: 1.7;
      font-size: 14px;
    }

    .total {
      margin-top: 25px;
      padding: 14px;
      background: #f3b7bb;
      display: flex;
      justify-content:
        space-between;
      font-size: 20px;
      font-weight: bold;
    }

    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top:
        1px solid #ddd;
      font-size: 11px;
      color: #666;
    }

    @media print {

      body {
        padding: 0;
      }

      .print-page {
        max-width: none;
      }

    }

  </style>

</head>

<body>

  <div class="print-page">

    <div class="header">

      <h1>
        Martins Confeitaria
      </h1>

      <p>
        Encomenda de bolo personalizado
      </p>

      <p>
        Recebido em:
        ${esc(
          formatDate(
            order?.created_at
          )
        )}
      </p>

    </div>

    <!-- CLIENTE -->

    <div class="section">

      <h2>
        Cliente
      </h2>

      <div class="info">

        <strong>
          Nome:
        </strong>

        ${esc(
          order?.customer ||
            "Não informado"
        )}

        <br>

        <strong>
          WhatsApp:
        </strong>

        ${esc(
          order?.whatsapp ||
            "Não informado"
        )}

        <br>

        <strong>
          Data desejada:
        </strong>

        ${esc(
          order?.date ||
            "Não informada"
        )}

      </div>

    </div>

    <!-- KIT -->

    <div class="section">

      <h2>
        Kit
      </h2>

      <div class="info">

        ${esc(
          value(
            order?.kit
          )
        )}

      </div>

    </div>

    <!-- BOLO -->

    <div class="section">

      <h2>
        Bolo
      </h2>

      <div class="info">

        <strong>
          Tipo:
        </strong>

        ${esc(
          value(
            order?.cake
          )
        )}

        <br>

        <strong>
          Massa:
        </strong>

        ${esc(
          value(
            order?.mass
          )
        )}

        <br>

        <strong>
          Recheio:
        </strong>

        ${esc(
          value(
            order?.filling
          )
        )}

      </div>

    </div>

    <!-- DECORAÇÃO -->

    <div class="section">

      <h2>
        Decoração
      </h2>

      <div class="info">

        ${esc(
          value(
            order?.decoration
          )
        )}

      </div>

    </div>

    <!-- ADICIONAIS -->

    <div class="section">

      <h2>
        Adicionais
      </h2>

      <div class="info">

        ${esc(
          list(
            extras
          )
        )}

      </div>

    </div>

    <!-- PERSONALIZAÇÃO -->

    <div class="section">

      <h2>
        Personalização
      </h2>

      <div class="info">

        <strong>
          Tipo:
        </strong>

        ${esc(
          value(
            order?.personalization
          )
        )}

        ${
          order?.personalization_text
            ? `
              <br>

              <strong>
                Texto:
              </strong>

              ${esc(
                order.personalization_text
              )}
            `
            : ""
        }

      </div>

    </div>

    <!-- BRIGADEIROS -->

    <div class="section">

      <h2>
        Brigadeiros
      </h2>

      <div class="info">

        ${esc(
          list(
            brigadeiros
          )
        )}

      </div>

    </div>

    <!-- OUTROS -->

    <div class="section">

      <h2>
        Outros Itens
      </h2>

      <div class="info">

        ${esc(
          list(
            otherItems
          )
        )}

      </div>

    </div>

    <!-- OBSERVAÇÕES -->

    <div class="section">

      <h2>
        Observações
      </h2>

      <div class="info">

        ${esc(
          order?.notes ||
            "Nenhuma observação."
        )}

      </div>

    </div>

    <!-- TOTAL -->

    <div class="total">

      <span>
        Total estimado
      </span>

      <span>
        ${brl(
          order?.estimatedTotal ||
            0
        )}
      </span>

    </div>

    <div class="footer">

      Martins Confeitaria
      <br>

      WhatsApp:
      ${WHATSAPP}

    </div>

  </div>

  <script>

    window.onload =
      function () {
        window.print();
      };

  </script>

</body>

</html>
  `;
}

/* =========================================================
   ABRIR IMPRESSÃO — ENCOMENDA
========================================================= */

function printCustomOrder(
  id
) {
  const order =
    S.customOrders.find(
      (item) =>
        String(item.id) ===
        String(id)
    );

  if (!order) {
    toast(
      "Encomenda não encontrada.",
      "error"
    );

    return;
  }

  const html =
    printableCustomOrder(
      order
    );

  const printWindow =
    window.open(
      "",
      "_blank",
      "width=900,height=800"
    );

  if (!printWindow) {
    toast(
      "O navegador bloqueou a janela de impressão.",
      "error"
    );

    return;
  }

  printWindow.document.open();

  printWindow.document.write(
    html
  );

  printWindow.document.close();
}

/* =========================================================
   RENDERIZAR PEDIDOS — ENCOMENDAS
========================================================= */

function renderCustomOrders() {
  const container =
    $("#orders-list");

  if (!container) {
    return;
  }

  const orders =
    Array.isArray(
      S.customOrders
    )
      ? S.customOrders
      : [];

  if (!orders.length) {
    container.innerHTML = `
      <div class="empty-state">

        <strong>
          Nenhuma encomenda cadastrada
        </strong>

        <span>
          As encomendas realizadas
          pelo formulário aparecerão
          aqui.
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML =
    orders
      .map(
        customOrderCard
      )
      .join("");
}

/* =========================================================
   EXIBIR LISTA DE PEDIDOS
========================================================= */

function renderOrders(
  type
) {
  if (
    type === "custom"
  ) {
    renderCustomOrders();
    return;
  }

  renderReadyOrders();
}

/* =========================================================
   FIM DA PARTE 5
========================================================= */
 /* =========================================================
   CONFIGURAÇÕES — ENCOMENDAS
========================================================= */

function ensureEnc() {
  if (!S.enc) {
    S.enc = mergeEnc(null);
  }

  return S.enc;
}

/* =========================================================
   VALOR SEGURO
========================================================= */

function encValue(
  value,
  fallback = ""
) {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return value;
}

/* =========================================================
   INPUT DE CONFIGURAÇÃO
========================================================= */

function encInput(
  value,
  type = "text"
) {
  return esc(
    encValue(
      value,
      ""
    )
  );
}

/* =========================================================
   RENDERIZAR CONFIGURAÇÕES
========================================================= */

function renderSettings() {
  const container =
    $("#settings-content");

  if (!container) {
    return;
  }

  const enc =
    ensureEnc();

  const cakes =
    Array.isArray(
      enc.cakes
    )
      ? enc.cakes
      : [];

  const masses =
    Array.isArray(
      enc.masses
    )
      ? enc.masses
      : [];

  const fillings =
    Array.isArray(
      enc.fillings
    )
      ? enc.fillings
      : [];

  const extras =
    Array.isArray(
      enc.extras
    )
      ? enc.extras
      : [];

  const topes =
    Array.isArray(
      enc.topes
    )
      ? enc.topes
      : [];

  const personalization =
    Array.isArray(
      enc.personalization
    )
      ? enc.personalization
      : [];

  const brigadeiroClassicos =
    Array.isArray(
      enc.brigadeiros?.classicos
    )
      ? enc.brigadeiros.classicos
      : [];

  const brigadeiroPremium =
    Array.isArray(
      enc.brigadeiros?.premium
    )
      ? enc.brigadeiros.premium
      : [];

  const otherItems =
    Array.isArray(
      enc.otherItems
    )
      ? enc.otherItems
      : [];

  const kits =
    Array.isArray(
      enc.kits
    )
      ? enc.kits
      : [];

  container.innerHTML = `

    <div class="settings-panel">

      <div class="settings-header">

        <div>

          <h2>
            Configurações de Encomendas
          </h2>

          <p>
            Gerencie as opções utilizadas
            no formulário de encomendas.
          </p>

        </div>

        <button
          type="button"
          class="btn btn-primary"
          data-action="save-enc"
        >
          Salvar alterações
        </button>

      </div>

      <!-- ===============================================
           BOLOS
      ================================================ -->

      <section class="settings-section">

        <div class="settings-section-header">

          <div>

            <h3>
              Bolos
            </h3>

            <p>
              Apenas Naked Cake e Chantininho.
            </p>

          </div>

        </div>

        <div class="settings-grid">

          ${cakes
            .map(
              (
                cake,
                cakeIndex
              ) => `
                <div
                  class="setting-card"
                  data-cake-index="${cakeIndex}"
                >

                  <div class="setting-card-header">

                    <input
                      type="text"
                      class="field-input"
                      data-enc="cake-name"
                      data-index="${cakeIndex}"
                      value="${encInput(
                        cake?.name
                      )}"
                      placeholder="Nome do bolo"
                    >

                    <label
                      class="switch-row"
                    >

                      <input
                        type="checkbox"
                        data-enc="cake-active"
                        data-index="${cakeIndex}"
                        ${
                          cake?.active !== false
                            ? "checked"
                            : ""
                        }
                      >

                      <span>
                        Ativo
                      </span>

                    </label>

                  </div>

                  <div class="setting-options">

                    ${
                      Array.isArray(
                        cake?.options
                      )
                        ? cake.options
                            .map(
                              (
                                option,
                                optionIndex
                              ) => `
                                <div
                                  class="setting-option-row"
                                >

                                  <input
                                    type="text"
                                    class="field-input"
                                    data-enc="cake-option"
                                    data-cake="${cakeIndex}"
                                    data-option="${optionIndex}"
                                    value="${encInput(
                                      option
                                    )}"
                                  >

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    class="field-input price-input"
                                    data-enc="cake-price"
                                    data-cake="${cakeIndex}"
                                    data-option="${optionIndex}"
                                    value="${encValue(
                                      cake?.prices?.[
                                        optionIndex
                                      ],
                                      0
                                    )}"
                                  >

                                </div>
                              `
                            )
                            .join("")
                        : ""
                    }

                  </div>

                </div>
              `
            )
            .join("")}

        </div>

      </section>

      <!-- ===============================================
           MASSAS
      ================================================ -->

      <section class="settings-section">

        <div class="settings-section-header">

          <div>

            <h3>
              Massas
            </h3>

            <p>
              Opções de massa disponíveis.
            </p>

          </div>

        </div>

        <div class="settings-list">

          ${masses
            .map(
              (
                item,
                index
              ) => `
                <div class="settings-list-row">

                  <input
                    type="text"
                    class="field-input"
                    data-enc="mass"
                    data-index="${index}"
                    value="${encInput(
                      item
                    )}"
                  >

                </div>
              `
            )
            .join("")}

        </div>

      </section>

      <!-- ===============================================
           RECHEIOS
      ================================================ -->

      <section class="settings-section">

        <div class="settings-section-header">

          <div>

            <h3>
              Recheios
            </h3>

            <p>
              Opções de recheio disponíveis.
            </p>

          </div>

        </div>

        <div class="settings-list">

          ${fillings
            .map(
              (
                item,
                index
              ) => `
                <div class="settings-list-row">

                  <input
                    type="text"
                    class="field-input"
                    data-enc="filling"
                    data-index="${index}"
                    value="${encInput(
                      item
                    )}"
                  >

                </div>
              `
            )
            .join("")}

        </div>

      </section>

      <!-- ===============================================
           TOPOS / DECORAÇÕES
      ================================================ -->

      <section class="settings-section">

        <div class="settings-section-header">

          <div>

            <h3>
              Topos / Decorações
            </h3>

          </div>

        </div>

        <div class="settings-list">

          ${topes
            .map(
              (
                item,
                index
              ) => {

                const name =
                  Array.isArray(item)
                    ? item[0]
                    : item?.name ||
                      "";

                const price =
                  Array.isArray(item)
                    ? item[1]
                    : item?.price ||
                      0;

                return `
                  <div class="settings-list-row">

                    <input
                      type="text"
                      class="field-input"
                      data-enc="top-name"
                      data-index="${index}"
                      value="${encInput(
                        name
                      )}"
                    >

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      class="field-input price-input"
                      data-enc="top-price"
                      data-index="${index}"
                      value="${encValue(
                        price,
                        0
                      )}"
                    >

                  </div>
                `;
              }
            )
            .join("")}

        </div>

      </section>

      <!-- ===============================================
           ADICIONAIS
      ================================================ -->

      <section class="settings-section">

        <div class="settings-section-header">

          <div>

            <h3>
              Adicionais
            </h3>

          </div>

        </div>

        <div class="settings-list">

          ${extras
            .map(
              (
                item,
                index
              ) => {

                const name =
                  Array.isArray(item)
                    ? item[0]
                    : item?.name ||
                      "";

                const price =
                  Array.isArray(item)
                    ? item[1]
                    : item?.price ||
                      0;

                return `
                  <div class="settings-list-row">

                    <input
                      type="text"
                      class="field-input"
                      data-enc="extra-name"
                      data-index="${index}"
                      value="${encInput(
                        name
                      )}"
                    >

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      class="field-input price-input"
                      data-enc="extra-price"
                      data-index="${index}"
                      value="${encValue(
                        price,
                        0
                      )}"
                    >

                  </div>
                `;
              }
            )
            .join("")}

        </div>

      </section>

      <!-- ===============================================
           PERSONALIZAÇÃO
      ================================================ -->

      <section class="settings-section">

        <div class="settings-section-header">

          <div>

            <h3>
              Personalização
            </h3>

          </div>

        </div>

        <div class="settings-list">

          ${personalization
            .map(
              (
                item,
                index
              ) => {

                const name =
                  Array.isArray(item)
                    ? item[0]
                    : item?.name ||
                      "";

                const price =
                  Array.isArray(item)
                    ? item[1]
                    : item?.price ||
                      0;

                return `
                  <div class="settings-list-row">

                    <input
                      type="text"
                      class="field-input"
                      data-enc="personalization-name"
                      data-index="${index}"
                      value="${encInput(
                        name
                      )}"
                    >

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      class="field-input price-input"
                      data-enc="personalization-price"
                      data-index="${index}"
                      value="${encValue(
                        price,
                        0
                      )}"
                    >

                  </div>
                `;
              }
            )
            .join("")}

        </div>

      </section>

      <!-- ===============================================
           BRIGADEIROS
      ================================================ -->

      <section class="settings-section">

        <div class="settings-section-header">

          <div>

            <h3>
              Brigadeiros
            </h3>

          </div>

        </div>

        <div class="settings-columns">

          <div>

            <h4>
              Clássicos
            </h4>

            <div class="settings-list">

              ${brigadeiroClassicos
                .map(
                  (
                    item,
                    index
                  ) => `
                    <div
                      class="settings-list-row"
                    >

                      <input
                        type="text"
                        class="field-input"
                        data-enc="brigadeiro-classico"
                        data-index="${index}"
                        value="${encInput(
                          item
                        )}"
                      >

                    </div>
                  `
                )
                .join("")}

            </div>

          </div>

          <div>

            <h4>
              Premium
            </h4>

            <div class="settings-list">

              ${brigadeiroPremium
                .map(
                  (
                    item,
                    index
                  ) => `
                    <div
                      class="settings-list-row"
                    >

                      <input
                        type="text"
                        class="field-input"
                        data-enc="brigadeiro-premium"
                        data-index="${index}"
                        value="${encInput(
                          item
                        )}"
                      >

                    </div>
                  `
                )
                .join("")}

            </div>

          </div>

        </div>

      </section>

      <!-- ===============================================
           OUTROS ITENS
      ================================================ -->

      <section class="settings-section">

        <div class="settings-section-header">

          <div>

            <h3>
              Outros Itens
            </h3>

            <p>
              Itens disponíveis para encomenda.
            </p>

          </div>

        </div>

        <div class="settings-list">

          ${otherItems
            .map(
              (
                item,
                index
              ) => `
                <div
                  class="settings-list-row"
                >

                  <input
                    type="text"
                    class="field-input"
                    data-enc="other-name"
                    data-index="${index}"
                    value="${encInput(
                      item?.name
                    )}"
                  >

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    class="field-input price-input"
                    data-enc="other-price"
                    data-index="${index}"
                    value="${encValue(
                      item?.price,
                      0
                    )}"
                  >

                  <label
                    class="switch-row"
                  >

                    <input
                      type="checkbox"
                      data-enc="other-active"
                      data-index="${index}"
                      ${
                        item?.active !== false
                          ? "checked"
                          : ""
                      }
                    >

                    <span>
                      Ativo
                    </span>

                  </label>

                </div>
              `
            )
            .join("")}

        </div>

      </section>

      <!-- ===============================================
           KITS
      ================================================ -->

      <section class="settings-section">

        <div class="settings-section-header">

          <div>

            <h3>
              Kits
            </h3>

            <p>
              Kits disponíveis para encomendas.
            </p>

          </div>

        </div>

        <div class="settings-grid">

          ${kits
            .map(
              (
                kit,
                index
              ) => `
                <div
                  class="setting-card"
                >

                  <div
                    class="setting-card-header"
                  >

                    <input
                      type="text"
                      class="field-input"
                      data-enc="kit-name"
                      data-index="${index}"
                      value="${encInput(
                        kit?.name
                      )}"
                      placeholder="Nome do kit"
                    >

                    <label
                      class="switch-row"
                    >

                      <input
                        type="checkbox"
                        data-enc="kit-active"
                        data-index="${index}"
                        ${
                          kit?.active !== false
                            ? "checked"
                            : ""
                        }
                      >

                      <span>
                        Ativo
                      </span>

                    </label>

                  </div>

                  <div
                    class="settings-list"
                  >

                    <div
                      class="settings-list-row"
                    >

                      <label>
                        Preço
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        class="field-input"
                        data-enc="kit-price"
                        data-index="${index}"
                        value="${encValue(
                          kit?.price,
                          0
                        )}"
                      >

                    </div>

                    <div
                      class="settings-list-row"
                    >

                      <label>
                        Bolo
                      </label>

                      <input
                        type="text"
                        class="field-input"
                        data-enc="kit-cake"
                        data-index="${index}"
                        value="${encInput(
                          kit?.cake
                        )}"
                      >

                    </div>

                    <div
                      class="settings-list-row"
                    >

                      <label>
                        Quantidade de docinhos
                      </label>

                      <input
                        type="number"
                        min="0"
                        class="field-input"
                        data-enc="kit-docinhos"
                        data-index="${index}"
                        value="${encValue(
                          kit?.docinhos,
                          0
                        )}"
                      >

                    </div>

                    <div
                      class="settings-list-row"
                    >

                      <label>
                        Itens
                      </label>

                      <textarea
                        class="field-input"
                        rows="3"
                        data-enc="kit-items"
                        data-index="${index}"
                      >${esc(
                        Array.isArray(
                          kit?.items
                        )
                          ? kit.items.join(
                              "\n"
                            )
                          : ""
                      )}</textarea>

                    </div>

                  </div>

                </div>
              `
            )
            .join("")}

        </div>

      </section>

      <div class="settings-footer">

        <button
          type="button"
          class="btn btn-primary"
          data-action="save-enc"
        >
          Salvar alterações
        </button>

      </div>

    </div>
  `;
}

/* =========================================================
   LER ALTERAÇÕES DAS CONFIGURAÇÕES
========================================================= */

function collectEncChanges() {
  const enc =
    ensureEnc();

  /* -------------------------------------------------------
     BOLOS
  ------------------------------------------------------- */

  $$(
    '[data-enc="cake-name"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      enc.cakes?.[index]
    ) {
      enc.cakes[index].name =
        input.value.trim();
    }

  });

  $$(
    '[data-enc="cake-active"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      enc.cakes?.[index]
    ) {
      enc.cakes[index].active =
        input.checked;
    }

  });

  $$(
    '[data-enc="cake-option"]'
  ).forEach((input) => {

    const cakeIndex =
      Number(
        input.dataset.cake
      );

    const optionIndex =
      Number(
        input.dataset.option
      );

    if (
      !enc.cakes?.[
        cakeIndex
      ]
    ) {
      return;
    }

    if (
      !Array.isArray(
        enc.cakes[
          cakeIndex
        ].options
      )
    ) {
      enc.cakes[
        cakeIndex
      ].options = [];
    }

    enc.cakes[
      cakeIndex
    ].options[
      optionIndex
    ] =
      input.value.trim();

  });

  $$(
    '[data-enc="cake-price"]'
  ).forEach((input) => {

    const cakeIndex =
      Number(
        input.dataset.cake
      );

    const optionIndex =
      Number(
        input.dataset.option
      );

    if (
      !enc.cakes?.[
        cakeIndex
      ]
    ) {
      return;
    }

    if (
      !Array.isArray(
        enc.cakes[
          cakeIndex
        ].prices
      )
    ) {
      enc.cakes[
        cakeIndex
      ].prices = [];
    }

    enc.cakes[
      cakeIndex
    ].prices[
      optionIndex
    ] =
      Number(
        input.value || 0
      );

  });

  /* -------------------------------------------------------
     MASSAS
  ------------------------------------------------------- */

  $$(
    '[data-enc="mass"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      Array.isArray(
        enc.masses
      )
    ) {
      enc.masses[index] =
        input.value.trim();
    }

  });

  /* -------------------------------------------------------
     RECHEIOS
  ------------------------------------------------------- */

  $$(
    '[data-enc="filling"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      Array.isArray(
        enc.fillings
      )
    ) {
      enc.fillings[index] =
        input.value.trim();
    }

  });

  /* -------------------------------------------------------
     TOPOS
  ------------------------------------------------------- */

  $$(
    '[data-enc="top-name"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      !Array.isArray(
        enc.topes
      )
    ) {
      return;
    }

    if (
      Array.isArray(
        enc.topes[index]
      )
    ) {
      enc.topes[index][0] =
        input.value.trim();
    } else {
      enc.topes[index] =
        {
          name:
            input.value.trim(),
          price:
            Number(
              enc.topes[index]
                ?.price || 0
            )
        };
    }

  });

  $$(
    '[data-enc="top-price"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      !Array.isArray(
        enc.topes
      )
    ) {
      return;
    }

    const price =
      Number(
        input.value || 0
      );

    if (
      Array.isArray(
        enc.topes[index]
      )
    ) {
      enc.topes[index][1] =
        price;
    } else if (
      enc.topes[index]
    ) {
      enc.topes[index].price =
        price;
    }

  });

  /* -------------------------------------------------------
     ADICIONAIS
  ------------------------------------------------------- */

  $$(
    '[data-enc="extra-name"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      !Array.isArray(
        enc.extras
      )
    ) {
      return;
    }

    if (
      Array.isArray(
        enc.extras[index]
      )
    ) {
      enc.extras[index][0] =
        input.value.trim();
    } else {
      enc.extras[index] =
        {
          name:
            input.value.trim(),
          price:
            Number(
              enc.extras[index]
                ?.price || 0
            )
        };
    }

  });

  $$(
    '[data-enc="extra-price"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      !Array.isArray(
        enc.extras
      )
    ) {
      return;
    }

    const price =
      Number(
        input.value || 0
      );

    if (
      Array.isArray(
        enc.extras[index]
      )
    ) {
      enc.extras[index][1] =
        price;
    } else if (
      enc.extras[index]
    ) {
      enc.extras[index].price =
        price;
    }

  });

  /* -------------------------------------------------------
     PERSONALIZAÇÃO
  ------------------------------------------------------- */

  $$(
    '[data-enc="personalization-name"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      !Array.isArray(
        enc.personalization
      )
    ) {
      return;
    }

    if (
      Array.isArray(
        enc.personalization[index]
      )
    ) {
      enc.personalization[
        index
      ][0] =
        input.value.trim();
    } else {
      enc.personalization[
        index
      ] = {
        name:
          input.value.trim(),
        price:
          Number(
            enc.personalization[
              index
            ]?.price || 0
          )
      };
    }

  });

  $$(
    '[data-enc="personalization-price"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      !Array.isArray(
        enc.personalization
      )
    ) {
      return;
    }

    const price =
      Number(
        input.value || 0
      );

    if (
      Array.isArray(
        enc.personalization[index]
      )
    ) {
      enc.personalization[
        index
      ][1] =
        price;
    } else if (
      enc.personalization[
        index
      ]
    ) {
      enc.personalization[
        index
      ].price =
        price;
    }

  });

  /* -------------------------------------------------------
     BRIGADEIROS
  ------------------------------------------------------- */

  $$(
    '[data-enc="brigadeiro-classico"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      !Array.isArray(
        enc.brigadeiros.classicos
      )
    ) {
      enc.brigadeiros.classicos =
        [];
    }

    enc.brigadeiros
      .classicos[index] =
      input.value.trim();

  });

  $$(
    '[data-enc="brigadeiro-premium"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      !Array.isArray(
        enc.brigadeiros.premium
      )
    ) {
      enc.brigadeiros.premium =
        [];
    }

    enc.brigadeiros
      .premium[index] =
      input.value.trim();

  });

  /* -------------------------------------------------------
     OUTROS ITENS
  ------------------------------------------------------- */

  $$(
    '[data-enc="other-name"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      enc.otherItems?.[index]
    ) {
      enc.otherItems[
        index
      ].name =
        input.value.trim();
    }

  });

  $$(
    '[data-enc="other-price"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      enc.otherItems?.[index]
    ) {
      enc.otherItems[
        index
      ].price =
        Number(
          input.value || 0
        );
    }

  });

  $$(
    '[data-enc="other-active"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      enc.otherItems?.[index]
    ) {
      enc.otherItems[
        index
      ].active =
        input.checked;
    }

  });

  /* -------------------------------------------------------
     KITS
  ------------------------------------------------------- */

  $$(
    '[data-enc="kit-name"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      enc.kits?.[index]
    ) {
      enc.kits[index].name =
        input.value.trim();
    }

  });

  $$(
    '[data-enc="kit-active"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      enc.kits?.[index]
    ) {
      enc.kits[index].active =
        input.checked;
    }

  });

  $$(
    '[data-enc="kit-price"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      enc.kits?.[index]
    ) {
      enc.kits[index].price =
        Number(
          input.value || 0
        );
    }

  });

  $$(
    '[data-enc="kit-cake"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      enc.kits?.[index]
    ) {
      enc.kits[index].cake =
        input.value.trim();
    }

  });

  $$(
    '[data-enc="kit-docinhos"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      enc.kits?.[index]
    ) {
      enc.kits[index].docinhos =
        Number(
          input.value || 0
        );
    }

  });

  $$(
    '[data-enc="kit-items"]'
  ).forEach((input) => {

    const index =
      Number(
        input.dataset.index
      );

    if (
      enc.kits?.[index]
    ) {
      enc.kits[index].items =
        input.value
          .split("\n")
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean);
    }

  });

  return enc;
}

/* =========================================================
   SALVAR CONFIGURAÇÕES
========================================================= */

async function saveEncSettings() {
  collectEncChanges();

  const saved =
    await saveEnc();

  if (saved) {
    renderSettings();
  }

  return saved;
}

/* =========================================================
   RENDERIZAÇÃO DO DASHBOARD
========================================================= */

function renderDashboard() {
  const container =
    $("#dashboard-content");

  if (!container) {
    return;
  }

  const readyProducts =
    productsView(
      "ready"
    );

  const customProducts =
    productsView(
      "orders"
    );

  const readyOrders =
    Array.isArray(
      S.readyOrders
    )
      ? S.readyOrders
      : [];

  const customOrders =
    Array.isArray(
      S.customOrders
    )
      ? S.customOrders
      : [];

  const pendingReady =
    readyOrders.filter(
      (order) =>
        ![
          "concluído",
          "cancelado"
        ].includes(
          normalizeStatus(
            order.status
          )
        )
    ).length;

  const pendingCustom =
    customOrders.filter(
      (order) =>
        ![
          "concluído",
          "cancelado"
        ].includes(
          normalizeStatus(
            order.status
          )
        )
    ).length;

  container.innerHTML = `

    <div class="dashboard-grid">

      <div class="dashboard-card">

        <span>
          Produtos — Pronta Entrega
        </span>

        <strong>
          ${readyProducts.length}
        </strong>

        <button
          type="button"
          class="btn btn-secondary"
          data-view="prod-ready"
        >
          Ver produtos
        </button>

      </div>

      <div class="dashboard-card">

        <span>
          Produtos — Encomendas
        </span>

        <strong>
          ${customProducts.length}
        </strong>

        <button
          type="button"
          class="btn btn-secondary"
          data-view="prod-orders"
        >
          Ver produtos
        </button>

      </div>

      <div class="dashboard-card">

        <span>
          Pedidos — Pronta Entrega
        </span>

        <strong>
          ${pendingReady}
        </strong>

        <button
          type="button"
          class="btn btn-secondary"
          data-view="ord-ready"
        >
          Ver pedidos
        </button>

      </div>

      <div class="dashboard-card">

        <span>
          Pedidos — Encomendas
        </span>

        <strong>
          ${pendingCustom}
        </strong>

        <button
          type="button"
          class="btn btn-secondary"
          data-view="ord-orders"
        >
          Ver pedidos
        </button>

      </div>

    </div>

  `;
}

/* =========================================================
   FIM DA PARTE 6
========================================================= */
 /* =========================================================
   RENDERIZAÇÃO PRINCIPAL
========================================================= */

function render() {
  const title =
    $("#page-title");

  if (title) {
    title.textContent =
      TITLES[S.view] ||
      "Painel Administrativo";
  }

  /* -------------------------------------------------------
     OCULTAR TODAS AS ÁREAS
  ------------------------------------------------------- */

  $$(".view").forEach(
    (view) => {
      view.classList.remove(
        "active"
      );
    }
  );

  /* -------------------------------------------------------
     DASHBOARD
  ------------------------------------------------------- */

  if (
    S.view ===
    "dashboard"
  ) {
    const view =
      $("#view-dashboard");

    if (view) {
      view.classList.add(
        "active"
      );
    }

    renderDashboard();

    return;
  }

  /* -------------------------------------------------------
     PRODUTOS — PRONTA ENTREGA
  ------------------------------------------------------- */

  if (
    S.view ===
    "prod-ready"
  ) {
    const view =
      $("#view-products");

    if (view) {
      view.classList.add(
        "active"
      );
    }

    renderProducts(
      "ready"
    );

    return;
  }

  /* -------------------------------------------------------
     PRODUTOS — ENCOMENDAS
  ------------------------------------------------------- */

  if (
    S.view ===
    "prod-orders"
  ) {
    const view =
      $("#view-products");

    if (view) {
      view.classList.add(
        "active"
      );
    }

    renderProducts(
      "orders"
    );

    return;
  }

  /* -------------------------------------------------------
     PEDIDOS — PRONTA ENTREGA
  ------------------------------------------------------- */

  if (
    S.view ===
    "ord-ready"
  ) {
    const view =
      $("#view-orders");

    if (view) {
      view.classList.add(
        "active"
      );
    }

    renderOrders(
      "ready"
    );

    return;
  }

  /* -------------------------------------------------------
     PEDIDOS — ENCOMENDAS
  ------------------------------------------------------- */

  if (
    S.view ===
    "ord-orders"
  ) {
    const view =
      $("#view-orders");

    if (view) {
      view.classList.add(
        "active"
      );
    }

    renderOrders(
      "orders"
    );

    return;
  }

  /* -------------------------------------------------------
     CONFIGURAÇÕES
  ------------------------------------------------------- */

  if (
    S.view ===
    "settings"
  ) {
    const view =
      $("#view-settings");

    if (view) {
      view.classList.add(
        "active"
      );
    }

    renderSettings();

    return;
  }
}

/* =========================================================
   EVENTOS DO MENU
========================================================= */

function bindNavigation() {

  document.addEventListener(
    "click",
    async (event) => {

      const viewButton =
        event.target.closest(
          "[data-view]"
        );

      if (
        viewButton
      ) {
        event.preventDefault();

        const view =
          viewButton.dataset.view;

        if (!view) {
          return;
        }

        setView(view);

        return;
      }

      /* ---------------------------------------------------
         IR PARA O SITE
      --------------------------------------------------- */

      const siteButton =
        event.target.closest(
          "[data-action='open-site']"
        );

      if (
        siteButton
      ) {
        event.preventDefault();

        openSite();

        return;
      }

      /* ---------------------------------------------------
         NOVO PRODUTO
      --------------------------------------------------- */

      const newProductButton =
        event.target.closest(
          "[data-action='new-product']"
        );

      if (
        newProductButton
      ) {
        event.preventDefault();

        openProductModal(
          null
        );

        return;
      }

      /* ---------------------------------------------------
         EDITAR PRODUTO
      --------------------------------------------------- */

      const editButton =
        event.target.closest(
          "[data-action='edit-product']"
        );

      if (
        editButton
      ) {
        event.preventDefault();

        const id =
          editButton.dataset.id;

        if (id) {
          openProductModal(
            id
          );
        }

        return;
      }

      /* ---------------------------------------------------
         EXCLUIR PRODUTO
      --------------------------------------------------- */

      const deleteButton =
        event.target.closest(
          "[data-action='delete-product']"
        );

      if (
        deleteButton
      ) {
        event.preventDefault();

        const id =
          deleteButton.dataset.id;

        if (id) {
          await deleteProduct(
            id
          );
        }

        return;
      }

      /* ---------------------------------------------------
         ATIVAR / DESATIVAR
      --------------------------------------------------- */

      const toggleButton =
        event.target.closest(
          "[data-action='toggle-product']"
        );

      if (
        toggleButton
      ) {
        event.preventDefault();

        const id =
          toggleButton.dataset.id;

        if (id) {
          await toggleProduct(
            id
          );
        }

        return;
      }

      /* ---------------------------------------------------
         FECHAR MODAL DE PRODUTO
      --------------------------------------------------- */

      const closeProductButton =
        event.target.closest(
          "[data-action='close-product-modal']"
        );

      if (
        closeProductButton
      ) {
        event.preventDefault();

        closeModal();

        return;
      }

      /* ---------------------------------------------------
         FECHAR MODAL DE PEDIDO
      --------------------------------------------------- */

      const closeOrderButton =
        event.target.closest(
          "[data-action='close-order-modal']"
        );

      if (
        closeOrderButton
      ) {
        event.preventDefault();

        closeOrderModal();

        return;
      }

      /* ---------------------------------------------------
         SALVAR CONFIGURAÇÕES
      --------------------------------------------------- */

      const saveEncButton =
        event.target.closest(
          "[data-action='save-enc']"
        );

      if (
        saveEncButton
      ) {
        event.preventDefault();

        saveEncButton.disabled =
          true;

        const originalText =
          saveEncButton.textContent;

        saveEncButton.textContent =
          "Salvando...";

        try {
          await saveEncSettings();
        } finally {
          saveEncButton.disabled =
            false;

          saveEncButton.textContent =
            originalText ||
            "Salvar alterações";
        }

        return;
      }

      /* ---------------------------------------------------
         FECHAR MODAL CLICANDO FORA
      --------------------------------------------------- */

      if (
        event.target.classList.contains(
          "modal-overlay"
        )
      ) {
        event.target.classList.remove(
          "open"
        );

        event.target.classList.remove(
          "active"
        );
      }

      /* ---------------------------------------------------
         IMPRIMIR PEDIDO
      --------------------------------------------------- */

      const printButton =
        event.target.closest(
          "[data-action='print-order']"
        );

      if (
        printButton
      ) {
        event.preventDefault();

        const type =
          printButton.dataset.type;

        const id =
          printButton.dataset.id;

        if (
          type ===
          "ready"
        ) {
          printReadyOrder(
            id
          );
        }

        if (
          type ===
          "custom"
        ) {
          printCustomOrder(
            id
          );
        }

        return;
      }

      /* ---------------------------------------------------
         ATUALIZAR STATUS
      --------------------------------------------------- */

      const statusButton =
        event.target.closest(
          "[data-action='update-status']"
        );

      if (
        statusButton
      ) {
        event.preventDefault();

        const id =
          statusButton.dataset.id;

        const type =
          statusButton.dataset.type;

        const status =
          statusButton.dataset.status;

        if (
          id &&
          status
        ) {
          await updateOrderStatus(
            id,
            type,
            status
          );
        }

        return;
      }

    }
  );
}

/* =========================================================
   FORMULÁRIO DE PRODUTO
========================================================= */

function bindProductForm() {

  document.addEventListener(
    "submit",
    async (event) => {

      if (
        event.target?.id !==
        "pform"
      ) {
        return;
      }

      await saveProduct(
        event
      );

    }
  );

}

/* =========================================================
   UPLOAD DE IMAGEM
========================================================= */

function bindImageUpload() {

  document.addEventListener(
    "change",
    async (event) => {

      if (
        event.target?.id !==
        "f-image"
      ) {
        return;
      }

      await handleImageChange(
        event
      );

    }
  );

}

/* =========================================================
   LOGIN
========================================================= */

function bindLogin() {

  const form =
    $("#login-form");

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        $("#login-email")
          ?.value
          ?.trim() ||
        "";

      const password =
        $("#login-password")
          ?.value ||
        "";

      if (
        !email ||
        !password
      ) {
        toast(
          "Preencha e-mail e senha.",
          "error"
        );

        return;
      }

      const button =
        form.querySelector(
          "button[type='submit']"
        );

      const oldText =
        button?.textContent ||
        "Entrar";

      if (button) {
        button.disabled =
          true;

        button.textContent =
          "Entrando...";
      }

      try {

        await login(
          email,
          password
        );

      } finally {

        if (button) {
          button.disabled =
            false;

          button.textContent =
            oldText;
        }

      }

    }
  );

}

/* =========================================================
   LOGOUT
========================================================= */

function bindLogout() {

  document.addEventListener(
    "click",
    async (event) => {

      const button =
        event.target.closest(
          "[data-action='logout']"
        );

      if (!button) {
        return;
      }

      event.preventDefault();

      await logout();

    }
  );

}

/* =========================================================
   BOTÃO ATUALIZAR
========================================================= */

function bindRefresh() {

  document.addEventListener(
    "click",
    async (event) => {

      const button =
        event.target.closest(
          "[data-action='refresh']"
        );

      if (!button) {
        return;
      }

      event.preventDefault();

      button.disabled =
        true;

      try {

        await loadAll();

        render();

        toast(
          "Dados atualizados."
        );

      } catch (error) {

        console.error(
          "Erro ao atualizar:",
          error
        );

        toast(
          "Não foi possível atualizar os dados.",
          "error"
        );

      } finally {

        button.disabled =
          false;

      }

    }
  );

}

/* =========================================================
   FECHAR MODAIS COM ESC
========================================================= */

function bindEscape() {

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !==
        "Escape"
      ) {
        return;
      }

      closeModal();

      closeOrderModal();

    }
  );

}

/* =========================================================
   INICIALIZAÇÃO FINAL
========================================================= */

async function boot() {

  console.log(
    "Martins Admin iniciando..."
  );

  try {

    bindNavigation();

    bindProductForm();

    bindImageUpload();

    bindLogin();

    bindLogout();

    bindRefresh();

    bindEscape();

    await checkSession();

  } catch (error) {

    console.error(
      "Erro ao iniciar painel:",
      error
    );

    toast(
      "Erro ao iniciar o painel administrativo.",
      "error"
    );

  }

}

/* =========================================================
   INICIAR QUANDO O DOCUMENTO ESTIVER PRONTO
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    boot
  );

} else {

  boot();

}

/* =========================================================
   FIM DO ADMIN.JS
========================================================= */

})();
