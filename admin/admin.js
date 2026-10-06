/* =========================================================
   MARTINS CONFEITARIA
   PAINEL ADMINISTRATIVO
   ADMIN.JS
   VERSÃO CORRIGIDA
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
    window.MARTINS_CONFIG?.SUPABASE_ANON_KEY ||
    "sb_publishable_RwiMCpC1NAsRIaB1LH5mQw_L-pgOEqH";

  let db = null;

  const DEFAULTS =
    window.MARTINS_DEFAULTS || {};

  /* =========================================================
     ESTADO
     ========================================================= */

  const state = {
    session: null,
    user: null,

    settings: {},

    products: [],

    orders: [],

    customCakes: [],

    editingProductId: null,

    activeView: "dashboard",

    loading: false
  };

  /* =========================================================
     ELEMENTOS
     ========================================================= */

  const $ = (selector) =>
    document.querySelector(selector);

  const $$ = (selector) =>
    Array.from(
      document.querySelectorAll(selector)
    );

  const login =
    $("#login");

  const loginForm =
    $("#loginForm");

  const loginEmail =
    $("#email");

  const loginPassword =
    $("#password");

  const loginMsg =
    $("#loginMsg");

  const app =
    $("#app");

  const view =
    $("#view");

  const title =
    $("#title");

  const logoutBtn =
    $("#logout");

  const refreshBtn =
    $("#refresh");

  const burger =
    $("#burger");

  const side =
    $("#side");

  const shade =
    $("#shade");

  const modal =
    $("#modal");

  const productForm =
    $("#pform");

  const toastBox =
    $("#toast");

  /* =========================================================
     UTILITÁRIOS
     ========================================================= */

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(value) {
    const number =
      Number(value || 0);

    return number.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim();
  }

  function slugify(value) {
    return normalizeText(value)
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
  }

  function showToast(
    message,
    type = "success"
  ) {
    if (!toastBox) {
      alert(message);
      return;
    }

    toastBox.textContent =
      message;

    toastBox.className = "";

    toastBox.classList.add(
      "show"
    );

    if (type === "error") {
      toastBox.classList.add(
        "error"
      );
    }

    if (type === "warning") {
      toastBox.classList.add(
        "warning"
      );
    }

    clearTimeout(
      showToast.timer
    );

    showToast.timer =
      setTimeout(() => {
        toastBox.classList.remove(
          "show"
        );
      }, 3500);
  }

  function setLoginMessage(
    message,
    error = true
  ) {
    if (!loginMsg) {
      return;
    }

    loginMsg.textContent =
      message || "";

    loginMsg.style.color =
      error
        ? "#c0392b"
        : "";
  }

  function setButtonLoading(
    button,
    loading,
    text
  ) {
    if (!button) {
      return;
    }

    if (loading) {
      button.dataset.originalText =
        button.textContent;

      button.disabled = true;

      button.textContent =
        text || "Salvando...";
    } else {
      button.disabled = false;

      button.textContent =
        button.dataset
          .originalText ||
        text ||
        "Salvar";
    }
  }

  function closeMobileMenu() {
    document.body.classList.remove(
      "menu-open"
    );

    if (side) {
      side.classList.remove(
        "open"
      );
    }

    if (shade) {
      shade.classList.remove(
        "show"
      );
    }
  }

  /* =========================================================
     ÁREA DO PRODUTO
     ========================================================= */

  function normalizeArea(
    area,
    product = {}
  ) {
    const value =
      normalizeText(area);

    if (
      value === "pronta" ||
      value === "pronta-entrega" ||
      value === "pronta entrega"
    ) {
      return "pronta";
    }

    if (
      value === "encomenda" ||
      value === "encomendas"
    ) {
      return "encomendas";
    }

    const name =
      normalizeText(
        product.name
      );

    if (
      name.includes("naked cake") ||
      name.includes("chantininho") ||
      name.includes("brigadeiro classico") ||
      name.includes("brigadeiros classicos") ||
      name.includes("brigadeiro premium") ||
      name.includes("brigadeiros premium") ||
      name.includes("oreo") ||
      name.includes("kit kat") ||
      name.includes("kitkat") ||
      name.includes("nutella") ||
      name.includes("kinder bueno")
    ) {
      return "encomendas";
    }

    return "pronta";
  }

  function areaLabel(area) {
    return normalizeArea(area) ===
      "encomendas"
      ? "Encomendas"
      : "Pronta Entrega";
  }

  /* =========================================================
     IMAGEM
     ========================================================= */

  function getProductImage(product) {
    return (
      product?.image_url ||
      product?.image ||
      product?.photo_url ||
      product?.photo ||
      product?.imagem ||
      product?.foto ||
      ""
    );
  }

  /* =========================================================
     SUPABASE
     ========================================================= */

  function initSupabase() {
    if (
      !window.supabase ||
      typeof window.supabase
        .createClient !==
        "function"
    ) {
      console.error(
        "Supabase JS não carregado."
      );

      return false;
    }

    try {
      db =
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY
        );

      return true;
    } catch (error) {
      console.error(
        "Erro ao inicializar Supabase:",
        error
      );

      db = null;

      return false;
    }
  }

  /* =========================================================
     CONFIGURAÇÕES — CARREGAR
     ========================================================= */

  async function loadSettings() {
    if (!db) {
      throw new Error(
        "Supabase não está conectado."
      );
    }

    const {
      data,
      error
    } = await db
      .from("settings")
      .select("*")
      .eq("key", "site")
      .maybeSingle();

    if (error) {
      console.error(
        "Erro ao carregar settings:",
        error
      );

      state.settings = {
        ...DEFAULTS
      };

      return;
    }

    state.settings = {
      ...DEFAULTS,
      ...(data?.value || {})
    };
  }

  /* =========================================================
     PRODUTOS — CARREGAR
     ========================================================= */

  async function loadProducts() {
    if (!db) {
      throw new Error(
        "Supabase não está conectado."
      );
    }

    const {
      data,
      error
    } = await db
      .from("products")
      .select("*")
      .order(
        "sort",
        {
          ascending: true
        }
      );

    if (error) {
      console.error(
        "Erro ao carregar produtos:",
        error
      );

      state.products = [];

      return;
    }

    state.products =
      Array.isArray(data)
        ? data.map(
            (product) => ({
              ...product,
              area:
                normalizeArea(
                  product.area,
                  product
                )
            })
          )
        : [];
  }

  /* =========================================================
     PEDIDOS — CARREGAR
     ========================================================= */

  async function loadOrders() {
    if (!db) {
      throw new Error(
        "Supabase não está conectado."
      );
    }

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
      console.error(
        "Erro ao carregar pedidos:",
        error
      );

      state.orders = [];

      return;
    }

    state.orders =
      Array.isArray(data)
        ? data
        : [];
  }

  /* =========================================================
     BOLOS PERSONALIZADOS
     ========================================================= */

  async function loadCustomCakes() {
    if (!db) {
      throw new Error(
        "Supabase não está conectado."
      );
    }

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
      console.error(
        "Erro ao carregar bolos personalizados:",
        error
      );

      state.customCakes = [];

      return;
    }

    state.customCakes =
      Array.isArray(data)
        ? data
        : [];
  }

  /* =========================================================
     CLASSIFICAÇÕES / CATEGORIAS
     ========================================================= */

  function getDefaultCategories() {
    if (
      Array.isArray(
        DEFAULTS.categories
      )
    ) {
      return [
        ...DEFAULTS.categories
      ];
    }

    return [
      "Bolos no Pote",
      "Sobremesas",
      "Copos da Felicidade",
      "Bolos 8 fatias",
      "Bolos 10 a 12 fatias",
      "Afogadinhos Baby",
      "Brownies",
      "Kits"
    ];
  }

  function getCategories() {
    const categories =
      state.settings?.categories;

    if (
      Array.isArray(
        categories
      )
    ) {
      return [
        ...new Set(
          categories
            .map(
              (item) =>
                String(
                  item || ""
                ).trim()
            )
            .filter(Boolean)
        )
      ];
    }

    return getDefaultCategories();
  }

  function renderCategoryOptions(
    selected = ""
  ) {
    const select =
      $("#f-cat");

    if (!select) {
      return;
    }

    const categories =
      getCategories();

    select.innerHTML = `
      <option value="">
        Selecione uma classificação
      </option>

      ${categories
        .map(
          (category) => `
            <option
              value="${escapeHtml(
                category
              )}"
            >
              ${escapeHtml(
                category
              )}
            </option>
          `
        )
        .join("")}

      <option value="__new__">
        + Nova classificação
      </option>
    `;

    if (selected) {
      select.value =
        selected;
    }
  }

  async function saveCategories(
    categories
  ) {
    if (!db) {
      throw new Error(
        "Supabase não está conectado."
      );
    }

    const payload = {
      ...state.settings,
      categories
    };

    const {
      error
    } = await db
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
      throw error;
    }

    state.settings =
      payload;
  }

  async function createCategory() {
    const name =
      window.prompt(
        "Digite o nome da nova classificação:"
      );

    if (name === null) {
      return;
    }

    const cleanName =
      name.trim();

    if (!cleanName) {
      showToast(
        "Digite um nome válido.",
        "warning"
      );
      return;
    }

    const categories =
      getCategories();

    const exists =
      categories.some(
        (category) =>
          normalizeText(
            category
          ) ===
          normalizeText(
            cleanName
          )
      );

    if (exists) {
      showToast(
        "Essa classificação já existe.",
        "warning"
      );
      return;
    }

    categories.push(
      cleanName
    );

    categories.sort(
      (a, b) =>
        a.localeCompare(
          b,
          "pt-BR"
        )
    );

    try {
      await saveCategories(
        categories
      );

      renderCategoryOptions(
        cleanName
      );

      showToast(
        "Classificação criada com sucesso."
      );
    } catch (error) {
      console.error(
        error
      );

      showToast(
        "Não foi possível salvar a classificação.",
        "error"
      );
    }
  }

  /* =========================================================
     PRODUTOS — SEPARAÇÃO
     ========================================================= */

  function getReadyProducts() {
    return state.products.filter(
      (product) =>
        normalizeArea(
          product.area,
          product
        ) === "pronta"
    );
  }

  function getOrderProducts() {
    return state.products.filter(
      (product) =>
        normalizeArea(
          product.area,
          product
        ) === "encomendas"
    );
  }

  /* =========================================================
     PRODUTOS — FORMULÁRIO
     ========================================================= */

  function clearProductForm() {
    if (!productForm) {
      return;
    }

    productForm.reset();

    state.editingProductId =
      null;

    const modalTitle =
      $("#mtitle");

    if (modalTitle) {
      modalTitle.textContent =
        "Novo produto";
    }

    const area =
      $("#f-area");

    if (area) {
      area.value =
        "pronta";
    }

    const available =
      $("#f-avail");

    if (available) {
      available.checked =
        true;
    }

    const featured =
      $("#f-feat");

    if (featured) {
      featured.checked =
        false;
    }

    const appointment =
      $("#f-appt");

    if (appointment) {
      appointment.checked =
        false;
    }

    const preview =
      $("#prev");

    if (preview) {
      preview.src = "";

      preview.classList.add(
        "hidden"
      );
    }

    const removeImage =
      $("#rmimg");

    if (removeImage) {
      removeImage.classList.add(
        "hidden"
      );
    }

    renderCategoryOptions();
  }

  function openProductModal(
    product = null
  ) {
    if (!modal) {
      return;
    }

    clearProductForm();

    if (product) {
      state.editingProductId =
        product.id;

      const modalTitle =
        $("#mtitle");

      if (modalTitle) {
        modalTitle.textContent =
          "Editar produto";
      }

      fillProductForm(
        product
      );
    }

    modal.classList.remove(
      "hidden"
    );
  }

  function closeProductModal() {
    if (!modal) {
      return;
    }

    modal.classList.add(
      "hidden"
    );

    state.editingProductId =
      null;
  }

  function fillProductForm(
    product
  ) {
    if (!product) {
      return;
    }

    const area =
      $("#f-area");

    if (area) {
      area.value =
        normalizeArea(
          product.area,
          product
        );
    }

    const name =
      $("#f-name");

    if (name) {
      name.value =
        product.name || "";
    }

    const category =
      $("#f-cat");

    renderCategoryOptions(
      product.category || ""
    );

    if (category) {
      category.value =
        product.category || "";
    }

    const price =
      $("#f-price");

    if (price) {
      price.value =
        product.price ?? "";
    }

    const discount =
      $("#f-disc");

    if (discount) {
      discount.value =
        product.discount_percent ?? 0;
    }

    const sort =
      $("#f-sort");

    if (sort) {
      sort.value =
        product.sort ?? 0;
    }

    const gram =
      $("#f-gram");

    if (gram) {
      gram.value =
        product.gramatura ?? "";
    }

    const serve =
      $("#f-serve");

    if (serve) {
      serve.value =
        product.serve_ate ?? "";
    }

    const description =
      $("#f-desc");

    if (description) {
      description.value =
        product.description || "";
    }

    const available =
      $("#f-avail");

    if (available) {
      available.checked =
        product.available !== false;
    }

    const featured =
      $("#f-feat");

    if (featured) {
      featured.checked =
        product.featured === true;
    }

    const appointment =
      $("#f-appt");

    if (appointment) {
      appointment.checked =
        product.appointment_required === true;
    }

    const image =
      getProductImage(
        product
      );

    const preview =
      $("#prev");

    const removeImage =
      $("#rmimg");

    if (
      image &&
      preview
    ) {
      preview.src =
        image;

      preview.classList.remove(
        "hidden"
      );

      if (removeImage) {
        removeImage.classList.remove(
          "hidden"
        );
      }
    }
  }

  /* =========================================================
     IMPORTANTE:
     NÃO existe mais "appointment" nos dados
     enviados para a tabela products.
     ========================================================= */

  function getProductFormData() {
    const area =
      $("#f-area")
        ?.value ||
      "pronta";

    const name =
      $("#f-name")
        ?.value
        ?.trim() ||
      "";

    const category =
      $("#f-cat")
        ?.value
        ?.trim() ||
      "";

    const price =
      Number(
        $("#f-price")
          ?.value ||
          0
      );

    const discount =
      Number(
        $("#f-disc")
          ?.value ||
          0
      );

    const sort =
      Number(
        $("#f-sort")
          ?.value ||
          0
      );

    const gramatura =
      $("#f-gram")
        ?.value
        ?.trim() ||
      "";

    const serveAte =
      $("#f-serve")
        ?.value
        ?.trim() ||
      "";

    const description =
      $("#f-desc")
        ?.value
        ?.trim() ||
      "";

    const available =
      $("#f-avail")
        ?.checked ??
      true;

    const featured =
      $("#f-feat")
        ?.checked ??
      false;

    return {
      area,
      name,
      category,
      price,
      discount,
      sort,
      gramatura,
      serve_ate:
        serveAte,
      description,
      available,
      featured
    };
  }
     /* =========================================================
     PRODUTOS — IMAGEM
     ========================================================= */

  async function uploadProductImage(file, productName) {
    if (!db || !file) {
      return null;
    }

    const extension =
      String(file.name || "")
        .split(".")
        .pop()
        .toLowerCase() || "jpg";

    const safeName =
      slugify(productName) ||
      `produto-${Date.now()}`;

    const path =
      `products/${Date.now()}-${safeName}.${extension}`;

    const {
      error: uploadError
    } = await db.storage
      .from("images")
      .upload(
        path,
        file,
        {
          upsert: true,
          contentType:
            file.type ||
            "image/jpeg"
        }
      );

    if (uploadError) {
      console.error(
        "Erro ao enviar imagem:",
        uploadError
      );

      throw uploadError;
    }

    const {
      data
    } = db.storage
      .from("images")
      .getPublicUrl(path);

    return (
      data?.publicUrl ||
      null
    );
  }

  /* =========================================================
     PRODUTOS — SALVAR
     ========================================================= */

  async function saveProduct() {
    if (!db) {
      showToast(
        "Supabase não está conectado.",
        "error"
      );

      return;
    }

    const formData =
      getProductFormData();

    if (!formData.name) {
      showToast(
        "Informe o nome do produto.",
        "warning"
      );

      $("#f-name")?.focus();

      return;
    }

    if (!formData.category) {
      showToast(
        "Selecione uma classificação.",
        "warning"
      );

      $("#f-cat")?.focus();

      return;
    }

    const submitButton =
      productForm?.querySelector(
        'button[type="submit"]'
      );

    setButtonLoading(
      submitButton,
      true,
      "Salvando..."
    );

    try {
      let imageUrl = null;

      const imageInput =
        $("#f-photo");

      const file =
        imageInput?.files?.[0] ||
        null;

      const existingProduct =
        state.products.find(
          (product) =>
            String(product.id) ===
            String(
              state.editingProductId
            )
        );

      if (file) {
        imageUrl =
          await uploadProductImage(
            file,
            formData.name
          );
      } else if (
        existingProduct
      ) {
        imageUrl =
          getProductImage(
            existingProduct
          ) || null;
      }

      /*
       * ATENÇÃO:
       * "appointment" NÃO é enviado.
       * A tabela products não possui essa coluna.
       */

      const payload = {
        area:
          normalizeArea(
            formData.area
          ),

        name:
          formData.name,

        category:
          formData.category,

        price:
          formData.price,

        discount_percent:
          formData.discount,

        sort:
          formData.sort,

        gramatura:
          formData.gramatura,

        serve_ate:
          formData.serve_ate,

        description:
          formData.description,

        available:
          formData.available,

        featured:
          formData.featured
      };

      if (imageUrl) {
        payload.image_url =
          imageUrl;
      }

      let result;

      if (
        state.editingProductId
      ) {
        result =
          await db
            .from("products")
            .update(payload)
            .eq(
              "id",
              state.editingProductId
            )
            .select()
            .single();
      } else {
        result =
          await db
            .from("products")
            .insert(payload)
            .select()
            .single();
      }

      if (result.error) {
        console.error(
          "Erro ao salvar produto:",
          result.error
        );

        throw result.error;
      }

      const savedProduct =
        result.data;

      /*
       * Atualiza imediatamente o estado
       * para a tela não precisar esperar
       * outro carregamento.
       */

      if (
        state.editingProductId
      ) {
        state.products =
          state.products.map(
            (product) =>
              String(product.id) ===
              String(
                state.editingProductId
              )
                ? {
                    ...product,
                    ...savedProduct,
                    area:
                      normalizeArea(
                        savedProduct.area,
                        savedProduct
                      )
                  }
                : product
          );
      } else if (
        savedProduct
      ) {
        state.products.push({
          ...savedProduct,
          area:
            normalizeArea(
              savedProduct.area,
              savedProduct
            )
        });
      }

      closeProductModal();

      renderCurrentView();

      showToast(
        state.editingProductId
          ? "Produto atualizado com sucesso."
          : "Produto criado com sucesso."
      );

      state.editingProductId =
        null;
    } catch (error) {
      console.error(
        "Erro ao salvar produto:",
        error
      );

      const message =
        error?.message ||
        "Não foi possível salvar o produto.";

      showToast(
        message,
        "error"
      );
    } finally {
      setButtonLoading(
        submitButton,
        false
      );
    }
  }

  /* =========================================================
     PRODUTOS — EXCLUIR
     ========================================================= */

  async function deleteProduct(
    product
  ) {
    if (!product?.id) {
      return;
    }

    const confirmed =
      window.confirm(
        `Excluir o produto "${product.name || ""}"?`
      );

    if (!confirmed) {
      return;
    }

    if (!db) {
      showToast(
        "Supabase não está conectado.",
        "error"
      );

      return;
    }

    try {
      const {
        error
      } = await db
        .from("products")
        .delete()
        .eq(
          "id",
          product.id
        );

      if (error) {
        throw error;
      }

      state.products =
        state.products.filter(
          (item) =>
            String(item.id) !==
            String(product.id)
        );

      renderCurrentView();

      showToast(
        "Produto excluído com sucesso."
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
     PRODUTOS — REMOVER IMAGEM
     ========================================================= */

  function removeProductImage() {
    const input =
      $("#f-photo");

    if (input) {
      input.value = "";
    }

    const preview =
      $("#prev");

    if (preview) {
      preview.src = "";

      preview.classList.add(
        "hidden"
      );
    }

    const removeButton =
      $("#rmimg");

    if (removeButton) {
      removeButton.classList.add(
        "hidden"
      );
    }
  }

  /* =========================================================
     PRODUTOS — VISUAL
     ========================================================= */

  function productCard(
    product
  ) {
    const image =
      getProductImage(
        product
      );

    const area =
      normalizeArea(
        product.area,
        product
      );

    const active =
      product.available !== false;

    const featured =
      product.featured === true;

    const discount =
      Number(
        product.discount || 0
      );

    const finalPrice =
      discount > 0
        ? Number(
            product.price || 0
          ) *
          (1 - discount / 100)
        : Number(
            product.price || 0
          );

    return `
      <article
        class="product-card"
        data-product-id="${escapeHtml(
          product.id
        )}"
      >

        <div class="product-image">
          ${
            image
              ? `
                <img
                  src="${escapeHtml(
                    image
                  )}"
                  alt="${escapeHtml(
                    product.name
                  )}"
                  loading="lazy"
                >
              `
              : `
                <div class="no-image">
                  Sem foto
                </div>
              `
          }
        </div>

        <div class="product-info">

          <div class="product-top">
            <span class="badge">
              ${escapeHtml(
                areaLabel(area)
              )}
            </span>

            ${
              featured
                ? `
                  <span class="badge highlight">
                    Destaque
                  </span>
                `
                : ""
            }
          </div>

          <h3>
            ${escapeHtml(
              product.name
            )}
          </h3>

          ${
            product.category
              ? `
                <p class="muted">
                  ${escapeHtml(
                    product.category
                  )}
                </p>
              `
              : ""
          }

          ${
            product.description
              ? `
                <p class="description">
                  ${escapeHtml(
                    product.description
                  )}
                </p>
              `
              : ""
          }

          <div class="price-area">

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
              ${money(
                finalPrice
              )}
            </strong>

            ${
              discount > 0
                ? `
                  <span class="discount">
                    -${discount}%
                  </span>
                `
                : ""
            }

          </div>

          <div class="product-status">
            <span
              class="${
                active
                  ? "status-ok"
                  : "status-off"
              }"
            >
              ${
                active
                  ? "Ativo"
                  : "Indisponível"
              }
            </span>
          </div>

          <div class="product-actions">

            <button
              type="button"
              class="btn soft"
              data-action="edit-product"
              data-id="${escapeHtml(
                product.id
              )}"
            >
              Editar
            </button>

            <button
              type="button"
              class="btn danger"
              data-action="delete-product"
              data-id="${escapeHtml(
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

  function renderProductsView(
    area
  ) {
    const products =
      area === "encomendas"
        ? getOrderProducts()
        : getReadyProducts();

    const label =
      area === "encomendas"
        ? "Produtos de Encomendas"
        : "Produtos de Pronta Entrega";

    const description =
      area === "encomendas"
        ? "Produtos utilizados para pedidos de encomenda."
        : "Produtos disponíveis para pronta entrega.";

    return `
      <div class="page-head">

        <div>
          <h2>
            ${label}
          </h2>

          <p class="muted">
            ${description}
          </p>
        </div>

        <button
          type="button"
          class="btn primary"
          data-action="new-product"
        >
          + Novo produto
        </button>

      </div>

      <div class="stats mini">

        <div class="stat">
          <strong>
            ${products.length}
          </strong>
          <span>
            ${area === "encomendas"
              ? "Produtos de encomenda"
              : "Produtos de pronta entrega"}
          </span>
        </div>

        <div class="stat">
          <strong>
            ${
              products.filter(
                (product) =>
                  product.available !==
                  false
              ).length
            }
          </strong>
          <span>
            Ativos
          </span>
        </div>

      </div>

      ${
        products.length
          ? `
            <div class="products-grid">
              ${products
                .map(
                  productCard
                )
                .join("")}
            </div>
          `
          : `
            <div class="empty">
              <strong>
                Nenhum produto encontrado.
              </strong>

              <p>
                Clique em "Novo produto"
                para cadastrar um item.
              </p>
            </div>
          `
      }
    `;
  }

  /* =========================================================
     MIGRAÇÃO DOS PRODUTOS EXISTENTES
     ========================================================= */

  async function migrateExistingProductsToOrders() {
    if (!db) {
      return;
    }

    /*
     * Esta função NÃO é executada automaticamente.
     *
     * Ela serve para mover os produtos antigos
     * que já estão cadastrados como produtos
     * de encomenda.
     *
     * Os novos produtos continuam podendo ser
     * cadastrados normalmente como:
     * - Pronta Entrega
     * - Encomendas
     */

    const knownOrderNames = [
      "naked cake",
      "chantininho",
      "brigadeiro classico",
      "brigadeiros classicos",
      "brigadeiro premium",
      "brigadeiros premium",
      "oreo",
      "kit kat",
      "kitkat",
      "nutella",
      "kinder bueno"
    ];

    const productsToMove =
      state.products.filter(
        (product) => {
          const name =
            normalizeText(
              product.name
            );

          return (
            normalizeArea(
              product.area,
              product
            ) === "pronta" &&
            knownOrderNames.some(
              (term) =>
                name.includes(term)
            )
          );
        }
      );

    if (
      !productsToMove.length
    ) {
      return;
    }

    for (
      const product of productsToMove
    ) {
      const {
        error
      } = await db
        .from("products")
        .update({
          area: "encomendas"
        })
        .eq(
          "id",
          product.id
        );

      if (error) {
        console.error(
          "Erro na migração do produto:",
          product,
          error
        );
      }
    }

    await loadProducts();
  }
     /* =========================================================
     DASHBOARD
     ========================================================= */

  function renderDashboard() {
    const readyProducts =
      getReadyProducts();

    const orderProducts =
      getOrderProducts();

    const totalProducts =
      state.products.length;

    const activeProducts =
      state.products.filter(
        (product) =>
          product.available !== false
      ).length;

    const totalOrders =
      state.orders.length;

    const pendingOrders =
      state.orders.filter(
        (order) => {
          const status =
            normalizeText(
              order.status
            );

          return (
            status === "pendente" ||
            status === "novo" ||
            !status
          );
        }
      ).length;

    return `
      <div class="page-head">

        <div>
          <h2>
            Dashboard
          </h2>

          <p class="muted">
            Visão geral do painel administrativo.
          </p>
        </div>

        <button
          type="button"
          class="btn soft"
          data-action="reload-all"
        >
          ↻ Recarregar dados
        </button>

      </div>

      <div class="stats">

        <div class="stat">
          <strong>
            ${totalProducts}
          </strong>

          <span>
            Produtos
          </span>
        </div>

        <div class="stat">
          <strong>
            ${readyProducts.length}
          </strong>

          <span>
            Pronta Entrega
          </span>
        </div>

        <div class="stat">
          <strong>
            ${orderProducts.length}
          </strong>

          <span>
            Encomendas
          </span>
        </div>

        <div class="stat">
          <strong>
            ${activeProducts}
          </strong>

          <span>
            Produtos ativos
          </span>
        </div>

        <div class="stat">
          <strong>
            ${totalOrders}
          </strong>

          <span>
            Pedidos
          </span>
        </div>

        <div class="stat">
          <strong>
            ${pendingOrders}
          </strong>

          <span>
            Pendentes
          </span>
        </div>

      </div>

      <div class="dashboard-grid">

        <section class="panel">

          <div class="panel-head">
            <div>
              <h3>
                Pronta Entrega
              </h3>

              <p class="muted">
                Produtos disponíveis para venda imediata.
              </p>
            </div>

            <button
              type="button"
              class="btn soft"
              data-action="go-view"
              data-view="prod-ready"
            >
              Ver produtos
            </button>
          </div>

          ${
            readyProducts.length
              ? `
                <div class="dashboard-list">
                  ${readyProducts
                    .slice(0, 5)
                    .map(
                      (product) => `
                        <div class="list-row">

                          <div>
                            <strong>
                              ${escapeHtml(
                                product.name
                              )}
                            </strong>

                            <small>
                              ${escapeHtml(
                                product.category ||
                                  "Sem classificação"
                              )}
                            </small>
                          </div>

                          <strong>
                            ${money(
                              product.price
                            )}
                          </strong>

                        </div>
                      `
                    )
                    .join("")}
                </div>
              `
              : `
                <div class="empty small">
                  Nenhum produto de pronta entrega.
                </div>
              `
          }

        </section>

        <section class="panel">

          <div class="panel-head">
            <div>
              <h3>
                Encomendas
              </h3>

              <p class="muted">
                Produtos utilizados para pedidos personalizados.
              </p>
            </div>

            <button
              type="button"
              class="btn soft"
              data-action="go-view"
              data-view="prod-orders"
            >
              Ver produtos
            </button>
          </div>

          ${
            orderProducts.length
              ? `
                <div class="dashboard-list">
                  ${orderProducts
                    .slice(0, 5)
                    .map(
                      (product) => `
                        <div class="list-row">

                          <div>
                            <strong>
                              ${escapeHtml(
                                product.name
                              )}
                            </strong>

                            <small>
                              ${escapeHtml(
                                product.category ||
                                  "Sem classificação"
                              )}
                            </small>
                          </div>

                          <strong>
                            ${money(
                              product.price
                            )}
                          </strong>

                        </div>
                      `
                    )
                    .join("")}
                </div>
              `
              : `
                <div class="empty small">
                  Nenhum produto de encomenda.
                </div>
              `
          }

        </section>

      </div>

      <section class="panel">

        <div class="panel-head">

          <div>
            <h3>
              Pedidos recentes
            </h3>

            <p class="muted">
              Últimos pedidos recebidos pelo site.
            </p>
          </div>

          <button
            type="button"
            class="btn soft"
            data-action="go-view"
            data-view="ord-ready"
          >
            Ver pedidos
          </button>

        </div>

        ${
          state.orders.length
            ? `
              <div class="dashboard-list">

                ${state.orders
                  .slice(0, 8)
                  .map(
                    order => `
                      <div class="list-row">

                        <div>
                          <strong>
                            ${escapeHtml(
                              getOrderCustomerName(
                                order
                              )
                            )}
                          </strong>

                          <small>
                            ${escapeHtml(
                              getOrderDisplayTitle(
                                order
                              )
                            )}
                          </small>
                        </div>

                        <span class="badge">
                          ${escapeHtml(
                            getOrderStatusLabel(
                              order.status
                            )
                          )}
                        </span>

                      </div>
                    `
                  )
                  .join("")}

              </div>
            `
            : `
              <div class="empty small">
                Nenhum pedido recebido.
              </div>
            `
        }

      </section>
    `;
  }

  /* =========================================================
     PEDIDOS — UTILITÁRIOS
     ========================================================= */

  function getOrderCustomerName(
    order
  ) {
    if (!order) {
      return "Cliente";
    }

    return (
      order.customer_name ||
      order.customer ||
      order.name ||
      order.nome ||
      order.client_name ||
      order.cliente ||
      "Cliente"
    );
  }

  function getOrderCustomerPhone(
    order
  ) {
    if (!order) {
      return "";
    }

    return (
      order.customer_phone ||
      order.phone ||
      order.telefone ||
      order.whatsapp ||
      order.customer_whatsapp ||
      ""
    );
  }

  function getOrderDisplayTitle(
    order
  ) {
    if (!order) {
      return "Pedido";
    }

    return (
      order.product_name ||
      order.title ||
      order.item_name ||
      order.name ||
      order.tipo ||
      order.type ||
      "Pedido"
    );
  }

  function getOrderDate(
    order
  ) {
    const value =
      order?.created_at ||
      order?.date ||
      order?.data ||
      order?.createdAt;

    if (!value) {
      return "";
    }

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
  }

  function getOrderStatusLabel(
    status
  ) {
    const value =
      normalizeText(
        status
      );

    const labels = {
      pendente: "Pendente",
      novo: "Novo",
      confirmado: "Confirmado",
      confirmado: "Confirmado",
      preparando: "Em preparo",
      pronto: "Pronto",
      concluido: "Concluído",
      concluido: "Concluído",
      entregue: "Entregue",
      cancelado: "Cancelado",
      canceled: "Cancelado"
    };

    return (
      labels[value] ||
      status ||
      "Pendente"
    );
  }

  function getOrderStatusClass(
    status
  ) {
    const value =
      normalizeText(
        status
      );

    if (
      value === "cancelado" ||
      value === "canceled"
    ) {
      return "status-off";
    }

    if (
      value === "concluido" ||
      value === "entregue" ||
      value === "pronto"
    ) {
      return "status-ok";
    }

    return "status-pending";
  }

  /* =========================================================
     PEDIDOS — CLASSIFICAÇÃO
     ========================================================= */

  function detectOrderArea(
    order
  ) {
    if (!order) {
      return "pronta";
    }

    const directValues = [
      order.area,
      order.type,
      order.tipo,
      order.category,
      order.categoria,
      order.order_type,
      order.orderType
    ];

    for (
      const value of directValues
    ) {
      const normalized =
        normalizeText(
          value
        );

      if (
        normalized.includes(
          "encomend"
        ) ||
        normalized.includes(
          "personaliz"
        ) ||
        normalized.includes(
          "custom"
        )
      ) {
        return "encomendas";
      }

      if (
        normalized.includes(
          "pronta"
        ) ||
        normalized.includes(
          "delivery"
        )
      ) {
        return "pronta";
      }
    }

    const raw =
      normalizeText(
        JSON.stringify(
          order
        )
      );

    const orderTerms = [
      "naked cake",
      "chantininho",
      "brigadeiro",
      "personalizado",
      "encomenda",
      "custom cake",
      "massa",
      "recheio",
      "kit"
    ];

    if (
      orderTerms.some(
        term =>
          raw.includes(
            normalizeText(
              term
            )
          )
      )
    ) {
      return "encomendas";
    }

    return "pronta";
  }

  function getOrdersByArea(
    area
  ) {
    return state.orders.filter(
      order =>
        detectOrderArea(
          order
        ) === area
    );
  }

  /* =========================================================
     PEDIDOS — DETALHES
     ========================================================= */

  function getOrderItemsText(
    order
  ) {
    if (!order) {
      return "";
    }

    const candidates = [
      order.items,
      order.products,
      order.cart,
      order.itens,
      order.products_data,
      order.order_items
    ];

    for (
      const value of candidates
    ) {
      if (
        value === null ||
        value === undefined
      ) {
        continue;
      }

      if (
        Array.isArray(value)
      ) {
        return value
          .map(
            item => {
              if (
                typeof item ===
                "string"
              ) {
                return item;
              }

              return (
                item?.name ||
                item?.product_name ||
                item?.nome ||
                "Item"
              );
            }
          )
          .filter(Boolean)
          .join(", ");
      }

      if (
        typeof value ===
        "string"
      ) {
        try {
          const parsed =
            JSON.parse(
              value
            );

          if (
            Array.isArray(
              parsed
            )
          ) {
            return parsed
              .map(
                item =>
                  item?.name ||
                  item?.product_name ||
                  item?.nome ||
                  String(
                    item
                  )
              )
              .join(", ");
          }
        } catch {
          return value;
        }
      }
    }

    return (
      order.description ||
      order.message ||
      order.observations ||
      order.observacao ||
      ""
    );
  }

  function getOrderTotal(
    order
  ) {
    if (!order) {
      return null;
    }

    const candidates = [
      order.total,
      order.total_price,
      order.amount,
      order.valor_total,
      order.price
    ];

    for (
      const value of candidates
    ) {
      if (
        value !== null &&
        value !== undefined &&
        value !== ""
      ) {
        const number =
          Number(value);

        if (
          !Number.isNaN(
            number
          )
        ) {
          return number;
        }
      }
    }

    return null;
  }

  /* =========================================================
     PEDIDOS — STATUS
     ========================================================= */

  async function updateOrderStatus(
    order,
    status
  ) {
    if (
      !db ||
      !order?.id
    ) {
      return;
    }

    try {
      const {
        error
      } = await db
        .from("orders")
        .update({
          status
        })
        .eq(
          "id",
          order.id
        );

      if (error) {
        throw error;
      }

      state.orders =
        state.orders.map(
          item =>
            String(item.id) ===
            String(order.id)
              ? {
                  ...item,
                  status
                }
              : item
        );

      showToast(
        "Status do pedido atualizado."
      );

      renderCurrentView();
    } catch (error) {
      console.error(
        "Erro ao atualizar status:",
        error
      );

      showToast(
        error?.message ||
          "Não foi possível atualizar o status.",
        "error"
      );
    }
  }
     /* =========================================================
     PEDIDOS — RENDERIZAÇÃO
     ========================================================= */

  function orderCard(order) {
    const area =
      detectOrderArea(order);

    const status =
      order.status ||
      "pendente";

    const items =
      getOrderItemsText(order);

    const total =
      getOrderTotal(order);

    const customer =
      getOrderCustomerName(order);

    const phone =
      getOrderCustomerPhone(order);

    return `
      <article
        class="order-card"
        data-order-id="${escapeHtml(
          order.id
        )}"
      >

        <div class="order-head">

          <div>
            <span class="badge">
              ${escapeHtml(
                areaLabel(area)
              )}
            </span>

            <h3>
              ${escapeHtml(
                customer
              )}
            </h3>

            <small class="muted">
              ${escapeHtml(
                getOrderDate(order)
              )}
            </small>
          </div>

          <span
            class="${getOrderStatusClass(
              status
            )}"
          >
            ${escapeHtml(
              getOrderStatusLabel(
                status
              )
            )}
          </span>

        </div>

        <div class="order-body">

          ${
            phone
              ? `
                <p>
                  <strong>WhatsApp:</strong>
                  ${escapeHtml(
                    phone
                  )}
                </p>
              `
              : ""
          }

          ${
            getOrderDisplayTitle(
              order
            )
              ? `
                <p>
                  <strong>Pedido:</strong>
                  ${escapeHtml(
                    getOrderDisplayTitle(
                      order
                    )
                  )}
                </p>
              `
              : ""
          }

          ${
            items
              ? `
                <p>
                  <strong>Itens:</strong>
                  ${escapeHtml(
                    items
                  )}
                </p>
              `
              : ""
          }

          ${
            order.observations ||
            order.observacao ||
            order.description
              ? `
                <p>
                  <strong>Observações:</strong>
                  ${escapeHtml(
                    order.observations ||
                      order.observacao ||
                      order.description
                  )}
                </p>
              `
              : ""
          }

          ${
            total !== null
              ? `
                <p>
                  <strong>Total:</strong>
                  ${money(total)}
                </p>
              `
              : ""
          }

        </div>

        <div class="order-actions">

          <label>
            Status

            <select
              data-action="order-status"
              data-id="${escapeHtml(
                order.id
              )}"
            >
              <option
                value="pendente"
                ${
                  normalizeText(
                    status
                  ) ===
                  "pendente"
                    ? "selected"
                    : ""
                }
              >
                Pendente
              </option>

              <option
                value="confirmado"
                ${
                  normalizeText(
                    status
                  ) ===
                  "confirmado"
                    ? "selected"
                    : ""
                }
              >
                Confirmado
              </option>

              <option
                value="preparando"
                ${
                  normalizeText(
                    status
                  ) ===
                  "preparando"
                    ? "selected"
                    : ""
                }
              >
                Em preparo
              </option>

              <option
                value="pronto"
                ${
                  normalizeText(
                    status
                  ) ===
                  "pronto"
                    ? "selected"
                    : ""
                }
              >
                Pronto
              </option>

              <option
                value="concluido"
                ${
                  normalizeText(
                    status
                  ) ===
                  "concluido"
                    ? "selected"
                    : ""
                }
              >
                Concluído
              </option>

              <option
                value="entregue"
                ${
                  normalizeText(
                    status
                  ) ===
                  "entregue"
                    ? "selected"
                    : ""
                }
              >
                Entregue
              </option>

              <option
                value="cancelado"
                ${
                  normalizeText(
                    status
                  ) ===
                  "cancelado"
                    ? "selected"
                    : ""
                }
              >
                Cancelado
              </option>
            </select>
          </label>

        </div>

      </article>
    `;
  }

  function renderOrdersView(
    area
  ) {
    const orders =
      getOrdersByArea(area);

    const isOrders =
      area ===
      "encomendas";

    const heading =
      isOrders
        ? "Pedidos de Encomendas"
        : "Pedidos de Pronta Entrega";

    const description =
      isOrders
        ? "Pedidos feitos através da área de encomendas."
        : "Pedidos de produtos disponíveis para pronta entrega.";

    return `
      <div class="page-head">

        <div>
          <h2>
            ${heading}
          </h2>

          <p class="muted">
            ${description}
          </p>
        </div>

        <div class="row">

          <button
            type="button"
            class="btn soft"
            data-action="print-orders"
            data-area="${escapeHtml(
              area
            )}"
          >
            🖨️ Imprimir
          </button>

          <button
            type="button"
            class="btn soft"
            data-action="reload-all"
          >
            ↻ Atualizar
          </button>

        </div>

      </div>

      <div class="stats mini">

        <div class="stat">
          <strong>
            ${orders.length}
          </strong>

          <span>
            ${
              isOrders
                ? "Pedidos de encomenda"
                : "Pedidos de pronta entrega"
            }
          </span>
        </div>

        <div class="stat">
          <strong>
            ${
              orders.filter(
                order => {
                  const status =
                    normalizeText(
                      order.status
                    );

                  return (
                    !status ||
                    status ===
                      "pendente" ||
                    status ===
                      "novo"
                  );
                }
              ).length
            }
          </strong>

          <span>
            Pendentes
          </span>
        </div>

        <div class="stat">
          <strong>
            ${
              orders.filter(
                order =>
                  normalizeText(
                    order.status
                  ) ===
                  "concluido"
              ).length
            }
          </strong>

          <span>
            Concluídos
          </span>
        </div>

      </div>

      ${
        orders.length
          ? `
            <div class="orders-list">

              ${orders
                .map(
                  order =>
                    orderCard(
                      order
                    )
                )
                .join("")}

            </div>
          `
          : `
            <div class="empty">

              <strong>
                Nenhum pedido encontrado.
              </strong>

              <p>
                Ainda não existem pedidos
                nesta categoria.
              </p>

            </div>
          `
      }
    `;
  }

  /* =========================================================
     IMPRESSÃO DOS PEDIDOS
     ========================================================= */

  function printOrders(
    area
  ) {
    const orders =
      getOrdersByArea(area);

    if (!orders.length) {
      showToast(
        "Não há pedidos para imprimir.",
        "warning"
      );

      return;
    }

    const titleText =
      area ===
      "encomendas"
        ? "Pedidos de Encomendas"
        : "Pedidos de Pronta Entrega";

    const rows =
      orders
        .map(
          order => {
            const total =
              getOrderTotal(
                order
              );

            return `
              <div class="print-order">

                <div class="print-order-head">

                  <div>
                    <h2>
                      ${escapeHtml(
                        getOrderCustomerName(
                          order
                        )
                      )}
                    </h2>

                    <p>
                      ${escapeHtml(
                        getOrderDate(
                          order
                        )
                      )}
                    </p>
                  </div>

                  <strong>
                    ${escapeHtml(
                      getOrderStatusLabel(
                        order.status
                      )
                    )}
                  </strong>

                </div>

                <p>
                  <strong>Pedido:</strong>
                  ${escapeHtml(
                    getOrderDisplayTitle(
                      order
                    )
                  )}
                </p>

                ${
                  getOrderCustomerPhone(
                    order
                  )
                    ? `
                      <p>
                        <strong>WhatsApp:</strong>
                        ${escapeHtml(
                          getOrderCustomerPhone(
                            order
                          )
                        )}
                      </p>
                    `
                    : ""
                }

                ${
                  getOrderItemsText(
                    order
                  )
                    ? `
                      <p>
                        <strong>Itens:</strong>
                        ${escapeHtml(
                          getOrderItemsText(
                            order
                          )
                        )}
                      </p>
                    `
                    : ""
                }

                ${
                  order.observations ||
                  order.observacao ||
                  order.description
                    ? `
                      <p>
                        <strong>Observações:</strong>
                        ${escapeHtml(
                          order.observations ||
                            order.observacao ||
                            order.description
                        )}
                      </p>
                    `
                    : ""
                }

                ${
                  total !== null
                    ? `
                      <p>
                        <strong>Total:</strong>
                        ${money(
                          total
                        )}
                      </p>
                    `
                    : ""
                }

              </div>
            `;
          }
        )
        .join("");

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=900,height=700"
      );

    if (!printWindow) {
      showToast(
        "O navegador bloqueou a janela de impressão.",
        "error"
      );

      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>

      <html lang="pt-BR">

      <head>

        <meta charset="UTF-8">

        <title>
          ${escapeHtml(
            titleText
          )}
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 32px;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            color: #222;
            background: #fff;
          }

          h1 {
            margin: 0 0 6px;
            font-size: 26px;
          }

          .subtitle {
            margin: 0 0 24px;
            color: #666;
          }

          .print-order {
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 18px;
            margin-bottom: 18px;
            page-break-inside: avoid;
          }

          .print-order-head {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            border-bottom: 1px solid #eee;
            padding-bottom: 12px;
            margin-bottom: 12px;
          }

          .print-order h2 {
            margin: 0 0 4px;
            font-size: 19px;
          }

          .print-order p {
            margin: 7px 0;
            line-height: 1.5;
          }

          @media print {

            body {
              padding: 15px;
            }

            .print-order {
              border-color: #bbb;
            }

          }

        </style>

      </head>

      <body>

        <h1>
          Martins Confeitaria
        </h1>

        <p class="subtitle">
          ${escapeHtml(
            titleText
          )}
        </p>

        ${rows}

        <script>
          window.onload = function() {
            window.print();
          };
        <\/script>

      </body>

      </html>
    `);

    printWindow.document.close();
  }

  /* =========================================================
     BOLOS PERSONALIZADOS
     ========================================================= */

  function getCustomCakeCustomer(
    cake
  ) {
    return (
      cake?.customer_name ||
      cake?.name ||
      cake?.cliente ||
      "Cliente"
    );
  }

  function getCustomCakeSummary(
    cake
  ) {
    if (!cake) {
      return "";
    }

    const parts = [];

    const fields = [
      ["Massa", cake.massa],
      ["Recheio", cake.recheio],
      ["Tamanho", cake.tamanho],
      ["Tema", cake.tema],
      ["Adicionais", cake.adicionais],
      ["Data", cake.data],
      ["Observações", cake.observacoes]
    ];

    fields.forEach(
      ([label, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          String(value).trim()
        ) {
          parts.push(
            `<strong>${escapeHtml(
              label
            )}:</strong> ${escapeHtml(
              value
            )}`
          );
        }
      }
    );

    return parts.join(
      "<br>"
    );
  }

  function renderCustomCakeOrders() {
    const cakes =
      state.customCakes;

    return `
      <div class="page-head">

        <div>
          <h2>
            Encomendas Personalizadas
          </h2>

          <p class="muted">
            Solicitações de bolos personalizados.
          </p>
        </div>

        <button
          type="button"
          class="btn soft"
          data-action="print-custom-cakes"
        >
          🖨️ Imprimir
        </button>

      </div>

      ${
        cakes.length
          ? `
            <div class="orders-list">

              ${cakes
                .map(
                  cake => `
                    <article class="order-card">

                      <div class="order-head">

                        <div>
                          <h3>
                            ${escapeHtml(
                              getCustomCakeCustomer(
                                cake
                              )
                            )}
                          </h3>

                          <small class="muted">
                            ${escapeHtml(
                              getOrderDate(
                                cake
                              )
                            )}
                          </small>
                        </div>

                      </div>

                      <div class="order-body">

                        ${getCustomCakeSummary(
                          cake
                        )}

                      </div>

                    </article>
                  `
                )
                .join("")}

            </div>
          `
          : `
            <div class="empty">

              <strong>
                Nenhuma encomenda personalizada.
              </strong>

            </div>
          `
      }
    `;
  }

  function printCustomCakes() {
    const cakes =
      state.customCakes;

    if (!cakes.length) {
      showToast(
        "Não há encomendas personalizadas para imprimir.",
        "warning"
      );

      return;
    }

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=900,height=700"
      );

    if (!printWindow) {
      showToast(
        "O navegador bloqueou a janela de impressão.",
        "error"
      );

      return;
    }

    const content =
      cakes
        .map(
          cake => `
            <div class="cake">

              <h2>
                ${escapeHtml(
                  getCustomCakeCustomer(
                    cake
                  )
                )}
              </h2>

              <p>
                ${getCustomCakeSummary(
                  cake
                )}
              </p>

            </div>
          `
        )
        .join("");

    printWindow.document.write(`
      <!DOCTYPE html>

      <html lang="pt-BR">

      <head>

        <meta charset="UTF-8">

        <title>
          Encomendas Personalizadas
        </title>

        <style>

          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            color: #222;
          }

          h1 {
            margin-bottom: 25px;
          }

          .cake {
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 18px;
            margin-bottom: 15px;
            page-break-inside: avoid;
          }

          .cake h2 {
            margin-top: 0;
          }

          .cake p {
            line-height: 1.6;
          }

        </style>

      </head>

      <body>

        <h1>
          Martins Confeitaria —
          Encomendas Personalizadas
        </h1>

        ${content}

        <script>
          window.onload = function() {
            window.print();
          };
        <\/script>

      </body>

      </html>
    `);

    printWindow.document.close();
  }
     /* =========================================================
     CONFIGURAÇÕES DO SITE
     ========================================================= */

  function renderSettings() {
    const settings =
      state.settings || {};

    const instagram =
      settings.instagram ||
      settings.instagram_url ||
      "";

    const whatsapp =
      settings.whatsapp ||
      settings.phone ||
      settings.telefone ||
      "";

    const address =
      settings.address ||
      settings.endereco ||
      "";

    const maps =
      settings.maps ||
      settings.maps_url ||
      "";

    const hours =
      settings.hours ||
      settings.horarios ||
      "";

    return `
      <div class="page-head">

        <div>
          <h2>
            Configurações
          </h2>

          <p class="muted">
            Altere as informações exibidas no site.
          </p>
        </div>

        <button
          type="button"
          class="btn primary"
          data-action="save-settings"
        >
          Salvar alterações
        </button>

      </div>

      <section class="panel">

        <div class="panel-head">
          <div>
            <h3>
              Informações do site
            </h3>

            <p class="muted">
              Essas informações são armazenadas no Supabase.
            </p>
          </div>
        </div>

        <div class="settings-grid">

          <label>
            Instagram

            <input
              id="s-instagram"
              type="text"
              value="${escapeHtml(
                instagram
              )}"
              placeholder="@martins_confeitariaartesanal"
            >
          </label>

          <label>
            WhatsApp

            <input
              id="s-whatsapp"
              type="text"
              value="${escapeHtml(
                whatsapp
              )}"
              placeholder="5585981563070"
            >
          </label>

          <label class="full">
            Endereço

            <input
              id="s-address"
              type="text"
              value="${escapeHtml(
                address
              )}"
              placeholder="Rua 1018, 65, Conjunto Ceará II, Fortaleza-CE"
            >
          </label>

          <label class="full">
            Link do Google Maps

            <input
              id="s-maps"
              type="url"
              value="${escapeHtml(
                maps
              )}"
              placeholder="https://maps.google.com/..."
            >
          </label>

          <label class="full">
            Horários de funcionamento

            <textarea
              id="s-hours"
              rows="7"
              placeholder="Quinta: 11h às 23h&#10;Sexta: 11h às 18h30&#10;..."
            >${escapeHtml(
              hours
            )}</textarea>
          </label>

        </div>

      </section>

      <section class="panel">

        <div class="panel-head">

          <div>
            <h3>
              Classificações
            </h3>

            <p class="muted">
              Categorias utilizadas nos produtos.
            </p>
          </div>

          <button
            type="button"
            class="btn soft"
            data-action="new-category"
          >
            + Nova classificação
          </button>

        </div>

        <div class="category-list">

          ${
            getCategories()
              .map(
                category => `
                  <span class="badge">
                    ${escapeHtml(
                      category
                    )}
                  </span>
                `
              )
              .join("")
          }

        </div>

      </section>
    `;
  }

  async function saveSettings() {
    if (!db) {
      showToast(
        "Supabase não está conectado.",
        "error"
      );

      return;
    }

    const button =
      document.querySelector(
        '[data-action="save-settings"]'
      );

    setButtonLoading(
      button,
      true,
      "Salvando..."
    );

    try {
      const next = {
        ...(state.settings || {})
      };

      const instagram =
        $("#s-instagram")?.value
          ?.trim() || "";

      const whatsapp =
        $("#s-whatsapp")?.value
          ?.trim() || "";

      const address =
        $("#s-address")?.value
          ?.trim() || "";

      const maps =
        $("#s-maps")?.value
          ?.trim() || "";

      const hours =
        $("#s-hours")?.value
          ?.trim() || "";

      /*
       * Mantém os demais dados existentes
       * dentro do objeto settings.
       */

      next.instagram =
        instagram;

      next.whatsapp =
        whatsapp;

      next.address =
        address;

      next.maps =
        maps;

      next.hours =
        hours;

      const {
        data,
        error
      } = await db
        .from("settings")
        .upsert(
          {
            key: "site",
            value: next
          },
          {
            onConflict: "key"
          }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      state.settings =
        data?.value ||
        next;

      showToast(
        "Configurações salvas com sucesso."
      );

      renderCurrentView();
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
    } finally {
      setButtonLoading(
        button,
        false
      );
    }
  }

  /* =========================================================
     RECARREGAR DADOS
     ========================================================= */

  async function reloadAll(
    rerender = true
  ) {
    if (!db) {
      return;
    }

    if (state.loading) {
      return;
    }

    state.loading =
      true;

    try {
      await Promise.all([
        loadSettings(),
        loadProducts(),
        loadOrders(),
        loadCustomCakes()
      ]);

      if (rerender) {
        renderCurrentView();
      }
    } catch (error) {
      console.error(
        "Erro ao carregar dados:",
        error
      );

      showToast(
        error?.message ||
          "Não foi possível carregar os dados.",
        "error"
      );
    } finally {
      state.loading =
        false;
    }
  }

  /* =========================================================
     NAVEGAÇÃO
     ========================================================= */

  const viewTitles = {
    dashboard:
      "Dashboard",

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

  function setActiveNav(
    viewName
  ) {
    $$(".nav").forEach(
      button => {
        button.classList.toggle(
          "active",
          button.dataset.view ===
            viewName
        );
      }
    );
  }

  function renderCurrentView() {
    if (!view) {
      return;
    }

    const current =
      state.activeView ||
      "dashboard";

    if (title) {
      title.textContent =
        viewTitles[current] ||
        "Dashboard";
    }

    setActiveNav(
      current
    );

    switch (current) {
      case "prod-ready":
        view.innerHTML =
          renderProductsView(
            "pronta"
          );
        break;

      case "prod-orders":
        view.innerHTML =
          renderProductsView(
            "encomendas"
          );
        break;

      case "ord-ready":
        view.innerHTML =
          renderOrdersView(
            "pronta"
          );
        break;

      case "ord-orders":
        view.innerHTML =
          renderOrdersView(
            "encomendas"
          );
        break;

      case "settings":
        view.innerHTML =
          renderSettings();
        break;

      case "dashboard":
      default:
        state.activeView =
          "dashboard";

        view.innerHTML =
          renderDashboard();
        break;
    }
  }

  function navigate(
    viewName
  ) {
    const allowed = [
      "dashboard",
      "prod-ready",
      "prod-orders",
      "ord-ready",
      "ord-orders",
      "settings"
    ];

    if (
      !allowed.includes(
        viewName
      )
    ) {
      viewName =
        "dashboard";
    }

    state.activeView =
      viewName;

    renderCurrentView();

    closeMobileMenu();
  }

  /* =========================================================
     LOGIN
     ========================================================= */

  async function loginUser(
    email,
    password
  ) {
    if (!db) {
      throw new Error(
        "Supabase não está conectado."
      );
    }

    const {
      data,
      error
    } = await db.auth
      .signInWithPassword({
        email,
        password
      });

    if (error) {
      throw error;
    }

    state.session =
      data?.session ||
      null;

    state.user =
      data?.user ||
      null;

    return data;
  }

  function showApp() {
    if (login) {
      login.classList.add(
        "hidden"
      );
    }

    if (app) {
      app.classList.remove(
        "hidden"
      );
    }
  }

  function showLogin() {
    if (app) {
      app.classList.add(
        "hidden"
      );
    }

    if (login) {
      login.classList.remove(
        "hidden"
      );
    }
  }

  async function handleLogin(
    event
  ) {
    event.preventDefault();

    const email =
      loginEmail?.value
        ?.trim() || "";

    const password =
      loginPassword?.value ||
      "";

    if (!email) {
      setLoginMessage(
        "Digite seu e-mail."
      );

      return;
    }

    if (!password) {
      setLoginMessage(
        "Digite sua senha."
      );

      return;
    }

    const button =
      loginForm?.querySelector(
        'button[type="submit"]'
      );

    setButtonLoading(
      button,
      true,
      "Entrando..."
    );

    setLoginMessage(
      "",
      false
    );

    try {
      await loginUser(
        email,
        password
      );

      setLoginMessage(
        "Login realizado.",
        false
      );

      await startAuthenticatedApp();
    } catch (error) {
      console.error(
        "Erro no login:",
        error
      );

      setLoginMessage(
        error?.message ||
          "E-mail ou senha incorretos."
      );
    } finally {
      setButtonLoading(
        button,
        false
      );
    }
  }

  async function logout() {
    try {
      if (db) {
        await db.auth.signOut();
      }
    } catch (error) {
      console.error(
        "Erro ao sair:",
        error
      );
    }

    state.session =
      null;

    state.user =
      null;

    state.settings =
      {};

    state.products =
      [];

    state.orders =
      [];

    state.customCakes =
      [];

    showLogin();

    if (loginForm) {
      loginForm.reset();
    }

    setLoginMessage(
      ""
    );
  }

  /* =========================================================
     INICIALIZAÇÃO DA ÁREA AUTENTICADA
     ========================================================= */

  async function startAuthenticatedApp() {
    showApp();

    try {
      await reloadAll(
        false
      );

      renderCategoryOptions();

      renderCurrentView();
    } catch (error) {
      console.error(
        "Erro ao iniciar painel:",
        error
      );

      showToast(
        error?.message ||
          "Erro ao carregar o painel.",
        "error"
      );
    }
  }
     /* =========================================================
     EVENTOS — NAVEGAÇÃO
     ========================================================= */

  function bindNavigation() {
    $$(".nav").forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            navigate(
              button.dataset.view
            );
          }
        );
      }
    );
  }

  /* =========================================================
     EVENTOS — MODAL
     ========================================================= */

  function bindModal() {
    if (!modal) {
      return;
    }

    $$("[data-close]").forEach(
      button => {
        button.addEventListener(
          "click",
          closeProductModal
        );
      }
    );

    modal.addEventListener(
      "click",
      event => {
        if (
          event.target ===
          modal
        ) {
          closeProductModal();
        }
      }
    );

    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key ===
          "Escape"
        ) {
          closeProductModal();
        }
      }
    );
  }

  /* =========================================================
     EVENTOS — FORMULÁRIO DE PRODUTO
     ========================================================= */

  function bindProductForm() {
    if (!productForm) {
      return;
    }

    productForm.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        saveProduct();
      }
    );

    const category =
      $("#f-cat");

    if (category) {
      category.addEventListener(
        "change",
        () => {
          if (
            category.value ===
            "__new__"
          ) {
            category.value =
              "";

            createCategory();
          }
        }
      );
    }

    const photo =
      $("#f-photo");

    if (photo) {
      photo.addEventListener(
        "change",
        () => {
          const file =
            photo.files?.[0];

          const preview =
            $("#prev");

          const removeButton =
            $("#rmimg");

          if (
            !file ||
            !preview
          ) {
            return;
          }

          const url =
            URL.createObjectURL(
              file
            );

          preview.src =
            url;

          preview.classList.remove(
            "hidden"
          );

          if (removeButton) {
            removeButton.classList.remove(
              "hidden"
            );
          }
        }
      );
    }

    const removeImage =
      $("#rmimg");

    if (removeImage) {
      removeImage.addEventListener(
        "click",
        removeProductImage
      );
    }
  }

  /* =========================================================
     EVENTOS — CLIQUES DINÂMICOS
     ========================================================= */

  function bindDynamicEvents() {
    document.addEventListener(
      "click",
      event => {
        const target =
          event.target.closest(
            "[data-action]"
          );

        if (!target) {
          return;
        }

        const action =
          target.dataset.action;

        if (
          action ===
          "new-product"
        ) {
          openProductModal();

          return;
        }

        if (
          action ===
          "edit-product"
        ) {
          const id =
            target.dataset.id;

          const product =
            state.products.find(
              item =>
                String(
                  item.id
                ) ===
                String(id)
            );

          if (product) {
            openProductModal(
              product
            );
          }

          return;
        }

        if (
          action ===
          "delete-product"
        ) {
          const id =
            target.dataset.id;

          const product =
            state.products.find(
              item =>
                String(
                  item.id
                ) ===
                String(id)
            );

          if (product) {
            deleteProduct(
              product
            );
          }

          return;
        }

        if (
          action ===
          "go-view"
        ) {
          navigate(
            target.dataset.view
          );

          return;
        }

        if (
          action ===
          "reload-all"
        ) {
          reloadAll();

          return;
        }

        if (
          action ===
          "print-orders"
        ) {
          printOrders(
            target.dataset.area ||
              "pronta"
          );

          return;
        }

        if (
          action ===
          "print-custom-cakes"
        ) {
          printCustomCakes();

          return;
        }

        if (
          action ===
          "new-category"
        ) {
          createCategory();

          return;
        }

        if (
          action ===
          "save-settings"
        ) {
          saveSettings();

          return;
        }
      }
    );

    document.addEventListener(
      "change",
      event => {
        const target =
          event.target.closest(
            '[data-action="order-status"]'
          );

        if (!target) {
          return;
        }

        const id =
          target.dataset.id;

        const order =
          state.orders.find(
            item =>
              String(
                item.id
              ) ===
              String(id)
          );

        if (!order) {
          return;
        }

        updateOrderStatus(
          order,
          target.value
        );
      }
    );
  }

  /* =========================================================
     MENU MOBILE
     ========================================================= */

  function openMobileMenu() {
    if (side) {
      side.classList.add(
        "open"
      );
    }

    if (shade) {
      shade.classList.add(
        "show"
      );
    }

    document.body.classList.add(
      "menu-open"
    );
  }

  function bindMobileMenu() {
    if (burger) {
      burger.addEventListener(
        "click",
        () => {
          const open =
            side?.classList.contains(
              "open"
            );

          if (open) {
            closeMobileMenu();
          } else {
            openMobileMenu();
          }
        }
      );
    }

    if (shade) {
      shade.addEventListener(
        "click",
        closeMobileMenu
      );
    }
  }

  /* =========================================================
     ATUALIZAR
     ========================================================= */

  function bindRefresh() {
    if (!refreshBtn) {
      return;
    }

    refreshBtn.addEventListener(
      "click",
      async () => {
        const original =
          refreshBtn.textContent;

        refreshBtn.disabled =
          true;

        refreshBtn.textContent =
          "↻ Atualizando...";

        try {
          await reloadAll();
        } finally {
          refreshBtn.disabled =
            false;

          refreshBtn.textContent =
            original;
        }
      }
    );
  }

  /* =========================================================
     AUTENTICAÇÃO — SESSÃO
     ========================================================= */

  async function restoreSession() {
    if (!db) {
      showLogin();

      return;
    }

    try {
      const {
        data,
        error
      } = await db.auth
        .getSession();

      if (error) {
        throw error;
      }

      const session =
        data?.session ||
        null;

      state.session =
        session;

      state.user =
        session?.user ||
        null;

      if (session) {
        await startAuthenticatedApp();
      } else {
        showLogin();
      }
    } catch (error) {
      console.error(
        "Erro ao restaurar sessão:",
        error
      );

      showLogin();
    }
  }

  function bindAuthListener() {
    if (!db) {
      return;
    }

    db.auth.onAuthStateChange(
      async (
        event,
        session
      ) => {
        state.session =
          session ||
          null;

        state.user =
          session?.user ||
          null;

        if (
          event ===
            "SIGNED_IN" &&
          session
        ) {
          await startAuthenticatedApp();

          return;
        }

        if (
          event ===
          "SIGNED_OUT"
        ) {
          showLogin();
        }
      }
    );
  }

  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  async function init() {
    const connected =
      initSupabase();

    if (!connected) {
      showLogin();

      setLoginMessage(
        "Não foi possível conectar ao Supabase."
      );

      return;
    }

    bindNavigation();

    bindModal();

    bindProductForm();

    bindDynamicEvents();

    bindMobileMenu();

    bindRefresh();

    if (loginForm) {
      loginForm.addEventListener(
        "submit",
        handleLogin
      );
    }

    if (logoutBtn) {
      logoutBtn.addEventListener(
        "click",
        logout
      );
    }

    bindAuthListener();

    showLogin();

    await restoreSession();
  }

  /* =========================================================
     INICIAR
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );
  } else {
    init();
  }

})();
