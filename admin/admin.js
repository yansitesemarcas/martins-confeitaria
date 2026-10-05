(() => {
  "use strict";

  /*
    MARTINS CONFEITARIA
    PAINEL ADMINISTRATIVO
  */

  const CONFIG = window.MARTINS_CONFIG || {};
  const DEFAULTS = window.MARTINS_DEFAULTS || {};

  if (!window.supabase) {
    console.error("Supabase JS não foi carregado.");
    return;
  }

  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
    console.error(
      "SUPABASE_URL ou SUPABASE_ANON_KEY não encontrados em config.js."
    );
    return;
  }

  const client = window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );

  /* =========================
     HELPERS
  ========================= */

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

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

  const clone = (value) => {
    try {
      return structuredClone(value);
    } catch {
      return JSON.parse(JSON.stringify(value));
    }
  };

  const money = (value) => {
    const number = Number(value || 0);

    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const slug = (value) =>
    normalize(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const firstValue = (...values) => {
    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        typeof value !== "object" &&
        String(value).trim() !== ""
      ) {
        return value;
      }
    }

    return "";
  };

  const formatDate = (value) => {
    if (!value) return "-";

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return date.toLocaleString("pt-BR");
    } catch {
      return String(value);
    }
  };

  const toast = (message, type = "") => {
    const element = $("#toast");

    if (!element) return;

    element.textContent = message;
    element.className = "";

    if (type) {
      element.classList.add(type);
    }

    element.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
      element.classList.remove("show");
    }, 3500);
  };

  /* =========================
     STATE
  ========================= */

  let S = clone(DEFAULTS || {});

  if (!S || typeof S !== "object") {
    S = {};
  }

  S.products = Array.isArray(S.products) ? S.products : [];
  S.categories = Array.isArray(S.categories) ? S.categories : [];
  S.hours = S.hours || {};
  S.rules = S.rules || {};
  S.about = S.about || {};
  S.delivery = S.delivery || {};
  S.payments = S.payments || {};
  S.deliveryInfo = S.deliveryInfo || {};

  let currentTab = "products";
  let currentProducts = [];
  let editingProductId = null;
  let selectedImageFile = null;

  /* =========================
     AREAS
  ========================= */

  /*
    EXISTEM SOMENTE DUAS ÁREAS:

    cardapio / encomendas
      -> Encomendas

    pronta-entrega / pronta / delivery
      -> Delivery

    Valores antigos continuam sendo
    reconhecidos para não quebrar
    produtos já cadastrados.
  */

  const AREAS = [
    {
      value: "cardapio",
      label: "Encomendas"
    },
    {
      value: "pronta-entrega",
      label: "Delivery"
    }
  ];

  function normalizeArea(value) {
    const v = normalize(value);

    if (
      v === "pronta" ||
      v === "ready" ||
      v === "delivery" ||
      v === "pronta entrega" ||
      v === "pronta-entrega" ||
      v === "pronta_entrega"
    ) {
      return "pronta-entrega";
    }

    if (
      v === "encomenda" ||
      v === "encomendas" ||
      v === "bolo-personalizado" ||
      v === "bolo personalizado" ||
      v === "cardapio" ||
      v === "cardápio"
    ) {
      return "cardapio";
    }

    return "cardapio";
  }

  function areaLabel(value) {
    const normalized = normalizeArea(value);

    return (
      AREAS.find(
        (area) => area.value === normalized
      )?.label || "Encomendas"
    );
  }

  function populateAreas(selected = "") {
    const select = $("#productArea");

    if (!select) return;

    select.innerHTML = AREAS.map(
      (area) =>
        `
          <option value="${esc(area.value)}">
            ${esc(area.label)}
          </option>
        `
    ).join("");

    select.value = normalizeArea(
      selected || "cardapio"
    );
  }

  /* =========================
     CATEGORIES
  ========================= */

  /*
    SOMENTE ESTAS CLASSIFICAÇÕES:

    - Bolos
    - Brownies
    - Bolos no pote
    - Copos de felicidade
    - Brigadeiros clássicos
    - Brigadeiros premium
  */

  const PRODUCT_CLASSIFICATIONS = [
    "Bolos",
    "Brownies",
    "Bolos no pote",
    "Copos de felicidade",
    "Brigadeiros clássicos",
    "Brigadeiros premium"
  ];

  function isAllowedCategory(category) {
    return PRODUCT_CLASSIFICATIONS.some(
      (item) =>
        normalize(item) ===
        normalize(category)
    );
  }

  function getCategories() {
    return [...PRODUCT_CLASSIFICATIONS];
  }

  function addCategory(category) {
    /*
      Mantido para compatibilidade com o restante
      do painel, mas nenhuma categoria fora das
      seis permitidas será adicionada.
    */

    if (!category) return;

    if (!isAllowedCategory(category)) {
      return;
    }

    if (!S.categories.includes(category)) {
      S.categories.push(category);
    }
  }

  /* =========================
     LOGO
  ========================= */

  function getLogoUrl() {
    return firstValue(
      CONFIG.LOGO_URL,
      CONFIG.logoUrl,
      CONFIG.LOGO,
      CONFIG.logo,

      DEFAULTS.logoUrl,
      DEFAULTS.logo,

      S.logoUrl,
      S.logo_url,
      S.logoURL,
      S.logo,
      S.siteLogo,
      S.site_logo,

      S.brand?.logoUrl,
      S.brand?.logo_url,
      S.brand?.logo,

      S.about?.logoUrl,
      S.about?.logo_url,
      S.about?.logo,

      S.company?.logoUrl,
      S.company?.logo_url,
      S.company?.logo
    );
  }

  function renderLogo() {
    const url = getLogoUrl();

    const loginWrap = $("#loginLogoWrap");
    const sidebarWrap = $("#sidebarLogoWrap");

    const loginImage = $("#loginLogo");
    const sidebarImage = $("#sidebarLogo");

    if (loginWrap) {
      loginWrap.innerHTML = url
        ? `
          <img
            class="login-logo"
            src="${esc(url)}"
            alt="Martins Confeitaria"
          >
        `
        : `
          <div class="login-logo-fallback">
            M
          </div>
        `;
    } else if (loginImage) {
      loginImage.src = url || "";
      loginImage.alt = "Martins Confeitaria";
      loginImage.style.display =
        url ? "" : "none";
    }

    if (sidebarWrap) {
      sidebarWrap.innerHTML = url
        ? `
          <img
            class="sidebar-logo"
            src="${esc(url)}"
            alt="Martins Confeitaria"
          >
        `
        : `
          <div class="sidebar-logo-fallback">
            M
          </div>
        `;
    } else if (sidebarImage) {
      sidebarImage.src = url || "";
      sidebarImage.alt = "Martins Confeitaria";
      sidebarImage.style.display =
        url ? "" : "none";
    }
  }

  /* =========================
     AUTH
  ========================= */

  function setupAuth() {
    const form = $("#loginForm");

    if (!form) return;

    form.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        const email =
          $("#loginEmail")?.value.trim();

        const password =
          $("#loginPassword")?.value;

        const message =
          $("#loginMsg");

        if (!email || !password) {
          if (message) {
            message.textContent =
              "Informe e-mail e senha.";
          }

          return;
        }

        if (message) {
          message.textContent =
            "Entrando...";
        }

        const { error } =
          await client.auth.signInWithPassword({
            email,
            password
          });

        if (error) {
          console.error(error);

          if (message) {
            message.textContent =
              error.message ||
              "Não foi possível entrar.";
          }

          return;
        }

        if (message) {
          message.textContent = "";
        }

        await startApp();
      }
    );
  }

  async function checkSession() {
    const {
      data,
      error
    } = await client.auth.getSession();

    if (error) {
      console.error(error);
      return null;
    }

    return data?.session || null;
  }

  async function logout() {
    await client.auth.signOut();

    $("#app")?.classList.add("hidden");
    $("#loginScreen")?.classList.remove("hidden");
  }

  /* =========================
     DATABASE
  ========================= */

  async function loadData() {
    const settingsResult =
      await client
        .from("settings")
        .select("key,value")
        .eq("key", "site")
        .maybeSingle();

    if (settingsResult.error) {
      throw settingsResult.error;
    }

    if (settingsResult.data?.value) {
      const saved =
        settingsResult.data.value;

      if (
        saved &&
        typeof saved === "object"
      ) {
        S = {
          ...S,
          ...saved
        };
      }
    }

    const productsResult =
      await client
        .from("products")
        .select("*")
        .order("sort", {
          ascending: true
        });

    if (productsResult.error) {
      throw productsResult.error;
    }

    S.products =
      productsResult.data || [];

    S.categories =
      Array.isArray(S.categories)
        ? S.categories
        : [];

    for (const product of S.products) {
      if (
        product.category &&
        isAllowedCategory(product.category)
      ) {
        addCategory(
          product.category
        );
      }
    }

    renderLogo();
  }

  async function saveSite() {
    const payload = clone(S);

    delete payload.products;

    const {
      error
    } = await client
      .from("settings")
      .upsert(
        {
          key: "site",
          value: payload
        },
        {
          onConflict: "key"
        }
      );

    if (error) {
      console.error(error);

      toast(
        "Erro ao salvar configurações: " +
        error.message,
        "error"
      );

      return false;
    }

    return true;
  }

  /* =========================
     APP
  ========================= */

  async function startApp() {
    try {
      $("#loginScreen")
        ?.classList.add("hidden");

      $("#app")
        ?.classList.remove("hidden");

      renderLogo();

      await loadData();

      renderStats();
      renderTab();

    } catch (error) {
      console.error(error);

      toast(
        "Erro ao carregar painel: " +
        (error.message || error),
        "error"
      );
    }
  }

  /* =========================
     NAVIGATION
  ========================= */

  const TITLES = {
    products: [
      "Produtos",
      "Gerencie o catálogo da confeitaria."
    ],

    orders: [
      "Pedidos",
      "Acompanhe os pedidos recebidos."
    ],

    cakes: [
      "Bolos personalizados",
      "Acompanhe as solicitações de bolos."
    ],

    content: [
      "Conteúdos",
      "Edite as informações exibidas no site."
    ],

    hours: [
      "Horários",
      "Configure os horários de atendimento."
    ],

    rules: [
      "Regras",
      "Configure regras e informações do atendimento."
    ],

    media: [
      "Mídia",
      "Gerencie arquivos utilizados no site."
    ]
  };

  function setupNavigation() {
    $$(".nav button").forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          currentTab =
            button.dataset.tab;

          $$(".nav button").forEach(
            (item) => {
              item.classList.toggle(
                "active",
                item === button
              );
            }
          );

          const title =
            TITLES[currentTab] ||
            ["Painel", ""];

          $("#pageTitle").textContent =
            title[0];

          $("#pageSubtitle").textContent =
            title[1];

          $("#sidebar")
            ?.classList.remove("open");

          renderTab();
        }
      );
    });
  }

  function renderTab() {
    if (currentTab === "products") {
      renderProducts();
      return;
    }

    if (currentTab === "orders") {
      renderOrders();
      return;
    }

    if (currentTab === "cakes") {
      renderCakes();
      return;
    }

    if (currentTab === "content") {
      renderContent();
      return;
    }

    if (currentTab === "hours") {
      renderHours();
      return;
    }

    if (currentTab === "rules") {
      renderRules();
      return;
    }

    if (currentTab === "media") {
      renderMedia();
      return;
    }
  }

  /* =========================
     STATS
  ========================= */

  function renderStats() {
    const products =
      S.products || [];

    $("#statProducts").textContent =
      products.length;

    $("#statAvailable").textContent =
      products.filter(
        (product) =>
          product.available !== false
      ).length;

    loadOrderCount();
    loadCakeCount();
  }

  async function loadOrderCount() {
    const {
      count,
      error
    } = await client
      .from("orders")
      .select("*", {
        count: "exact",
        head: true
      });

    if (!error) {
      $("#statOrders").textContent =
        count || 0;
    }
  }

  async function loadCakeCount() {
    const {
      count,
      error
    } = await client
      .from("custom_cakes")
      .select("*", {
        count: "exact",
        head: true
      });

    if (!error) {
      $("#statCakes").textContent =
        count || 0;
    }
  }

  /* =========================
     PRODUCTS
  ========================= */

  function renderProducts() {
    currentProducts =
      S.products || [];

    const groups = {};

    for (const area of AREAS) {
      groups[area.value] = [];
    }

    for (const product of currentProducts) {
      const area =
        normalizeArea(product.area);

      if (!groups[area]) {
        groups[area] = [];
      }

      groups[area].push(product);
    }

    let html = `
      <div class="section">

        <div class="section-header">

          <div>
            <h3>Catálogo</h3>

            <p>
              Cadastre produtos e escolha onde eles aparecem.
            </p>
          </div>

          <button
            class="btn btn-primary"
            id="newProductBtn"
            type="button"
          >
            + Novo produto
          </button>

        </div>

        <div class="section-body">
    `;

    for (const area of AREAS) {
      const products =
        groups[area.value] || [];

      html += `
        <div class="area-group">

          <div class="area-heading">

            <h4>
              ${esc(area.label)}
            </h4>

            <button
              class="btn btn-secondary btn-small"
              data-add-area="${esc(area.value)}"
              type="button"
            >
              + Adicionar aqui
            </button>

          </div>

          <div class="product-list">
      `;

      if (!products.length) {
        html += `
          <div class="empty">
            <div class="empty-icon">🍰</div>
            <p>Nenhum produto nesta área.</p>
          </div>
        `;
      } else {
        for (const product of products) {
          html += productRow(product);
        }
      }

      html += `
          </div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    $("#tabContent").innerHTML =
      html;

    $("#newProductBtn")
      ?.addEventListener(
        "click",
        () => openProductModal()
      );

    $$("[data-add-area]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            openProductModal(
              null,
              button.dataset.addArea
            );
          }
        );
      });

    $$("[data-edit-product]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const product =
              currentProducts.find(
                (item) =>
                  String(item.id) ===
                  String(
                    button.dataset.editProduct
                  )
              );

            if (product) {
              openProductModal(product);
            }
          }
        );
      });

    $$("[data-delete-product]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            deleteProduct(
              button.dataset.deleteProduct
            );
          }
        );
      });
  }

  function productRow(product) {
    const available =
      product.available !== false;

    const discount =
      Number(
        product.discount_percent || 0
      );

    const originalPrice =
      Number(product.price || 0);

    const finalPrice =
      discount > 0
        ? originalPrice *
          (1 - discount / 100)
        : originalPrice;

    const photo =
      product.image_url ||
      product.image ||
      "";

    const meta = [];

    if (product.category) {
      meta.push(
        `<span class="tag">${esc(
          product.category
        )}</span>`
      );
    }

    if (product.gramatura) {
      meta.push(
        `<span class="tag">${esc(
          product.gramatura
        )}</span>`
      );
    }

    if (product.serve_ate) {
      meta.push(
        `<span class="tag">${esc(
          product.serve_ate
        )}</span>`
      );
    }

    if (discount > 0) {
      meta.push(
        `<span class="tag yellow">-${discount}%</span>`
      );
    }

    if (product.appointment_required) {
      meta.push(
        `<span class="tag yellow">Agendamento</span>`
      );
    }

    meta.push(
      available
        ? `<span class="tag green">Disponível</span>`
        : `<span class="tag red">Em falta</span>`
    );

    return `
      <div class="product-row">

        <div class="product-image">
          ${
            photo
              ? `
                <img
                  src="${esc(photo)}"
                  alt="${esc(
                    product.name
                  )}"
                >
              `
              : "🍰"
          }
        </div>

        <div class="product-info">

          <div class="product-name">
            ${esc(
              product.name ||
              "Produto sem nome"
            )}
          </div>

          <div class="product-meta">
            ${meta.join("")}
          </div>

        </div>

        <div class="product-price">

          ${
            discount > 0
              ? `
                <span class="old-price">
                  ${money(originalPrice)}
                </span>
              `
              : ""
          }

          <strong>
            ${money(finalPrice)}
          </strong>

        </div>

        <div class="product-actions">

          <button
            class="btn btn-secondary btn-small"
            data-edit-product="${esc(
              product.id
            )}"
            type="button"
          >
            Editar
          </button>

          <button
            class="btn btn-danger btn-small"
            data-delete-product="${esc(
              product.id
            )}"
            type="button"
          >
            Excluir
          </button>

        </div>

      </div>
    `;
  }

  /* =========================
     PRODUCT MODAL
  ========================= */

  function openProductModal(
    product = null,
    forcedArea = null
  ) {
    editingProductId =
      product?.id || null;

    selectedImageFile = null;

    $("#productModalTitle").textContent =
      product
        ? "Editar produto"
        : "Novo produto";

    $("#productName").value =
      product?.name || "";

    populateAreas(
      forcedArea ||
      product?.area ||
      "cardapio"
    );

    populateCategories(
      product?.category || ""
    );

    $("#productPrice").value =
      product?.price ?? "";

    $("#productDiscount").value =
      product?.discount_percent ?? 0;

    $("#productSort").value =
      product?.sort ?? 0;

    $("#productGramatura").value =
      product?.gramatura || "";

    $("#productServeAte").value =
      product?.serve_ate || "";

    $("#productDescription").value =
      product?.description || "";

    $("#productAvailable").checked =
      product?.available !== false;

    $("#productFeatured").checked =
      product?.featured === true;

    $("#productAppointment").checked =
      product?.appointment_required === true;

    $("#newCategoryField")
      ?.classList.add("hidden");

    if ($("#newCategory")) {
      $("#newCategory").value = "";
    }

    const photo =
      product?.image_url ||
      product?.image ||
      "";

    if (photo) {
      $("#photoPreview").innerHTML =
        `
          <img
            src="${esc(photo)}"
            alt="Prévia"
          >
        `;
    } else {
      $("#photoPreview").textContent =
        "📷";
    }

    $("#productModal")
      ?.classList.add("open");
  }

  function closeProductModal() {
    $("#productModal")
      ?.classList.remove("open");

    editingProductId = null;
    selectedImageFile = null;

    $("#productForm")?.reset();

    if ($("#productAvailable")) {
      $("#productAvailable").checked =
        true;
    }

    if ($("#productDiscount")) {
      $("#productDiscount").value = 0;
    }

    if ($("#productSort")) {
      $("#productSort").value = 0;
    }

    if ($("#photoPreview")) {
      $("#photoPreview").textContent =
        "📷";
    }

    $("#newCategoryField")
      ?.classList.add("hidden");
  }

  function populateCategories(selected = "") {
    const select =
      $("#productCategory");

    if (!select) return;

    const categories =
      getCategories();

    select.innerHTML = `
      <option value="">
        Sem categoria
      </option>

      ${categories
        .map(
          (category) =>
            `
              <option
                value="${esc(category)}"
              >
                ${esc(category)}
              </option>
            `
        )
        .join("")}
    `;

    if (
      selected &&
      !categories.some(
        (category) =>
          normalize(category) ===
          normalize(selected)
      )
    ) {
      /*
        Produto antigo com classificação
        que não faz mais parte das permitidas.

        Não adicionamos essa classificação
        novamente ao seletor.
      */

      select.value = "";
    } else {
      select.value =
        selected || "";
    }
  }

  /* =========================
     PHOTO
  ========================= */

  function setupPhotoPicker() {
    $("#productPhoto")
      ?.addEventListener(
        "change",
        (event) => {
          const file =
            event.target.files?.[0];

          if (!file) return;

          if (
            !file.type.startsWith(
              "image/"
            )
          ) {
            toast(
              "Escolha um arquivo de imagem.",
              "error"
            );

            event.target.value =
              "";

            return;
          }

          selectedImageFile =
            file;

          const url =
            URL.createObjectURL(file);

          $("#photoPreview").innerHTML =
            `
              <img
                src="${url}"
                alt="Prévia da imagem"
              >
            `;
        }
      );
  }

  /* =========================
     STORAGE
  ========================= */

  async function uploadProductImage(file) {
    if (!file) return null;

    const safeName =
      slug(
        file.name.replace(
          /\.[^/.]+$/,
          ""
        )
      ) || "produto";

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";

    const path =
      `products/${Date.now()}-${safeName}.${extension}`;

    const {
      data,
      error
    } = await client
      .storage
      .from("media")
      .upload(
        path,
        file,
        {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        }
      );

    if (error) {
      throw error;
    }

    const publicResult =
      client
        .storage
        .from("media")
        .getPublicUrl(
          data.path
        );

    return publicResult.data
      .publicUrl;
  }

  /* =========================
     SAVE PRODUCT
  ========================= */

  async function saveProduct(event) {
    event.preventDefault();

    /*
      Guardamos isso ANTES de fechar o modal.
      closeProductModal() limpa editingProductId.
    */
    const wasEditing =
      Boolean(editingProductId);

    const productId =
      editingProductId;

    const name =
      $("#productName")
        .value
        .trim();

    const area =
      normalizeArea(
        $("#productArea").value
      );

    const category =
      $("#productCategory").value;

    const price =
      Number(
        $("#productPrice").value
      );

    const discount =
      Math.min(
        100,
        Math.max(
          0,
          Number(
            $("#productDiscount")
              .value || 0
          )
        )
      );

    const sort =
      Number(
        $("#productSort")
          .value || 0
      );

    const gramatura =
      $("#productGramatura")
        .value
        .trim();

    const serveAte =
      $("#productServeAte")
        .value
        .trim();

    const description =
      $("#productDescription")
        .value
        .trim();

    const available =
      $("#productAvailable")
        .checked;

    const featured =
      $("#productFeatured")
        .checked;

    const appointmentRequired =
      $("#productAppointment")
        .checked;

    if (!name) {
      toast(
        "Informe o nome do produto.",
        "error"
      );

      return;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      toast(
        "Informe um preço válido.",
        "error"
      );

      return;
    }

    if (
      category &&
      !isAllowedCategory(category)
    ) {
      toast(
        "Escolha uma classificação válida.",
        "error"
      );

      return;
    }

    const submit =
      $('#productForm button[type="submit"]');

    if (submit) {
      submit.disabled =
        true;

      submit.textContent =
        "Salvando...";
    }

    try {
      let imageUrl = null;

      if (selectedImageFile) {
        toast(
          "Enviando foto..."
        );

        imageUrl =
          await uploadProductImage(
            selectedImageFile
          );
      }

      const payload = {
        name,
        area,
        category:
          category || null,
        price,
        discount_percent:
          discount,
        gramatura:
          gramatura || null,
        serve_ate:
          serveAte || null,
        description:
          description || null,
        available,
        featured,
        appointment_required:
          appointmentRequired,
        sort
      };

      if (imageUrl) {
        payload.image_url =
          imageUrl;
      }

      let result;

      if (wasEditing) {
        result =
          await client
            .from("products")
            .update(payload)
            .eq(
              "id",
              productId
            );
      } else {
        result =
          await client
            .from("products")
            .insert(payload);
      }

      if (result.error) {
        throw result.error;
      }

      if (category) {
        addCategory(category);
      }

      await saveSite();

      closeProductModal();

      await loadData();

      renderStats();
      renderProducts();

      toast(
        wasEditing
          ? "Produto atualizado."
          : "Produto criado.",
        "success"
      );

    } catch (error) {
      console.error(error);

      toast(
        "Erro ao salvar produto: " +
        error.message,
        "error"
      );

    } finally {
      if (submit) {
        submit.disabled =
          false;

        submit.textContent =
          "Salvar produto";
      }
    }
  }

  /* =========================
     DELETE PRODUCT
  ========================= */

  async function deleteProduct(id) {
    const product =
      S.products.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!product) return;

    const confirmed =
      window.confirm(
        `Excluir o produto "${product.name}"?`
      );

    if (!confirmed) return;

    const {
      error
    } = await client
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);

      toast(
        "Erro ao excluir: " +
        error.message,
        "error"
      );

      return;
    }

    await loadData();

    renderStats();
    renderProducts();

    toast(
      "Produto excluído.",
      "success"
    );
  }

  /* =========================
     ORDERS
  ========================= */

  async function renderOrders() {
    $("#tabContent").innerHTML = `
      <div class="section">

        <div class="section-header">

          <div>
            <h3>Pedidos</h3>

            <p>
              Pedidos recebidos pelo site.
            </p>
          </div>

          <button
            class="btn btn-secondary btn-small"
            id="reloadOrders"
            type="button"
          >
            Atualizar
          </button>

        </div>

        <div
          class="section-body"
          id="ordersBody"
        >
          <div class="empty">
            Carregando pedidos...
          </div>
        </div>

      </div>
    `;

    $("#reloadOrders")
      ?.addEventListener(
        "click",
        renderOrders
      );

    const {
      data,
      error
    } = await client
      .from("orders")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {
      $("#ordersBody").innerHTML =
        `
          <div class="empty">
            ${esc(error.message)}
          </div>
        `;

      return;
    }

    const orders =
      data || [];

    if (!orders.length) {
      $("#ordersBody").innerHTML =
        `
          <div class="empty">

            <div class="empty-icon">
              🛍️
            </div>

            <p>
              Nenhum pedido encontrado.
            </p>

          </div>
        `;

      return;
    }

    $("#ordersBody").innerHTML =
      `
        <div class="table-wrap">

          <table class="data-table">

            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Entrega</th>
                <th>Total</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>

              ${orders
                .map(
                  (order) =>
                    orderRow(order)
                )
                .join("")}

            </tbody>

          </table>

        </div>
      `;

    $$("[data-order-status]")
      .forEach((select) => {
        select.addEventListener(
          "change",
          () =>
            updateOrderStatus(
              select.dataset
                .orderStatus,
              select.value
            )
        );
      });

    $$("[data-print-order]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () =>
            printOrder(
              orders.find(
                (order) =>
                  String(
                    order.id
                  ) ===
                  String(
                    button.dataset
                      .printOrder
                  )
              )
            )
        );
      });
  }

  function orderRow(order) {
    const date =
      order.created_at
        ? new Date(
            order.created_at
          ).toLocaleString(
            "pt-BR"
          )
        : "-";

    const customer =
      firstValue(
        order.customer_name,
        order.customer,
        order.name,
        order.client_name
      ) || "-";

    const phone =
      firstValue(
        order.phone,
        order.telephone,
        order.whatsapp,
        order.customer_phone
      );

    const receiving =
      firstValue(
        order.receiving,
        order.delivery_method,
        order.method
      ) || "-";

    const total =
      Number(
        order.total || 0
      );

    const status =
      order.status || "novo";

    return `
      <tr>

        <td>
          ${esc(date)}
        </td>

        <td>

          <strong>
            ${esc(customer)}
          </strong>

          ${
            phone
              ? `
                <br>
                <small>
                  ${esc(phone)}
                </small>
              `
              : ""
          }

        </td>

        <td>
          ${esc(receiving)}
        </td>

        <td>
          <strong>
            ${money(total)}
          </strong>
        </td>

        <td>

          <select
            class="field-input"
            data-order-status="${esc(
              order.id
            )}"
            style="
              padding:8px;
              border:1px solid #e7d8c6;
              border-radius:9px;
              background:#fff;
            "
          >

            ${[
              "novo",
              "em preparo",
              "pronto",
              "concluído",
              "cancelado"
            ]
              .map(
                (item) =>
                  `
                    <option
                      value="${esc(item)}"
                      ${
                        normalize(
                          status
                        ) ===
                        normalize(
                          item
                        )
                          ? "selected"
                          : ""
                      }
                    >
                      ${esc(item)}
                    </option>
                  `
              )
              .join("")}

          </select>

        </td>

        <td>

          <button
            class="btn btn-secondary btn-small"
            data-print-order="${esc(
              order.id
            )}"
            type="button"
          >
            Imprimir
          </button>

        </td>

      </tr>
    `;
  }

  async function updateOrderStatus(
    id,
    status
  ) {
    const {
      error
    } = await client
      .from("orders")
      .update({
        status
      })
      .eq(
        "id",
        id
      );

    if (error) {
      toast(
        "Erro ao atualizar pedido: " +
        error.message,
        "error"
      );

      return;
    }

    toast(
      "Status atualizado.",
      "success"
    );
  }

  /* =========================
     CUSTOM CAKES
  ========================= */

  function cakeSources(cake) {
    const sources = [
      cake,
      cake?.data,
      cake?.form,
      cake?.form_data,
      cake?.customer_data,
      cake?.customer,
      cake?.details,
      cake?.payload,
      cake?.request
    ];

    return sources.filter(
      (source) =>
        source &&
        typeof source === "object" &&
        !Array.isArray(source)
    );
  }

  function cakeValue(cake, keys) {
    const sources =
      cakeSources(cake);

    for (const source of sources) {
      for (const key of keys) {
        const value =
          source?.[key];

        if (
          value !== undefined &&
          value !== null &&
          typeof value !== "object" &&
          String(value).trim() !== ""
        ) {
          return value;
        }
      }
    }

    return "";
  }

  function cakeText(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return "";
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }

    try {
      return JSON.stringify(
        value,
        null,
        2
      );
    } catch {
      return String(value);
    }
  }

  async function renderCakes() {
    $("#tabContent").innerHTML = `
      <div class="section">

        <div class="section-header">

          <div>
            <h3>
              Bolos personalizados
            </h3>

            <p>
              Solicitações de encomendas personalizadas.
            </p>
          </div>

          <button
            class="btn btn-secondary btn-small"
            id="reloadCakes"
            type="button"
          >
            Atualizar
          </button>

        </div>

        <div
          class="section-body"
          id="cakesBody"
        >
          <div class="empty">
            Carregando...
          </div>
        </div>

      </div>
    `;

    $("#reloadCakes")
      ?.addEventListener(
        "click",
        renderCakes
      );

    const {
      data,
      error
    } = await client
      .from("custom_cakes")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {
      $("#cakesBody").innerHTML =
        `
          <div class="empty">
            ${esc(error.message)}
          </div>
        `;

      return;
    }

    const cakes =
      data || [];

    if (!cakes.length) {
      $("#cakesBody").innerHTML =
        `
          <div class="empty">

            <div class="empty-icon">
              🎂
            </div>

            <p>
              Nenhuma solicitação encontrada.
            </p>

          </div>
        `;

      return;
    }

    $("#cakesBody").innerHTML =
      `
        <div class="cake-list">

          ${cakes
            .map(
              (cake) =>
                cakeCard(cake)
            )
            .join("")}

        </div>
      `;

    $$("[data-cake-status]")
      .forEach((select) => {
        select.addEventListener(
          "change",
          () =>
            updateCakeStatus(
              select.dataset
                .cakeStatus,
              select.value
            )
        );
      });

    $$("[data-print-cake]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () =>
            printCake(
              cakes.find(
                (cake) =>
                  String(
                    cake.id
                  ) ===
                  String(
                    button.dataset
                      .printCake
                  )
              )
            )
        );
      });
  }

  function cakeCard(cake) {
    const customer =
      cakeText(
        cakeValue(cake, [
          "customer_name",
          "client_name",
          "full_name",
          "nome_completo",
          "customer",
          "client",
          "name",
          "nome"
        ])
      ) || "-";

    const phone =
      cakeText(
        cakeValue(cake, [
          "phone",
          "telephone",
          "whatsapp",
          "customer_phone",
          "client_phone",
          "phone_number",
          "telefone"
        ])
      ) || "-";

    const email =
      cakeText(
        cakeValue(cake, [
          "email",
          "customer_email",
          "client_email",
          "e_mail"
        ])
      );

    const event =
      cakeText(
        cakeValue(cake, [
          "event",
          "event_type",
          "occasion",
          "event_name",
          "evento",
          "tipo_evento"
        ])
      ) || "-";

    const eventDate =
      cakeText(
        cakeValue(cake, [
          "event_date",
          "delivery_date",
          "date",
          "data_evento",
          "data",
          "date_event"
        ])
      ) || "-";

    const eventTime =
      cakeText(
        cakeValue(cake, [
          "event_time",
          "delivery_time",
          "time",
          "horario",
          "hora"
        ])
      );

    const guests =
      cakeText(
        cakeValue(cake, [
          "guests",
          "people",
          "people_count",
          "quantity_people",
          "number_of_people",
          "servings",
          "serves",
          "serve_ate",
          "pessoas"
        ])
      );

    const flavor =
      cakeText(
        cakeValue(cake, [
          "flavor",
          "sabor",
          "cake_flavor",
          "filling",
          "cake_filling",
          "recheio",
          "recheios"
        ])
      );

    const dough =
      cakeText(
        cakeValue(cake, [
          "dough",
          "cake_dough",
          "massa",
          "mass"
        ])
      );

    const size =
      cakeText(
        cakeValue(cake, [
          "size",
          "tamanho",
          "weight",
          "peso",
          "gramatura",
          "cake_size"
        ])
      );

    const theme =
      cakeText(
        cakeValue(cake, [
          "theme",
          "tema",
          "decoration",
          "decoracao",
          "decoração",
          "design"
        ])
      );

    const description =
      cakeText(
        cakeValue(cake, [
          "description",
          "details",
          "request",
          "pedido",
          "message",
          "mensagem",
          "personalization",
          "personalizacao"
        ])
      );

    const notes =
      cakeText(
        cakeValue(cake, [
          "notes",
          "observations",
          "observation",
          "observacao",
          "observações",
          "obs"
        ])
      );

    const address =
      cakeText(
        cakeValue(cake, [
          "address",
          "delivery_address",
          "endereco",
          "endereço"
        ])
      );

    const payment =
      cakeText(
        cakeValue(cake, [
          "payment",
          "payment_method",
          "pagamento",
          "forma_pagamento"
        ])
      );

    const total =
      cakeValue(cake, [
        "total",
        "price",
        "valor",
        "budget",
        "orcamento",
        "orçamento"
      ]);

    const createdAt =
      cake.created_at
        ? formatDate(
            cake.created_at
          )
        : "-";

    const status =
      cake.status || "novo";

    const statuses = [
      "novo",
      "em contato",
      "orçamento enviado",
      "concluído",
      "cancelado"
    ];

    const detail = (
      label,
      value
    ) => {
      if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        return "";
      }

      return `
        <div class="cake-detail">

          <span class="cake-detail-label">
            ${esc(label)}
          </span>

          <strong class="cake-detail-value">
            ${esc(value)}
          </strong>

        </div>
      `;
    };

    return `
      <div class="cake-card">

        <div class="cake-card-header">

          <div>

            <h4>
              ${esc(customer)}
            </h4>

            <span>
              Solicitação em
              ${esc(createdAt)}
            </span>

          </div>

          <select
            class="field-input"
            data-cake-status="${esc(
              cake.id
            )}"
            style="
              min-width:180px;
              padding:9px;
              border:1px solid #e7d8c6;
              border-radius:9px;
              background:#fff;
            "
          >

            ${statuses
              .map(
                (item) =>
                  `
                    <option
                      value="${esc(item)}"
                      ${
                        normalize(
                          status
                        ) ===
                        normalize(
                          item
                        )
                          ? "selected"
                          : ""
                      }
                    >
                      ${esc(item)}
                    </option>
                  `
              )
              .join("")}

          </select>

        </div>

        <div class="cake-client-grid">

          ${detail(
            "Cliente",
            customer
          )}

          ${detail(
            "Telefone / WhatsApp",
            phone
          )}

          ${
            email
              ? detail(
                  "E-mail",
                  email
                )
              : ""
          }

          ${detail(
            "Evento",
            event
          )}

          ${detail(
            "Data desejada",
            eventDate
          )}

          ${
            eventTime
              ? detail(
                  "Horário",
                  eventTime
                )
              : ""
          }

          ${
            guests
              ? detail(
                  "Quantidade de pessoas",
                  guests
                )
              : ""
          }

          ${
            size
              ? detail(
                  "Tamanho / peso",
                  size
                )
              : ""
          }

          ${
            dough
              ? detail(
                  "Massa",
                  dough
                )
              : ""
          }

          ${
            flavor
              ? detail(
                  "Recheio / sabor",
                  flavor
                )
              : ""
          }

          ${
            theme
              ? detail(
                  "Tema / decoração",
                  theme
                )
              : ""
          }

          ${
            address
              ? detail(
                  "Endereço",
                  address
                )
              : ""
          }

          ${
            payment
              ? detail(
                  "Pagamento",
                  payment
                )
              : ""
          }

          ${
            total !== ""
              ? detail(
                  "Valor / orçamento",
                  money(total)
                )
              : ""
          }

        </div>

        ${
          description
            ? `
              <div class="cake-description">

                <span class="cake-detail-label">
                  Detalhes da encomenda
                </span>

                <div>
                  ${esc(description)}
                </div>

              </div>
            `
            : ""
        }

        ${
          notes
            ? `
              <div class="cake-description">

                <span class="cake-detail-label">
                  Observações
                </span>

                <div>
                  ${esc(notes)}
                </div>

              </div>
            `
            : ""
        }

        <div class="cake-card-footer">

          <button
            class="btn btn-secondary btn-small"
            data-print-cake="${esc(
              cake.id
            )}"
            type="button"
          >
            Imprimir comanda
          </button>

        </div>

      </div>
    `;
  }

  async function updateCakeStatus(
    id,
    status
  ) {
    const {
      error
    } = await client
      .from("custom_cakes")
      .update({
        status
      })
      .eq(
        "id",
        id
      );

    if (error) {
      toast(
        "Erro ao atualizar bolo: " +
        error.message,
        "error"
      );

      return;
    }

    toast(
      "Status atualizado.",
      "success"
    );
  }

  /* =========================
     CONTENT
  ========================= */

  function renderContent() {
    const about =
      S.about || {};

    $("#tabContent").innerHTML =
      `
        <div class="section">

          <div class="section-header">

            <div>
              <h3>
                Conteúdos do site
              </h3>

              <p>
                Informações institucionais e contato.
              </p>
            </div>

          </div>

          <div class="section-body">

            <div class="setting-card">

              <h4>Identidade</h4>

              <div class="grid-2">

                <div class="field">

                  <label>
                    Nome
                  </label>

                  <input
                    id="contentName"
                    value="${esc(
                      about.name ||
                      ""
                    )}"
                  >

                </div>

                <div class="field">

                  <label>
                    Título
                  </label>

                  <input
                    id="contentTitle"
                    value="${esc(
                      about.title ||
                      ""
                    )}"
                  >

                </div>

              </div>

              <div class="field">

                <label>
                  Frase
                </label>

                <input
                  id="contentQuote"
                  value="${esc(
                    about.quote ||
                    ""
                  )}"
                >

              </div>

              <div class="field">

                <label>
                  Texto sobre a confeitaria
                </label>

                <textarea id="contentText">${esc(
                  about.text ||
                  ""
                )}</textarea>

              </div>

            </div>

            <div class="setting-card">

              <h4>Contato</h4>

              <div class="grid-2">

                <div class="field">

                  <label>
                    Instagram
                  </label>

                  <input
                    id="contentInstagram"
                    value="${esc(
                      S.instagram ||
                      ""
                    )}"
                    placeholder="@martinsconfeitaria"
                  >

                </div>

                <div class="field">

                  <label>
                    WhatsApp
                  </label>

                  <input
                    id="contentWhatsapp"
                    value="${esc(
                      S.whatsapp ||
                      ""
                    )}"
                    placeholder="5585999999999"
                  >

                </div>

              </div>

            </div>

            <button
              class="btn btn-primary"
              id="saveContent"
              type="button"
            >
              Salvar conteúdos
            </button>

          </div>

        </div>
      `;

    $("#saveContent")
      ?.addEventListener(
        "click",
        saveContent
      );
  }

  async function saveContent() {
    S.about = {
      ...S.about,

      name:
        $("#contentName")
          .value
          .trim(),

      title:
        $("#contentTitle")
          .value
          .trim(),

      quote:
        $("#contentQuote")
          .value
          .trim(),

      text:
        $("#contentText")
          .value
          .trim()
    };

    S.instagram =
      $("#contentInstagram")
        .value
        .trim();

    S.whatsapp =
      $("#contentWhatsapp")
        .value
        .trim();

    const saved =
      await saveSite();

    if (saved) {
      toast(
        "Conteúdos salvos.",
        "success"
      );
    }
  }

  /* =========================
     HOURS
  ========================= */

  function renderHours() {
    const days = [
      ["monday", "Segunda-feira"],
      ["tuesday", "Terça-feira"],
      ["wednesday", "Quarta-feira"],
      ["thursday", "Quinta-feira"],
      ["friday", "Sexta-feira"],
      ["saturday", "Sábado"],
      ["sunday", "Domingo"]
    ];

    const hours =
      S.hours || {};

    $("#tabContent").innerHTML =
      `
        <div class="section">

          <div class="section-header">

            <div>

              <h3>
                Horários
              </h3>

              <p>
                Configure os horários exibidos no site.
              </p>

            </div>

          </div>

          <div class="section-body">

            ${days
              .map(
                ([key, label]) =>
                  `
                    <div class="setting-card">

                      <div class="grid-3">

                        <div>
                          <strong>
                            ${label}
                          </strong>
                        </div>

                        <div class="field">

                          <label>
                            Abertura
                          </label>

                          <input
                            type="time"
                            id="open_${key}"
                            value="${esc(
                              hours[key]
                                ?.open ||
                              ""
                            )}"
                          >

                        </div>

                        <div class="field">

                          <label>
                            Fechamento
                          </label>

                          <input
                            type="time"
                            id="close_${key}"
                            value="${esc(
                              hours[key]
                                ?.close ||
                              ""
                            )}"
                          >

                        </div>

                      </div>

                    </div>
                  `
              )
              .join("")}

            <button
              class="btn btn-primary"
              id="saveHours"
              type="button"
            >
              Salvar horários
            </button>

          </div>

        </div>
      `;

    $("#saveHours")
      ?.addEventListener(
        "click",
        saveHours
      );
  }

  async function saveHours() {
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday"
    ];

    S.hours =
      S.hours || {};

    for (const day of days) {
      S.hours[day] = {
        open:
          $(`#open_${day}`)
            ?.value || "",

        close:
          $(`#close_${day}`)
            ?.value || ""
      };
    }

    const saved =
      await saveSite();

    if (saved) {
      toast(
        "Horários salvos.",
        "success"
      );
    }
  }

  /* =========================
     RULES
  ========================= */

  function renderRules() {
    const rules =
      S.rules || {};

    $("#tabContent").innerHTML =
      `
        <div class="section">

          <div class="section-header">

            <div>

              <h3>
                Regras do atendimento
              </h3>

              <p>
                Informações utilizadas para orientar os clientes.
              </p>

            </div>

          </div>

          <div class="section-body">

            <div class="setting-card">

              <h4>
                Delivery
              </h4>

              <div class="field">

                <label>
                  Regra de entrega
                </label>

                <textarea
                  id="ruleDelivery"
                >${esc(
                  rules.delivery ||
                  ""
                )}</textarea>

              </div>

            </div>

            <div class="setting-card">

              <h4>
                Encomendas
              </h4>

              <div class="field">

                <label>
                  Regra de encomendas
                </label>

                <textarea
                  id="ruleOrders"
                >${esc(
                  rules.orders ||
                  ""
                )}</textarea>

              </div>

            </div>

            <div class="setting-card">

              <h4>
                Pagamento
              </h4>

              <div class="field">

                <label>
                  Formas e regras de pagamento
                </label>

                <textarea
                  id="rulePayment"
                >${esc(
                  rules.payment ||
                  ""
                )}</textarea>

              </div>

            </div>

            <div class="setting-card">

              <h4>
                Observações gerais
              </h4>

              <div class="field">

                <label>
                  Informações adicionais
                </label>

                <textarea
                  id="ruleGeneral"
                >${esc(
                  rules.general ||
                  ""
                )}</textarea>

              </div>

            </div>

            <button
              class="btn btn-primary"
              id="saveRules"
              type="button"
            >
              Salvar regras
            </button>

          </div>

        </div>
      `;

    $("#saveRules")
      ?.addEventListener(
        "click",
        saveRules
      );
  }

  async function saveRules() {
    S.rules = {
      ...S.rules,

      delivery:
        $("#ruleDelivery")
          .value
          .trim(),

      orders:
        $("#ruleOrders")
          .value
          .trim(),

      payment:
        $("#rulePayment")
          .value
          .trim(),

      general:
        $("#ruleGeneral")
          .value
          .trim()
    };

    const saved =
      await saveSite();

    if (saved) {
      toast(
        "Regras salvas.",
        "success"
      );
    }
  }

  /* =========================
     MEDIA
  ========================= */

  async function renderMedia() {
    $("#tabContent").innerHTML =
      `
        <div class="section">

          <div class="section-header">

            <div>

              <h3>
                Mídia
              </h3>

              <p>
                Arquivos armazenados no bucket media.
              </p>

            </div>

          </div>

          <div class="section-body">

            <div class="photo-picker">

              <label
                for="mediaUpload"
                class="btn btn-primary"
              >
                + Enviar arquivo
              </label>

              <input
                id="mediaUpload"
                class="file-input"
                type="file"
                accept="image/*,video/*"
              >

              <small>
                Fotos, imagens e outros arquivos de mídia.
              </small>

            </div>

            <div
              id="mediaList"
              style="margin-top:20px;"
            >
              <div class="empty">
                Carregando mídia...
              </div>
            </div>

          </div>

        </div>
      `;

    $("#mediaUpload")
      ?.addEventListener(
        "change",
        uploadMedia
      );

    await loadMedia();
  }

  async function loadMedia() {
    const container =
      $("#mediaList");

    if (!container) return;

    const {
      data,
      error
    } = await client
      .storage
      .from("media")
      .list(
        "",
        {
          limit: 100,
          sortBy: {
            column:
              "created_at",
            order:
              "desc"
          }
        }
      );

    if (error) {
      container.innerHTML =
        `
          <div class="empty">
            ${esc(
              error.message
            )}
          </div>
        `;

      return;
    }

    const files =
      (data || [])
        .filter(
          (file) =>
            file.name &&
            file.name !==
              ".emptyFolderPlaceholder"
        );

    if (!files.length) {
      container.innerHTML =
        `
          <div class="empty">
            Nenhum arquivo encontrado.
          </div>
        `;

      return;
    }

    container.innerHTML =
      `
        <div
          style="
            display:grid;
            grid-template-columns:
              repeat(
                auto-fill,
                minmax(180px,1fr)
              );
            gap:14px;
          "
        >

          ${files
            .map(
              (file) =>
                `
                  <div
                    class="setting-card"
                    style="margin:0;"
                  >

                    <div
                      style="
                        height:150px;
                        border-radius:12px;
                        overflow:hidden;
                        background:#f2e8da;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        margin-bottom:10px;
                      "
                    >
                      🖼️
                    </div>

                    <strong
                      style="
                        display:block;
                        font-size:12px;
                        word-break:break-word;
                      "
                    >
                      ${esc(
                        file.name
                      )}
                    </strong>

                  </div>
                `
            )
            .join("")}

        </div>
      `;
  }

  async function uploadMedia(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      const safeName =
        slug(
          file.name.replace(
            /\.[^/.]+$/,
            ""
          )
        ) || "arquivo";

      const extension =
        file.name
          .split(".")
          .pop() ||
        "bin";

      const path =
        `media/${Date.now()}-${safeName}.${extension}`;

      const {
        error
      } = await client
        .storage
        .from("media")
        .upload(
          path,
          file,
          {
            cacheControl:
              "3600",
            upsert:
              false,
            contentType:
              file.type
          }
        );

      if (error) {
        throw error;
      }

      toast(
        "Arquivo enviado.",
        "success"
      );

      event.target.value =
        "";

      await loadMedia();

    } catch (error) {
      console.error(error);

      toast(
        "Erro ao enviar arquivo: " +
        error.message,
        "error"
      );
    }
  }

  /* =========================
     PRINT
  ========================= */

  function printWindow(
    title,
    body
  ) {
    const popup =
      window.open(
        "",
        "_blank",
        "width=800,height=900"
      );

    if (!popup) {
      toast(
        "O navegador bloqueou a janela de impressão.",
        "error"
      );

      return;
    }

    popup.document.write(`
      <!DOCTYPE html>

      <html lang="pt-BR">

      <head>

        <meta charset="UTF-8">

        <title>
          ${esc(title)}
        </title>

        <style>

          body {
            font-family:
              Arial,
              sans-serif;

            padding:30px;
            color:#222;
          }

          h1 {
            font-size:22px;
          }

          h2 {
            margin-top:24px;
          }

          .line {
            border-bottom:
              1px solid #ddd;

            padding:8px 0;
          }

          .block {
            margin-top:18px;
            padding:12px;
            border:1px solid #ddd;
            border-radius:8px;
          }

        </style>

      </head>

      <body>

        ${body}

        <script>
          window.onload = function() {
            window.print();
          };
        <\/script>

      </body>

      </html>
    `);

    popup.document.close();
  }

  function printOrder(order) {
    if (!order) return;

    let items = [];

    try {
      items =
        typeof order.items ===
        "string"
          ? JSON.parse(
              order.items
            )
          : order.items || [];
    } catch {
      items = [];
    }

    const itemsHtml =
      Array.isArray(items)
        ? items
            .map(
              (item) =>
                `
                  <div class="line">

                    ${esc(
                      item.name ||
                      item.product ||
                      "Produto"
                    )}

                    ${
                      item.quantity
                        ? ` × ${esc(
                            item.quantity
                          )}`
                        : ""
                    }

                    ${
                      item.price != null
                        ? ` - ${money(
                            item.price
                          )}`
                        : ""
                    }

                  </div>
                `
            )
            .join("")
        : `
            <div class="line">
              ${esc(items)}
            </div>
          `;

    printWindow(
      "Pedido - Martins Confeitaria",
      `
        <h1>
          Martins Confeitaria
        </h1>

        <h2>
          Pedido
        </h2>

        <div class="line">
          <strong>
            Cliente:
          </strong>

          ${esc(
            firstValue(
              order.customer_name,
              order.customer,
              order.name
            ) || "-"
          )}
        </div>

        <div class="line">
          <strong>
            Telefone:
          </strong>

          ${esc(
            firstValue(
              order.phone,
              order.telephone,
              order.whatsapp
            ) || "-"
          )}
        </div>

        <div class="line">
          <strong>
            Recebimento:
          </strong>

          ${esc(
            firstValue(
              order.receiving,
              order.delivery_method
            ) || "-"
          )}
        </div>

        <div class="line">
          <strong>
            Endereço:
          </strong>

          ${esc(
            order.address || "-"
          )}
        </div>

        <h3>
          Itens
        </h3>

        ${itemsHtml}

        <div class="line">
          <strong>
            Total:
          </strong>

          ${money(order.total)}
        </div>

        <div class="line">
          <strong>
            Pagamento:
          </strong>

          ${esc(
            order.payment || "-"
          )}
        </div>

        <div class="line">
          <strong>
            Observações:
          </strong>

          ${esc(
            order.notes || "-"
          )}
        </div>
      `
    );
  }

  function printCake(cake) {
    if (!cake) return;

    const customer =
      cakeText(
        cakeValue(cake, [
          "customer_name",
          "client_name",
          "full_name",
          "nome_completo",
          "customer",
          "client",
          "name",
          "nome"
        ])
      ) || "-";

    const phone =
      cakeText(
        cakeValue(cake, [
          "phone",
          "telephone",
          "whatsapp",
          "customer_phone",
          "client_phone",
          "phone_number",
          "telefone"
        ])
      ) || "-";

    const email =
      cakeText(
        cakeValue(cake, [
          "email",
          "customer_email",
          "client_email",
          "e_mail"
        ])
      );

    const event =
      cakeText(
        cakeValue(cake, [
          "event",
          "event_type",
          "occasion",
          "event_name",
          "evento",
          "tipo_evento"
        ])
      ) || "-";

    const eventDate =
      cakeText(
        cakeValue(cake, [
          "event_date",
          "delivery_date",
          "date",
          "data_evento",
          "data",
          "date_event"
        ])
      ) || "-";

    const eventTime =
      cakeText(
        cakeValue(cake, [
          "event_time",
          "delivery_time",
          "time",
          "horario",
          "hora"
        ])
      );

    const guests =
      cakeText(
        cakeValue(cake, [
          "guests",
          "people",
          "people_count",
          "quantity_people",
          "number_of_people",
          "servings",
          "serves",
          "serve_ate",
          "pessoas"
        ])
      );

    const flavor =
      cakeText(
        cakeValue(cake, [
          "flavor",
          "sabor",
          "cake_flavor",
          "filling",
          "cake_filling",
          "recheio",
          "recheios"
        ])
      );

    const dough =
      cakeText(
        cakeValue(cake, [
          "dough",
          "cake_dough",
          "massa",
          "mass"
        ])
      );

    const size =
      cakeText(
        cakeValue(cake, [
          "size",
          "tamanho",
          "weight",
          "peso",
          "gramatura",
          "cake_size"
        ])
      );

    const theme =
      cakeText(
        cakeValue(cake, [
          "theme",
          "tema",
          "decoration",
          "decoracao",
          "decoração",
          "design"
        ])
      );

    const description =
      cakeText(
        cakeValue(cake, [
          "description",
          "details",
          "request",
          "pedido",
          "message",
          "mensagem",
          "personalization",
          "personalizacao"
        ])
      ) || "-";

    const notes =
      cakeText(
        cakeValue(cake, [
          "notes",
          "observations",
          "observation",
          "observacao",
          "observações",
          "obs"
        ])
      );

    const address =
      cakeText(
        cakeValue(cake, [
          "address",
          "delivery_address",
          "endereco",
          "endereço"
        ])
      );

    const payment =
      cakeText(
        cakeValue(cake, [
          "payment",
          "payment_method",
          "pagamento",
          "forma_pagamento"
        ])
      );

    const total =
      cakeValue(cake, [
        "total",
        "price",
        "valor",
        "budget",
        "orcamento",
        "orçamento"
      ]);

    printWindow(
      "Bolo personalizado - Martins Confeitaria",
      `
        <h1>
          Martins Confeitaria
        </h1>

        <h2>
          Bolo personalizado
        </h2>

        <div class="block">

          <div class="line">
            <strong>
              Cliente:
            </strong>

            ${esc(customer)}
          </div>

          <div class="line">
            <strong>
              Telefone / WhatsApp:
            </strong>

            ${esc(phone)}
          </div>

          ${
            email
              ? `
                <div class="line">
                  <strong>
                    E-mail:
                  </strong>

                  ${esc(email)}
                </div>
              `
              : ""
          }

          <div class="line">
            <strong>
              Evento:
            </strong>

            ${esc(event)}
          </div>

          <div class="line">
            <strong>
              Data desejada:
            </strong>

            ${esc(eventDate)}
          </div>

          ${
            eventTime
              ? `
                <div class="line">
                  <strong>
                    Horário:
                  </strong>

                  ${esc(eventTime)}
                </div>
              `
              : ""
          }

          ${
            guests
              ? `
                <div class="line">
                  <strong>
                    Quantidade de pessoas:
                  </strong>

                  ${esc(guests)}
                </div>
              `
              : ""
          }

          ${
            size
              ? `
                <div class="line">
                  <strong>
                    Tamanho / peso:
                  </strong>

                  ${esc(size)}
                </div>
              `
              : ""
          }

          ${
            dough
              ? `
                <div class="line">
                  <strong>
                    Massa:
                  </strong>

                  ${esc(dough)}
                </div>
              `
              : ""
          }

          ${
            flavor
              ? `
                <div class="line">
                  <strong>
                    Recheio / sabor:
                  </strong>

                  ${esc(flavor)}
                </div>
              `
              : ""
          }

          ${
            theme
              ? `
                <div class="line">
                  <strong>
                    Tema / decoração:
                  </strong>

                  ${esc(theme)}
                </div>
              `
              : ""
          }

          ${
            address
              ? `
                <div class="line">
                  <strong>
                    Endereço:
                  </strong>

                  ${esc(address)}
                </div>
              `
              : ""
          }

          ${
            payment
              ? `
                <div class="line">
                  <strong>
                    Pagamento:
                  </strong>

                  ${esc(payment)}
                </div>
              `
              : ""
          }

          ${
            total !== ""
              ? `
                <div class="line">
                  <strong>
                    Valor / orçamento:
                  </strong>

                  ${money(total)}
                </div>
              `
              : ""
          }

        </div>

        ${
          description
            ? `
              <div class="block">

                <strong>
                  Detalhes da encomenda:
                </strong>

                <p>
                  ${esc(description)}
                </p>

              </div>
            `
            : ""
        }

        ${
          notes
            ? `
              <div class="block">

                <strong>
                  Observações:
                </strong>

                <p>
                  ${esc(notes)}
                </p>

              </div>
            `
            : ""
        }
      `
    );
  }

  /* =========================
     GLOBAL EVENTS
  ========================= */

  function setupGlobalEvents() {
    $("#logout")
      ?.addEventListener(
        "click",
        logout
      );

    $("#refreshBtn")
      ?.addEventListener(
        "click",
        async () => {
          try {
            await loadData();

            renderStats();
            renderTab();

            toast(
              "Painel atualizado.",
              "success"
            );

          } catch (error) {
            toast(
              "Erro ao atualizar: " +
              error.message,
              "error"
            );
          }
        }
      );

    $("#mobileMenu")
      ?.addEventListener(
        "click",
        () => {
          $("#sidebar")
            ?.classList.toggle(
              "open"
            );
        }
      );

    $$("[data-close-modal]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const id =
              button.dataset
                .closeModal;

            if (
              id ===
              "productModal"
            ) {
              closeProductModal();
            }
          }
        );
      });

    $("#productModal")
      ?.addEventListener(
        "click",
        (event) => {
          if (
            event.target.id ===
            "productModal"
          ) {
            closeProductModal();
          }
        }
      );

    $("#productForm")
      ?.addEventListener(
        "submit",
        saveProduct
      );

    /*
      Como as classificações agora são fixas,
      não existe mais criação de categoria.
    */

    $("#productCategory")
      ?.addEventListener(
        "change",
        (event) => {
          if (
            event.target.value ===
            "__new__"
          ) {
            event.target.value = "";
          }

          $("#newCategoryField")
            ?.classList.add(
              "hidden"
            );
        }
      );

    setupPhotoPicker();
  }

  /* =========================
     INIT
  ========================= */

  async function init() {
    try {
      renderLogo();

      setupAuth();
      setupNavigation();
      setupGlobalEvents();

      const session =
        await checkSession();

      if (session) {
        await startApp();
      } else {
        $("#loginScreen")
          ?.classList.remove(
            "hidden"
          );

        $("#app")
          ?.classList.add(
            "hidden"
          );
      }

      client.auth.onAuthStateChange(
        async (
          event,
          session
        ) => {
          if (
            event ===
              "SIGNED_IN" &&
            session
          ) {
            await startApp();
          }

          if (
            event ===
            "SIGNED_OUT"
          ) {
            $("#app")
              ?.classList.add(
                "hidden"
              );

            $("#loginScreen")
              ?.classList.remove(
                "hidden"
              );
          }
        }
      );

    } catch (error) {
      console.error(
        "Erro ao iniciar painel:",
        error
      );

      toast(
        "Erro ao iniciar painel: " +
        error.message,
        "error"
      );
    }
  }

  init();

})();v
