/* =========================================================
   MARTINS CONFEITARIA
   PAINEL ADMINISTRATIVO
   ADMIN.JS
   Compatível com admin/index.html atual
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
      document.querySelectorAll(
        selector
      )
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
    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
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

  function normalizeText(
    value
  ) {
    return String(
      value || ""
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim();
  }

  function slugify(value) {
    return normalizeText(
      value
    )
      .replace(
        /\s+/g,
        "-"
      )
      .replace(
        /[^a-z0-9-]/g,
        ""
      )
      .replace(
        /-+/g,
        "-"
      );
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

    toastBox.className =
      "";

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

      button.disabled =
        true;

      button.textContent =
        text ||
        "Salvando...";
    } else {
      button.disabled =
        false;

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
      value ===
        "pronta-entrega" ||
      value ===
        "pronta entrega"
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

    /*
     * Produtos conhecidos da área
     * de encomendas.
     */

    if (
      name.includes(
        "naked cake"
      ) ||
      name.includes(
        "chantininho"
      ) ||
      name.includes(
        "brigadeiro classico"
      ) ||
      name.includes(
        "brigadeiros classicos"
      ) ||
      name.includes(
        "brigadeiro premium"
      ) ||
      name.includes(
        "brigadeiros premium"
      ) ||
      name.includes(
        "oreo"
      ) ||
      name.includes(
        "kit kat"
      ) ||
      name.includes(
        "kitkat"
      ) ||
      name.includes(
        "nutella"
      ) ||
      name.includes(
        "kinder bueno"
      )
    ) {
      return "encomendas";
    }

    return "pronta";
  }

  function areaLabel(
    area
  ) {
    return normalizeArea(
      area
    ) === "encomendas"
      ? "Encomendas"
      : "Pronta Entrega";
  }

  /* =========================================================
     IMAGEM
     ========================================================= */

  function getProductImage(
    product
  ) {
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
     CONFIGURAÇÕES
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
      .eq(
        "key",
        "site"
      )
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
      state.settings
        ?.categories;

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

    if (
      name === null
    ) {
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
      product.category ||
        ""
    );

    if (category) {
      category.value =
        product.category ||
        "";
    }

    const price =
      $("#f-price");

    if (price) {
      price.value =
        product.price ??
        "";
    }

    const discount =
      $("#f-disc");

    if (discount) {
      discount.value =
        product.discount ??
        0;
    }

    const sort =
      $("#f-sort");

    if (sort) {
      sort.value =
        product.sort ??
        0;
    }

    const gram =
      $("#f-gram");

    if (gram) {
      gram.value =
        product.gramatura ??
        "";
    }

    const serve =
      $("#f-serve");

    if (serve) {
      serve.value =
        product.serve_ate ??
        "";
    }

    const description =
      $("#f-desc");

    if (description) {
      description.value =
        product.description ||
        "";
    }

    const available =
      $("#f-avail");

    if (available) {
      available.checked =
        product.available !==
        false;
    }

    const featured =
      $("#f-feat");

    if (featured) {
      featured.checked =
        product.featured ===
        true;
    }

    const appointment =
      $("#f-appt");

    if (appointment) {
      appointment.checked =
        product.appointment ===
        true;
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

    const appointment =
      $("#f-appt")
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
      featured,
      appointment
    };
  }
     /* =========================================================
     PRODUTOS — SALVAR
     ========================================================= */

  async function saveProduct(
    event
  ) {
    event.preventDefault();

    if (!db) {
      showToast(
        "Supabase não está conectado.",
        "error"
      );
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
      const formData =
        getProductFormData();

      if (!formData.name) {
        throw new Error(
          "Informe o nome do produto."
        );
      }

      if (
        !formData.category ||
        formData.category ===
          "__new__"
      ) {
        throw new Error(
          "Selecione uma classificação."
        );
      }

      /*
       * Upload da foto, caso uma nova
       * imagem tenha sido selecionada.
       */

      const file =
        $("#f-photo")
          ?.files?.[0];

      const payload = {
        name:
          formData.name,

        area:
          formData.area,

        category:
          formData.category,

        price:
          formData.price,

        discount:
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
          formData.featured,

        appointment:
          formData.appointment
      };

      if (file) {
        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          throw new Error(
            "O arquivo selecionado não é uma imagem válida."
          );
        }

        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          "jpg";

        const fileName =
          `${Date.now()}-${slugify(
            formData.name
          )}.${extension}`;

        const filePath =
          `products/${fileName}`;

        const {
          error:
            uploadError
        } =
          await db.storage
            .from("images")
            .upload(
              filePath,
              file,
              {
                upsert:
                  true
              }
            );

        if (uploadError) {
          throw uploadError;
        }

        const {
          data:
            publicUrlData
        } =
          db.storage
            .from("images")
            .getPublicUrl(
              filePath
            );

        payload.image_url =
          publicUrlData
            ?.publicUrl ||
          "";
      }

      /*
       * Edição
       */

      if (
        state.editingProductId !==
          null &&
        state.editingProductId !==
          undefined &&
        state.editingProductId !==
          ""
      ) {
        const numericId =
          Number(
            state.editingProductId
          );

        if (
          !Number.isFinite(
            numericId
          )
        ) {
          throw new Error(
            "ID do produto inválido."
          );
        }

        const {
          error
        } = await db
          .from("products")
          .update(
            payload
          )
          .eq(
            "id",
            numericId
          );

        if (error) {
          throw error;
        }

        showToast(
          "Produto atualizado com sucesso."
        );

      } else {
        /*
         * Novo produto
         */

        const {
          data,
          error
        } = await db
          .from("products")
          .insert(
            payload
          )
          .select()
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          state.products.push(
            {
              ...data,
              area:
                normalizeArea(
                  data.area,
                  data
                )
            }
          );
        }

        showToast(
          "Produto criado com sucesso."
        );
      }

      await loadProducts();

      closeProductModal();

      renderCurrentView();

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
      setButtonLoading(
        submitButton,
        false,
        "Salvar alterações"
      );
    }
  }

  /* =========================================================
     PRODUTOS — EXCLUIR
     ========================================================= */

  async function deleteProduct(
    product
  ) {
    if (
      !product ||
      product.id ===
        undefined ||
      product.id ===
        null
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Excluir o produto "${product.name || ""}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const numericId =
        Number(
          product.id
        );

      if (
        !Number.isFinite(
          numericId
        )
      ) {
        throw new Error(
          "ID do produto inválido."
        );
      }

      const {
        error
      } = await db
        .from("products")
        .delete()
        .eq(
          "id",
          numericId
        );

      if (error) {
        throw error;
      }

      state.products =
        state.products.filter(
          (item) =>
            String(
              item.id
            ) !==
            String(
              product.id
            )
        );

      showToast(
        "Produto excluído com sucesso."
      );

      renderCurrentView();

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
     PRODUTOS — CARD
     ========================================================= */

  function renderProductCard(
    product
  ) {
    const image =
      getProductImage(
        product
      );

    const available =
      product.available !==
        false &&
      product.available !==
        "false";

    const price =
      Number(
        product.price ||
          0
      );

    const discount =
      Number(
        product.discount ||
          0
      );

    const finalPrice =
      discount > 0
        ? price -
          price *
            (discount /
              100)
        : price;

    return `
      <article
        class="product-card"
        data-product-id="${escapeHtml(
          product.id
        )}"
      >

        <div class="product-card-image">

          ${
            image
              ? `
                <img
                  src="${escapeHtml(
                    image
                  )}"
                  alt="${escapeHtml(
                    product.name ||
                      ""
                  )}"
                >
              `
              : `
                <div class="product-image-empty">
                  Sem foto
                </div>
              `
          }

        </div>

        <div class="product-card-body">

          <div class="product-card-top">

            <span class="badge">
              ${escapeHtml(
                areaLabel(
                  product.area
                )
              )}
            </span>

            <span class="status ${
              available
                ? "active"
                : "inactive"
            }">
              ${
                available
                  ? "Ativo"
                  : "Inativo"
              }
            </span>

          </div>

          <h3>
            ${escapeHtml(
              product.name ||
                ""
            )}
          </h3>

          <p>
            ${escapeHtml(
              product.category ||
                ""
            )}
          </p>

          <div class="product-card-price">

            ${
              discount > 0
                ? `
                  <span class="old-price">
                    ${money(
                      price
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

          </div>

          ${
            product.description
              ? `
                <div class="product-card-description">
                  ${escapeHtml(
                    product.description
                  )}
                </div>
              `
              : ""
          }

          <div class="product-actions">

            <button
              type="button"
              class="btn soft"
              data-edit-product="${escapeHtml(
                product.id
              )}"
            >
              Editar
            </button>

            <button
              type="button"
              class="btn danger"
              data-delete-product="${escapeHtml(
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
     PRODUTOS — LISTA
     ========================================================= */

  function renderProductsView(
    area
  ) {
    const isOrders =
      area ===
      "encomendas";

    const products =
      isOrders
        ? getOrderProducts()
        : getReadyProducts();

    const heading =
      isOrders
        ? "Produtos — Encomendas"
        : "Produtos — Pronta Entrega";

    const description =
      isOrders
        ? "Produtos utilizados na área de encomendas."
        : "Produtos disponíveis para pronta entrega.";

    const cards =
      products.length
        ? products
            .map(
              renderProductCard
            )
            .join("")
        : `
          <div class="empty">
            Nenhum produto cadastrado nesta área.
          </div>
        `;

    if (title) {
      title.textContent =
        heading;
    }

    if (!view) {
      return;
    }

    view.innerHTML = `
      <div class="toolbar">

        <div>
          <h2>
            ${escapeHtml(
              heading
            )}
          </h2>

          <p class="muted">
            ${escapeHtml(
              description
            )}
          </p>
        </div>

        <button
          type="button"
          class="btn primary"
          id="newProduct"
        >
          + Novo produto
        </button>

      </div>

      <div class="products-grid">
        ${cards}
      </div>
    `;

    $("#newProduct")
      ?.addEventListener(
        "click",
        () => {
          openProductModal();
        }
      );

    $$(
      "[data-edit-product]"
    ).forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const id =
              button.dataset
                .editProduct;

            const product =
              state.products.find(
                (item) =>
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
          }
        );
      }
    );

    $$(
      "[data-delete-product]"
    ).forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const id =
              button.dataset
                .deleteProduct;

            const product =
              state.products.find(
                (item) =>
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
          }
        );
      }
    );
  }
     /* =========================================================
     DASHBOARD
     ========================================================= */

  function renderDashboard() {
    if (title) {
      title.textContent =
        "Dashboard";
    }

    if (!view) {
      return;
    }

    const readyProducts =
      getReadyProducts();

    const orderProducts =
      getOrderProducts();

    const readyOrders =
      state.orders.filter(
        (order) =>
          detectOrderArea(
            order
          ) === "pronta"
      );

    const customOrders =
      state.orders.filter(
        (order) =>
          detectOrderArea(
            order
          ) === "encomendas"
      );

    const pendingOrders =
      state.orders.filter(
        (order) => {
          const status =
            normalizeText(
              order.status
            );

          return (
            status ===
              "pendente" ||
            status ===
              "novo" ||
            status ===
              "aguardando"
          );
        }
      );

    view.innerHTML = `
      <div class="toolbar">

        <div>
          <h2>Dashboard</h2>
          <p class="muted">
            Visão geral da administração da Martins Confeitaria.
          </p>
        </div>

      </div>

      <div class="stats-grid">

        <div class="stat-card">
          <span>Produtos</span>
          <strong>
            ${state.products.length}
          </strong>
          <small>
            Todos os produtos
          </small>
        </div>

        <div class="stat-card">
          <span>Pronta Entrega</span>
          <strong>
            ${readyProducts.length}
          </strong>
          <small>
            Produtos disponíveis
          </small>
        </div>

        <div class="stat-card">
          <span>Encomendas</span>
          <strong>
            ${orderProducts.length}
          </strong>
          <small>
            Produtos para encomenda
          </small>
        </div>

        <div class="stat-card">
          <span>Pedidos</span>
          <strong>
            ${state.orders.length}
          </strong>
          <small>
            Total recebido
          </small>
        </div>

        <div class="stat-card">
          <span>Pronta Entrega</span>
          <strong>
            ${readyOrders.length}
          </strong>
          <small>
            Pedidos
          </small>
        </div>

        <div class="stat-card">
          <span>Encomendas</span>
          <strong>
            ${customOrders.length}
          </strong>
          <small>
            Pedidos
          </small>
        </div>

        <div class="stat-card">
          <span>Pendentes</span>
          <strong>
            ${pendingOrders.length}
          </strong>
          <small>
            Aguardando atendimento
          </small>
        </div>

      </div>

      <div class="dashboard-sections">

        <section class="panel">

          <div class="panel-head">
            <div>
              <h3>
                Últimos pedidos
              </h3>

              <p class="muted">
                Pedidos recebidos recentemente.
              </p>
            </div>
          </div>

          ${
            state.orders.length
              ? renderRecentOrders()
              : `
                <div class="empty">
                  Nenhum pedido recebido.
                </div>
              `
          }

        </section>

      </div>
    `;
  }

  function renderRecentOrders() {
    const orders =
      state.orders.slice(
        0,
        8
      );

    return `
      <div class="table-wrap">

        <table>

          <thead>
            <tr>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Total</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>

          <tbody>

            ${orders
              .map(
                (order) => `
                  <tr>

                    <td>
                      ${escapeHtml(
                        getOrderCustomer(
                          order
                        )
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        areaLabel(
                          detectOrderArea(
                            order
                          )
                        )
                      )}
                    </td>

                    <td>
                      ${money(
                        getOrderTotal(
                          order
                        )
                      )}
                    </td>

                    <td>
                      <span class="status ${
                        getOrderStatusClass(
                          order
                        )
                      }">
                        ${escapeHtml(
                          getOrderStatusLabel(
                            order
                          )
                        )}
                      </span>
                    </td>

                    <td>
                      ${formatDate(
                        order.created_at ||
                          order.createdAt
                      )}
                    </td>

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
     PEDIDOS — IDENTIFICAÇÃO
     ========================================================= */

  function getOrderCustomer(
    order
  ) {
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

  function getOrderPhone(
    order
  ) {
    return (
      order.customer_phone ||
      order.phone ||
      order.telefone ||
      order.whatsapp ||
      order.celular ||
      ""
    );
  }

  function getOrderTotal(
    order
  ) {
    const possibleValues = [
      order.total,
      order.total_price,
      order.valor_total,
      order.amount,
      order.price
    ];

    for (
      const value of
        possibleValues
    ) {
      if (
        value !==
          undefined &&
        value !==
          null &&
        value !== ""
      ) {
        const number =
          Number(
            value
          );

        if (
          Number.isFinite(
            number
          )
        ) {
          return number;
        }
      }
    }

    return 0;
  }

  function getOrderStatusLabel(
    order
  ) {
    const status =
      normalizeText(
        order?.status ||
          ""
      );

    if (
      status ===
      "concluido"
    ) {
      return "Concluído";
    }

    if (
      status ===
      "cancelado"
    ) {
      return "Cancelado";
    }

    if (
      status ===
      "em preparo"
    ) {
      return "Em preparo";
    }

    if (
      status ===
      "preparando"
    ) {
      return "Preparando";
    }

    if (
      status ===
      "aguardando"
    ) {
      return "Aguardando";
    }

    return "Pendente";
  }

  function getOrderStatusClass(
    order
  ) {
    const status =
      normalizeText(
        order?.status ||
          ""
      );

    if (
      status ===
      "concluido"
    ) {
      return "active";
    }

    if (
      status ===
      "cancelado"
    ) {
      return "inactive";
    }

    return "";
  }

  function detectOrderArea(
    order
  ) {
    if (!order) {
      return "pronta";
    }

    const directValues = [
      order.area,
      order.type,
      order.order_type,
      order.orderType,
      order.tipo,
      order.kind,
      order.category
    ];

    for (
      const value of
        directValues
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
          "personalizado"
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

    /*
     * Alguns pedidos podem guardar
     * os produtos dentro de JSON.
     */

    const raw =
      JSON.stringify(
        order
      );

    const normalizedRaw =
      normalizeText(
        raw
      );

    if (
      normalizedRaw.includes(
        "encomenda"
      ) ||
      normalizedRaw.includes(
        "naked cake"
      ) ||
      normalizedRaw.includes(
        "chantininho"
      ) ||
      normalizedRaw.includes(
        "brigadeiro premium"
      )
    ) {
      return "encomendas";
    }

    return "pronta";
  }

  function formatDate(
    value
  ) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(
        value
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(
        value
      );
    }

    return date.toLocaleString(
      "pt-BR",
      {
        dateStyle:
          "short",
        timeStyle:
          "short"
      }
    );
  }

  /* =========================================================
     PEDIDOS — RENDERIZAÇÃO
     ========================================================= */

  function renderOrdersView(
    area
  ) {
    const isCustom =
      area ===
      "encomendas";

    const orders =
      state.orders.filter(
        (order) =>
          detectOrderArea(
            order
          ) === area
      );

    const heading =
      isCustom
        ? "Pedidos — Encomendas"
        : "Pedidos — Pronta Entrega";

    if (title) {
      title.textContent =
        heading;
    }

    if (!view) {
      return;
    }

    view.innerHTML = `
      <div class="toolbar">

        <div>
          <h2>
            ${escapeHtml(
              heading
            )}
          </h2>

          <p class="muted">
            ${
              isCustom
                ? "Pedidos de bolos e produtos feitos sob encomenda."
                : "Pedidos dos produtos disponíveis para pronta entrega."
            }
          </p>
        </div>

        <button
          type="button"
          class="btn soft"
          id="printOrders"
        >
          🖨️ Imprimir
        </button>

      </div>

      ${
        orders.length
          ? renderOrdersTable(
              orders,
              isCustom
            )
          : `
            <div class="empty">
              Nenhum pedido encontrado nesta área.
            </div>
          `
      }
    `;

    $("#printOrders")
      ?.addEventListener(
        "click",
        () => {
          printOrders(
            orders,
            heading
          );
        }
      );

    $$(
      "[data-order-status]"
    ).forEach(
      (select) => {
        select.addEventListener(
          "change",
          async () => {
            const id =
              select.dataset
                .orderStatus;

            const status =
              select.value;

            await updateOrderStatus(
              id,
              status
            );
          }
        );
      }
    );
  }

  function renderOrdersTable(
    orders,
    isCustom
  ) {
    return `
      <div class="panel">

        <div class="table-wrap">

          <table>

            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Pedido</th>
                <th>Total</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>

            <tbody>

              ${orders
                .map(
                  (order) => `
                    <tr>

                      <td>
                        <strong>
                          ${escapeHtml(
                            getOrderCustomer(
                              order
                            )
                          )}
                        </strong>
                      </td>

                      <td>
                        ${escapeHtml(
                          getOrderPhone(
                            order
                          ) ||
                            "—"
                        )}
                      </td>

                      <td>
                        ${renderOrderItems(
                          order
                        )}
                      </td>

                      <td>
                        <strong>
                          ${money(
                            getOrderTotal(
                              order
                            )
                          )}
                        </strong>
                      </td>

                      <td>

                        <select
                          class="order-status"
                          data-order-status="${escapeHtml(
                            order.id
                          )}"
                        >

                          ${renderStatusOptions(
                            order.status
                          )}

                        </select>

                      </td>

                      <td>
                        ${formatDate(
                          order.created_at ||
                            order.createdAt
                        )}
                      </td>

                    </tr>
                  `
                )
                .join("")}

            </tbody>

          </table>

        </div>

      </div>
    `;
  }

  function renderStatusOptions(
    current
  ) {
    const normalized =
      normalizeText(
        current ||
          "pendente"
      );

    const options = [
      [
        "pendente",
        "Pendente"
      ],
      [
        "em_preparo",
        "Em preparo"
      ],
      [
        "concluido",
        "Concluído"
      ],
      [
        "cancelado",
        "Cancelado"
      ]
    ];

    return options
      .map(
        ([value, label]) => `
          <option
            value="${value}"
            ${
              normalizeText(
                normalized
              ) ===
              normalizeText(
                value
              )
                ? "selected"
                : ""
            }
          >
            ${label}
          </option>
        `
      )
      .join("");
  }

  function renderOrderItems(
    order
  ) {
    const possible =
      order.items ||
      order.products ||
      order.produtos ||
      order.order_items;

    if (
      Array.isArray(
        possible
      )
    ) {
      return possible
        .map(
          (item) => {
            const name =
              item.name ||
              item.nome ||
              item.product_name ||
              "Produto";

            const quantity =
              item.quantity ||
              item.quantidade ||
              1;

            return `
              <div>
                ${escapeHtml(
                  name
                )}
                × ${escapeHtml(
                  quantity
                )}
              </div>
            `;
          }
        )
        .join("");
    }

    if (
      typeof possible ===
      "string"
    ) {
      return escapeHtml(
        possible
      );
    }

    return "—";
  }
     /* =========================================================
     PEDIDOS — ATUALIZAR STATUS
     ========================================================= */

  async function updateOrderStatus(
    orderId,
    status
  ) {
    if (!db) {
      showToast(
        "Supabase não está conectado.",
        "error"
      );
      return;
    }

    if (
      orderId ===
        undefined ||
      orderId ===
        null ||
      orderId === ""
    ) {
      showToast(
        "Pedido inválido.",
        "error"
      );
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
          orderId
        );

      if (error) {
        throw error;
      }

      const order =
        state.orders.find(
          (item) =>
            String(
              item.id
            ) ===
            String(
              orderId
            )
        );

      if (order) {
        order.status =
          status;
      }

      showToast(
        "Status do pedido atualizado."
      );

    } catch (error) {
      console.error(
        "Erro ao atualizar pedido:",
        error
      );

      showToast(
        error?.message ||
          "Não foi possível atualizar o pedido.",
        "error"
      );
    }
  }

  /* =========================================================
     IMPRESSÃO DE PEDIDOS
     ========================================================= */

  function printOrders(
    orders,
    heading
  ) {
    if (
      !Array.isArray(
        orders
      ) ||
      !orders.length
    ) {
      showToast(
        "Não há pedidos para imprimir.",
        "warning"
      );
      return;
    }

    const rows =
      orders
        .map(
          (order) => `
            <tr>

              <td>
                ${escapeHtml(
                  getOrderCustomer(
                    order
                  )
                )}
              </td>

              <td>
                ${escapeHtml(
                  getOrderPhone(
                    order
                  ) ||
                    "—"
                )}
              </td>

              <td>
                ${renderOrderItems(
                  order
                )}
              </td>

              <td>
                ${money(
                  getOrderTotal(
                    order
                  )
                )}
              </td>

              <td>
                ${escapeHtml(
                  getOrderStatusLabel(
                    order
                  )
                )}
              </td>

              <td>
                ${formatDate(
                  order.created_at ||
                    order.createdAt
                )}
              </td>

            </tr>
          `
        )
        .join("");

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1200,height=800"
      );

    if (!printWindow) {
      showToast(
        "O navegador bloqueou a janela de impressão.",
        "warning"
      );
      return;
    }

    printWindow.document.write(
      `
        <!DOCTYPE html>

        <html lang="pt-BR">

        <head>

          <meta charset="UTF-8">

          <title>
            ${escapeHtml(
              heading
            )}
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

            h1 {
              margin: 0 0 8px;
              font-size: 25px;
            }

            .date {
              margin-bottom: 24px;
              color: #666;
              font-size: 13px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }

            th,
            td {
              padding: 10px;
              border: 1px solid #ddd;
              text-align: left;
              vertical-align: top;
            }

            th {
              background: #f3f3f3;
              font-weight: 700;
            }

            .total {
              font-weight: 700;
            }

            @media print {

              body {
                padding: 10px;
              }

              button {
                display: none;
              }

            }

          </style>

        </head>

        <body>

          <h1>
            Martins Confeitaria
          </h1>

          <div class="date">
            ${escapeHtml(
              heading
            )}
            —
            Impresso em
            ${escapeHtml(
              formatDate(
                new Date()
              )
            )}
          </div>

          <table>

            <thead>

              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Pedido</th>
                <th>Total</th>
                <th>Status</th>
                <th>Data</th>
              </tr>

            </thead>

            <tbody>
              ${rows}
            </tbody>

          </table>

          <script>
            window.onload = function () {
              window.print();
            };
          <\/script>

        </body>

        </html>
      `
    );

    printWindow.document.close();
  }

  /* =========================================================
     ENCOMENDAS PERSONALIZADAS
     ========================================================= */

  function renderCustomCakeOrders() {
    const orders =
      state.customCakes;

    if (title) {
      title.textContent =
        "Encomendas";
    }

    if (!view) {
      return;
    }

    view.innerHTML = `
      <div class="toolbar">

        <div>
          <h2>
            Encomendas personalizadas
          </h2>

          <p class="muted">
            Solicitações de bolos personalizados.
          </p>
        </div>

        <button
          type="button"
          class="btn soft"
          id="printCustomCakes"
        >
          🖨️ Imprimir
        </button>

      </div>

      ${
        orders.length
          ? `
            <div class="panel">

              <div class="table-wrap">

                <table>

                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Bolo</th>
                      <th>Data</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>

                    ${orders
                      .map(
                        (
                          order
                        ) => `
                          <tr>

                            <td>
                              ${escapeHtml(
                                order.customer_name ||
                                  order.name ||
                                  order.cliente ||
                                  "Cliente"
                              )}
                            </td>

                            <td>
                              ${escapeHtml(
                                order.cake_type ||
                                  order.cake ||
                                  order.tipo ||
                                  "—"
                              )}
                            </td>

                            <td>
                              ${formatDate(
                                order.created_at ||
                                  order.createdAt
                              )}
                            </td>

                            <td>
                              ${escapeHtml(
                                order.status ||
                                  "Pendente"
                              )}
                            </td>

                          </tr>
                        `
                      )
                      .join("")}

                  </tbody>

                </table>

              </div>

            </div>
          `
          : `
            <div class="empty">
              Nenhuma encomenda personalizada encontrada.
            </div>
          `
      }
    `;

    $("#printCustomCakes")
      ?.addEventListener(
        "click",
        () => {
          printCustomCakes(
            orders
          );
        }
      );
  }

  function printCustomCakes(
    orders
  ) {
    if (
      !Array.isArray(
        orders
      ) ||
      !orders.length
    ) {
      showToast(
        "Não há encomendas para imprimir.",
        "warning"
      );
      return;
    }

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1100,height=800"
      );

    if (!printWindow) {
      showToast(
        "O navegador bloqueou a janela de impressão.",
        "warning"
      );
      return;
    }

    const rows =
      orders
        .map(
          (order) => `
            <tr>

              <td>
                ${escapeHtml(
                  order.customer_name ||
                    order.name ||
                    order.cliente ||
                    "Cliente"
                )}
              </td>

              <td>
                ${escapeHtml(
                  order.cake_type ||
                    order.cake ||
                    order.tipo ||
                    "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  order.filling ||
                    order.recheio ||
                    "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  order.size ||
                    order.tamanho ||
                    "—"
                )}
              </td>

              <td>
                ${formatDate(
                  order.created_at ||
                    order.createdAt
                )}
              </td>

            </tr>
          `
        )
        .join("");

    printWindow.document.write(
      `
        <!DOCTYPE html>

        <html lang="pt-BR">

        <head>

          <meta charset="UTF-8">

          <title>
            Encomendas — Martins Confeitaria
          </title>

          <style>

            body {
              font-family:
                Arial,
                Helvetica,
                sans-serif;
              padding: 30px;
              color: #222;
            }

            h1 {
              margin-bottom: 5px;
            }

            p {
              color: #666;
              margin-top: 0;
              margin-bottom: 25px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th,
            td {
              border: 1px solid #ddd;
              padding: 9px;
              text-align: left;
              vertical-align: top;
            }

            th {
              background: #f4f4f4;
            }

            @media print {
              body {
                padding: 10px;
              }
            }

          </style>

        </head>

        <body>

          <h1>
            Martins Confeitaria
          </h1>

          <p>
            Encomendas personalizadas
          </p>

          <table>

            <thead>

              <tr>
                <th>Cliente</th>
                <th>Bolo</th>
                <th>Recheio</th>
                <th>Tamanho</th>
                <th>Data</th>
              </tr>

            </thead>

            <tbody>
              ${rows}
            </tbody>

          </table>

          <script>
            window.onload = function () {
              window.print();
            };
          <\/script>

        </body>

        </html>
      `
    );

    printWindow.document.close();
  }

  /* =========================================================
     CONFIGURAÇÕES — FORMATAÇÃO
     ========================================================= */

  function getSetting(
    key,
    fallback = ""
  ) {
    if (
      state.settings &&
      Object.prototype.hasOwnProperty.call(
        state.settings,
        key
      )
    ) {
      return (
        state.settings[key] ??
        fallback
      );
    }

    return fallback;
  }

  function renderSettings() {
    if (title) {
      title.textContent =
        "Configurações";
    }

    if (!view) {
      return;
    }

    const settings =
      state.settings ||
      {};

    view.innerHTML = `
      <div class="toolbar">

        <div>
          <h2>
            Configurações
          </h2>

          <p class="muted">
            Altere as informações utilizadas pelo site.
          </p>
        </div>

        <button
          type="button"
          class="btn primary"
          id="saveSettings"
        >
          Salvar alterações
        </button>

      </div>

      <div class="panel">

        <form
          id="settingsForm"
          class="settings-form"
        >

          <div class="settings-grid">

            <label>
              Nome da empresa

              <input
                id="s-name"
                value="${escapeHtml(
                  settings.name ||
                    settings.business_name ||
                    "Martins Confeitaria"
                )}"
              >
            </label>

            <label>
              WhatsApp

              <input
                id="s-whatsapp"
                value="${escapeHtml(
                  settings.whatsapp ||
                    "5585981563070"
                )}"
              >
            </label>

            <label class="full">
              Endereço

              <input
                id="s-address"
                value="${escapeHtml(
                  settings.address ||
                    "Rua 1018, 65, Conjunto Ceará II, Fortaleza-CE 60532-690"
                )}"
              >
            </label>

            <label class="full">
              Instagram

              <input
                id="s-instagram"
                value="${escapeHtml(
                  settings.instagram ||
                    "@martins_confeitariaartesanal"
                )}"
              </label>

            <label class="full">
              Mensagem do WhatsApp

              <textarea
                id="s-message"
                rows="4"
              >${escapeHtml(
                settings.whatsapp_message ||
                  ""
              )}</textarea>
            </label>

          </div>

        </form>

      </div>
    `;

    $("#saveSettings")
      ?.addEventListener(
        "click",
        saveSettings
      );
  }
     /* =========================================================
     CONFIGURAÇÕES — SALVAR
     ========================================================= */

  async function saveSettings() {
    if (!db) {
      showToast(
        "Supabase não está conectado.",
        "error"
      );
      return;
    }

    const button =
      $("#saveSettings");

    setButtonLoading(
      button,
      true,
      "Salvando..."
    );

    try {
      const current =
        state.settings || {};

      const next = {
        ...current,

        name:
          $("#s-name")
            ?.value
            ?.trim() ||
          "Martins Confeitaria",

        whatsapp:
          $("#s-whatsapp")
            ?.value
            ?.trim() ||
          "5585981563070",

        address:
          $("#s-address")
            ?.value
            ?.trim() ||
          "",

        instagram:
          $("#s-instagram")
            ?.value
            ?.trim() ||
          "",

        whatsapp_message:
          $("#s-message")
            ?.value
            ?.trim() ||
          ""
      };

      const {
        error
      } = await db
        .from("settings")
        .upsert(
          {
            key: "site",
            value: next
          },
          {
            onConflict:
              "key"
          }
        );

      if (error) {
        throw error;
      }

      state.settings =
        next;

      showToast(
        "Alterações salvas com sucesso."
      );

    } catch (error) {
      console.error(
        "Erro ao salvar configurações:",
        error
      );

      showToast(
        error?.message ||
          "Não foi possível salvar as alterações.",
        "error"
      );

    } finally {
      setButtonLoading(
        button,
        false,
        "Salvar alterações"
      );
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
    $$(
      "[data-view]"
    ).forEach(
      (button) => {
        button.classList.toggle(
          "active",
          button.dataset.view ===
            viewName
        );
      }
    );
  }

  function renderCurrentView() {
    const current =
      state.activeView ||
      "dashboard";

    setActiveNav(
      current
    );

    if (current ===
      "dashboard"
    ) {
      renderDashboard();
      return;
    }

    if (
      current ===
      "prod-ready"
    ) {
      renderProductsView(
        "pronta"
      );
      return;
    }

    if (
      current ===
      "prod-orders"
    ) {
      renderProductsView(
        "encomendas"
      );
      return;
    }

    if (
      current ===
      "ord-ready"
    ) {
      renderOrdersView(
        "pronta"
      );
      return;
    }

    if (
      current ===
      "ord-orders"
    ) {
      renderOrdersView(
        "encomendas"
      );
      return;
    }

    if (
      current ===
      "settings"
    ) {
      renderSettings();
      return;
    }

    state.activeView =
      "dashboard";

    renderDashboard();
  }

  function navigate(
    viewName
  ) {
    if (
      !viewTitles[
        viewName
      ]
    ) {
      viewName =
        "dashboard";
    }

    state.activeView =
      viewName;

    if (title) {
      title.textContent =
        viewTitles[
          viewName
        ];
    }

    renderCurrentView();

    closeMobileMenu();
  }

  /* =========================================================
     MENU LATERAL
     ========================================================= */

  function bindNavigation() {
    $$(
      "[data-view]"
    ).forEach(
      (button) => {
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

  function toggleMobileMenu() {
    if (!side) {
      return;
    }

    const isOpen =
      side.classList.contains(
        "open"
      );

    if (isOpen) {
      closeMobileMenu();
      return;
    }

    document.body.classList.add(
      "menu-open"
    );

    side.classList.add(
      "open"
    );

    if (shade) {
      shade.classList.add(
        "show"
      );
    }
  }

  /* =========================================================
     MODAL DE PRODUTO
     ========================================================= */

  function bindProductModal() {
    if (
      productForm
    ) {
      productForm.addEventListener(
        "submit",
        saveProduct
      );
    }

    $$(
      "[data-close]"
    ).forEach(
      (button) => {
        button.addEventListener(
          "click",
          closeProductModal
        );
      }
    );

    modal?.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          modal
        ) {
          closeProductModal();
        }
      }
    );

    $("#f-cat")
      ?.addEventListener(
        "change",
        async (event) => {
          if (
            event.target.value ===
            "__new__"
          ) {
            await createCategory();

            if (
              event.target.value ===
              "__new__"
            ) {
              renderCategoryOptions();
            }
          }
        }
      );

    $("#rmimg")
      ?.addEventListener(
        "click",
        () => {
          const preview =
            $("#prev");

          const photo =
            $("#f-photo");

          if (preview) {
            preview.src =
              "";
            preview.classList.add(
              "hidden"
            );
          }

          if (photo) {
            photo.value =
              "";
          }

          const remove =
            $("#rmimg");

          if (remove) {
            remove.classList.add(
              "hidden"
            );
          }
        }
      );

    $("#f-photo")
      ?.addEventListener(
        "change",
        () => {
          const file =
            $("#f-photo")
              ?.files?.[0];

          const preview =
            $("#prev");

          const remove =
            $("#rmimg");

          if (
            !file ||
            !preview
          ) {
            return;
          }

          if (
            !file.type.startsWith(
              "image/"
            )
          ) {
            showToast(
              "Selecione uma imagem válida.",
              "warning"
            );

            $("#f-photo").value =
              "";

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

          if (remove) {
            remove.classList.remove(
              "hidden"
            );
          }
        }
      );
  }

  /* =========================================================
     ATUALIZAÇÃO DOS DADOS
     ========================================================= */

  async function refreshData(
    showMessage = true
  ) {
    if (!db) {
      return;
    }

    if (
      state.loading
    ) {
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

      renderCurrentView();

      if (
        showMessage
      ) {
        showToast(
          "Dados atualizados."
        );
      }

    } catch (error) {
      console.error(
        "Erro ao atualizar dados:",
        error
      );

      showToast(
        error?.message ||
          "Não foi possível atualizar os dados.",
        "error"
      );

    } finally {
      state.loading =
        false;
    }
  }

  /* =========================================================
     LOGIN
     ========================================================= */

  async function loginUser(
    event
  ) {
    event.preventDefault();

    if (!db) {
      setLoginMessage(
        "Não foi possível conectar ao Supabase."
      );
      return;
    }

    const email =
      loginEmail
        ?.value
        ?.trim() ||
      "";

    const password =
      loginPassword
        ?.value ||
      "";

    if (
      !email ||
      !password
    ) {
      setLoginMessage(
        "Informe e-mail e senha."
      );
      return;
    }

    const submitButton =
      loginForm?.querySelector(
        'button[type="submit"]'
      );

    setButtonLoading(
      submitButton,
      true,
      "Entrando..."
    );

    setLoginMessage(
      "",
      false
    );

    try {
      const {
        data,
        error
      } =
        await db.auth.signInWithPassword(
          {
            email,
            password
          }
        );

      if (error) {
        throw error;
      }

      state.session =
        data?.session ||
        null;

      state.user =
        data?.user ||
        null;

      if (
        !state.session
      ) {
        throw new Error(
          "Não foi possível iniciar a sessão."
        );
      }

      await enterApp();

    } catch (error) {
      console.error(
        "Erro no login:",
        error
      );

      let message =
        "Não foi possível entrar.";

      if (
        error?.message
      ) {
        message =
          error.message;
      }

      if (
        normalizeText(
          message
        ).includes(
          "invalid login credentials"
        )
      ) {
        message =
          "E-mail ou senha incorretos.";
      }

      setLoginMessage(
        message
      );

    } finally {
      setButtonLoading(
        submitButton,
        false,
        "Entrar"
      );
    }
  }
     /* =========================================================
     ENTRAR NO PAINEL
     ========================================================= */

  async function enterApp() {
    if (!login || !app) {
      return;
    }

    login.classList.add(
      "hidden"
    );

    app.classList.remove(
      "hidden"
    );

    setLoginMessage(
      "",
      false
    );

    try {
      await refreshData(
        false
      );
    } catch (error) {
      console.error(
        "Erro ao carregar painel:",
        error
      );
    }

    navigate(
      state.activeView ||
        "dashboard"
    );
  }

  /* =========================================================
     SAIR
     ========================================================= */

  async function logout() {
    try {
      if (db) {
        const {
          error
        } =
          await db.auth.signOut();

        if (error) {
          console.error(
            "Erro ao sair:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Erro no logout:",
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

    state.activeView =
      "dashboard";

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

    if (loginForm) {
      loginForm.reset();
    }

    setLoginMessage(
      "",
      false
    );

    closeMobileMenu();
  }

  /* =========================================================
     RECUPERAR SESSÃO EXISTENTE
     ========================================================= */

  async function restoreSession() {
    if (!db) {
      return;
    }

    try {
      const {
        data,
        error
      } =
        await db.auth.getSession();

      if (error) {
        console.error(
          "Erro ao recuperar sessão:",
          error
        );
        return;
      }

      const session =
        data?.session ||
        null;

      if (!session) {
        return;
      }

      state.session =
        session;

      state.user =
        session.user ||
        null;

      await enterApp();

    } catch (error) {
      console.error(
        "Erro ao restaurar sessão:",
        error
      );
    }
  }

  /* =========================================================
     OBSERVADOR DE AUTENTICAÇÃO
     ========================================================= */

  function bindAuthListener() {
    if (!db) {
      return;
    }

    db.auth.onAuthStateChange(
      (
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
            "SIGNED_OUT" ||
          !session
        ) {
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

          closeMobileMenu();

          return;
        }

        if (
          event ===
            "SIGNED_IN" &&
          session
        ) {
          if (
            app &&
            app.classList.contains(
              "hidden"
            )
          ) {
            enterApp();
          }
        }
      }
    );
  }

  /* =========================================================
     EVENTOS GERAIS
     ========================================================= */

  function bindGeneralEvents() {
    if (loginForm) {
      loginForm.addEventListener(
        "submit",
        loginUser
      );
    }

    if (logoutBtn) {
      logoutBtn.addEventListener(
        "click",
        logout
      );
    }

    if (refreshBtn) {
      refreshBtn.addEventListener(
        "click",
        () => {
          refreshData(
            true
          );
        }
      );
    }

    if (burger) {
      burger.addEventListener(
        "click",
        toggleMobileMenu
      );
    }

    if (shade) {
      shade.addEventListener(
        "click",
        closeMobileMenu
      );
    }

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key ===
          "Escape"
        ) {
          closeProductModal();
          closeMobileMenu();
        }
      }
    );
  }

  /* =========================================================
     VERIFICAÇÃO DOS ELEMENTOS
     ========================================================= */

  function checkRequiredElements() {
    const required = [
      [
        "login",
        login
      ],
      [
        "loginForm",
        loginForm
      ],
      [
        "email",
        loginEmail
      ],
      [
        "password",
        loginPassword
      ],
      [
        "app",
        app
      ],
      [
        "view",
        view
      ],
      [
        "modal",
        modal
      ],
      [
        "pform",
        productForm
      ]
    ];

    const missing =
      required.filter(
        ([name, element]) =>
          !element
      );

    if (
      missing.length
    ) {
      console.warn(
        "Elementos não encontrados no admin:",
        missing.map(
          ([name]) =>
            name
        )
      );
    }
  }

  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  async function init() {
    checkRequiredElements();

    const connected =
      initSupabase();

    if (!connected) {
      setLoginMessage(
        "Não foi possível carregar o sistema."
      );
      return;
    }

    bindNavigation();

    bindProductModal();

    bindGeneralEvents();

    bindAuthListener();

    renderCategoryOptions();

    /*
     * Começa sempre mostrando
     * o login até que o Supabase
     * confirme uma sessão existente.
     */

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

    await restoreSession();
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
      init
    );
  } else {
    init();
  }
     /* =========================================================
     FIM DO PAINEL ADMINISTRATIVO
     ========================================================= */

})();
