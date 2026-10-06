/* =========================================================
   MARTINS CONFEITARIA
   PAINEL ADMINISTRATIVO
   ADMIN.JS — VERSÃO COMPLETA
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     CONFIGURAÇÃO
     ========================================================= */

  const SUPABASE_URL =
    window.MARTINS_CONFIG?.SUPABASE_URL ||
    "https://grdyxoflbqilmgpzlrzm.supabase.co";

  const SUPABASE_ANON_KEY =
    window.MARTINS_CONFIG?.SUPABASE_ANON_KEY || "";

  const WHATSAPP = "5585981563070";

  const sb = window.supabase?.createClient
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  /* =========================================================
     ESTADO
     ========================================================= */

  const S = {
    user: null,
    view: "dashboard",

    site: {
      categories: [],
      hours: {},
      address: "",
      phone: "",
      instagram: "",
      mapsUrl: "",
      reviewUrl: ""
    },

    enc: null,

    products: [],
    orders: [],
    customOrders: [],

    editingProduct: null,
    image: undefined,

    loading: false
  };

  /* =========================================================
     DEFAULTS — ENCOMENDAS
     ========================================================= */

  const DEFAULT_ENC = {
    cakes: [
      {
        id: "naked",
        name: "Naked Cake",
        options: [
          { label: "06/08 Pessoas", price: 45 },
          { label: "10/12 Pessoas", price: 70 },
          { label: "15/20 Pessoas", price: 98 },
          { label: "20/25 Pessoas", price: 115 },
          { label: "25/30 Pessoas", price: 145 },
          { label: "30/40 Pessoas", price: 188 },
          { label: "40/50 Pessoas", price: 240 },
          { label: "50/60 Pessoas", price: 280 }
        ]
      },
      {
        id: "chantininho",
        name: "Chantininho",
        options: [
          { label: "06/08 Pessoas", price: 60 },
          { label: "10/12 Pessoas", price: 80 },
          { label: "15/20 Pessoas", price: 120 },
          { label: "20/25 Pessoas", price: 140 },
          { label: "25/30 Pessoas", price: 170 },
          { label: "30/40 Pessoas", price: 220 },
          { label: "40/50 Pessoas", price: 260 },
          { label: "50/60 Pessoas", price: 300 }
        ]
      }
    ],

    topes: [
      { name: "Topo simples", price: 20 },
      { name: "Topo 3D", price: 30 },
      { name: "Flores naturais", price: 70 }
    ],

    masses: [
      "Amanteigado",
      "Ninho",
      "Chocolate",
      "Baunilha",
      "Coco",
      "Limão"
    ],

    fillings: [
      "Ninho",
      "Brigadeiro",
      "Leite condensado",
      "Oreo",
      "Beijinho",
      "Doce de leite",
      "Limão"
    ],

    extras: [
      { name: "Abacaxi", price: 10 },
      { name: "Morango", price: 16 },
      { name: "Crocante de Castanha", price: 10 },
      { name: "Kit Kat", price: 12 },
      { name: "Geleia de Morango", price: 16 },
      { name: "Ouro Branco", price: 10 },
      { name: "Nutella", price: 16 },
      { name: "Kinder Bueno", price: 16 }
    ],

    personalizations: [
      { name: "Topo simples", price: 20 },
      { name: "Topo 3D", price: 30 },
      { name: "Flores naturais", price: 70 }
    ],

    brigadeiros: {
      classic: {
        title: "Clássicos",
        prices: {
          "50 unidades": 62.5,
          "100 unidades": 125
        },
        flavors: [
          "Brigadeiro Tradicional",
          "Brigadeiro Branco Ninho",
          "Casadinho",
          "Limão",
          "Beijinho",
          "Doce de Leite"
        ],
        maxFlavors: {
          "50 unidades": 2,
          "100 unidades": 4
        }
      },

      premium: {
        title: "Premium",
        prices: {
          "50 unidades": 72.5,
          "100 unidades": 145
        },
        flavors: [
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
        maxFlavors: {
          "50 unidades": 2,
          "100 unidades": 4
        }
      }
    },

    otherItems: [
      { name: "Petit Brownie", price: 0 },
      { name: "Mini Brownie Recheado", price: 0 },
      { name: "Bem Casado", price: 0 },
      { name: "Cupcakes", price: 35 }
    ],

    kits: [
      {
        id: "k1",
        name: "Kit Festa 01",
        price: 150,
        cake: "Chantininho 10/15 Pessoas",
        sweets: "20 docinhos",
        items: [
          "04 Cupcakes",
          "20 Petit Brownie",
          "20 Docinhos"
        ]
      },
      {
        id: "k2",
        name: "Kit Festa 02",
        price: 200,
        cake: "Chantininho 15/20 Pessoas",
        sweets: "30 docinhos",
        items: [
          "05 Cupcakes",
          "30 Petit Brownie",
          "30 Docinhos"
        ]
      },
      {
        id: "k3",
        name: "Kit Festa 03",
        price: 250,
        cake: "Chantininho 20/25 Pessoas",
        sweets: "50 docinhos",
        items: [
          "08 Cupcakes",
          "50 Petit Brownie",
          "50 Docinhos"
        ]
      },
      {
        id: "k4",
        name: "Kit Festa 04",
        price: 430,
        cake: "Chantininho 30/40 Pessoas",
        sweets: "60 docinhos",
        items: [
          "10 Cupcakes",
          "60 Petit Brownie",
          "60 Docinhos"
        ]
      },
      {
        id: "k5",
        name: "Kit Festa 05",
        price: 500,
        cake: "Chantininho 40/50 Pessoas",
        sweets: "70 docinhos",
        items: [
          "12 Cupcakes",
          "70 Petit Brownie",
          "70 Docinhos"
        ]
      }
    ]
  };

  /* =========================================================
     HELPERS
     ========================================================= */

  const $ = (sel, root = document) => root.querySelector(sel);

  const $$ = (sel, root = document) =>
    [...root.querySelectorAll(sel)];

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(value) {
    const n = Number(value);

    if (!Number.isFinite(n)) {
      return "R$ 0,00";
    }

    return n.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function number(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function firstValue(...values) {
    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    return "";
  }

  function formatDate(value) {
    if (!value) return "—";

    const text = String(value);

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const [y, m, d] = text.split("-");
      return `${d}/${m}/${y}`;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return text;
    }

    return date.toLocaleDateString("pt-BR");
  }

  function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString("pt-BR");
  }

  function safeJSON(value) {
    if (!value) return {};

    if (typeof value === "object") {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  function textValue(value) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return "—";
    }

    if (Array.isArray(value)) {
      return value
        .map(textValue)
        .filter(Boolean)
        .join(", ") || "—";
    }

    if (typeof value === "object") {
      if (value.name) return String(value.name);
      if (value.label) return String(value.label);
      if (value.title) return String(value.title);

      return Object.entries(value)
        .map(([key, val]) => `${key}: ${textValue(val)}`)
        .join(" • ");
    }

    return String(value);
  }

  function listValue(value) {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "object") {
      return [value];
    }

    if (typeof value === "string") {
      const trimmed = value.trim();

      if (!trimmed) return [];

      try {
        const parsed = JSON.parse(trimmed);

        if (Array.isArray(parsed)) {
          return parsed;
        }

        if (parsed && typeof parsed === "object") {
          return [parsed];
        }
      } catch {}

      return trimmed
        .split(/\n|,\s*/)
        .map(v => v.trim())
        .filter(Boolean);
    }

    return [value];
  }

  function showToast(message, type = "ok") {
    const toast = $("#toast");

    if (!toast) return;

    toast.textContent = message;
    toast.className = type;

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.className = "";
      toast.textContent = "";
    }, 3000);
  }

  function setLoading(value) {
    S.loading = value;

    document.body.classList.toggle("loading", value);
  }

  function statusLabel(status) {
    const map = {
      novo: "Novo",
      recebido: "Recebido",
      confirmado: "Confirmado",
      preparando: "Preparando",
      pronto: "Pronto",
      concluido: "Concluído",
      entregue: "Entregue",
      cancelado: "Cancelado"
    };

    return map[status] || status || "Novo";
  }

  function statusClass(status) {
    return String(status || "novo")
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  function normalizeArea(value) {
    const v = String(value || "")
      .toLowerCase()
      .trim();

    if (
      v === "encomenda" ||
      v === "encomendas" ||
      v === "bolo" ||
      v === "bolos" ||
      v === "custom"
    ) {
      return "encomendas";
    }

    return "pronta";
  }

  function orderPayload(row) {
    if (!row) return {};

    const data = row.data;

    if (data && typeof data === "object") {
      return data;
    }

    if (typeof data === "string") {
      return safeJSON(data);
    }

    return row;
  }

  /* =========================================================
     NORMALIZAÇÃO — PRONTA ENTREGA
     ========================================================= */

  function normalizeReadyOrder(row) {
    const raw = orderPayload(row);

    const customer =
      raw.customer ||
      raw.cliente ||
      {};

    const items =
      raw.itens ||
      raw.items ||
      raw.products ||
      [];

    return {
      id: row.id,

      status:
        row.status ||
        raw.status ||
        "novo",

      createdAt:
        row.created_at ||
        raw.criado_em ||
        raw.created_at ||
        "",

      customerName:
        firstValue(
          raw.cliente,
          raw.customer,
          raw.customerName,
          customer?.name,
          customer?.nome
        ),

      whatsapp:
        firstValue(
          raw.whatsapp,
          raw.phone,
          raw.telefone,
          raw.customerPhone,
          customer?.phone,
          customer?.telefone
        ),

      receiving:
        firstValue(
          raw.recebimento,
          raw.receiving,
          raw.tipo_entrega,
          raw.delivery
        ),

      address:
        firstValue(
          raw.endereco,
          raw.address
        ),

      payment:
        firstValue(
          raw.pagamento,
          raw.payment
        ),

      notes:
        firstValue(
          raw.observacoes,
          raw.notes,
          raw.notas
        ),

      items: Array.isArray(items)
        ? items.map(item => ({
            id: item.id || "",
            name:
              firstValue(
                item.name,
                item.nome,
                item.product,
                item.produto
              ) || "Produto",

            quantity:
              number(
                firstValue(
                  item.quantity,
                  item.quantidade,
                  item.qty
                ),
                1
              ),

            unitPrice:
              number(
                firstValue(
                  item.unit_price,
                  item.unitPrice,
                  item.preco,
                  item.price
                ),
                0
              ),

            total:
              number(
                firstValue(
                  item.total,
                  item.subtotal
                ),
                number(item.quantity, 1) *
                  number(
                    firstValue(
                      item.unit_price,
                      item.unitPrice,
                      item.price
                    ),
                    0
                  )
              )
          }))
        : [],

      total:
        number(
          firstValue(
            raw.total,
            raw.total_pedido,
            raw.valor_total
          ),
          0
        )
    };
  }

  /* =========================================================
     NORMALIZAÇÃO — ENCOMENDAS
     ========================================================= */

  function normalizeCustomOrder(row) {
    const raw = orderPayload(row);

    const customer =
      raw.customer ||
      raw.cliente ||
      {};

    const cake =
      raw.cake ||
      raw.bolo ||
      {};

    const kit =
      raw.kit ||
      raw.kits ||
      null;

    const extras =
      firstValue(
        raw.extras,
        raw.adicionais
      );

    const personalization =
      firstValue(
        raw.personalization,
        raw.personalizacao
      );

    const brigadeiros =
      firstValue(
        raw.brigadeiros,
        raw.brigadeiro
      );

    const otherItems =
      firstValue(
        raw.otherItems,
        raw.outros,
        raw.outrosItens
      );

    return {
      id: row.id,

      status:
        row.status ||
        raw.status ||
        "novo",

      createdAt:
        row.created_at ||
        raw.criado_em ||
        raw.created_at ||
        "",

      customerName:
        firstValue(
          raw.customerName,
          raw.customer,
          raw.cliente,
          customer?.name,
          customer?.nome
        ),

      whatsapp:
        firstValue(
          raw.customerPhone,
          raw.whatsapp,
          raw.phone,
          raw.telefone,
          customer?.phone,
          customer?.telefone
        ),

      desiredDate:
        firstValue(
          raw.customerDate,
          raw.date,
          raw.data_desejada,
          raw.data
        ),

      kit,

      cake,

      mass:
        firstValue(
          raw.mass,
          raw.massa
        ),

      filling:
        firstValue(
          raw.filling,
          raw.recheio
        ),

      extras,

      personalization,

      brigadeiros,

      otherItems,

      notes:
        firstValue(
          raw.notes,
          raw.observacoes
        ),

      estimatedTotal:
        number(
          firstValue(
            raw.estimatedTotal,
            raw.total_estimado,
            raw.total
          ),
          0
        )
    };
  }

  /* =========================================================
     SUPABASE
     ========================================================= */

  async function getSetting(key, fallback = null) {
    if (!sb) return fallback;

    const { data, error } = await sb
      .from("settings")
      .select("key,value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("Erro settings:", error);
      return fallback;
    }

    if (!data) return fallback;

    return data.value ?? fallback;
  }

  async function saveSetting(key, value) {
    if (!sb) {
      throw new Error("Supabase não foi inicializado.");
    }

    const { error } = await sb
      .from("settings")
      .upsert(
        {
          key,
          value
        },
        {
          onConflict: "key"
        }
      );

    if (error) {
      throw error;
    }
  }

  async function loadSite() {
    const fallback =
      window.MARTINS_DEFAULTS?.site ||
      {};

    const data = await getSetting(
      "site",
      fallback
    );

    S.site = {
      ...S.site,
      ...(data || {})
    };

    if (!Array.isArray(S.site.categories)) {
      S.site.categories = [];
    }

    if (!S.site.categories.length) {
      S.site.categories = [
        "Bolos",
        "Doces",
        "Brownies",
        "Cupcakes",
        "Outros"
      ];
    }
  }

  async function loadEnc() {
    const data = await getSetting(
      "encomendas",
      DEFAULT_ENC
    );

    S.enc = {
      ...clone(DEFAULT_ENC),
      ...(data || {})
    };

    if (!Array.isArray(S.enc.cakes)) {
      S.enc.cakes = clone(DEFAULT_ENC.cakes);
    }

    if (!Array.isArray(S.enc.masses)) {
      S.enc.masses = clone(DEFAULT_ENC.masses);
    }

    if (!Array.isArray(S.enc.fillings)) {
      S.enc.fillings = clone(DEFAULT_ENC.fillings);
    }

    if (!Array.isArray(S.enc.extras)) {
      S.enc.extras = clone(DEFAULT_ENC.extras);
    }

    if (!Array.isArray(S.enc.personalizations)) {
      S.enc.personalizations =
        clone(DEFAULT_ENC.personalizations);
    }

    if (!Array.isArray(S.enc.topes)) {
      S.enc.topes =
        clone(DEFAULT_ENC.topes);
    }

    if (!Array.isArray(S.enc.otherItems)) {
      S.enc.otherItems =
        clone(DEFAULT_ENC.otherItems);
    }

    if (!Array.isArray(S.enc.kits)) {
      S.enc.kits =
        clone(DEFAULT_ENC.kits);
    }

    if (!S.enc.brigadeiros) {
      S.enc.brigadeiros =
        clone(DEFAULT_ENC.brigadeiros);
    }
  }

  async function loadProducts() {
    if (!sb) return;

    const { data, error } = await sb
      .from("products")
      .select("*")
      .order("sort_order", {
        ascending: true,
        nullsFirst: false
      })
      .order("created_at", {
        ascending: false
      });

    if (error) {
      console.error(error);
      showToast(
        "Erro ao carregar produtos.",
        "error"
      );
      return;
    }

    S.products = data || [];
  }

  async function loadOrders() {
    if (!sb) return;

    const { data, error } = await sb
      .from("orders")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {
      console.error(error);
      S.orders = [];
      return;
    }

    S.orders = data || [];
  }

  async function loadCustomOrders() {
    if (!sb) return;

    const { data, error } = await sb
      .from("custom_cakes")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {
      console.error(error);
      S.customOrders = [];
      return;
    }

    S.customOrders = data || [];
  }

  async function refreshAll() {
    setLoading(true);

    try {
      await Promise.all([
        loadSite(),
        loadEnc(),
        loadProducts(),
        loadOrders(),
        loadCustomOrders()
      ]);

      renderView();
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     AUTH
     ========================================================= */

  async function login(email, password) {
    if (!sb) {
      throw new Error(
        "Supabase não foi inicializado."
      );
    }

    const { data, error } =
      await sb.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    S.user = data.user;

    $("#login")?.classList.add("hidden");
    $("#app")?.classList.remove("hidden");
  }

  async function logout() {
    if (sb) {
      await sb.auth.signOut();
    }

    S.user = null;

    $("#app")?.classList.add("hidden");
    $("#login")?.classList.remove("hidden");
  }

  async function checkSession() {
    if (!sb) {
      $("#login")?.classList.remove("hidden");
      return;
    }

    const {
      data: { session }
    } = await sb.auth.getSession();

    if (session?.user) {
      S.user = session.user;

      $("#login")?.classList.add("hidden");
      $("#app")?.classList.remove("hidden");

      await refreshAll();
      return;
    }

    $("#login")?.classList.remove("hidden");
    $("#app")?.classList.add("hidden");
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */

  function renderDashboard() {
    const readyProducts =
      S.products.filter(
        p => normalizeArea(p.area) === "pronta"
      );

    const encProducts =
      S.products.filter(
        p => normalizeArea(p.area) === "encomendas"
      );

    const newReady =
      S.orders.filter(
        o => String(o.status || "novo") === "novo"
      ).length;

    const newEnc =
      S.customOrders.filter(
        o => String(o.status || "novo") === "novo"
      ).length;

    return `
      <div class="cards">
        <article class="card stat">
          <span class="stat-icon">🛒</span>
          <div>
            <strong>${readyProducts.length}</strong>
            <small>Produtos — Pronta Entrega</small>
          </div>
        </article>

        <article class="card stat">
          <span class="stat-icon">🎂</span>
          <div>
            <strong>${encProducts.length}</strong>
            <small>Produtos — Encomendas</small>
          </div>
        </article>

        <article class="card stat">
          <span class="stat-icon">📦</span>
          <div>
            <strong>${newReady}</strong>
            <small>Pedidos novos — Pronta Entrega</small>
          </div>
        </article>

        <article class="card stat">
          <span class="stat-icon">📋</span>
          <div>
            <strong>${newEnc}</strong>
            <small>Encomendas novas</small>
          </div>
        </article>
      </div>

      <div class="grid dashboard-grid">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Pronta Entrega</h2>
              <p class="muted">
                Produtos disponíveis para compra imediata.
              </p>
            </div>
            <button class="btn primary"
              data-view="prod-ready">
              Gerenciar
            </button>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h2>Encomendas</h2>
              <p class="muted">
                Produtos e configurações de bolos personalizados.
              </p>
            </div>
            <button class="btn primary"
              data-view="prod-orders">
              Gerenciar
            </button>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h2>Pedidos</h2>
              <p class="muted">
                Veja pedidos da pronta entrega.
              </p>
            </div>
            <button class="btn primary"
              data-view="ord-ready">
              Abrir pedidos
            </button>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h2>Encomendas recebidas</h2>
              <p class="muted">
                Veja os pedidos personalizados enviados pelo formulário.
              </p>
            </div>
            <button class="btn primary"
              data-view="ord-orders">
              Abrir encomendas
            </button>
          </div>
        </section>
      </div>
    `;
  }

  /* =========================================================
     PRODUTOS
     ========================================================= */

  function renderProducts(area) {
    const list = S.products.filter(
      p => normalizeArea(p.area) === area
    );

    const title =
      area === "pronta"
        ? "Produtos — Pronta Entrega"
        : "Produtos — Encomendas";

    const description =
      area === "pronta"
        ? "Produtos que aparecem na vitrine de pronta entrega."
        : "Produtos utilizados na área de encomendas.";

    return `
      <div class="section-head">
        <div>
          <h2>${title}</h2>
          <p class="muted">${description}</p>
        </div>

        <button class="btn primary"
          data-act="new-product"
          data-area="${area}">
          + Novo produto
        </button>
      </div>

      ${
        list.length
          ? `
            <div class="products">
              ${list.map(productCard).join("")}
            </div>
          `
          : `
            <div class="card empty">
              <strong>Nenhum produto cadastrado.</strong>
              <p class="muted">
                Clique em “Novo produto” para adicionar.
              </p>
            </div>
          `
      }
    `;
  }

  function productCard(p) {
    const image =
      p.image_url ||
      p.image ||
      "";

    const area =
      normalizeArea(p.area);

    const active =
      p.available !== false;

    const featured =
      !!p.featured;

    return `
      <article class="product-card">

        <div class="product-image">
          ${
            image
              ? `<img src="${escapeHTML(image)}"
                    alt="${escapeHTML(p.name || "")}">`
              : `<span>🍰</span>`
          }
        </div>

        <div class="product-body">
          <div class="product-top">
            <span class="badge">
              ${
                area === "pronta"
                  ? "Pronta Entrega"
                  : "Encomenda"
              }
            </span>

            ${
              active
                ? `<span class="status ok">Ativo</span>`
                : `<span class="status error">Inativo</span>`
            }
          </div>

          <h3>${escapeHTML(p.name || "Sem nome")}</h3>

          ${
            p.category
              ? `<small class="muted">
                   ${escapeHTML(p.category)}
                 </small>`
              : ""
          }

          ${
            p.description
              ? `<p>${escapeHTML(p.description)}</p>`
              : ""
          }

          <strong class="price">
            ${money(p.price)}
          </strong>

          ${
            p.discount
              ? `<small class="muted">
                  Desconto: ${number(p.discount)}%
                </small>`
              : ""
          }

          <div class="product-actions">
            <button class="btn soft"
              data-act="edit-product"
              data-id="${escapeHTML(p.id)}">
              Editar
            </button>

            <button class="btn danger"
              data-act="delete-product"
              data-id="${escapeHTML(p.id)}">
              Excluir
            </button>
          </div>
        </div>
      </article>
    `;
  }

  /* =========================================================
     CATEGORIAS
     ========================================================= */

  function categoryOptions(selected = "") {
    const categories =
      Array.isArray(S.site.categories)
        ? S.site.categories
        : [];

    return categories
      .map(cat => `
        <option
          value="${escapeHTML(cat)}"
          ${String(cat) === String(selected) ? "selected" : ""}>
          ${escapeHTML(cat)}
        </option>
      `)
      .join("");
  }

  async function addCategory() {
    const name = window.prompt(
      "Digite o nome da nova classificação:"
    );

    if (!name) return;

    const category = name.trim();

    if (!category) return;

    if (!Array.isArray(S.site.categories)) {
      S.site.categories = [];
    }

    const exists =
      S.site.categories.some(
        c =>
          String(c).toLowerCase() ===
          category.toLowerCase()
      );

    if (exists) {
      showToast(
        "Essa classificação já existe.",
        "error"
      );
      return;
    }

    S.site.categories.push(category);

    try {
      await saveSetting(
        "site",
        S.site
      );

      showToast(
        "Classificação adicionada."
      );

      populateCategorySelect();
    } catch (error) {
      console.error(error);

      showToast(
        "Não foi possível salvar a classificação.",
        "error"
      );
    }
  }

  function populateCategorySelect(selected) {
    const select = $("#f-cat");

    if (!select) return;

    select.innerHTML = categoryOptions(
      selected ?? select.value
    );
  }

  /* =========================================================
     MODAL PRODUTO
     ========================================================= */

  function openProductModal(id = null, area = "pronta") {
    const modal = $("#modal");
    const form = $("#pform");

    if (!modal || !form) return;

    const product =
      id
        ? S.products.find(
            p => String(p.id) === String(id)
          )
        : null;

    S.editingProduct =
      product || null;

    S.image =
      product?.image_url ??
      product?.image ??
      undefined;

    $("#mtitle").textContent =
      product
        ? "Editar produto"
        : "Novo produto";

    $("#f-area").value =
      normalizeArea(
        product?.area || area
      );

    $("#f-name").value =
      product?.name || "";

    $("#f-price").value =
      product?.price ?? "";

    $("#f-disc").value =
      product?.discount ?? "";

    $("#f-sort").value =
      product?.sort_order ?? 0;

    $("#f-gram").value =
      product?.grammage ??
      product?.gramatura ??
      "";

    $("#f-serve").value =
      product?.serves ??
      product?.serve ??
      "";

    $("#f-desc").value =
      product?.description || "";

    $("#f-avail").checked =
      product
        ? product.available !== false
        : true;

    $("#f-feat").checked =
      !!product?.featured;

    $("#f-appt").checked =
      !!product?.appointment_required;

    populateCategorySelect(
      product?.category || ""
    );

    renderPreview(
      S.image
    );

    modal.classList.remove("hidden");
  }

  function closeModal() {
    $("#modal")?.classList.add("hidden");

    S.editingProduct = null;
    S.image = undefined;

    $("#pform")?.reset();

    $("#f-avail").checked = true;

    renderPreview("");
  }

  function renderPreview(src) {
    const img = $("#prev");
    const rm = $("#rmimg");

    if (!img || !rm) return;

    if (src) {
      img.src = src;
      img.classList.remove("hidden");
      rm.classList.remove("hidden");
    } else {
      img.removeAttribute("src");
      img.classList.add("hidden");
      rm.classList.add("hidden");
    }
  }

  async function uploadProductImage(file) {
    if (!sb) {
      throw new Error(
        "Supabase não foi inicializado."
      );
    }

    const ext =
      file.name.split(".").pop() || "jpg";

    const filename =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

    const path =
      `products/${filename}`;

    const { error } =
      await sb.storage
        .from("products")
        .upload(
          path,
          file,
          {
            upsert: false,
            contentType: file.type
          }
        );

    if (error) throw error;

    const {
      data
    } = sb.storage
      .from("products")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async function saveProduct(event) {
    event.preventDefault();

    if (!sb) {
      showToast(
        "Supabase não foi inicializado.",
        "error"
      );
      return;
    }

    const name =
      $("#f-name").value.trim();

    if (!name) {
      showToast(
        "Digite o nome do produto.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      let imageUrl = S.image;

      const file =
        $("#f-photo").files?.[0];

      if (file) {
        imageUrl =
          await uploadProductImage(file);
      }

      const payload = {
        name,

        area:
          normalizeArea(
            $("#f-area").value
          ),

        category:
          $("#f-cat").value || "",

        price:
          number(
            $("#f-price").value,
            0
          ),

        discount:
          number(
            $("#f-disc").value,
            0
          ),

        sort_order:
          number(
            $("#f-sort").value,
            0
          ),

        grammage:
          number(
            $("#f-gram").value,
            0
          ),

        serves:
          number(
            $("#f-serve").value,
            0
          ),

        description:
          $("#f-desc").value.trim(),

        available:
          $("#f-avail").checked,

        featured:
          $("#f-feat").checked,

        appointment_required:
          $("#f-appt").checked,

        image_url:
          imageUrl || null
      };

      if (S.editingProduct) {
        const { error } =
          await sb
            .from("products")
            .update(payload)
            .eq(
              "id",
              S.editingProduct.id
            );

        if (error) throw error;

        showToast(
          "Produto atualizado."
        );
      } else {
        const { error } =
          await sb
            .from("products")
            .insert(payload);

        if (error) throw error;

        showToast(
          "Produto criado."
        );
      }

      closeModal();

      await loadProducts();

      renderView();
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "Erro ao salvar produto.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id) {
    const product =
      S.products.find(
        p => String(p.id) === String(id)
      );

    if (!product) return;

    const ok =
      window.confirm(
        `Excluir o produto "${product.name}"?`
      );

    if (!ok) return;

    try {
      const { error } =
        await sb
          .from("products")
          .delete()
          .eq("id", id);

      if (error) throw error;

      showToast(
        "Produto excluído."
      );

      await loadProducts();

      renderView();
    } catch (error) {
      console.error(error);

      showToast(
        "Erro ao excluir produto.",
        "error"
      );
    }
  }

  /* =========================================================
     PEDIDOS — PRONTA ENTREGA
     ========================================================= */

  function renderReadyOrders() {
    return `
      <div class="section-head">
        <div>
          <h2>Pedidos — Pronta Entrega</h2>
          <p class="muted">
            Pedidos realizados pelo carrinho da pronta entrega.
          </p>
        </div>

        <button class="btn soft"
          data-act="reload-orders">
          ↻ Atualizar
        </button>
      </div>

      ${
        S.orders.length
          ? `
            <div class="orders">
              ${S.orders
                .map(renderReadyOrderCard)
                .join("")}
            </div>
          `
          : `
            <div class="card empty">
              <strong>Nenhum pedido encontrado.</strong>
              <p class="muted">
                Os pedidos da pronta entrega aparecerão aqui.
              </p>
            </div>
          `
      }
    `;
  }

  function renderReadyOrderCard(row) {
    const order =
      normalizeReadyOrder(row);

    return `
      <article class="order-card">

        <div class="order-head">
          <div>
            <span class="order-id">
              Pedido #${escapeHTML(
                String(order.id).slice(0, 8)
              )}
            </span>

            <h3>
              ${escapeHTML(
                order.customerName ||
                "Cliente não informado"
              )}
            </h3>

            <small class="muted">
              ${formatDateTime(
                order.createdAt
              )}
            </small>
          </div>

          <span class="status ${statusClass(order.status)}">
            ${escapeHTML(
              statusLabel(order.status)
            )}
          </span>
        </div>

        <div class="order-summary">

          <div>
            <strong>WhatsApp</strong>
            <span>
              ${escapeHTML(
                order.whatsapp || "—"
              )}
            </span>
          </div>

          <div>
            <strong>Recebimento</strong>
            <span>
              ${escapeHTML(
                textValue(order.receiving)
              )}
            </span>
          </div>

          <div>
            <strong>Pagamento</strong>
            <span>
              ${escapeHTML(
                textValue(order.payment)
              )}
            </span>
          </div>

          <div>
            <strong>Total</strong>
            <span>
              ${money(order.total)}
            </span>
          </div>

        </div>

        <div class="order-actions">

          <button class="btn primary"
            data-act="view-ready-order"
            data-id="${escapeHTML(order.id)}">
            Ver pedido
          </button>

          <button class="btn soft"
            data-act="print-ready-order"
            data-id="${escapeHTML(order.id)}">
            🖨️ Imprimir
          </button>

          <select
            class="status-select"
            data-act="status-ready"
            data-id="${escapeHTML(order.id)}">

            ${[
              "novo",
              "recebido",
              "confirmado",
              "preparando",
              "pronto",
              "entregue",
              "concluido",
              "cancelado"
            ]
              .map(status => `
                <option
                  value="${status}"
                  ${
                    String(order.status) ===
                    status
                      ? "selected"
                      : ""
                  }>
                  ${statusLabel(status)}
                </option>
              `)
              .join("")}

          </select>

        </div>

      </article>
    `;
  }

  function readyOrderDetails(row) {
    const order =
      normalizeReadyOrder(row);

    const itemsHtml =
      order.items.length
        ? `
          <div class="detail-block">
            <h3>Itens do pedido</h3>

            <div class="detail-items">
              ${order.items
                .map(item => `
                  <div class="detail-item">
                    <div>
                      <strong>
                        ${escapeHTML(item.name)}
                      </strong>
                      <small>
                        ${item.quantity} ×
                        ${money(item.unitPrice)}
                      </small>
                    </div>

                    <strong>
                      ${money(item.total)}
                    </strong>
                  </div>
                `)
                .join("")}
            </div>
          </div>
        `
        : `
          <div class="detail-block">
            <h3>Itens do pedido</h3>
            <p class="muted">
              Nenhum item foi encontrado no registro.
            </p>
          </div>
        `;

    return `
      <div class="order-detail">

        <div class="detail-header">
          <div>
            <small>Pedido</small>
            <h2>
              #${escapeHTML(
                String(order.id).slice(0, 8)
              )}
            </h2>
          </div>

          <span class="status ${statusClass(order.status)}">
            ${escapeHTML(
              statusLabel(order.status)
            )}
          </span>
        </div>

        <div class="detail-grid">

          <div>
            <strong>Cliente</strong>
            <span>
              ${escapeHTML(
                order.customerName || "—"
              )}
            </span>
          </div>

          <div>
            <strong>WhatsApp</strong>
            <span>
              ${escapeHTML(
                order.whatsapp || "—"
              )}
            </span>
          </div>

          <div>
            <strong>Recebimento</strong>
            <span>
              ${escapeHTML(
                textValue(order.receiving)
              )}
            </span>
          </div>

          <div>
            <strong>Pagamento</strong>
            <span>
              ${escapeHTML(
                textValue(order.payment)
              )}
            </span>
          </div>

          <div class="full">
            <strong>Endereço</strong>
            <span>
              ${escapeHTML(
                textValue(order.address)
              )}
            </span>
          </div>

        </div>

        ${itemsHtml}

        <div class="detail-total">
          <span>Total do pedido</span>
          <strong>
            ${money(order.total)}
          </strong>
        </div>

        ${
          order.notes
            ? `
              <div class="detail-block">
                <h3>Observações</h3>
                <p>
                  ${escapeHTML(
                    textValue(order.notes)
                  )}
                </p>
              </div>
            `
            : ""
        }

      </div>
    `;
  }

  /* =========================================================
     PEDIDOS — ENCOMENDAS
     ========================================================= */

  function renderCustomOrders() {
    return `
      <div class="section-head">
        <div>
          <h2>Pedidos — Encomendas</h2>
          <p class="muted">
            Solicitações recebidas pelo formulário de encomendas.
          </p>
        </div>

        <button class="btn soft"
          data-act="reload-orders">
          ↻ Atualizar
        </button>
      </div>

      ${
        S.customOrders.length
          ? `
            <div class="orders">
              ${S.customOrders
                .map(renderCustomOrderCard)
                .join("")}
            </div>
          `
          : `
            <div class="card empty">
              <strong>Nenhuma encomenda encontrada.</strong>
              <p class="muted">
                As encomendas enviadas pelo site aparecerão aqui.
              </p>
            </div>
          `
      }
    `;
  }

  function renderCustomOrderCard(row) {
    const order =
      normalizeCustomOrder(row);

    return `
      <article class="order-card">

        <div class="order-head">

          <div>
            <span class="order-id">
              Encomenda #${escapeHTML(
                String(order.id).slice(0, 8)
              )}
            </span>

            <h3>
              ${escapeHTML(
                order.customerName ||
                "Cliente não informado"
              )}
            </h3>

            <small class="muted">
              ${formatDateTime(
                order.createdAt
              )}
            </small>
          </div>

          <span class="status ${statusClass(order.status)}">
            ${escapeHTML(
              statusLabel(order.status)
            )}
          </span>

        </div>

        <div class="order-summary">

          <div>
            <strong>Data desejada</strong>
            <span>
              ${formatDate(
                order.desiredDate
              )}
            </span>
          </div>

          <div>
            <strong>Bolo</strong>
            <span>
              ${escapeHTML(
                textValue(order.cake)
              )}
            </span>
          </div>

          <div>
            <strong>WhatsApp</strong>
            <span>
              ${escapeHTML(
                order.whatsapp || "—"
              )}
            </span>
          </div>

          <div>
            <strong>Total estimado</strong>
            <span>
              ${money(
                order.estimatedTotal
              )}
            </span>
          </div>

        </div>

        <div class="order-actions">

          <button class="btn primary"
            data-act="view-custom-order"
            data-id="${escapeHTML(order.id)}">
            Ver encomenda
          </button>

          <button class="btn soft"
            data-act="print-custom-order"
            data-id="${escapeHTML(order.id)}">
            🖨️ Imprimir
          </button>

          <select
            class="status-select"
            data-act="status-custom"
            data-id="${escapeHTML(order.id)}">

            ${[
              "novo",
              "recebido",
              "confirmado",
              "preparando",
              "pronto",
              "entregue",
              "concluido",
              "cancelado"
            ]
              .map(status => `
                <option
                  value="${status}"
                  ${
                    String(order.status) ===
                    status
                      ? "selected"
                      : ""
                  }>
                  ${statusLabel(status)}
                </option>
              `)
              .join("")}

          </select>

        </div>

      </article>
    `;
  }

  function customOrderDetails(row) {
    const order =
      normalizeCustomOrder(row);

    const cake =
      order.cake;

    const kit =
      order.kit;

    return `
      <div class="order-detail">

        <div class="detail-header">
          <div>
            <small>Encomenda</small>
            <h2>
              #${escapeHTML(
                String(order.id).slice(0, 8)
              )}
            </h2>
          </div>

          <span class="status ${statusClass(order.status)}">
            ${escapeHTML(
              statusLabel(order.status)
            )}
          </span>
        </div>

        <div class="detail-grid">

          <div>
            <strong>Cliente</strong>
            <span>
              ${escapeHTML(
                order.customerName || "—"
              )}
            </span>
          </div>

          <div>
            <strong>WhatsApp</strong>
            <span>
              ${escapeHTML(
                order.whatsapp || "—"
              )}
            </span>
          </div>

          <div>
            <strong>Data desejada</strong>
            <span>
              ${formatDate(
                order.desiredDate
              )}
            </span>
          </div>

          <div>
            <strong>Bolo</strong>
            <span>
              ${escapeHTML(
                textValue(cake)
              )}
            </span>
          </div>

          <div>
            <strong>Massa</strong>
            <span>
              ${escapeHTML(
                textValue(order.mass)
              )}
            </span>
          </div>

          <div>
            <strong>Recheio</strong>
            <span>
              ${escapeHTML(
                textValue(order.filling)
              )}
            </span>
          </div>

          ${
            kit
              ? `
                <div class="full">
                  <strong>Kit</strong>
                  <span>
                    ${escapeHTML(
                      textValue(kit)
                    )}
                  </span>
                </div>
              `
              : ""
          }

          <div class="full">
            <strong>Adicionais</strong>
            <span>
              ${escapeHTML(
                textValue(order.extras)
              )}
            </span>
          </div>

          <div class="full">
            <strong>Personalização</strong>
            <span>
              ${escapeHTML(
                textValue(
                  order.personalization
                )
              )}
            </span>
          </div>

          <div class="full">
            <strong>Brigadeiros</strong>
            <span>
              ${escapeHTML(
                textValue(
                  order.brigadeiros
                )
              )}
            </span>
          </div>

          <div class="full">
            <strong>Outros itens</strong>
            <span>
              ${escapeHTML(
                textValue(
                  order.otherItems
                )
              )}
            </span>
          </div>

        </div>

        ${
          order.notes
            ? `
              <div class="detail-block">
                <h3>Observações</h3>
                <p>
                  ${escapeHTML(
                    textValue(order.notes)
                  )}
                </p>
              </div>
            `
            : ""
        }

        <div class="detail-total">
          <span>Total estimado</span>
          <strong>
            ${money(
              order.estimatedTotal
            )}
          </strong>
        </div>

      </div>
    `;
  }

  /* =========================================================
     ATUALIZAÇÃO DE STATUS
     ========================================================= */

  async function updateReadyStatus(
    id,
    status
  ) {
    if (!sb) return;

    try {
      const { error } =
        await sb
          .from("orders")
          .update({ status })
          .eq("id", id);

      if (error) throw error;

      const item =
        S.orders.find(
          o => String(o.id) === String(id)
        );

      if (item) {
        item.status = status;
      }

      showToast(
        "Status atualizado."
      );
    } catch (error) {
      console.error(error);

      showToast(
        "Erro ao atualizar status.",
        "error"
      );
    }
  }

  async function updateCustomStatus(
    id,
    status
  ) {
    if (!sb) return;

    try {
      const { error } =
        await sb
          .from("custom_cakes")
          .update({ status })
          .eq("id", id);

      if (error) throw error;

      const item =
        S.customOrders.find(
          o => String(o.id) === String(id)
        );

      if (item) {
        item.status = status;
      }

      showToast(
        "Status atualizado."
      );
    } catch (error) {
      console.error(error);

      showToast(
        "Erro ao atualizar status.",
        "error"
      );
    }
  }

  /* =========================================================
     IMPRESSÃO
     ========================================================= */

  function printHTML(title, body) {
    const win =
      window.open(
        "",
        "_blank",
        "width=850,height=900"
      );

    if (!win) {
      showToast(
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
        <title>${escapeHTML(title)}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 30px;
            color: #263238;
          }

          h1, h2, h3 {
            margin-top: 0;
          }

          .header {
            border-bottom: 2px solid #67b0cb;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }

          .header h1 {
            margin-bottom: 5px;
          }

          .muted {
            color: #71808a;
          }

          .grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 15px;
            margin-bottom: 25px;
          }

          .field {
            border: 1px solid #dce8ec;
            border-radius: 8px;
            padding: 12px;
          }

          .field strong {
            display: block;
            margin-bottom: 5px;
            font-size: 12px;
            color: #71808a;
            text-transform: uppercase;
          }

          .items {
            border: 1px solid #dce8ec;
            border-radius: 8px;
            overflow: hidden;
            margin: 20px 0;
          }

          .item {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            padding: 12px;
            border-bottom: 1px solid #dce8ec;
          }

          .item:last-child {
            border-bottom: 0;
          }

          .total {
            display: flex;
            justify-content: space-between;
            font-size: 20px;
            font-weight: bold;
            padding: 15px 0;
            border-top: 2px solid #67b0cb;
          }

          .notes {
            margin-top: 20px;
            border: 1px solid #dce8ec;
            padding: 15px;
            border-radius: 8px;
          }

          @media print {
            body {
              padding: 15mm;
            }
          }
        </style>
      </head>

      <body>
        ${body}

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

  function printReadyOrder(row) {
    const order =
      normalizeReadyOrder(row);

    const items =
      order.items
        .map(item => `
          <div class="item">
            <div>
              <strong>
                ${escapeHTML(item.name)}
              </strong>

              <div class="muted">
                ${item.quantity} ×
                ${money(item.unitPrice)}
              </div>
            </div>

            <strong>
              ${money(item.total)}
            </strong>
          </div>
        `)
        .join("");

    printHTML(
      "Pedido — Pronta Entrega",
      `
        <div class="header">
          <h1>Martins Confeitaria</h1>
          <div>Pedido de Pronta Entrega</div>
          <div class="muted">
            Nº ${escapeHTML(
              String(order.id)
            )}
          </div>
        </div>

        <div class="grid">

          <div class="field">
            <strong>Cliente</strong>
            ${escapeHTML(
              order.customerName || "—"
            )}
          </div>

          <div class="field">
            <strong>WhatsApp</strong>
            ${escapeHTML(
              order.whatsapp || "—"
            )}
          </div>

          <div class="field">
            <strong>Recebimento</strong>
            ${escapeHTML(
              textValue(order.receiving)
            )}
          </div>

          <div class="field">
            <strong>Pagamento</strong>
            ${escapeHTML(
              textValue(order.payment)
            )}
          </div>

          <div class="field">
            <strong>Endereço</strong>
            ${escapeHTML(
              textValue(order.address)
            )}
          </div>

          <div class="field">
            <strong>Status</strong>
            ${escapeHTML(
              statusLabel(order.status)
            )}
          </div>

        </div>

        <h2>Itens</h2>

        <div class="items">
          ${
            items ||
            `<div class="item">
              Nenhum item registrado.
            </div>`
          }
        </div>

        <div class="total">
          <span>Total</span>
          <span>
            ${money(order.total)}
          </span>
        </div>

        ${
          order.notes
            ? `
              <div class="notes">
                <strong>Observações</strong>
                <p>
                  ${escapeHTML(
                    textValue(order.notes)
                  )}
                </p>
              </div>
            `
            : ""
        }
      `
    );
  }

  function printCustomOrder(row) {
    const order =
      normalizeCustomOrder(row);

    printHTML(
      "Encomenda — Martins Confeitaria",
      `
        <div class="header">
          <h1>Martins Confeitaria</h1>
          <div>Pedido de Encomenda</div>
          <div class="muted">
            Nº ${escapeHTML(
              String(order.id)
            )}
          </div>
        </div>

        <div class="grid">

          <div class="field">
            <strong>Cliente</strong>
            ${escapeHTML(
              order.customerName || "—"
            )}
          </div>

          <div class="field">
            <strong>WhatsApp</strong>
            ${escapeHTML(
              order.whatsapp || "—"
            )}
          </div>

          <div class="field">
            <strong>Data desejada</strong>
            ${formatDate(
              order.desiredDate
            )}
          </div>

          <div class="field">
            <strong>Status</strong>
            ${escapeHTML(
              statusLabel(order.status)
            )}
          </div>

          <div class="field">
            <strong>Bolo</strong>
            ${escapeHTML(
              textValue(order.cake)
            )}
          </div>

          <div class="field">
            <strong>Massa</strong>
            ${escapeHTML(
              textValue(order.mass)
            )}
          </div>

          <div class="field">
            <strong>Recheio</strong>
            ${escapeHTML(
              textValue(order.filling)
            )}
          </div>

          ${
            order.kit
              ? `
                <div class="field">
                  <strong>Kit</strong>
                  ${escapeHTML(
                    textValue(order.kit)
                  )}
                </div>
              `
              : ""
          }

          <div class="field">
            <strong>Adicionais</strong>
            ${escapeHTML(
              textValue(order.extras)
            )}
          </div>

          <div class="field">
            <strong>Personalização</strong>
            ${escapeHTML(
              textValue(
                order.personalization
              )
            )}
          </div>

          <div class="field">
            <strong>Brigadeiros</strong>
            ${escapeHTML(
              textValue(
                order.brigadeiros
              )
            )}
          </div>

          <div class="field">
            <strong>Outros itens</strong>
            ${escapeHTML(
              textValue(
                order.otherItems
              )
            )}
          </div>

        </div>

        ${
          order.notes
            ? `
              <div class="notes">
                <strong>Observações</strong>
                <p>
                  ${escapeHTML(
                    textValue(order.notes)
                  )}
                </p>
              </div>
            `
            : ""
        }

        <div class="total">
          <span>Total estimado</span>
          <span>
            ${money(
              order.estimatedTotal
            )}
          </span>
        </div>
      `
    );
  }

  /* =========================================================
     CONFIGURAÇÕES DE ENCOMENDAS
     ========================================================= */

  function renderEncSettings() {
    if (!S.enc) {
      S.enc =
        clone(DEFAULT_ENC);
    }

    return `
      <div class="section-head">
        <div>
          <h2>Configurações de Encomendas</h2>
          <p class="muted">
            Edite os produtos e opções que aparecem no formulário de encomendas.
          </p>
        </div>

        <button class="btn primary"
          data-act="save-enc">
          Salvar alterações
        </button>
      </div>

      <div class="enc-settings">

        ${renderCakeSettings()}

        ${renderSimpleListSettings(
          "Massa",
          "masses",
          S.enc.masses
        )}

        ${renderSimpleListSettings(
          "Recheio",
          "fillings",
          S.enc.fillings
        )}

        ${renderPriceListSettings(
          "Adicionais",
          "extras",
          S.enc.extras
        )}

        ${renderPriceListSettings(
          "Personalizações",
          "personalizations",
          S.enc.personalizations
        )}

        ${renderPriceListSettings(
          "Topos",
          "topes",
          S.enc.topes
        )}

        ${renderBrigadeiroSettings()}

        ${renderPriceListSettings(
          "Outros Itens",
          "otherItems",
          S.enc.otherItems
        )}

        ${renderKitSettings()}

      </div>
    `;
  }

  function renderCakeSettings() {
    return `
      <section class="card">

        <div class="card-head">
          <div>
            <h2>Bolos</h2>
            <p class="muted">
              Tipos de bolo e tamanhos disponíveis.
            </p>
          </div>

          <button class="btn soft"
            data-act="add-cake">
            + Tipo de bolo
          </button>
        </div>

        <div class="settings-list">

          ${S.enc.cakes
            .map(
              (cake, cakeIndex) => `
                <div class="settings-box">

                  <div class="row">
                    <input
                      class="input"
                      data-enc-cake-name="${cakeIndex}"
                      value="${escapeHTML(
                        cake.name || ""
                      )}"
                      placeholder="Nome do bolo">

                    <button
                      class="btn danger"
                      data-act="remove-cake"
                      data-index="${cakeIndex}">
                      Excluir
                    </button>
                  </div>

                  <div class="sublist">

                    ${
                      (cake.options || [])
                        .map(
                          (option, optionIndex) => `
                            <div class="row">

                              <input
                                class="input"
                                data-enc-cake-option-label="${cakeIndex}:${optionIndex}"
                                value="${escapeHTML(
                                  option.label || ""
                                )}"
                                placeholder="Tamanho">

                              <input
                                class="input small"
                                type="number"
                                step="0.01"
                                min="0"
                                data-enc-cake-option-price="${cakeIndex}:${optionIndex}"
                                value="${number(
                                  option.price,
                                  0
                                )}">

                              <button
                                class="btn danger"
                                data-act="remove-cake-option"
                                data-cake="${cakeIndex}"
                                data-option="${optionIndex}">
                                ×
                              </button>

                            </div>
                          `
                        )
                        .join("")
                    }

                    <button
                      class="btn soft"
                      data-act="add-cake-option"
                      data-cake="${cakeIndex}">
                      + Tamanho
                    </button>

                  </div>

                </div>
              `
            )
            .join("")}

        </div>
      </section>
    `;
  }

  function renderSimpleListSettings(
    title,
    key,
    list
  ) {
    return `
      <section class="card">

        <div class="card-head">
          <div>
            <h2>${escapeHTML(title)}</h2>
          </div>

          <button
            class="btn soft"
            data-act="add-simple"
            data-key="${key}">
            + Adicionar
          </button>
        </div>

        <div class="settings-list">

          ${
            (list || [])
              .map(
                (item, index) => `
                  <div class="row">
                    <input
                      class="input"
                      data-simple="${key}:${index}"
                      value="${escapeHTML(
                        typeof item === "string"
                          ? item
                          : item?.name || ""
                      )}">

                    <button
                      class="btn danger"
                      data-act="remove-simple"
                      data-key="${key}"
                      data-index="${index}">
                      ×
                    </button>
                  </div>
                `
              )
              .join("")
          }

        </div>
      </section>
    `;
  }

  function renderPriceListSettings(
    title,
    key,
    list
  ) {
    return `
      <section class="card">

        <div class="card-head">
          <div>
            <h2>${escapeHTML(title)}</h2>
          </div>

          <button
            class="btn soft"
            data-act="add-price-item"
            data-key="${key}">
            + Adicionar
          </button>
        </div>

        <div class="settings-list">

          ${
            (list || [])
              .map(
                (item, index) => `
                  <div class="row">

                    <input
                      class="input"
                      data-price-name="${key}:${index}"
                      value="${escapeHTML(
                        item?.name || ""
                      )}"
                      placeholder="Nome">

                    <input
                      class="input small"
                      type="number"
                      step="0.01"
                      min="0"
                      data-price-value="${key}:${index}"
                      value="${number(
                        item?.price,
                        0
                      )}"
                      placeholder="Preço">

                    <button
                      class="btn danger"
                      data-act="remove-price-item"
                      data-key="${key}"
                      data-index="${index}">
                      ×
                    </button>

                  </div>
                `
              )
              .join("")
          }

        </div>
      </section>
    `;
  }

  function renderBrigadeiroSettings() {
    const groups =
      S.enc.brigadeiros || {};

    return `
      <section class="card">

        <div class="card-head">
          <div>
            <h2>Brigadeiros</h2>
            <p class="muted">
              Categorias, preços e sabores.
            </p>
          </div>
        </div>

        ${Object.entries(groups)
          .map(
            ([key, group]) => `
              <div class="settings-box">

                <div class="row">
                  <input
                    class="input"
                    data-brig-title="${key}"
                    value="${escapeHTML(
                      group.title || ""
                    )}">
                </div>

                <h3>Preços</h3>

                ${
                  Object.entries(
                    group.prices || {}
                  )
                    .map(
                      ([size, price]) => `
                        <div class="row">

                          <input
                            class="input"
                            data-brig-price-size="${key}:${escapeHTML(size)}"
                            value="${escapeHTML(size)}">

                          <input
                            class="input small"
                            type="number"
                            step="0.01"
                            min="0"
                            data-brig-price-value="${key}:${escapeHTML(size)}"
                            value="${number(
                              price,
                              0
                            )}">

                        </div>
                      `
                    )
                    .join("")
                }

                <h3>Sabores</h3>

                <div class="sublist">

                  ${
                    (group.flavors || [])
                      .map(
                        (flavor, index) => `
                          <div class="row">

                            <input
                              class="input"
                              data-brig-flavor="${key}:${index}"
                              value="${escapeHTML(
                                flavor
                              )}">

                            <button
                              class="btn danger"
                              data-act="remove-brig-flavor"
                              data-key="${key}"
                              data-index="${index}">
                              ×
                            </button>

                          </div>
                        `
                      )
                      .join("")
                  }

                  <button
                    class="btn soft"
                    data-act="add-brig-flavor"
                    data-key="${key}">
                    + Sabor
                  </button>

                </div>

              </div>
            `
          )
          .join("")}

      </section>
    `;
  }

  function renderKitSettings() {
    return `
      <section class="card">

        <div class="card-head">
          <div>
            <h2>Kits</h2>
            <p class="muted">
              Kits completos disponíveis para encomenda.
            </p>
          </div>

          <button
            class="btn soft"
            data-act="add-kit">
            + Novo kit
          </button>
        </div>

        <div class="settings-list">

          ${S.enc.kits
            .map(
              (kit, index) => `
                <div class="settings-box">

                  <div class="row">
                    <input
                      class="input"
                      data-kit-name="${index}"
                      value="${escapeHTML(
                        kit.name || ""
                      )}"
                      placeholder="Nome do kit">

                    <input
                      class="input small"
                      type="number"
                      step="0.01"
                      min="0"
                      data-kit-price="${index}"
                      value="${number(
                        kit.price,
                        0
                      )}">

                    <button
                      class="btn danger"
                      data-act="remove-kit"
                      data-index="${index}">
                      Excluir
                    </button>
                  </div>

                  <label>
                    Bolo do kit
                    <input
                      class="input"
                      data-kit-cake="${index}"
                      value="${escapeHTML(
                        kit.cake || ""
                      )}">
                  </label>

                  <label>
                    Quantidade de docinhos
                    <input
                      class="input"
                      data-kit-sweets="${index}"
                      value="${escapeHTML(
                        kit.sweets || ""
                      )}">
                  </label>

                  <div class="sublist">

                    <strong>Itens incluídos</strong>

                    ${
                      (kit.items || [])
                        .map(
                          (item, itemIndex) => `
                            <div class="row">

                              <input
                                class="input"
                                data-kit-item="${index}:${itemIndex}"
                                value="${escapeHTML(
                                  item
                                )}">

                              <button
                                class="btn danger"
                                data-act="remove-kit-item"
                                data-kit="${index}"
                                data-item="${itemIndex}">
                                ×
                              </button>

                            </div>
                          `
                        )
                        .join("")
                    }

                    <button
                      class="btn soft"
                      data-act="add-kit-item"
                      data-kit="${index}">
                      + Item
                    </button>

                  </div>

                </div>
              `
            )
            .join("")}

        </div>
      </section>
    `;
  }

  /* =========================================================
     MANIPULAÇÃO DAS CONFIGURAÇÕES
     ========================================================= */

  function syncEncInputs() {
    if (!S.enc) return;

    $$("[data-enc-cake-name]")
      .forEach(input => {
        const index =
          Number(
            input.dataset.encCakeName
          );

        if (S.enc.cakes[index]) {
          S.enc.cakes[index].name =
            input.value.trim();
        }
      });

    $$("[data-enc-cake-option-label]")
      .forEach(input => {
        const [
          cakeIndex,
          optionIndex
        ] =
          input.dataset.encCakeOptionLabel
            .split(":")
            .map(Number);

        if (
          S.enc.cakes[cakeIndex] &&
          S.enc.cakes[cakeIndex].options?.[
            optionIndex
          ]
        ) {
          S.enc.cakes[cakeIndex]
            .options[optionIndex]
            .label =
            input.value.trim();
        }
      });

    $$("[data-enc-cake-option-price]")
      .forEach(input => {
        const [
          cakeIndex,
          optionIndex
        ] =
          input.dataset.encCakeOptionPrice
            .split(":")
            .map(Number);

        if (
          S.enc.cakes[cakeIndex] &&
          S.enc.cakes[cakeIndex].options?.[
            optionIndex
          ]
        ) {
          S.enc.cakes[cakeIndex]
            .options[optionIndex]
            .price =
            number(input.value, 0);
        }
      });

    $$("[data-simple]")
      .forEach(input => {
        const [
          key,
          index
        ] =
          input.dataset.simple.split(":");

        if (!Array.isArray(S.enc[key])) {
          return;
        }

        if (
          typeof S.enc[key][index] ===
          "string"
        ) {
          S.enc[key][index] =
            input.value.trim();
        } else {
          S.enc[key][index].name =
            input.value.trim();
        }
      });

    $$("[data-price-name]")
      .forEach(input => {
        const [
          key,
          index
        ] =
          input.dataset.priceName.split(":");

        if (
          S.enc[key]?.[index]
        ) {
          S.enc[key][index].name =
            input.value.trim();
        }
      });

    $$("[data-price-value]")
      .forEach(input => {
        const [
          key,
          index
        ] =
          input.dataset.priceValue.split(":");

        if (
          S.enc[key]?.[index]
        ) {
          S.enc[key][index].price =
            number(input.value, 0);
        }
      });

    $$("[data-brig-title]")
      .forEach(input => {
        const key =
          input.dataset.brigTitle;

        if (
          S.enc.brigadeiros[key]
        ) {
          S.enc.brigadeiros[key]
            .title =
            input.value.trim();
        }
      });

    $$("[data-brig-price-size]")
      .forEach(input => {
        const keySize =
          input.dataset.brigPriceSize;

        const separator =
          keySize.indexOf(":");

        if (separator < 0) return;

        const key =
          keySize.slice(0, separator);

        const oldSize =
          keySize.slice(separator + 1);

        const newSize =
          input.value.trim();

        if (
          S.enc.brigadeiros[key] &&
          newSize
        ) {
          const price =
            S.enc.brigadeiros[key]
              .prices?.[oldSize] ?? 0;

          delete S.enc.brigadeiros[key]
            .prices[oldSize];

          S.enc.brigadeiros[key]
            .prices[newSize] =
            number(price, 0);
        }
      });

    $$("[data-brig-price-value]")
      .forEach(input => {
        const keySize =
          input.dataset.brigPriceValue;

        const separator =
          keySize.indexOf(":");

        if (separator < 0) return;

        const key =
          keySize.slice(0, separator);

        const size =
          keySize.slice(separator + 1);

        if (
          S.enc.brigadeiros[key]
        ) {
          S.enc.brigadeiros[key]
            .prices[size] =
            number(input.value, 0);
        }
      });

    $$("[data-brig-flavor]")
      .forEach(input => {
        const [
          key,
          index
        ] =
          input.dataset.brigFlavor.split(":");

        if (
          S.enc.brigadeiros[key]
            ?.flavors
        ) {
          S.enc.brigadeiros[key]
            .flavors[index] =
            input.value.trim();
        }
      });

    $$("[data-kit-name]")
      .forEach(input => {
        const index =
          Number(
            input.dataset.kitName
          );

        if (S.enc.kits[index]) {
          S.enc.kits[index].name =
            input.value.trim();
        }
      });

    $$("[data-kit-price]")
      .forEach(input => {
        const index =
          Number(
            input.dataset.kitPrice
          );

        if (S.enc.kits[index]) {
          S.enc.kits[index].price =
            number(input.value, 0);
        }
      });

    $$("[data-kit-cake]")
      .forEach(input => {
        const index =
          Number(
            input.dataset.kitCake
          );

        if (S.enc.kits[index]) {
          S.enc.kits[index].cake =
            input.value.trim();
        }
      });

    $$("[data-kit-sweets]")
      .forEach(input => {
        const index =
          Number(
            input.dataset.kitSweets
          );

        if (S.enc.kits[index]) {
          S.enc.kits[index].sweets =
            input.value.trim();
        }
      });

    $$("[data-kit-item]")
      .forEach(input => {
        const [
          kitIndex,
          itemIndex
        ] =
          input.dataset.kitItem
            .split(":")
            .map(Number);

        if (
          S.enc.kits[kitIndex]
            ?.items?.[itemIndex]
          ) {
          S.enc.kits[kitIndex]
            .items[itemIndex] =
            input.value.trim();
        }
      });
  }

  async function saveEnc() {
    syncEncInputs();

    try {
      await saveSetting(
        "encomendas",
        S.enc
      );

      showToast(
        "Configurações de encomendas salvas."
      );
    } catch (error) {
      console.error(error);

      showToast(
        "Erro ao salvar configurações.",
        "error"
      );
    }
  }

  /* =========================================================
     AÇÕES DAS CONFIGURAÇÕES
     ========================================================= */

  function addCake() {
    syncEncInputs();

    S.enc.cakes.push({
      id:
        `cake-${Date.now()}`,
      name: "Novo bolo",
      options: [
        {
          label: "Novo tamanho",
          price: 0
        }
      ]
    });

    renderView();
  }

  function removeCake(index) {
    if (
      !window.confirm(
        "Excluir este tipo de bolo?"
      )
    ) {
      return;
    }

    syncEncInputs();

    S.enc.cakes.splice(
      Number(index),
      1
    );

    renderView();
  }

  function addCakeOption(index) {
    syncEncInputs();

    const cake =
      S.enc.cakes[
        Number(index)
      ];

    if (!cake) return;

    if (!Array.isArray(cake.options)) {
      cake.options = [];
    }

    cake.options.push({
      label: "Novo tamanho",
      price: 0
    });

    renderView();
  }

  function removeCakeOption(
    cakeIndex,
    optionIndex
  ) {
    syncEncInputs();

    const cake =
      S.enc.cakes[
        Number(cakeIndex)
      ];

    if (!cake?.options) return;

    cake.options.splice(
      Number(optionIndex),
      1
    );

    renderView();
  }

  function addSimple(key) {
    syncEncInputs();

    if (!Array.isArray(S.enc[key])) {
      S.enc[key] = [];
    }

    S.enc[key].push(
      key === "masses" ||
      key === "fillings"
        ? "Novo item"
        : {
            name: "Novo item",
            price: 0
          }
    );

    renderView();
  }

  function removeSimple(
    key,
    index
  ) {
    syncEncInputs();

    if (!Array.isArray(S.enc[key])) {
      return;
    }

    S.enc[key].splice(
      Number(index),
      1
    );

    renderView();
  }

  function addPriceItem(key) {
    syncEncInputs();

    if (!Array.isArray(S.enc[key])) {
      S.enc[key] = [];
    }

    S.enc[key].push({
      name: "Novo item",
      price: 0
    });

    renderView();
  }

  function removePriceItem(
    key,
    index
  ) {
    syncEncInputs();

    if (!Array.isArray(S.enc[key])) {
      return;
    }

    S.enc[key].splice(
      Number(index),
      1
    );

    renderView();
  }

  function addBrigFlavor(key) {
    syncEncInputs();

    if (
      !S.enc.brigadeiros[key]
    ) {
      return;
    }

    if (
      !Array.isArray(
        S.enc.brigadeiros[key].flavors
      )
    ) {
      S.enc.brigadeiros[key].flavors =
        [];
    }

    S.enc.brigadeiros[key]
      .flavors
      .push("Novo sabor");

    renderView();
  }

  function removeBrigFlavor(
    key,
    index
  ) {
    syncEncInputs();

    if (
      !S.enc.brigadeiros[key]
        ?.flavors
    ) {
      return;
    }

    S.enc.brigadeiros[key]
      .flavors
      .splice(
        Number(index),
        1
      );

    renderView();
  }

  function addKit() {
    syncEncInputs();

    const number =
      S.enc.kits.length + 1;

    S.enc.kits.push({
      id:
        `k${number}`,
      name:
        `Kit Festa ${String(number).padStart(2, "0")}`,
      price: 0,
      cake: "",
      sweets: "",
      items: []
    });

    renderView();
  }

  function removeKit(index) {
    if (
      !window.confirm(
        "Excluir este kit?"
      )
    ) {
      return;
    }

    syncEncInputs();

    S.enc.kits.splice(
      Number(index),
      1
    );

    renderView();
  }

  function addKitItem(index) {
    syncEncInputs();

    const kit =
      S.enc.kits[
        Number(index)
      ];

    if (!kit) return;

    if (!Array.isArray(kit.items)) {
      kit.items = [];
    }

    kit.items.push(
      "Novo item"
    );

    renderView();
  }

  function removeKitItem(
    kitIndex,
    itemIndex
  ) {
    syncEncInputs();

    const kit =
      S.enc.kits[
        Number(kitIndex)
      ];

    if (!kit?.items) return;

    kit.items.splice(
      Number(itemIndex),
      1
    );

    renderView();
  }

  /* =========================================================
     CONFIGURAÇÕES DO SITE
     ========================================================= */

  function renderSiteSettings() {
    const hours =
      S.site.hours || {};

    return `
      <div class="section-head">
        <div>
          <h2>Configurações do Site</h2>
          <p class="muted">
            Informações exibidas no site da Martins Confeitaria.
          </p>
        </div>

        <button
          class="btn primary"
          data-act="save-site">
          Salvar alterações
        </button>
      </div>

      <div class="grid">

        <section class="card">

          <h2>Informações</h2>

          <label>
            Endereço
            <input
              class="input"
              id="site-address"
              value="${escapeHTML(
                S.site.address || ""
              )}">
          </label>

          <label>
            WhatsApp
            <input
              class="input"
              id="site-phone"
              value="${escapeHTML(
                S.site.phone ||
                WHATSAPP
              )}">
          </label>

          <label>
            Instagram
            <input
              class="input"
              id="site-instagram"
              value="${escapeHTML(
                S.site.instagram || ""
              )}">
          </label>

          <label>
            Link do Google Maps
            <input
              class="input"
              id="site-maps"
              value="${escapeHTML(
                S.site.mapsUrl || ""
              )}">
          </label>

          <label>
            Link para avaliação no Google
            <input
              class="input"
              id="site-review"
              value="${escapeHTML(
                S.site.reviewUrl || ""
              )}">
          </label>

        </section>

        <section class="card">

          <h2>Horários</h2>

          ${[
            ["segunda", "Segunda-feira"],
            ["terca", "Terça-feira"],
            ["quarta", "Quarta-feira"],
            ["quinta", "Quinta-feira"],
            ["sexta", "Sexta-feira"],
            ["sabado", "Sábado"],
            ["domingo", "Domingo"]
          ]
            .map(
              ([key, label]) => `
                <label>
                  ${label}

                  <input
                    class="input"
                    data-hour="${key}"
                    value="${escapeHTML(
                      hours[key] || ""
                    )}"
                    placeholder="Ex.: 11h às 23h">
                </label>
              `
            )
            .join("")}

        </section>

        <section class="card">

          <div class="card-head">
            <div>
              <h2>Classificações</h2>
              <p class="muted">
                Usadas nos produtos da pronta entrega.
              </p>
            </div>

            <button
              class="btn soft"
              data-act="newcat">
              + Nova
            </button>
          </div>

          <div class="settings-list">

            ${
              (S.site.categories || [])
                .map(
                  (category, index) => `
                    <div class="row">

                      <input
                        class="input"
                        data-site-category="${index}"
                        value="${escapeHTML(
                          category
                        )}">

                      <button
                        class="btn danger"
                        data-act="remove-site-category"
                        data-index="${index}">
                        ×
                      </button>

                    </div>
                  `
                )
                .join("")
            }

          </div>

        </section>

      </div>
    `;
  }

  async function saveSite() {
    if (!S.site) return;

    S.site.address =
      $("#site-address")?.value.trim() ||
      "";

    S.site.phone =
      $("#site-phone")?.value.trim() ||
      "";

    S.site.instagram =
      $("#site-instagram")?.value.trim() ||
      "";

    S.site.mapsUrl =
      $("#site-maps")?.value.trim() ||
      "";

    S.site.reviewUrl =
      $("#site-review")?.value.trim() ||
      "";

    if (!S.site.hours) {
      S.site.hours = {};
    }

    $$("[data-hour]")
      .forEach(input => {
        S.site.hours[
          input.dataset.hour
        ] =
          input.value.trim();
      });

    $$("[data-site-category]")
      .forEach(input => {
        const index =
          Number(
            input.dataset.siteCategory
          );

        if (
          S.site.categories[index] !==
          undefined
        ) {
          S.site.categories[index] =
            input.value.trim();
        }
      });

    S.site.categories =
      S.site.categories.filter(Boolean);

    try {
      await saveSetting(
        "site",
        S.site
      );

      showToast(
        "Configurações do site salvas."
      );
    } catch (error) {
      console.error(error);

      showToast(
        "Erro ao salvar configurações do site.",
        "error"
      );
    }
  }

  function removeSiteCategory(index) {
    if (
      !window.confirm(
        "Excluir esta classificação?"
      )
    ) {
      return;
    }

    S.site.categories.splice(
      Number(index),
      1
    );

    renderView();
  }

  /* =========================================================
     NAVEGAÇÃO
     ========================================================= */

  function viewTitle(view) {
    const titles = {
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

    return titles[view] ||
      "Martins Confeitaria";
  }

  function go(view) {
    S.view = view;

    $$(".nav").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.view === view
      );
    });

    $("#title").textContent =
      viewTitle(view);

    renderView();

    $("#side")?.classList.remove("open");
    $("#shade")?.classList.remove("open");
  }

  function renderView() {
    const view =
      $("#view");

    if (!view) return;

    switch (S.view) {
      case "dashboard":
        view.innerHTML =
          renderDashboard();
        break;

      case "prod-ready":
        view.innerHTML =
          renderProducts("pronta");
        break;

      case "prod-orders":
        view.innerHTML =
          renderProducts("encomendas");
        break;

      case "ord-ready":
        view.innerHTML =
          renderReadyOrders();
        break;

      case "ord-orders":
        view.innerHTML =
          renderCustomOrders();
        break;

      case "settings":
        view.innerHTML =
          renderSettings();
        break;

      default:
        view.innerHTML =
          renderDashboard();
    }
  }

  function renderSettings() {
    return `
      <div class="settings-tabs">

        <button
          class="btn primary"
          data-act="settings-enc">
          🎂 Configurações de Encomendas
        </button>

        <button
          class="btn soft"
          data-act="settings-site">
          ⚙️ Configurações do Site
        </button>

      </div>

      <div id="settingsContent">
        ${renderEncSettings()}
      </div>
    `;
  }

  function showSettingsTab(type) {
    const container =
      $("#settingsContent");

    if (!container) return;

    if (type === "site") {
      container.innerHTML =
        renderSiteSettings();
    } else {
      container.innerHTML =
        renderEncSettings();
    }
  }

  /* =========================================================
     DETALHES EM MODAL
     ========================================================= */

  function showDetails(title, html) {
    const modal =
      $("#modal");

    const form =
      $("#pform");

    if (!modal || !form) return;

    form.innerHTML = `
      <div class="dhead">
        <h2>
          ${escapeHTML(title)}
        </h2>

        <button
          type="button"
          class="x"
          data-close>
          ×
        </button>
      </div>

      <div class="dbody">
        ${html}
      </div>

      <div class="dfoot">
        <button
          type="button"
          class="btn soft"
          data-close>
          Fechar
        </button>
      </div>
    `;

    modal.classList.remove("hidden");
  }

  /* =========================================================
     EVENTOS
     ========================================================= */

  document.addEventListener(
    "click",
    async event => {
      const target =
        event.target.closest(
          "[data-view],[data-act],[data-close]"
        );

      if (!target) return;

      if (
        target.hasAttribute(
          "data-close"
        )
      ) {
        closeModal();
        return;
      }

      const view =
        target.dataset.view;

      if (view) {
        go(view);
        return;
      }

      const act =
        target.dataset.act;

      if (!act) return;

      switch (act) {
        case "new-product":
          openProductModal(
            null,
            target.dataset.area
          );
          break;

        case "edit-product":
          openProductModal(
            target.dataset.id
          );
          break;

        case "delete-product":
          await deleteProduct(
            target.dataset.id
          );
          break;

        case "newcat":
          await addCategory();
          break;

        case "reload-orders":
          await refreshAll();
          break;

        case "view-ready-order": {
          const row =
            S.orders.find(
              item =>
                String(item.id) ===
                String(target.dataset.id)
            );

          if (row) {
            showDetails(
              "Detalhes do pedido",
              readyOrderDetails(row)
            );
          }

          break;
        }

        case "print-ready-order": {
          const row =
            S.orders.find(
              item =>
                String(item.id) ===
                String(target.dataset.id)
            );

          if (row) {
            printReadyOrder(row);
          }

          break;
        }

        case "view-custom-order": {
          const row =
            S.customOrders.find(
              item =>
                String(item.id) ===
                String(target.dataset.id)
            );

          if (row) {
            showDetails(
              "Detalhes da encomenda",
              customOrderDetails(row)
            );
          }

          break;
        }

        case "print-custom-order": {
          const row =
            S.customOrders.find(
              item =>
                String(item.id) ===
                String(target.dataset.id)
            );

          if (row) {
            printCustomOrder(row);
          }

          break;
        }

        case "save-enc":
          await saveEnc();
          break;

        case "save-site":
          await saveSite();
          break;

        case "settings-enc":
          showSettingsTab("enc");
          break;

        case "settings-site":
          showSettingsTab("site");
          break;

        case "add-cake":
          addCake();
          break;

        case "remove-cake":
          removeCake(
            target.dataset.index
          );
          break;

        case "add-cake-option":
          addCakeOption(
            target.dataset.cake
          );
          break;

        case "remove-cake-option":
          removeCakeOption(
            target.dataset.cake,
            target.dataset.option
          );
          break;

        case "add-simple":
          addSimple(
            target.dataset.key
          );
          break;

        case "remove-simple":
          removeSimple(
            target.dataset.key,
            target.dataset.index
          );
          break;

        case "add-price-item":
          addPriceItem(
            target.dataset.key
          );
          break;

        case "remove-price-item":
          removePriceItem(
            target.dataset.key,
            target.dataset.index
          );
          break;

        case "add-brig-flavor":
          addBrigFlavor(
            target.dataset.key
          );
          break;

        case "remove-brig-flavor":
          removeBrigFlavor(
            target.dataset.key,
            target.dataset.index
          );
          break;

        case "add-kit":
          addKit();
          break;

        case "remove-kit":
          removeKit(
            target.dataset.index
          );
          break;

        case "add-kit-item":
          addKitItem(
            target.dataset.kit
          );
          break;

        case "remove-kit-item":
          removeKitItem(
            target.dataset.kit,
            target.dataset.item
          );
          break;

        case "remove-site-category":
          removeSiteCategory(
            target.dataset.index
          );
          break;
      }
    }
  );

  document.addEventListener(
    "change",
    async event => {
      const target =
        event.target;

      if (
        target.matches(
          '[data-act="status-ready"]'
        )
      ) {
        await updateReadyStatus(
          target.dataset.id,
          target.value
        );

        renderView();
        return;
      }

      if (
        target.matches(
          '[data-act="status-custom"]'
        )
      ) {
        await updateCustomStatus(
          target.dataset.id,
          target.value
        );

        renderView();
        return;
      }

      if (
        target.id === "f-photo"
      ) {
        const file =
          target.files?.[0];

        if (!file) return;

        const reader =
          new FileReader();

        reader.onload = event => {
          S.image =
            event.target.result;

          renderPreview(
            S.image
          );
        };

        reader.readAsDataURL(file);
      }
    }
  );

  document.addEventListener(
    "click",
    event => {
      if (
        event.target.id === "rmimg"
      ) {
        S.image = null;
        renderPreview("");
      }
    }
  );

  /* =========================================================
     LOGIN
     ========================================================= */

  $("#loginForm")
    ?.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const email =
          $("#email").value.trim();

        const password =
          $("#password").value;

        const msg =
          $("#loginMsg");

        msg.textContent =
          "Entrando...";

        try {
          await login(
            email,
            password
          );

          msg.textContent = "";

          await refreshAll();

        } catch (error) {
          console.error(error);

          msg.textContent =
            error.message ||
            "Não foi possível entrar.";
        }
      }
    );

  /* =========================================================
     BOTÕES GERAIS
     ========================================================= */

  $("#logout")
    ?.addEventListener(
      "click",
      logout
    );

  $("#refresh")
    ?.addEventListener(
      "click",
      refreshAll
    );

  $("#burger")
    ?.addEventListener(
      "click",
      () => {
        $("#side")
          ?.classList.toggle("open");

        $("#shade")
          ?.classList.toggle("open");
      }
    );

  $("#shade")
    ?.addEventListener(
      "click",
      () => {
        $("#side")
          ?.classList.remove("open");

        $("#shade")
          ?.classList.remove("open");
      }
    );

  $("#pform")
    ?.addEventListener(
      "submit",
      saveProduct
    );

  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  async function start() {
    if (!sb) {
      console.error(
        "Supabase JS não está disponível."
      );

      $("#loginMsg").textContent =
        "Erro ao carregar o Supabase.";

      return;
    }

    await checkSession();

    if (S.user) {
      go("dashboard");
    }
  }

  start();

})();
