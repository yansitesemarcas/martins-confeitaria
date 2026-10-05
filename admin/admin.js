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
    IMPORTANTE:
    Mantemos os valores do banco para não quebrar
    os produtos existentes.

    Apenas corrigimos o significado visual das áreas:

    cardapio        -> Encomendas
    pronta-entrega  -> Delivery
    encomendas      -> Pronta entrega
  */

  const AREAS = [
    {
      value: "cardapio",
      label: "Encomendas"
    },
    {
      value: "pronta-entrega",
      label: "Delivery"
    },
    {
      value: "encomendas",
      label: "Pronta entrega"
    }
  ];

  function normalizeArea(value) {
    const v = normalize(value);

    if (
      v === "pronta" ||
      v === "ready" ||
      v === "pronta entrega" ||
      v === "pronta-entrega"
    ) {
      return "pronta-entrega";
    }

    if (
      v === "encomenda" ||
      v === "bolo-personalizado" ||
      v === "encomendas"
    ) {
      return "encomendas";
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


  /* =========================
     CATEGORIES
  ========================= */

  /*
    Somente categorias de produtos.
    Categorias antigas relacionadas a serviços
    de encomenda não aparecem mais no seletor.
  */

  const BLOCKED_CATEGORIES = [
    "kit massas",
    "para sua festa",
    "personalização",
    "personalizacao",
    "recheios",
    "sobremesas"
  ];

  function isBlockedCategory(category) {
    return BLOCKED_CATEGORIES.includes(
      normalize(category)
    );
  }

  function getCategories() {
    const values = [];

    if (Array.isArray(S.categories)) {
      values.push(...S.categories);
    }

    for (const product of S.products) {
      if (product.category) {
        values.push(product.category);
      }
    }

    return Array.from(
      new Map(
        values
          .map((value) => String(value).trim())
          .filter(Boolean)
          .filter(
            (value) => !isBlockedCategory(value)
          )
          .map((value) => [
            normalize(value),
            value
          ])
      ).values()
    ).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }

  function addCategory(category) {
    const value = String(category || "").trim();

    if (!value) return;

    if (isBlockedCategory(value)) {
      return;
    }

    const exists = getCategories().some(
      (item) =>
        normalize(item) ===
        normalize(value)
    );

    if (!exists) {
      S.categories.push(value);
    }
  }


  /* =========================
     LOGO
  ========================= */

  function getLogoUrl() {
    return (
      S.logoUrl ||
      S.logo ||
      S.brand?.logoUrl ||
      S.brand?.logo ||
      S.about?.logoUrl ||
      S.about?.logo ||
      ""
    );
  }

  function renderLogo() {
    const url = getLogoUrl();

    const loginWrap = $("#loginLogoWrap");
    const sidebarWrap = $("#sidebarLogoWrap");

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
    }

    if (sidebarWrap) {
      sidebarWrap.innerHTML = url
        ? `
          <img
            class="sidebar-logo"
            src="${esc(url)}"
            alt="Martins"
          >
        `
        : `
          <div class="sidebar-logo-fallback">
            M
          </div>
        `;
    }
  }


  /* =========================
     AUTH
  ========================= */

  function setupAuth() {
    const form = $("#loginForm");

    if (!form) return;

    form.addEventListener("submit", async (event) => {
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
    });
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
        !isBlockedCategory(product.category)
      ) {
        addCategory(
          product.category
        );
      }
    }
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
        async () => {
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
            [
              "Painel",
              ""
            ];

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
              Cadastre produtos e escolha exatamente onde eles aparecem.
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
          html +=
            productRow(product);
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

    $("#productArea").value =
      normalizeArea(
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

    $("#newCategory").value = "";

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

    $("#productAvailable").checked =
      true;

    $("#productDiscount").value =
      0;

    $("#productSort").value =
      0;

    $("#photoPreview").textContent =
      "📷";

    $("#newCategoryField")
      ?.classList.add("hidden");
  }


  function populateCategories(
    selected = ""
  ) {
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

      <option value="__new__">
        + Criar nova categoria
      </option>
    `;

    if (
      selected &&
      !categories.some(
        (category) =>
          normalize(category) ===
          normalize(selected)
      )
    ) {
      const option =
        document.createElement(
          "option"
        );

      option.value = selected;
      option.textContent =
        selected;

      select.insertBefore(
        option,
        select.lastElementChild
      );
    }

    select.value =
      selected || "";
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
            URL.createObjectURL(
              file
            );

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

  async function uploadProductImage(
    file
  ) {
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

    const name =
      $("#productName")
        .value
        .trim();

    const area =
      normalizeArea(
        $("#productArea").value
      );

    const categorySelect =
      $("#productCategory").value;

    let category =
      categorySelect;

    if (
      categorySelect ===
      "__new__"
    ) {
      category =
        $("#newCategory")
          .value
          .trim();

      if (!category) {
        toast(
          "Digite o nome da nova categoria.",
          "error"
        );

        return;
      }

      if (
        isBlockedCategory(
          category
        )
      ) {
        toast(
          "Essa categoria é reservada e não pode ser usada.",
          "error"
        );

        return;
      }

      addCategory(category);
    }

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

      if (editingProductId) {
        result =
          await client
            .from("products")
            .update(payload)
            .eq(
              "id",
              editingProductId
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

      addCategory(category);

      await saveSite();

      closeProductModal();

      await loadData();

      renderStats();
      renderProducts();

      toast(
        editingProductId
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
      firstValue(
        cake.customer_name,
        cake.client_name,
        cake.client,
        cake.customer,
        cake.name
      ) || "-";

    const phone =
      firstValue(
        cake.phone,
        cake.telephone,
        cake.whatsapp,
        cake.customer_phone,
        cake.client_phone
      ) || "-";

    const email =
      firstValue(
        cake.email,
        cake.customer_email,
        cake.client_email
      );

    const event =
      firstValue(
        cake.event,
        cake.event_type,
        cake.occasion,
        cake.event_name
      ) || "-";

    const eventDate =
      firstValue(
        cake.event_date,
        cake.delivery_date,
        cake.date,
        cake.data,
        cake.data_evento
      ) || "-";

    const eventTime =
      firstValue(
        cake.event_time,
        cake.delivery_time,
        cake.time,
        cake.horario,
        cake.hora
      ) || "-";

    const guests =
      firstValue(
        cake.guests,
        cake.people,
        cake.people_count,
        cake.quantity_people,
        cake.serves,
        cake.serve_ate,
        cake.pessoas
      );

    const flavor =
      firstValue(
        cake.flavor,
        cake.sabor,
        cake.recheio,
        cake.filling,
        cake.recheios
      );

    const dough =
      firstValue(
        cake.dough,
        cake.massa,
        cake.mass
      );

    const size =
      firstValue(
        cake.size,
        cake.tamanho,
        cake.weight,
        cake.peso,
        cake.gramatura
      );

    const description =
      firstValue(
        cake.description,
        cake.details,
        cake.message,
        cake.design,
        cake.theme,
        cake.tema,
        cake.personalization,
        cake.personalizacao
      ) || "-";

    const notes =
      firstValue(
        cake.notes,
        cake.observations,
        cake.observacao,
        cake.obs
      );

    const address =
      firstValue(
        cake.address,
        cake.delivery_address,
        cake.endereco
      );

    const payment =
      firstValue(
        cake.payment,
        cake.payment_method,
        cake.pagamento
      );

    const total =
      firstValue(
        cake.total,
        cake.price,
        cake.valor,
        cake.budget,
        cake.orcamento
      );

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

    const detail = (label, value) => {
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
            "Telefone",
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


        <div class="cake-description">

          <span class="cake-detail-label">
            Detalhes da encomenda
          </span>

          <div>
            ${esc(description)}
          </div>

        </div>


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
      firstValue(
        cake.customer_name,
        cake.client_name,
        cake.client,
        cake.customer,
        cake.name
      ) || "-";

    const phone =
      firstValue(
        cake.phone,
        cake.telephone,
        cake.whatsapp,
        cake.customer_phone,
        cake.client_phone
      ) || "-";

    const email =
      firstValue(
        cake.email,
        cake.customer_email,
        cake.client_email
      );

    const event =
      firstValue(
        cake.event,
        cake.event_type,
        cake.occasion,
        cake.event_name
      ) || "-";

    const eventDate =
      firstValue(
        cake.event_date,
        cake.delivery_date,
        cake.date,
        cake.data,
        cake.data_evento
      ) || "-";

    const eventTime =
      firstValue(
        cake.event_time,
        cake.delivery_time,
        cake.time,
        cake.horario,
        cake.hora
      );

    const guests =
      firstValue(
        cake.guests,
        cake.people,
        cake.people_count,
        cake.quantity_people,
        cake.serves,
        cake.serve_ate,
        cake.pessoas
      );

    const flavor =
      firstValue(
        cake.flavor,
        cake.sabor,
        cake.recheio,
        cake.filling,
        cake.recheios
      );

    const dough =
      firstValue(
        cake.dough,
        cake.massa,
        cake.mass
      );

    const size =
      firstValue(
        cake.size,
        cake.tamanho,
        cake.weight,
        cake.peso,
        cake.gramatura
      );

    const description =
      firstValue(
        cake.description,
        cake.details,
        cake.message,
        cake.design,
        cake.theme,
        cake.tema,
        cake.personalization,
        cake.personalizacao
      ) || "-";

    const notes =
      firstValue(
        cake.notes,
        cake.observations,
        cake.observacao,
        cake.obs
      );

    const address =
      firstValue(
        cake.address,
        cake.delivery_address,
        cake.endereco
      );

    const payment =
      firstValue(
        cake.payment,
        cake.payment_method,
        cake.pagamento
      );

    const total =
      firstValue(
        cake.total,
        cake.price,
        cake.valor,
        cake.budget,
        cake.orcamento
      );

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
              Telefone:
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


        <div class="block">

          <strong>
            Detalhes da encomenda:
          </strong>

          <p>
            ${esc(description)}
          </p>

        </div>


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

    $("#productCategory")
      ?.addEventListener(
        "change",
        (event) => {
          if (
            event.target.value ===
            "__new__"
          ) {
            $("#newCategoryField")
              ?.classList.remove(
                "hidden"
              );

            $("#newCategory")
              ?.focus();

          } else {
            $("#newCategoryField")
              ?.classList.add(
                "hidden"
              );
          }
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

})();
