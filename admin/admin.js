/* =========================================================
   MARTINS CONFEITARIA — PAINEL ADMINISTRATIVO
   admin/admin.js
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     CONFIGURAÇÃO
     ========================================================= */

  const CONFIG = window.MARTINS_CONFIG || {};

  if (!window.supabase) {
    console.error("Supabase JS não foi carregado.");
    return;
  }

  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
    console.error("Configuração do Supabase não encontrada.");
    return;
  }

  const db = window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_ANON_KEY
  );

  const DEFAULTS = window.MARTINS_DEFAULTS || {};

  const PRODUCT_AREAS = {
    delivery: "Delivery",
    encomendas: "Encomendas"
  };

  let state = clone(DEFAULTS);

  let products = [];
  let orders = [];
  let cakeOrders = [];

  let editingProductId = null;
  let currentTab = "products";

  let classifications = [];

  /* =========================================================
     UTILITÁRIOS
     ========================================================= */

  function clone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(value) {
    const number = Number(value || 0);

    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function showMessage(element, message, type = "error") {
    if (!element) return;

    element.textContent = message;
    element.dataset.type = type;
    element.style.display = message ? "block" : "none";
  }

  function generateId(prefix = "id") {
    if (window.crypto && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID()}`;
    }

    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
  }

  function normalizeClassification(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  /* =========================================================
     CLASSIFICAÇÕES
     
     Delivery e Pronta entrega NÃO são classificações.
     A classificação é algo como:
     - Bolos
     - Brownies
     - Sobremesas
     - Bolos no pote
     - etc.
     ========================================================= */

  function getDefaultClassifications() {
    const defaults = Array.isArray(DEFAULTS.categories)
      ? DEFAULTS.categories
      : [];

    return defaults
      .map(normalizeClassification)
      .filter(Boolean);
  }

  function loadClassificationsFromState() {
    const saved =
      state &&
      state.admin &&
      Array.isArray(state.admin.classifications)
        ? state.admin.classifications
        : null;

    if (saved && saved.length) {
      classifications = saved
        .map(normalizeClassification)
        .filter(Boolean);
    } else {
      classifications = getDefaultClassifications();
    }

    classifications = [...new Set(classifications)];
  }

  function saveClassificationsToState() {
    if (!state.admin || typeof state.admin !== "object") {
      state.admin = {};
    }

    state.admin.classifications = [...classifications];
  }

  function renderClassificationOptions(selected = "") {
    const select = $("#productClassification");

    if (!select) return;

    const current = normalizeClassification(selected);

    select.innerHTML = `
      <option value="">Selecione uma classificação</option>
      ${classifications
        .map((item) => {
          const selectedAttr =
            item === current ? " selected" : "";

          return `
            <option value="${escapeHTML(item)}"${selectedAttr}>
              ${escapeHTML(item)}
            </option>
          `;
        })
        .join("")}
    `;
  }

  function createClassification() {
    const value = window.prompt(
      "Digite o nome da nova classificação:"
    );

    if (value === null) return;

    const name = normalizeClassification(value);

    if (!name) {
      alert("Digite um nome válido.");
      return;
    }

    const exists = classifications.some(
      (item) => item.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      alert("Essa classificação já existe.");
      return;
    }

    classifications.push(name);
    classifications.sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );

    saveClassificationsToState();
    renderClassificationOptions(name);

    saveSettings().catch((error) => {
      console.error(error);
      alert(
        "A classificação foi criada localmente, mas não foi possível salvar no Supabase."
      );
    });
  }

  function removeClassification() {
    const select = $("#productClassification");

    if (!select || !select.value) {
      alert("Selecione uma classificação primeiro.");
      return;
    }

    const selected = select.value;

    const confirmed = window.confirm(
      `Excluir a classificação "${selected}"?\n\nOs produtos existentes não serão apagados.`
    );

    if (!confirmed) return;

    classifications = classifications.filter(
      (item) => item !== selected
    );

    saveClassificationsToState();
    renderClassificationOptions("");

    saveSettings().catch((error) => {
      console.error(error);
      alert(
        "A classificação foi removida localmente, mas houve um erro ao salvar."
      );
    });
  }

  /* =========================================================
     LOGO / IDENTIDADE
     ========================================================= */

  function findLogoUrl() {
    const candidates = [
      state?.media?.logo,
      state?.media?.logo_url,
      state?.logo,
      state?.logo_url,
      "../assets/logo.png",
      "../logo.png",
      "../assets/logo.webp"
    ];

    return candidates.find(Boolean) || "";
  }

  function applyMartinsBrand() {
    const logoUrl = findLogoUrl();

    const loginLogoWrap = $("#loginLogoWrap");

    if (loginLogoWrap && logoUrl) {
      loginLogoWrap.innerHTML = `
        <img
          src="${escapeHTML(logoUrl)}"
          alt="Martins Confeitaria"
          style="
            max-width:140px;
            max-height:90px;
            width:auto;
            height:auto;
            object-fit:contain;
            display:block;
            margin:auto;
          "
          onerror="this.style.display='none'"
        >
      `;
    }

    document.documentElement.style.setProperty(
      "--blue",
      "#67b0cb"
    );

    document.documentElement.style.setProperty(
      "--blue-dark",
      "#2b7896"
    );

    document.documentElement.style.setProperty(
      "--pink",
      "#f3b7bb"
    );

    document.documentElement.style.setProperty(
      "--white",
      "#ffffff"
    );

    document.documentElement.style.setProperty(
      "--primary",
      "#67b0cb"
    );

    document.documentElement.style.setProperty(
      "--primary-dark",
      "#2b7896"
    );

    const brandElements = $$(
      ".login-brand h1, .brand-name, .sidebar-brand h1"
    );

    brandElements.forEach((element) => {
      element.style.color = "#2b7896";
    });
  }

  /* =========================================================
     LOGIN
     ========================================================= */

  async function checkSession() {
    try {
      const {
        data,
        error
      } = await db.auth.getSession();

      if (error) {
        throw error;
      }

      if (data?.session) {
        showApp();
      } else {
        showLogin();
      }
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      showLogin();
    }
  }

  function showLogin() {
    const login = $("#loginScreen");
    const app = $("#app");

    if (login) {
      login.classList.remove("hidden");
      login.style.display = "";
    }

    if (app) {
      app.classList.add("hidden");
    }
  }

  async function showApp() {
    const login = $("#loginScreen");
    const app = $("#app");

    if (login) {
      login.classList.add("hidden");
    }

    if (app) {
      app.classList.remove("hidden");
      app.style.display = "";
    }

    await loadAll();
  }

  async function handleLogin(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const emailInput =
      $("#loginEmail", form) || $("#loginEmail");

    const passwordInput =
      $("#loginPassword", form) || $("#loginPassword");

    const message =
      $("#loginMsg") ||
      form.querySelector(".login-msg");

    const submitButton =
      form.querySelector('button[type="submit"]');

    const email = emailInput?.value?.trim() || "";
    const password = passwordInput?.value || "";

    if (!email || !password) {
      showMessage(
        message,
        "Informe o e-mail e a senha."
      );
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.originalText =
        submitButton.textContent;
      submitButton.textContent = "Entrando...";
    }

    showMessage(message, "");

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
          "Login realizado, mas nenhuma sessão foi criada."
        );
      }

      showMessage(
        message,
        "Login realizado com sucesso.",
        "success"
      );

      await showApp();
    } catch (error) {
      console.error(error);

      showMessage(
        message,
        error?.message ||
          "Não foi possível entrar. Verifique o e-mail e a senha."
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent =
          submitButton.dataset.originalText ||
          "Entrar";
      }
    }
  }

  async function logout() {
    try {
      await db.auth.signOut();
    } catch (error) {
      console.error(error);
    }

    showLogin();
  }

  /* =========================================================
     SUPABASE — SETTINGS
     ========================================================= */

  async function loadSettings() {
    const {
      data,
      error
    } = await db
      .from("settings")
      .select("*")
      .eq("key", "site")
      .maybeSingle();

    if (error) {
      console.warn(
        "Não foi possível carregar settings:",
        error
      );
      return;
    }

    if (data?.value) {
      const saved =
        typeof data.value === "string"
          ? JSON.parse(data.value)
          : data.value;

      if (saved && typeof saved === "object") {
        state = {
          ...clone(DEFAULTS),
          ...saved
        };
      }
    }

    loadClassificationsFromState();
  }

  async function saveSettings() {
    saveClassificationsToState();

    const {
      error
    } = await db
      .from("settings")
      .upsert(
        {
          key: "site",
          value: state
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
     SUPABASE — PRODUCTS
     ========================================================= */

  async function loadProducts() {
    const {
      data,
      error
    } = await db
      .from("products")
      .select("*")
      .order("sort", {
        ascending: true
      });

    if (error) {
      console.error(
        "Erro carregando produtos:",
        error
      );

      products = [];
      return;
    }

    products = Array.isArray(data)
      ? data
      : [];
  }

  /* =========================================================
     PEDIDOS — MÓDULO OPCIONAL
     ========================================================= */

  async function loadOrders() {
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
        orders = [];
        return;
      }

      orders = Array.isArray(data)
        ? data
        : [];
    } catch {
      orders = [];
    }
  }

  /* =========================================================
     ENCOMENDAS — MÓDULO OPCIONAL
     ========================================================= */

  async function loadCakeOrders() {
    const possibleTables = [
      "custom_cakes",
      "cake_orders",
      "encomendas"
    ];

    for (const table of possibleTables) {
      try {
        const {
          data,
          error
        } = await db
          .from(table)
          .select("*")
          .order("created_at", {
            ascending: false
          });

        if (!error && Array.isArray(data)) {
          cakeOrders = data;
          return;
        }
      } catch {
        // tenta a próxima tabela
      }
    }

    cakeOrders = [];
  }

  /* =========================================================
     CARREGAMENTO GERAL
     ========================================================= */

  async function loadAll() {
    setLoading(true);

    try {
      await Promise.all([
        loadSettings(),
        loadProducts(),
        loadOrders(),
        loadCakeOrders()
      ]);

      applyMartinsBrand();
      updateStats();
      renderCurrentTab();
    } catch (error) {
      console.error(
        "Erro carregando painel:",
        error
      );

      alert(
        "Algumas informações não puderam ser carregadas. Verifique o console."
      );
    } finally {
      setLoading(false);
    }
  }

  function setLoading(isLoading) {
    document.body.dataset.loading = isLoading
      ? "true"
      : "false";
  }

  /* =========================================================
     ESTATÍSTICAS
     ========================================================= */

  function updateStats() {
    const total = products.length;

    const available = products.filter(
      (product) =>
        product.available !== false
    ).length;

    const statProducts = $("#statProducts");
    const statAvailable = $("#statAvailable");
    const statOrders = $("#statOrders");
    const statCakes = $("#statCakes");

    if (statProducts) {
      statProducts.textContent = total;
    }

    if (statAvailable) {
      statAvailable.textContent = available;
    }

    if (statOrders) {
      statOrders.textContent = orders.length;
    }

    if (statCakes) {
      statCakes.textContent = cakeOrders.length;
    }
  }

  /* =========================================================
     PRODUTOS — IMAGEM
     ========================================================= */

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();

        image.onload = () => {
          const maxSize = 1000;

          let width = image.width;
          let height = image.height;

          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(
              maxSize / width,
              maxSize / height
            );

            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas =
            document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

          const context =
            canvas.getContext("2d");

          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          const dataUrl =
            canvas.toDataURL(
              "image/jpeg",
              0.78
            );

          resolve(dataUrl);
        };

        image.onerror = () => {
          reject(
            new Error(
              "Não foi possível processar a imagem."
            )
          );
        };

        image.src = reader.result;
      };

      reader.onerror = () => {
        reject(
          new Error(
            "Não foi possível ler a imagem."
          )
        );
      };

      reader.readAsDataURL(file);
    });
  }

  /* =========================================================
     PRODUTOS — MODAL
     ========================================================= */

  function getProductModal() {
    return $("#productModal");
  }

  function openProductModal(product = null) {
    const modal = getProductModal();
    const form = $("#productForm");

    if (!modal || !form) return;

    editingProductId = product?.id || null;

    form.reset();

    const title =
      modal.querySelector(
        ".modal-title, h2, h3"
      );

    if (title) {
      title.textContent = product
        ? "Editar produto"
        : "Novo produto";
    }

    const name = $("#productName");
    const price = $("#productPrice");
    const discount = $("#productDiscount");
    const sort = $("#productSort");
    const gramatura = $("#productGramatura");
    const serveAte = $("#productServeAte");
    const description = $("#productDescription");
    const available = $("#productAvailable");
    const featured = $("#productFeatured");
    const appointment = $("#productAppointment");
    const photo = $("#productPhoto");

    /* Área não é mais usada como classificação.
       Naked Cake / Chantininho ficam em Encomendas. */

    const area =
      $("#productArea");

    if (product) {
      if (name) {
        name.value = product.name || "";
      }

      if (price) {
        price.value =
          product.price ?? "";
      }

      if (discount) {
        discount.value =
          product.discount_percent ?? "";
      }

      if (sort) {
        sort.value =
          product.sort ?? 0;
      }

      if (gramatura) {
        gramatura.value =
          product.gramatura || "";
      }

      if (serveAte) {
        serveAte.value =
          product.serve_ate || "";
      }

      if (description) {
        description.value =
          product.description || "";
      }

      if (available) {
        available.checked =
          product.available !== false;
      }

      if (featured) {
        featured.checked =
          product.featured === true;
      }

      if (appointment) {
        appointment.checked =
          product.appointment_required === true;
      }

      if (photo) {
        photo.value = "";
      }

      renderClassificationOptions(
        product.category || ""
      );

      if (area) {
        /*
          Delivery e Pronta Entrega são a mesma coisa.
          Para produtos comuns usamos Delivery.
          Produtos de encomenda ficam em Encomendas.
        */
        const currentArea =
          String(product.area || "")
            .toLowerCase();

        if (
          currentArea.includes("encom") ||
          currentArea.includes("bolo")
        ) {
          area.value = "encomendas";
        } else {
          area.value = "delivery";
        }
      }
    } else {
      if (available) {
        available.checked = true;
      }

      if (featured) {
        featured.checked = false;
      }

      if (appointment) {
        appointment.checked = false;
      }

      if (sort) {
        sort.value = products.length + 1;
      }

      renderClassificationOptions("");

      if (area) {
        area.value = "delivery";
      }
    }

    modal.classList.remove("hidden");
    modal.style.display = "flex";

    document.body.classList.add(
      "modal-open"
    );
  }

  function closeProductModal() {
    const modal = getProductModal();

    if (!modal) return;

    modal.classList.add("hidden");
    modal.style.display = "none";

    document.body.classList.remove(
      "modal-open"
    );

    editingProductId = null;
  }

  /* =========================================================
     PRODUTOS — SALVAR
     ========================================================= */

  async function saveProduct(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const name =
      $("#productName")?.value?.trim() || "";

    const price =
      Number($("#productPrice")?.value || 0);

    const discount =
      Number(
        $("#productDiscount")?.value || 0
      );

    const sort =
      Number($("#productSort")?.value || 0);

    const gramatura =
      $("#productGramatura")?.value?.trim() ||
      "";

    const serveAte =
      $("#productServeAte")?.value?.trim() ||
      "";

    const description =
      $("#productDescription")?.value?.trim() ||
      "";

    const available =
      $("#productAvailable")?.checked !== false;

    const featured =
      $("#productFeatured")?.checked === true;

    const appointment =
      $("#productAppointment")?.checked === true;

    const classification =
      normalizeClassification(
        $("#productClassification")?.value || ""
      );

    const areaValue =
      $("#productArea")?.value || "delivery";

    const photoFile =
      $("#productPhoto")?.files?.[0] || null;

    if (!name) {
      alert("Informe o nome do produto.");
      return;
    }

    if (!price || price < 0) {
      alert("Informe um preço válido.");
      return;
    }

    if (!classification) {
      alert(
        "Selecione uma classificação para o produto."
      );
      return;
    }

    const existing =
      editingProductId
        ? products.find(
            (item) =>
              String(item.id) ===
              String(editingProductId)
          )
        : null;

    const saveButton =
      form.querySelector(
        'button[type="submit"]'
      );

    if (saveButton) {
      saveButton.disabled = true;
      saveButton.dataset.originalText =
        saveButton.textContent;
      saveButton.textContent =
        "Salvando...";
    }

    try {
      let imageUrl =
        existing?.image_url ||
        existing?.image ||
        existing?.photo_url ||
        existing?.photo ||
        existing?.imagem ||
        existing?.foto ||
        "";

      if (photoFile) {
        imageUrl =
          await compressImage(photoFile);
      }

      /*
        IMPORTANTE:
        A classificação é salva no campo "category"
        da tabela products.

        A interface não mostra mais "Categoria".
        O usuário vê "Classificação".
      */

      const productData = {
        id:
          existing?.id ||
          generateId("product"),

        name,

        price,

        category: classification,

        /*
          Delivery e Pronta Entrega são tratados
          como uma única área.

          Encomendas continua separado para
          Naked Cake, Chantininho etc.
        */
        area:
          areaValue === "encomendas"
            ? "encomendas"
            : "delivery",

        discount_percent:
          discount >= 0
            ? discount
            : 0,

        sort,

        gramatura,

        serve_ate: serveAte,

        description,

        available,

        featured,

        appointment_required:
          appointment,

        ...(imageUrl
          ? {
              image_url: imageUrl
            }
          : {})
      };

      const {
        error
      } = await db
        .from("products")
        .upsert(productData);

      if (error) {
        throw error;
      }

      await loadProducts();

      updateStats();
      renderProducts();

      closeProductModal();

      alert(
        existing
          ? "Produto atualizado com sucesso."
          : "Produto criado com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro salvando produto:",
        error
      );

      alert(
        error?.message ||
          "Não foi possível salvar o produto."
      );
    } finally {
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent =
          saveButton.dataset.originalText ||
          "Salvar";
      }
    }
  }

  /* =========================================================
     PRODUTOS — EXCLUIR
     ========================================================= */

  async function deleteProduct(id) {
    const product = products.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (!product) return;

    const confirmed = window.confirm(
      `Excluir "${product.name}"?\n\nEssa ação não pode ser desfeita.`
    );

    if (!confirmed) return;

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

      await loadProducts();

      updateStats();
      renderProducts();
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "Não foi possível excluir o produto."
      );
    }
  }

  /* =========================================================
     PRODUTOS — DISPONIBILIDADE
     ========================================================= */

  async function toggleProduct(id) {
    const product = products.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (!product) return;

    const newValue =
      product.available === false;

    try {
      const {
        error
      } = await db
        .from("products")
        .update({
          available: newValue
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      product.available = newValue;

      updateStats();
      renderProducts();
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "Não foi possível alterar a disponibilidade."
      );
    }
  }

  /* =========================================================
     PRODUTOS — LISTAGEM
     ========================================================= */

  function renderProducts() {
    const container =
      $("#tabContent");

    if (!container) return;

    const search =
      (
        $("#productSearch")?.value ||
        ""
      )
        .trim()
        .toLowerCase();

    let filtered = [...products];

    if (search) {
      filtered = filtered.filter(
        (product) => {
          const text = [
            product.name,
            product.category,
            product.description,
            product.area
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(search);
        }
      );
    }

    if (!filtered.length) {
      container.innerHTML = `
        <div class="admin-empty">
          <h3>Nenhum produto encontrado</h3>
          <p>
            ${
              products.length
                ? "Tente outra busca."
                : "Cadastre o primeiro produto."
            }
          </p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="admin-section-head">
        <div>
          <h2>Produtos</h2>
          <p>
            Gerencie os produtos do cardápio e das encomendas.
          </p>
        </div>

        <button
          type="button"
          class="btn btn-primary"
          data-action="new-product"
        >
          + Novo produto
        </button>
      </div>

      <div class="product-toolbar">
        <input
          id="productSearch"
          type="search"
          placeholder="Buscar produto..."
          value="${escapeHTML(search)}"
        >

        <button
          type="button"
          class="btn"
          data-action="new-classification"
        >
          + Classificação
        </button>
      </div>

      <div class="classification-list">
        ${classifications
          .map(
            (item) => `
              <span class="classification-chip">
                ${escapeHTML(item)}
              </span>
            `
          )
          .join("")}
      </div>

      <div class="admin-products-list">
        ${filtered
          .map(renderProductCard)
          .join("")}
      </div>
    `;

    const searchInput =
      $("#productSearch");

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        renderProducts
      );
    }
  }

  function renderProductCard(product) {
    const image =
      product.image_url ||
      product.image ||
      product.photo_url ||
      product.photo ||
      product.imagem ||
      product.foto ||
      "";

    const isAvailable =
      product.available !== false;

    const area =
      String(product.area || "")
        .toLowerCase()
        .includes("encom")
        ? "Encomendas"
        : "Delivery";

    return `
      <article
        class="admin-product-card"
        data-product-id="${escapeHTML(
          product.id
        )}"
      >

        <div class="admin-product-image">
          ${
            image
              ? `
                <img
                  src="${escapeHTML(image)}"
                  alt="${escapeHTML(
                    product.name
                  )}"
                >
              `
              : `
                <div class="product-image-placeholder">
                  🍰
                </div>
              `
          }
        </div>

        <div class="admin-product-info">

          <div class="admin-product-top">
            <div>
              <h3>
                ${escapeHTML(
                  product.name
                )}
              </h3>

              <span class="product-classification">
                ${escapeHTML(
                  product.category ||
                    "Sem classificação"
                )}
              </span>
            </div>

            <strong>
              ${money(product.price)}
            </strong>
          </div>

          <div class="product-meta">
            <span>
              ${escapeHTML(area)}
            </span>

            ${
              product.gramatura
                ? `
                  <span>
                    ${escapeHTML(
                      product.gramatura
                    )}
                  </span>
                `
                : ""
            }

            ${
              product.serve_ate
                ? `
                  <span>
                    Serve até ${escapeHTML(
                      product.serve_ate
                    )}
                  </span>
                `
                : ""
            }
          </div>

          ${
            product.description
              ? `
                <p>
                  ${escapeHTML(
                    product.description
                  )}
                </p>
              `
              : ""
          }

          <div class="product-status">
            <span class="${
              isAvailable
                ? "status-on"
                : "status-off"
            }">
              ${
                isAvailable
                  ? "Disponível"
                  : "Indisponível"
              }
            </span>
          </div>

          <div class="product-actions">

            <button
              type="button"
              class="btn"
              data-action="edit-product"
              data-id="${escapeHTML(
                product.id
              )}"
            >
              Editar
            </button>

            <button
              type="button"
              class="btn"
              data-action="toggle-product"
              data-id="${escapeHTML(
                product.id
              )}"
            >
              ${
                isAvailable
                  ? "Desativar"
                  : "Ativar"
              }
            </button>

            <button
              type="button"
              class="btn btn-danger"
              data-action="delete-product"
              data-id="${escapeHTML(
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
     CONTEÚDO
     ========================================================= */

  function renderContent() {
    const container = $("#tabContent");

    if (!container) return;

    const about = state.about || {};
    const address = Array.isArray(
      state.address
    )
      ? state.address.join("\n")
      : state.address || "";

    container.innerHTML = `
      <div class="admin-section-head">
        <div>
          <h2>Conteúdo</h2>
          <p>
            Edite as informações principais da Martins Confeitaria.
          </p>
        </div>
      </div>

      <form id="contentForm" class="admin-form">

        <div class="field">
          <label>Nome</label>
          <input
            id="contentName"
            value="${escapeHTML(
              state.name || ""
            )}"
          >
        </div>

        <div class="field">
          <label>WhatsApp</label>
          <input
            id="contentWhatsapp"
            value="${escapeHTML(
              state.whatsapp || ""
            )}"
          >
        </div>

        <div class="field">
          <label>Instagram</label>
          <input
            id="contentInstagram"
            value="${escapeHTML(
              state.instagram || ""
            )}"
          >
        </div>

        <div class="field">
          <label>Endereço</label>
          <textarea id="contentAddress">${escapeHTML(
            address
          )}</textarea>
        </div>

        <div class="field">
          <label>Google Maps</label>
          <input
            id="contentMaps"
            value="${escapeHTML(
              state.maps || ""
            )}"
          >
        </div>

        <div class="field">
          <label>Link de avaliação</label>
          <input
            id="contentReview"
            value="${escapeHTML(
              state.review || ""
            )}"
          >
        </div>

        <div class="field">
          <label>Título da história</label>
          <input
            id="contentAboutTitle"
            value="${escapeHTML(
              about.title || ""
            )}"
          >
        </div>

        <div class="field">
          <label>Frase</label>
          <input
            id="contentAboutQuote"
            value="${escapeHTML(
              about.quote || ""
            )}"
          >
        </div>

        <div class="field">
          <label>História</label>
          <textarea
            id="contentAboutText"
            rows="12"
          >${escapeHTML(
            about.text || ""
          )}</textarea>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
        >
          Salvar conteúdo
        </button>

      </form>
    `;

    $("#contentForm")?.addEventListener(
      "submit",
      saveContent
    );
  }

  async function saveContent(event) {
    event.preventDefault();

    state.name =
      $("#contentName")?.value?.trim() ||
      state.name;

    state.whatsapp =
      $("#contentWhatsapp")?.value?.trim() ||
      state.whatsapp;

    state.instagram =
      $("#contentInstagram")?.value?.trim() ||
      state.instagram;

    state.address =
      ($("#contentAddress")?.value || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    state.maps =
      $("#contentMaps")?.value?.trim() ||
      "";

    state.review =
      $("#contentReview")?.value?.trim() ||
      "";

    if (!state.about) {
      state.about = {};
    }

    state.about.title =
      $("#contentAboutTitle")
        ?.value?.trim() || "";

    state.about.quote =
      $("#contentAboutQuote")
        ?.value?.trim() || "";

    state.about.text =
      $("#contentAboutText")
        ?.value || "";

    try {
      await saveSettings();

      applyMartinsBrand();

      alert(
        "Conteúdo salvo com sucesso."
      );
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "Não foi possível salvar o conteúdo."
      );
    }
  }

  /* =========================================================
     HORÁRIOS
     ========================================================= */

  function renderHours() {
    const container = $("#tabContent");

    if (!container) return;

    const days = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado"
    ];

    const hours = Array.isArray(
      state.hours
    )
      ? state.hours
      : [];

    container.innerHTML = `
      <div class="admin-section-head">
        <div>
          <h2>Horários</h2>
          <p>
            Configure os horários de funcionamento.
          </p>
        </div>
      </div>

      <form id="hoursForm">

        <div class="hours-list">

          ${days
            .map((day, index) => {
              const item =
                hours[index] || {
                  s: "closed",
                  o: "",
                  c: ""
                };

              return `
                <div
                  class="hour-row"
                  data-day="${index}"
                >
                  <strong>
                    ${day}
                  </strong>

                  <select
                    class="hour-status"
                    data-index="${index}"
                  >
                    <option
                      value="open"
                      ${
                        item.s === "open"
                          ? "selected"
                          : ""
                      }
                    >
                      Aberto
                    </option>

                    <option
                      value="closed"
                      ${
                        item.s === "closed"
                          ? "selected"
                          : ""
                      }
                    >
                      Fechado
                    </option>

                    <option
                      value="tbd"
                      ${
                        item.s === "tbd"
                          ? "selected"
                          : ""
                      }
                    >
                      A confirmar
                    </option>
                  </select>

                  <input
                    type="time"
                    class="hour-open"
                    data-index="${index}"
                    value="${escapeHTML(
                      item.o || ""
                    )}"
                  >

                  <input
                    type="time"
                    class="hour-close"
                    data-index="${index}"
                    value="${escapeHTML(
                      item.c || ""
                    )}"
                  >
                </div>
              `;
            })
            .join("")}

        </div>

        <button
          type="submit"
          class="btn btn-primary"
        >
          Salvar horários
        </button>

      </form>
    `;

    $("#hoursForm")?.addEventListener(
      "submit",
      saveHours
    );
  }

  async function saveHours(event) {
    event.preventDefault();

    const days = $$(".hour-status");

    state.hours = days.map(
      (select, index) => {
        const open =
          $(
            `.hour-open[data-index="${index}"]`
          )?.value || "";

        const close =
          $(
            `.hour-close[data-index="${index}"]`
          )?.value || "";

        return {
          s: select.value,
          o:
            select.value === "open"
              ? open
              : "",
          c:
            select.value === "open"
              ? close
              : ""
        };
      }
    );

    try {
      await saveSettings();

      alert(
        "Horários salvos com sucesso."
      );
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "Não foi possível salvar os horários."
      );
    }
  }

  /* =========================================================
     REGRAS DE ENCOMENDAS
     ========================================================= */

  function renderRules() {
    const container = $("#tabContent");

    if (!container) return;

    const cake =
      state.cake || {};

    const types =
      Array.isArray(cake.types)
        ? cake.types
        : [];

    const masses =
      Array.isArray(cake.masses)
        ? cake.masses
        : [];

    const fillings =
      Array.isArray(cake.fillings)
        ? cake.fillings
        : [];

    const extras =
      Array.isArray(cake.extras)
        ? cake.extras
        : [];

    container.innerHTML = `
      <div class="admin-section-head">
        <div>
          <h2>Regras de encomendas</h2>
          <p>
            Gerencie as opções usadas na página de encomendas.
          </p>
        </div>
      </div>

      <form id="rulesForm">

        <div class="field">
          <label>
            Bolos — tipo e tamanho
          </label>

          <textarea
            id="ruleTypes"
            rows="10"
            placeholder="Naked Cake — 06/08 pessoas | 55"
          >${escapeHTML(
            types
              .map((item) => {
                if (
                  Array.isArray(item)
                ) {
                  return `${item[0]} | ${item[1]}`;
                }

                return String(item);
              })
              .join("\n")
          )}</textarea>

          <small>
            Use: Nome | Preço
          </small>
        </div>

        <div class="field">
          <label>
            Massas
          </label>

          <textarea
            id="ruleMasses"
            rows="7"
          >${escapeHTML(
            masses.join("\n")
          )}</textarea>
        </div>

        <div class="field">
          <label>
            Recheios
          </label>

          <textarea
            id="ruleFillings"
            rows="7"
          >${escapeHTML(
            fillings.join("\n")
          )}</textarea>
        </div>

        <div class="field">
          <label>
            Adicionais
          </label>

          <textarea
            id="ruleExtras"
            rows="10"
            placeholder="Morango | 16"
          >${escapeHTML(
            extras
              .map((item) => {
                if (
                  Array.isArray(item)
                ) {
                  return `${item[0]} | ${item[1]}`;
                }

                return String(item);
              })
              .join("\n")
          )}</textarea>

          <small>
            Use: Nome | Preço
          </small>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
        >
          Salvar regras
        </button>

      </form>
    `;

    $("#rulesForm")?.addEventListener(
      "submit",
      saveRules
    );
  }

  async function saveRules(event) {
    event.preventDefault();

    if (!state.cake) {
      state.cake = {};
    }

    const typesText =
      $("#ruleTypes")?.value || "";

    const massesText =
      $("#ruleMasses")?.value || "";

    const fillingsText =
      $("#ruleFillings")?.value || "";

    const extrasText =
      $("#ruleExtras")?.value || "";

    state.cake.types =
      typesText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts =
            line.split("|");

          return [
            parts[0]?.trim() || "",
            Number(
              String(
                parts[1] || "0"
              ).replace(",", ".")
            ) || 0
          ];
        });

    state.cake.masses =
      massesText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    state.cake.fillings =
      fillingsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    state.cake.extras =
      extrasText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts =
            line.split("|");

          return [
            parts[0]?.trim() || "",
            Number(
              String(
                parts[1] || "0"
              ).replace(",", ".")
            ) || 0
          ];
        });

    try {
      await saveSettings();

      alert(
        "Regras salvas com sucesso."
      );
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "Não foi possível salvar as regras."
      );
    }
  }

  /* =========================================================
     MÍDIA
     ========================================================= */

  function renderMedia() {
    const container = $("#tabContent");

    if (!container) return;

    if (!state.media) {
      state.media = {};
    }

    container.innerHTML = `
      <div class="admin-section-head">
        <div>
          <h2>Mídia</h2>
          <p>
            Configure os endereços das imagens principais.
          </p>
        </div>
      </div>

      <form id="mediaForm">

        <div class="field">
          <label>
            Logo
          </label>

          <input
            id="mediaLogo"
            type="text"
            placeholder="URL da logo"
            value="${escapeHTML(
              state.media.logo ||
                state.media.logo_url ||
                ""
            )}"
          >
        </div>

        <div class="field">
          <label>
            Imagem principal
          </label>

          <input
            id="mediaHero"
            type="text"
            placeholder="URL da imagem principal"
            value="${escapeHTML(
              state.media.hero ||
                state.media.hero_url ||
                ""
            )}"
          >
        </div>

        <button
          type="submit"
          class="btn btn-primary"
        >
          Salvar mídia
        </button>

      </form>
    `;

    $("#mediaForm")?.addEventListener(
      "submit",
      saveMedia
    );
  }

  async function saveMedia(event) {
    event.preventDefault();

    if (!state.media) {
      state.media = {};
    }

    state.media.logo =
      $("#mediaLogo")
        ?.value?.trim() || "";

    state.media.hero =
      $("#mediaHero")
        ?.value?.trim() || "";

    try {
      await saveSettings();

      applyMartinsBrand();

      alert(
        "Mídia salva com sucesso."
      );
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "Não foi possível salvar a mídia."
      );
    }
  }

  /* =========================================================
     PEDIDOS
     ========================================================= */

  function renderOrders() {
    const container = $("#tabContent");

    if (!container) return;

    container.innerHTML = `
      <div class="admin-section-head">
        <div>
          <h2>Pedidos</h2>
          <p>
            Pedidos registrados no sistema.
          </p>
        </div>
      </div>

      ${
        orders.length
          ? `
            <div class="admin-orders-list">
              ${orders
                .map(
                  (order) => `
                    <article class="admin-order-card">
                      <strong>
                        Pedido
                      </strong>

                      <pre>${escapeHTML(
                        JSON.stringify(
                          order,
                          null,
                          2
                        )
                      )}</pre>
                    </article>
                  `
                )
                .join("")}
            </div>
          `
          : `
            <div class="admin-empty">
              <h3>Nenhum pedido encontrado</h3>
              <p>
                Não há pedidos registrados na tabela configurada.
              </p>
            </div>
          `
      }
    `;
  }

  /* =========================================================
     ENCOMENDAS
     ========================================================= */

  function renderCakeOrders() {
    const container = $("#tabContent");

    if (!container) return;

    container.innerHTML = `
      <div class="admin-section-head">
        <div>
          <h2>Encomendas</h2>
          <p>
            Naked Cake, Chantininho e demais encomendas.
          </p>
        </div>
      </div>

      ${
        cakeOrders.length
          ? `
            <div class="admin-orders-list">
              ${cakeOrders
                .map(
                  (order) => `
                    <article class="admin-order-card">
                      <strong>
                        Encomenda
                      </strong>

                      <pre>${escapeHTML(
                        JSON.stringify(
                          order,
                          null,
                          2
                        )
                      )}</pre>
                    </article>
                  `
                )
                .join("")}
            </div>
          `
          : `
            <div class="admin-empty">
              <h3>Nenhuma encomenda encontrada</h3>
              <p>
                As opções de Naked Cake e Chantininho continuam configuradas em Encomendas.
              </p>
            </div>
          `
      }
    `;
  }

  /* =========================================================
     RENDERIZAÇÃO DAS ABAS
     ========================================================= */

  function renderCurrentTab() {
    switch (currentTab) {
      case "products":
        renderProducts();
        break;

      case "orders":
        renderOrders();
        break;

      case "cakes":
        renderCakeOrders();
        break;

      case "content":
        renderContent();
        break;

      case "hours":
        renderHours();
        break;

      case "rules":
        renderRules();
        break;

      case "media":
        renderMedia();
        break;

      default:
        currentTab = "products";
        renderProducts();
    }
  }

  /* =========================================================
     NAVEGAÇÃO
     ========================================================= */

  function setTab(tab) {
    if (!tab) return;

    currentTab = tab;

    $$(
      "[data-tab]"
    ).forEach((element) => {
      element.classList.toggle(
        "active",
        element.dataset.tab === tab
      );
    });

    renderCurrentTab();
  }

  function detectTabFromElement(element) {
    if (!element) return "";

    if (element.dataset.tab) {
      return element.dataset.tab;
    }

    const id =
      element.id || "";

    const text =
      element.textContent
        ?.trim()
        .toLowerCase() || "";

    const map = {
      products: "products",
      product: "products",
      pedidos: "orders",
      orders: "orders",
      encomendas: "cakes",
      cakes: "cakes",
      conteúdo: "content",
      conteudo: "content",
      content: "content",
      horários: "hours",
      horarios: "hours",
      hours: "hours",
      regras: "rules",
      rules: "rules",
      mídia: "media",
      midia: "media",
      media: "media"
    };

    if (map[id]) {
      return map[id];
    }

    if (map[text]) {
      return map[text];
    }

    for (const key of Object.keys(map)) {
      if (
        id.toLowerCase().includes(key) ||
        text.includes(key)
      ) {
        return map[key];
      }
    }

    return "";
  }

  /* =========================================================
     EVENTOS GERAIS
     ========================================================= */

  function setupEvents() {
    const loginForm =
      $("#loginForm");

    if (loginForm) {
      loginForm.addEventListener(
        "submit",
        handleLogin
      );
    }

    const logoutButton =
      $("#logout");

    if (logoutButton) {
      logoutButton.addEventListener(
        "click",
        logout
      );
    }

    const refreshButton =
      $("#refreshBtn");

    if (refreshButton) {
      refreshButton.addEventListener(
        "click",
        async () => {
          await loadAll();
        }
      );
    }

    const productForm =
      $("#productForm");

    if (productForm) {
      productForm.addEventListener(
        "submit",
        saveProduct
      );
    }

    document.addEventListener(
      "click",
      handleDocumentClick
    );

    db.auth.onAuthStateChange(
      async (event, session) => {
        if (
          event === "SIGNED_IN" &&
          session
        ) {
          await showApp();
        }

        if (
          event === "SIGNED_OUT"
        ) {
          showLogin();
        }
      }
    );
  }

  function handleDocumentClick(event) {
    const tabElement =
      event.target.closest(
        "[data-tab]"
      );

    if (tabElement) {
      event.preventDefault();

      const tab =
        detectTabFromElement(
          tabElement
        );

      if (tab) {
        setTab(tab);
      }

      return;
    }

    const actionElement =
      event.target.closest(
        "[data-action]"
      );

    if (!actionElement) return;

    const action =
      actionElement.dataset.action;

    switch (action) {
      case "new-product":
        openProductModal();
        break;

      case "edit-product": {
        const product =
          products.find(
            (item) =>
              String(item.id) ===
              String(
                actionElement.dataset.id
              )
          );

        if (product) {
          openProductModal(product);
        }

        break;
      }

      case "delete-product":
        deleteProduct(
          actionElement.dataset.id
        );
        break;

      case "toggle-product":
        toggleProduct(
          actionElement.dataset.id
        );
        break;

      case "new-classification":
        createClassification();
        break;

      case "remove-classification":
        removeClassification();
        break;

      case "close-product":
      case "cancel-product":
      case "close-modal":
        closeProductModal();
        break;
    }
  }

  /* =========================================================
     BOTÕES DO MODAL EXISTENTE
     ========================================================= */

  function setupModalButtons() {
    const modal =
      $("#productModal");

    if (!modal) return;

    $$(
      "button",
      modal
    ).forEach((button) => {
      const text =
        button.textContent
          ?.trim()
          .toLowerCase() || "";

      if (
        text === "cancelar" ||
        text === "fechar"
      ) {
        button.addEventListener(
          "click",
          (event) => {
            event.preventDefault();
            closeProductModal();
          }
        );
      }
    });

    modal.addEventListener(
      "click",
      (event) => {
        if (
          event.target === modal
        ) {
          closeProductModal();
        }
      }
    );
  }

  /* =========================================================
     CLASSIFICAÇÃO — BOTÕES DO HTML
     ========================================================= */

  function ensureClassificationControls() {
    const form =
      $("#productForm");

    if (!form) return;

    /*
      Se o HTML antigo ainda tiver "Área",
      escondemos somente o campo de área.
      Não mexemos no restante do visual.
    */

    const area =
      $("#productArea");

    if (area) {
      const wrapper =
        area.closest(
          ".field, .form-group, .input-group"
        );

      if (wrapper) {
        wrapper.style.display = "none";
      } else {
        area.style.display = "none";
      }
    }

    /*
      Cria a classificação dentro do formulário
      caso ela ainda não exista no HTML.
    */

    let classification =
      $("#productClassification");

    if (!classification) {
      const areaWrapper =
        area?.closest(
          ".field, .form-group, .input-group"
        );

      const wrapper =
        document.createElement("div");

      wrapper.className =
        areaWrapper?.className ||
        "field";

      wrapper.innerHTML = `
        <label for="productClassification">
          Classificação
        </label>

        <div
          style="
            display:flex;
            gap:8px;
            align-items:center;
            flex-wrap:wrap;
          "
        >
          <select
            id="productClassification"
            name="classification"
            style="flex:1;min-width:180px;"
          ></select>

          <button
            type="button"
            class="btn"
            data-action="new-classification"
          >
            +
          </button>
        </div>
      `;

      if (areaWrapper) {
        areaWrapper.parentNode.insertBefore(
          wrapper,
          areaWrapper
        );
      } else {
        form.prepend(wrapper);
      }

      classification =
        $("#productClassification");
    }

    renderClassificationOptions(
      classification?.value || ""
    );
  }

  /* =========================================================
     CORREÇÕES DE TEXTO NO HTML EXISTENTE
     ========================================================= */

  function normalizeExistingAreaLabels() {
    /*
      No painel:
      "Delivery" continua significando pronta entrega.

      Naked Cake e Chantininho são mostrados
      como "Encomendas".

      Não alteramos o layout.
    */

    $$(
      "*"
    ).forEach((element) => {
      if (
        element.children.length > 0
      ) {
        return;
      }

      const text =
        element.textContent
          ?.trim();

      if (
        text === "Pronta entrega"
      ) {
        element.textContent =
          "Delivery";
      }

      if (
        text === "Pronta Entrega"
      ) {
        element.textContent =
          "Delivery";
      }
    });
  }

  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  async function init() {
    console.log(
      "Martins Admin — iniciando..."
    );

    applyMartinsBrand();

    setupEvents();

    setupModalButtons();

    ensureClassificationControls();

    normalizeExistingAreaLabels();

    await checkSession();

    console.log(
      "Martins Admin — pronto."
    );
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
