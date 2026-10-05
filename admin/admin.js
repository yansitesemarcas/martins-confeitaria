(() => {
  "use strict";

  /* =========================================================
     MARTINS CONFEITARIA
     PAINEL ADMINISTRATIVO
     admin.js — versão refeita do zero
  ========================================================= */

  const CONFIG = window.MARTINS_CONFIG || {};
  const DEFAULTS = window.MARTINS_DEFAULTS || {};

  let client = null;
  let state = JSON.parse(JSON.stringify(DEFAULTS || {}));

  let currentTab = "products";
  let editingProductId = null;
  let selectedPhotoData = "";
  let toastTimer = null;

  const TAB_INFO = {
    products: {
      title: "Produtos",
      subtitle: "Gerencie o catálogo da confeitaria."
    },

    orders: {
      title: "Pedidos",
      subtitle: "Visualize os pedidos recebidos."
    },

    cakes: {
      title: "Bolos personalizados",
      subtitle: "Consulte as encomendas de bolos personalizados."
    },

    content: {
      title: "Conteúdos",
      subtitle: "Edite os conteúdos principais do site."
    },

    hours: {
      title: "Horários",
      subtitle: "Configure os horários de funcionamento."
    },

    rules: {
      title: "Regras",
      subtitle: "Configure informações e regras das encomendas."
    },

    media: {
      title: "Mídia",
      subtitle: "Gerencie imagens e informações visuais."
    }
  };

  const DAYS = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado"
  ];

  /* =========================================================
     HELPERS
  ========================================================= */

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const escapeHTML = (value) =>
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

  const money = (value) => {
    const number = Number(value || 0);

    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const normalizeArea = (area) =>
    String(area || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/\s+/g, "-");

  function clone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }

  function getProductImage(product) {
    return (
      product?.image ||
      product?.image_url ||
      product?.photo ||
      product?.photo_url ||
      product?.imagem ||
      product?.foto ||
      ""
    );
  }

  function setValue(selector, value) {
    const element = $(selector);

    if (element) {
      element.value = value ?? "";
    }
  }

  function setChecked(selector, value) {
    const element = $(selector);

    if (element) {
      element.checked = Boolean(value);
    }
  }

  function getValue(selector) {
    return $(selector)?.value ?? "";
  }

  function getChecked(selector) {
    return Boolean($(selector)?.checked);
  }

  /* =========================================================
     SUPABASE
  ========================================================= */

  function initSupabase() {
    if (
      !window.supabase ||
      !CONFIG.SUPABASE_URL ||
      !CONFIG.SUPABASE_ANON_KEY
    ) {
      console.error(
        "Configuração do Supabase não encontrada."
      );

      return null;
    }

    try {
      return window.supabase.createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_ANON_KEY
      );
    } catch (error) {
      console.error(
        "Erro ao criar cliente Supabase:",
        error
      );

      return null;
    }
  }

  /* =========================================================
     TOAST
  ========================================================= */

  function showToast(message, type = "") {
    const toast = $("#toast");

    if (!toast) {
      alert(message);
      return;
    }

    clearTimeout(toastTimer);

    toast.textContent = message;

    toast.className = "";

    if (type) {
      toast.classList.add(type);
    }

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3200);
  }

  /* =========================================================
     AUTH
  ========================================================= */

  function showLogin() {
    $("#loginScreen")?.classList.remove("hidden");
    $("#app")?.classList.add("hidden");
  }

  async function showApp() {
    $("#loginScreen")?.classList.add("hidden");
    $("#app")?.classList.remove("hidden");

    await loadEverything();

    renderTab(currentTab);
  }

  function setupAuth() {
    const loginForm = $("#loginForm");

    if (!loginForm) {
      return;
    }

    /*
      Não dependemos de id="loginButton".
      O próprio botão submit do formulário é localizado aqui.
    */

    loginForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        if (!client) {
          showToast(
            "Não foi possível conectar ao Supabase.",
            "error"
          );

          return;
        }

        const button =
          loginForm.querySelector(
            'button[type="submit"]'
          );

        const message = $("#loginMsg");

        const formData =
          new FormData(loginForm);

        const email = String(
          formData.get("email") || ""
        ).trim();

        const password = String(
          formData.get("password") || ""
        );

        if (!email || !password) {
          if (message) {
            message.textContent =
              "Informe seu e-mail e sua senha.";
          }

          return;
        }

        if (button) {
          button.disabled = true;
          button.textContent = "Entrando...";
        }

        if (message) {
          message.textContent = "";
        }

        try {
          const { error } =
            await client.auth.signInWithPassword({
              email,
              password
            });

          if (error) {
            console.error(
              "Erro de login:",
              error
            );

            if (message) {
              message.textContent =
                error.message ||
                "Não foi possível entrar.";
            }

            showToast(
              error.message ||
                "E-mail ou senha incorretos.",
              "error"
            );

            return;
          }

          if (message) {
            message.textContent = "";
          }

          await showApp();
        } catch (error) {
          console.error(
            "Erro inesperado no login:",
            error
          );

          showToast(
            "Ocorreu um erro ao tentar entrar.",
            "error"
          );
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = "Entrar";
          }
        }
      }
    );
  }

  async function checkSession() {
    if (!client) {
      showLogin();
      return;
    }

    try {
      const {
        data,
        error
      } = await client.auth.getSession();

      if (error) {
        console.error(
          "Erro ao verificar sessão:",
          error
        );

        showLogin();
        return;
      }

      if (data?.session) {
        await showApp();
      } else {
        showLogin();
      }
    } catch (error) {
      console.error(
        "Erro ao verificar sessão:",
        error
      );

      showLogin();
    }
  }

  function setupAuthListener() {
    if (!client) {
      return;
    }

    client.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "SIGNED_OUT" ||
          !session
        ) {
          showLogin();
        }
      }
    );
  }

  function setupLogout() {
    $("#logout")?.addEventListener(
      "click",
      async () => {
        if (!client) {
          showLogin();
          return;
        }

        try {
          await client.auth.signOut();
        } catch (error) {
          console.error(
            "Erro ao sair:",
            error
          );
        }

        showLogin();
      }
    );
  }

  /* =========================================================
     CARREGAMENTO
  ========================================================= */

  async function loadEverything() {
    state = clone(DEFAULTS || {});

    if (!Array.isArray(state.products)) {
      state.products = [];
    }

    try {
      await loadSettings();
    } catch (error) {
      console.warn(
        "Não foi possível carregar settings:",
        error
      );
    }

    try {
      await loadProducts();
    } catch (error) {
      console.warn(
        "Não foi possível carregar produtos:",
        error
      );
    }

    updateStats();
  }

  async function loadSettings() {
    if (!client) {
      return;
    }

    const {
      data,
      error
    } = await client
      .from("settings")
      .select("value")
      .eq("key", "site")
      .maybeSingle();

    if (error) {
      console.warn(
        "Erro ao carregar settings:",
        error
      );

      return;
    }

    if (data?.value) {
      const remote = data.value;

      state = {
        ...state,
        ...remote,

        about: {
          ...(state.about || {}),
          ...(remote.about || {})
        },

        cake: {
          ...(state.cake || {}),
          ...(remote.cake || {})
        }
      };
    }
  }

  async function loadProducts() {
    if (!client) {
      return;
    }

    const {
      data,
      error
    } = await client
      .from("products")
      .select("*")
      .order("sort", {
        ascending: true
      });

    if (error) {
      console.warn(
        "Erro ao carregar products:",
        error
      );

      return;
    }

    if (Array.isArray(data)) {
      state.products = data;
    }
  }

  /* =========================================================
     SALVAR SETTINGS
  ========================================================= */

  async function saveSettings() {
    if (!client) {
      throw new Error(
        "Supabase não configurado."
      );
    }

    const payload = {
      key: "site",
      value: state
    };

    const {
      error
    } = await client
      .from("settings")
      .upsert(payload, {
        onConflict: "key"
      });

    if (error) {
      throw error;
    }
  }

  /* =========================================================
     STATS
  ========================================================= */

  function updateStats() {
    const products =
      Array.isArray(state.products)
        ? state.products
        : [];

    const available =
      products.filter(
        (product) =>
          product.available !== false
      );

    const statProducts =
      $("#statProducts");

    const statAvailable =
      $("#statAvailable");

    if (statProducts) {
      statProducts.textContent =
        products.length;
    }

    if (statAvailable) {
      statAvailable.textContent =
        available.length;
    }

    /*
      Pedidos e bolos são atualizados
      quando as respectivas tabelas
      estiverem disponíveis.
    */

    loadOptionalStats();
  }

  async function loadOptionalStats() {
    if (!client) {
      return;
    }

    try {
      const result =
        await client
          .from("orders")
          .select("id", {
            count: "exact",
            head: true
          });

      if (!result.error) {
        $("#statOrders").textContent =
          result.count || 0;
      }
    } catch {
      $("#statOrders").textContent = "—";
    }

    try {
      const result =
        await client
          .from("custom_cakes")
          .select("id", {
            count: "exact",
            head: true
          });

      if (!result.error) {
        $("#statCakes").textContent =
          result.count || 0;
      }
    } catch {
      $("#statCakes").textContent = "—";
    }
  }

  /* =========================================================
     TABS
  ========================================================= */

  function setupTabs() {
    $$(".nav button[data-tab]").forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const tab =
              button.dataset.tab;

            if (!tab) {
              return;
            }

            currentTab = tab;

            $$(".nav button").forEach(
              (item) => {
                item.classList.toggle(
                  "active",
                  item === button
                );
              }
            );

            renderTab(tab);

            $("#sidebar")?.classList.remove(
              "open"
            );
          }
        );
      }
    );
  }

  function renderTab(tab) {
    const info =
      TAB_INFO[tab] ||
      TAB_INFO.products;

    $("#pageTitle").textContent =
      info.title;

    $("#pageSubtitle").textContent =
      info.subtitle;

    if (tab === "products") {
      renderProductsTab();
      return;
    }

    if (tab === "orders") {
      renderOrdersTab();
      return;
    }

    if (tab === "cakes") {
      renderCakesTab();
      return;
    }

    if (tab === "content") {
      renderContentTab();
      return;
    }

    if (tab === "hours") {
      renderHoursTab();
      return;
    }

    if (tab === "rules") {
      renderRulesTab();
      return;
    }

    if (tab === "media") {
      renderMediaTab();
      return;
    }

    renderProductsTab();
  }

  /* =========================================================
     MOBILE
  ========================================================= */

  function setupMobileMenu() {
    $("#mobileMenu")?.addEventListener(
      "click",
      () => {
        $("#sidebar")?.classList.toggle(
          "open"
        );
      }
    );
  }

  /* =========================================================
     PRODUCTS
  ========================================================= */

  function renderProductsTab() {
    const container =
      $("#tabContent");

    if (!container) {
      return;
    }

    const products =
      Array.isArray(state.products)
        ? [...state.products]
        : [];

    products.sort(
      (a, b) =>
        Number(a.sort || 0) -
        Number(b.sort || 0)
    );

    const areas = [
      {
        value: "cardapio",
        label: "Delivery"
      },
      {
        value: "pronta-entrega",
        label: "Pronta entrega"
      },
      {
        value: "encomendas",
        label: "Encomendas"
      }
    ];

    container.innerHTML = `
      <div class="section">

        <div class="section-header">

          <div>
            <h3>Produtos</h3>
            <p>
              Cadastre e edite os produtos exibidos no site.
            </p>
          </div>

          <button
            class="btn btn-primary"
            type="button"
            id="newProductBtn"
          >
            + Novo produto
          </button>

        </div>

        <div class="section-body">

          ${
            products.length
              ? areas
                  .map((area) => {
                    const list =
                      products.filter(
                        (product) =>
                          normalizeArea(
                            product.area
                          ) ===
                          area.value
                      );

                    return `
                      <div class="area-group">

                        <div class="area-heading">
                          <h4>
                            ${area.label}
                          </h4>

                          <span class="tag">
                            ${list.length}
                            ${
                              list.length === 1
                                ? "produto"
                                : "produtos"
                            }
                          </span>
                        </div>

                        ${
                          list.length
                            ? `
                              <div class="product-list">
                                ${list
                                  .map(
                                    renderProductRow
                                  )
                                  .join("")}
                              </div>
                            `
                            : `
                              <div class="empty">
                                Nenhum produto nesta área.
                              </div>
                            `
                        }

                      </div>
                    `;
                  })
                  .join("")
              : `
                <div class="empty">

                  <div class="empty-icon">
                    🍰
                  </div>

                  <p>
                    Nenhum produto cadastrado.
                  </p>

                </div>
              `
          }

        </div>
      </div>
    `;

    $("#newProductBtn")?.addEventListener(
      "click",
      () => openProductModal()
    );

    $$(".edit-product").forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            openProductModal(
              button.dataset.id
            );
          }
        );
      }
    );

    $$(".delete-product").forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            deleteProduct(
              button.dataset.id
            );
          }
        );
      }
    );
  }

  function renderProductRow(product) {
    const image =
      getProductImage(product);

    const available =
      product.available !== false;

    const discount =
      Number(
        product.discount_percent || 0
      );

    const finalPrice =
      Number(product.price || 0) *
      (1 - discount / 100);

    return `
      <div class="product-row">

        <div class="product-image">

          ${
            image
              ? `
                <img
                  src="${escapeHTML(
                    image
                  )}"
                  alt="${escapeHTML(
                    product.name
                  )}"
                >
              `
              : "🧁"
          }

        </div>

        <div class="product-info">

          <div class="product-name">
            ${escapeHTML(
              product.name ||
                "Produto sem nome"
            )}
          </div>

          <div class="product-meta">

            ${
              available
                ? `
                  <span class="tag green">
                    Disponível
                  </span>
                `
                : `
                  <span class="tag red">
                    Indisponível
                  </span>
                `
            }

            ${
              product.featured
                ? `
                  <span class="tag yellow">
                    Destaque
                  </span>
                `
                : ""
            }

            ${
              product.appointment_required
                ? `
                  <span class="tag">
                    Agendamento
                  </span>
                `
                : ""
            }

          </div>

        </div>

        <div class="product-price">

          ${
            discount > 0
              ? `
                <span class="old-price">
                  ${money(
                    product.price
                  )}
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
            class="btn btn-secondary btn-small edit-product"
            type="button"
            data-id="${escapeHTML(
              product.id
            )}"
          >
            Editar
          </button>

          <button
            class="btn btn-danger btn-small delete-product"
            type="button"
            data-id="${escapeHTML(
              product.id
            )}"
          >
            Excluir
          </button>

        </div>

      </div>
    `;
  }

  /* =========================================================
     MODAL PRODUTO
  ========================================================= */

  function openProductModal(id = null) {
    const modal =
      $("#productModal");

    const form =
      $("#productForm");

    if (!modal || !form) {
      return;
    }

    editingProductId =
      id ? String(id) : null;

    selectedPhotoData = "";

    form.reset();

    $("#productModalTitle").textContent =
      editingProductId
        ? "Editar produto"
        : "Novo produto";

    setChecked(
      "#productAvailable",
      true
    );

    setValue(
      "#productArea",
      "cardapio"
    );

    setValue(
      "#productDiscount",
      "0"
    );

    setValue(
      "#productSort",
      "0"
    );

    $("#photoPreview").innerHTML =
      "📷";

    if (editingProductId) {
      const product =
        state.products.find(
          (item) =>
            String(item.id) ===
            editingProductId
        );

      if (!product) {
        return;
      }

      setValue(
        "#productName",
        product.name
      );

      setValue(
        "#productArea",
        normalizeArea(
          product.area
        ) || "cardapio"
      );

      setValue(
        "#productPrice",
        product.price
      );

      setValue(
        "#productDiscount",
        product.discount_percent ||
          0
      );

      setValue(
        "#productSort",
        product.sort || 0
      );

      setValue(
        "#productGramatura",
        product.gramatura ?? ""
      );

      setValue(
        "#productServeAte",
        product.serve_ate ?? ""
      );

      setValue(
        "#productDescription",
        product.description || ""
      );

      setChecked(
        "#productAvailable",
        product.available !== false
      );

      setChecked(
        "#productFeatured",
        product.featured
      );

      setChecked(
        "#productAppointment",
        product.appointment_required
      );

      const image =
        getProductImage(product);

      if (image) {
        $("#photoPreview").innerHTML = `
          <img
            src="${escapeHTML(image)}"
            alt="Foto do produto"
          >
        `;
      }
    }

    modal.classList.add("open");
  }

  function closeProductModal() {
    $("#productModal")?.classList.remove(
      "open"
    );

    editingProductId = null;
    selectedPhotoData = "";
  }

  function setupProductModal() {
    $$(
      "[data-close-modal='productModal']"
    ).forEach((button) => {
      button.addEventListener(
        "click",
        closeProductModal
      );
    });

    $("#productModal")?.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          $("#productModal")
        ) {
          closeProductModal();
        }
      }
    );

    $("#productPhoto")?.addEventListener(
      "change",
      handlePhotoSelection
    );

    $("#productForm")?.addEventListener(
      "submit",
      saveProduct
    );
  }

  /* =========================================================
     FOTO
  ========================================================= */

  function handlePhotoSelection(event) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast(
        "Escolha uma imagem válida.",
        "error"
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      selectedPhotoData =
        String(reader.result || "");

      $("#photoPreview").innerHTML = `
        <img
          src="${escapeHTML(
            selectedPhotoData
          )}"
          alt="Prévia da foto"
        >
      `;
    };

    reader.onerror = () => {
      showToast(
        "Não foi possível ler a imagem.",
        "error"
      );
    };

    reader.readAsDataURL(file);
  }

  /* =========================================================
     SALVAR PRODUTO
  ========================================================= */

  async function saveProduct(event) {
    event.preventDefault();

    if (!client) {
      showToast(
        "Supabase não configurado.",
        "error"
      );

      return;
    }

    const button =
      $("#productForm button[type='submit']");

    if (button) {
      button.disabled = true;
      button.textContent =
        "Salvando...";
    }

    try {
      const existing =
        editingProductId
          ? state.products.find(
              (item) =>
                String(item.id) ===
                String(editingProductId)
            )
          : null;

      const product = {
        ...(existing || {}),

        name:
          getValue("#productName")
            .trim(),

        area:
          normalizeArea(
            getValue("#productArea")
          ) || "cardapio",

        price:
          Number(
            getValue("#productPrice") ||
              0
          ),

        discount_percent:
          Number(
            getValue(
              "#productDiscount"
            ) || 0
          ),

        sort:
          Number(
            getValue("#productSort") ||
              0
          ),

        gramatura:
          getValue(
            "#productGramatura"
          ).trim(),

        serve_ate:
          getValue(
            "#productServeAte"
          ).trim(),

        description:
          getValue(
            "#productDescription"
          ).trim(),

        available:
          getChecked(
            "#productAvailable"
          ),

        featured:
          getChecked(
            "#productFeatured"
          ),

        appointment_required:
          getChecked(
            "#productAppointment"
          )
      };

      /*
        Mantemos a categoria existente
        quando editamos um produto.

        O painel não exibe mais o campo
        de categoria.
      */

      if (
        existing &&
        Object.prototype.hasOwnProperty.call(
          existing,
          "category"
        )
      ) {
        product.category =
          existing.category;
      }

      if (
        selectedPhotoData
      ) {
        /*
          A imagem selecionada fica
          disponível imediatamente.
          Se o banco aceitar image_url,
          ela será gravada nesse campo.
        */

        product.image_url =
          selectedPhotoData;
      }

      let result;

      if (editingProductId) {
        result =
          await client
            .from("products")
            .update(product)
            .eq(
              "id",
              editingProductId
            );
      } else {
        /*
          ID é deixado para o banco gerar
          quando houver UUID/default.

          Se a tabela usar texto sem default,
          usamos um ID local.
        */

        if (!product.id) {
          product.id =
            "p_" +
            Date.now() +
            "_" +
            Math.random()
              .toString(36)
              .slice(2, 8);
        }

        result =
          await client
            .from("products")
            .insert(product);
      }

      if (result.error) {
        throw result.error;
      }

      showToast(
        editingProductId
          ? "Produto atualizado com sucesso."
          : "Produto cadastrado com sucesso.",
        "success"
      );

      closeProductModal();

      await loadProducts();

      updateStats();

      renderProductsTab();
    } catch (error) {
      console.error(
        "Erro ao salvar produto:",
        error
      );

      showToast(
        error?.message ||
          "Não foi possível salvar o produto.",
        "error"
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent =
          "Salvar produto";
      }
    }
  }

  /* =========================================================
     EXCLUIR PRODUTO
  ========================================================= */

  async function deleteProduct(id) {
    if (!id || !client) {
      return;
    }

    const product =
      state.products.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    const name =
      product?.name ||
      "este produto";

    const confirmed =
      window.confirm(
        `Deseja realmente excluir "${name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        error
      } = await client
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      state.products =
        state.products.filter(
          (item) =>
            String(item.id) !==
            String(id)
        );

      updateStats();

      renderProductsTab();

      showToast(
        "Produto excluído com sucesso.",
        "success"
      );
    } catch (error) {
      console.error(
        "Erro ao excluir produto:",
        error
      );

      showToast(
        error?.message ||
          "Não foi possível excluir o produto.",
        "error"
      );
    }
  }

  /* =========================================================
     ORDERS
  ========================================================= */

  async function renderOrdersTab() {
    const container =
      $("#tabContent");

    if (!container) {
      return;
    }

    container.innerHTML = `
      <div class="section">

        <div class="section-header">

          <div>
            <h3>Pedidos</h3>
            <p>
              Pedidos armazenados no sistema.
            </p>
          </div>

          <button
            class="btn btn-secondary"
            type="button"
            id="reloadOrders"
          >
            ↻ Atualizar
          </button>

        </div>

        <div class="section-body" id="ordersBody">

          <div class="empty">
            Carregando pedidos...
          </div>

        </div>

      </div>
    `;

    $("#reloadOrders")?.addEventListener(
      "click",
      renderOrdersTab
    );

    if (!client) {
      $("#ordersBody").innerHTML = `
        <div class="empty">
          Supabase não configurado.
        </div>
      `;

      return;
    }

    try {
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
        throw error;
      }

      renderOrders(data || []);
    } catch (error) {
      console.warn(
        "Pedidos não disponíveis:",
        error
      );

      $("#ordersBody").innerHTML = `
        <div class="empty">
          <div class="empty-icon">🛍️</div>
          <p>
            Nenhuma tabela de pedidos disponível
            ou nenhum pedido cadastrado.
          </p>
        </div>
      `;
    }
  }

  function renderOrders(orders) {
    const body =
      $("#ordersBody");

    if (!body) {
      return;
    }

    if (!orders.length) {
      body.innerHTML = `
        <div class="empty">
          <div class="empty-icon">🛍️</div>
          <p>
            Nenhum pedido encontrado.
          </p>
        </div>
      `;

      $("#statOrders").textContent = "0";

      return;
    }

    $("#statOrders").textContent =
      orders.length;

    const keys =
      Object.keys(orders[0] || {});

    body.innerHTML = `
      <div class="table-wrap">

        <table class="data-table">

          <thead>
            <tr>
              ${keys
                .slice(0, 6)
                .map(
                  (key) => `
                    <th>
                      ${escapeHTML(key)}
                    </th>
                  `
                )
                .join("")}
            </tr>
          </thead>

          <tbody>
            ${orders
              .map(
                (order) => `
                  <tr>
                    ${keys
                      .slice(0, 6)
                      .map(
                        (key) => `
                          <td>
                            ${escapeHTML(
                              formatTableValue(
                                order[key]
                              )
                            )}
                          </td>
                        `
                      )
                      .join("")}
                  </tr>
                `
              )
              .join("")}
          </tbody>

        </table>

      </div>
    `;
  }

  /* =========================================================
     BOLOS PERSONALIZADOS
  ========================================================= */

  async function renderCakesTab() {
    const container =
      $("#tabContent");

    if (!container) {
      return;
    }

    container.innerHTML = `
      <div class="section">

        <div class="section-header">

          <div>
            <h3>Bolos personalizados</h3>
            <p>
              Encomendas de bolos personalizados.
            </p>
          </div>

          <button
            class="btn btn-secondary"
            type="button"
            id="reloadCakes"
          >
            ↻ Atualizar
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

    $("#reloadCakes")?.addEventListener(
      "click",
      renderCakesTab
    );

    if (!client) {
      return;
    }

    try {
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
        throw error;
      }

      renderCakes(data || []);
    } catch (error) {
      console.warn(
        "Bolos personalizados não disponíveis:",
        error
      );

      $("#cakesBody").innerHTML = `
        <div class="empty">

          <div class="empty-icon">
            🎂
          </div>

          <p>
            Nenhuma encomenda de bolo personalizado
            encontrada.
          </p>

        </div>
      `;

      $("#statCakes").textContent = "0";
    }
  }

  function renderCakes(cakes) {
    const body =
      $("#cakesBody");

    if (!body) {
      return;
    }

    if (!cakes.length) {
      body.innerHTML = `
        <div class="empty">
          <div class="empty-icon">🎂</div>
          <p>
            Nenhum bolo personalizado encontrado.
          </p>
        </div>
      `;

      $("#statCakes").textContent = "0";

      return;
    }

    $("#statCakes").textContent =
      cakes.length;

    const keys =
      Object.keys(cakes[0] || {});

    body.innerHTML = `
      <div class="table-wrap">

        <table class="data-table">

          <thead>
            <tr>
              ${keys
                .slice(0, 7)
                .map(
                  (key) => `
                    <th>
                      ${escapeHTML(key)}
                    </th>
                  `
                )
                .join("")}
            </tr>
          </thead>

          <tbody>
            ${cakes
              .map(
                (cake) => `
                  <tr>
                    ${keys
                      .slice(0, 7)
                      .map(
                        (key) => `
                          <td>
                            ${escapeHTML(
                              formatTableValue(
                                cake[key]
                              )
                            )}
                          </td>
                        `
                      )
                      .join("")}
                  </tr>
                `
              )
              .join("")}
          </tbody>

        </table>

      </div>
    `;
  }

  /* =========================================================
     CONTEÚDO
  ========================================================= */

  function renderContentTab() {
    const about =
      state.about || {};

    const container =
      $("#tabContent");

    if (!container) {
      return;
    }

    container.innerHTML = `
      <div class="section">

        <div class="section-header">

          <div>
            <h3>História da confeitaria</h3>
            <p>
              Edite o conteúdo da seção "Um pouco da nossa história".
            </p>
          </div>

          <button
            class="btn btn-primary"
            type="button"
            id="saveContentBtn"
          >
            Salvar conteúdo
          </button>

        </div>

        <div class="section-body">

          <div class="field">

            <label for="adminAboutTitle">
              Título
            </label>

            <input
              id="adminAboutTitle"
              type="text"
              value="${escapeHTML(
                about.title || ""
              )}"
            >

          </div>

          <div class="field">

            <label for="adminAboutQuote">
              Frase
            </label>

            <input
              id="adminAboutQuote"
              type="text"
              value="${escapeHTML(
                about.quote || ""
              )}"
            >

          </div>

          <div class="field">

            <label for="adminAboutText">
              História
            </label>

            <textarea
              id="adminAboutText"
              style="min-height:380px;"
            >${escapeHTML(
              about.text || ""
            )}</textarea>

          </div>

        </div>

      </div>
    `;

    $("#saveContentBtn")?.addEventListener(
      "click",
      saveContent
    );
  }

  async function saveContent() {
    state.about = {
      ...(state.about || {}),

      title:
        getValue(
          "#adminAboutTitle"
        ).trim(),

      quote:
        getValue(
          "#adminAboutQuote"
        ).trim(),

      text:
        getValue(
          "#adminAboutText"
        ).trim()
    };

    await saveSettingsWithMessage(
      "Conteúdo salvo com sucesso."
    );
  }

  /* =========================================================
     HORÁRIOS
  ========================================================= */

  function renderHoursTab() {
    const container =
      $("#tabContent");

    if (!container) {
      return;
    }

    const hours =
      Array.isArray(state.hours)
        ? state.hours
        : [];

    const normalized =
      DAYS.map(
        (_, index) =>
          hours[index] || {
            s: "closed",
            o: "",
            c: ""
          }
      );

    container.innerHTML = `
      <div class="section">

        <div class="section-header">

          <div>
            <h3>Horários de funcionamento</h3>
            <p>
              Configure os horários exibidos no site.
            </p>
          </div>

          <button
            class="btn btn-primary"
            type="button"
            id="saveHoursBtn"
          >
            Salvar horários
          </button>

        </div>

        <div class="section-body">

          ${DAYS.map(
            (day, index) => {
              const item =
                normalized[index];

              return `
                <div
                  class="setting-card"
                  data-day-index="${index}"
                >

                  <h4>
                    ${day}
                  </h4>

                  <div class="grid-3">

                    <div class="field">

                      <label>
                        Situação
                      </label>

                      <select
                        class="hour-status"
                      >

                        <option
                          value="open"
                          ${
                            item.s ===
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
                            item.s ===
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
                            item.s ===
                            "tbd"
                              ? "selected"
                              : ""
                          }
                        >
                          A confirmar
                        </option>

                      </select>

                    </div>

                    <div class="field">

                      <label>
                        Abertura
                      </label>

                      <input
                        class="hour-open"
                        type="time"
                        value="${escapeHTML(
                          item.o || ""
                        )}"
                      >

                    </div>

                    <div class="field">

                      <label>
                        Fechamento
                      </label>

                      <input
                        class="hour-close"
                        type="time"
                        value="${escapeHTML(
                          item.c || ""
                        )}"
                      >

                    </div>

                  </div>

                </div>
              `;
            }
          ).join("")}

        </div>

      </div>
    `;

    $("#saveHoursBtn")?.addEventListener(
      "click",
      saveHours
    );
  }

  async function saveHours() {
    const hours = [];

    $$(".setting-card[data-day-index]").forEach(
      (card) => {
        hours.push({
          s:
            $(".hour-status", card)
              ?.value || "closed",

          o:
            $(".hour-open", card)
              ?.value || "",

          c:
            $(".hour-close", card)
              ?.value || ""
        });
      }
    );

    state.hours = hours;

    await saveSettingsWithMessage(
      "Horários salvos com sucesso."
    );
  }

  /* =========================================================
     REGRAS
  ========================================================= */

  function renderRulesTab() {
    const container =
      $("#tabContent");

    if (!container) {
      return;
    }

    const cake =
      state.cake || {};

    const masses =
      Array.isArray(cake.masses)
        ? cake.masses.join("\n")
        : "";

    const fillings =
      Array.isArray(cake.fillings)
        ? cake.fillings.join("\n")
        : "";

    container.innerHTML = `
      <div class="section">

        <div class="section-header">

          <div>
            <h3>Regras e opções</h3>
            <p>
              Configure as opções utilizadas nas encomendas.
            </p>
          </div>

          <button
            class="btn btn-primary"
            type="button"
            id="saveRulesBtn"
          >
            Salvar regras
          </button>

        </div>

        <div class="section-body">

          <div class="setting-card">

            <h4>
              Massas
            </h4>

            <div class="field">

              <label for="adminMasses">
                Uma opção por linha
              </label>

              <textarea
                id="adminMasses"
              >${escapeHTML(
                masses
              )}</textarea>

            </div>

          </div>

          <div class="setting-card">

            <h4>
              Recheios
            </h4>

            <div class="field">

              <label for="adminFillings">
                Uma opção por linha
              </label>

              <textarea
                id="adminFillings"
              >${escapeHTML(
                fillings
              )}</textarea>

            </div>

          </div>

        </div>

      </div>
    `;

    $("#saveRulesBtn")?.addEventListener(
      "click",
      saveRules
    );
  }

  async function saveRules() {
    state.cake = {
      ...(state.cake || {}),

      masses:
        getValue(
          "#adminMasses"
        )
          .split("\n")
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean),

      fillings:
        getValue(
          "#adminFillings"
        )
          .split("\n")
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean)
    };

    await saveSettingsWithMessage(
      "Regras salvas com sucesso."
    );
  }

  /* =========================================================
     MÍDIA
  ========================================================= */

  function renderMediaTab() {
    const container =
      $("#tabContent");

    if (!container) {
      return;
    }

    container.innerHTML = `
      <div class="section">

        <div class="section-header">

          <div>
            <h3>Mídia</h3>
            <p>
              Informações de mídia utilizadas pelo site.
            </p>
          </div>

        </div>

        <div class="section-body">

          <div class="setting-card">

            <h4>
              Imagens dos produtos
            </h4>

            <p style="color:var(--muted);font-size:13px;">
              As fotos dos produtos podem ser escolhidas
              diretamente no cadastro ou edição de cada produto.
            </p>

          </div>

          <div class="setting-card">

            <h4>
              Logo
            </h4>

            <p style="color:var(--muted);font-size:13px;">
              O site utiliza a identidade visual configurada
              nos arquivos principais do projeto.
            </p>

          </div>

        </div>

      </div>
    `;
  }

  /* =========================================================
     SALVAR SETTINGS COM MENSAGEM
  ========================================================= */

  async function saveSettingsWithMessage(
    successMessage
  ) {
    try {
      await saveSettings();

      showToast(
        successMessage,
        "success"
      );
    } catch (error) {
      console.error(
        "Erro ao salvar configurações:",
        error
      );

      showToast(
        error?.message ||
          "Não foi possível salvar as configurações.",
        "error"
      );
    }
  }

  /* =========================================================
     FORMATAÇÃO DE TABELAS
  ========================================================= */

  function formatTableValue(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value === "object"
    ) {
      try {
        return JSON.stringify(value);
      } catch {
        return "";
      }
    }

    return String(value);
  }

  /* =========================================================
     REFRESH
  ========================================================= */

  function setupRefresh() {
    $("#refreshBtn")?.addEventListener(
      "click",
      async () => {
        const button =
          $("#refreshBtn");

        if (button) {
          button.disabled = true;
          button.textContent =
            "↻ Carregando...";
        }

        try {
          await loadEverything();

          renderTab(
            currentTab
          );

          showToast(
            "Painel atualizado.",
            "success"
          );
        } catch (error) {
          console.error(error);

          showToast(
            "Não foi possível atualizar.",
            "error"
          );
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent =
              "↻ Atualizar";
          }
        }
      }
    );
  }

  /* =========================================================
     FECHAR MODAIS COM ESC
  ========================================================= */

  function setupEscape() {
    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key ===
          "Escape"
        ) {
          closeProductModal();

          $("#sidebar")?.classList.remove(
            "open"
          );
        }
      }
    );
  }

  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  async function init() {
    client =
      initSupabase();

    setupAuth();
    setupAuthListener();
    setupLogout();
    setupTabs();
    setupMobileMenu();
    setupProductModal();
    setupRefresh();
    setupEscape();

    await checkSession();
  }

  /* =========================================================
     PROTEÇÃO
  ========================================================= */

  window.addEventListener(
    "error",
    (event) => {
      console.error(
        "Erro no painel administrativo:",
        event.error ||
          event.message
      );
    }
  );

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
