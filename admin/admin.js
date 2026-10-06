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
    settings: {},
    products: [],
    categories: [],
    editingProductId: null,
    activeTab: "products",
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

  const loginScreen = $("#loginScreen");
  const app = $("#app");
  const loginForm = $("#loginForm");
  const loginMsg = $("#loginMsg");
  const logoutBtn = $("#logout");
  const refreshBtn = $("#refreshBtn");
  const tabContent = $("#tabContent");
  const productModal = $("#productModal");
  const productForm = $("#productForm");

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
    const number = Number(value || 0);

    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
  }

  function toast(
    message,
    type = "success"
  ) {
    let box = $("#adminToast");

    if (!box) {
      box = document.createElement("div");
      box.id = "adminToast";

      Object.assign(box.style, {
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: "99999",
        padding: "14px 18px",
        borderRadius: "12px",
        color: "#fff",
        fontWeight: "700",
        boxShadow:
          "0 8px 30px rgba(0,0,0,.18)",
        maxWidth: "360px",
        fontSize: "14px"
      });

      document.body.appendChild(box);
    }

    box.style.background =
      type === "error"
        ? "#c0392b"
        : type === "warning"
        ? "#d68910"
        : "#2b7896";

    box.textContent = message;
    box.style.display = "block";

    clearTimeout(box._timer);

    box._timer = setTimeout(() => {
      box.style.display = "none";
    }, 3500);
  }

  function showLoginMessage(
    message,
    error = true
  ) {
    if (!loginMsg) return;

    loginMsg.textContent = message;

    loginMsg.style.color =
      error
        ? "#c0392b"
        : "#2b7896";
  }

  function setLoading(
    button,
    loading,
    originalText = "Salvar"
  ) {
    if (!button) return;

    if (loading) {
      button.dataset.originalText =
        button.textContent ||
        originalText;

      button.disabled = true;
      button.textContent =
        "Salvando...";
    } else {
      button.disabled = false;

      button.textContent =
        button.dataset.originalText ||
        originalText;
    }
  }

  /* =========================================================
     LOGO
     ========================================================= */

  function loadAdminLogo() {
    const wrap = $("#loginLogoWrap");

    if (!wrap) return;

    const possibleLogo =
      DEFAULTS.logo ||
      DEFAULTS.logo_url ||
      state.settings.logo ||
      state.settings.logo_url ||
      state.settings.logoUrl ||
      "";

    if (possibleLogo) {
      wrap.innerHTML = `
        <img
          src="${escapeHtml(possibleLogo)}"
          alt="Martins Confeitaria"
          class="login-logo"
        >
      `;
    }
  }

  /* =========================================================
     CLASSIFICAÇÕES
     ========================================================= */

  function defaultCategories() {
    return Array.isArray(
      DEFAULTS.categories
    )
      ? [...DEFAULTS.categories]
      : [
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

  function normalizeCategories(
    categories
  ) {
    if (!Array.isArray(categories)) {
      return defaultCategories();
    }

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

  async function saveCategories() {
    if (!db) {
      throw new Error(
        "Supabase não está disponível."
      );
    }

    const payload = {
      ...state.settings,
      categories:
        state.categories
    };

    const { error } =
      await db
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
      throw error;
    }

    state.settings = payload;
  }

  async function createClassification() {
    const name = window.prompt(
      "Digite o nome da nova classificação:"
    );

    if (name === null) return;

    const cleanName =
      name.trim();

    if (!cleanName) {
      toast(
        "Digite um nome válido.",
        "warning"
      );
      return;
    }

    const alreadyExists =
      state.categories.some(
        (category) =>
          category.toLowerCase() ===
          cleanName.toLowerCase()
      );

    if (alreadyExists) {
      toast(
        "Essa classificação já existe.",
        "warning"
      );
      return;
    }

    state.categories.push(
      cleanName
    );

    state.categories.sort(
      (a, b) =>
        a.localeCompare(
          b,
          "pt-BR"
        )
    );

    try {
      await saveCategories();
      renderProductTab();

      toast(
        "Classificação criada com sucesso."
      );
    } catch (error) {
      state.categories =
        state.categories.filter(
          (category) =>
            category !== cleanName
        );

      toast(
        "Não foi possível salvar a classificação: " +
          (error.message ||
            "erro desconhecido"),
        "error"
      );
    }
  }

  async function deleteClassification(
    name
  ) {
    const used =
      state.products.some(
        (product) =>
          String(
            product.category || ""
          ).trim() ===
          String(name).trim()
      );

    if (used) {
      toast(
        "Essa classificação está sendo usada por um produto.",
        "warning"
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Excluir a classificação "${name}"?`
      );

    if (!confirmed) return;

    const oldCategories = [
      ...state.categories
    ];

    state.categories =
      state.categories.filter(
        (category) =>
          category !== name
      );

    try {
      await saveCategories();
      renderProductTab();

      toast(
        "Classificação excluída."
      );
    } catch (error) {
      state.categories =
        oldCategories;

      toast(
        "Não foi possível excluir a classificação.",
        "error"
      );
    }
  }

  /* =========================================================
     NORMALIZAÇÃO DA ÁREA
     ========================================================= */

  function normalizeArea(
    area,
    product = {}
  ) {
    const value =
      String(area || "")
        .toLowerCase()
        .trim();

    if (
      value === "encomendas" ||
      value === "encomenda"
    ) {
      return "encomendas";
    }

    const name =
      String(product.name || "")
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .toLowerCase()
        .trim();

    if (
      name.includes("naked cake") ||
      name.includes("chantininho")
    ) {
      return "encomendas";
    }

    if (
      name.includes("oreo") ||
      name.includes("kit kat") ||
      name.includes("kitkat") ||
      name.includes("nutella") ||
      name.includes("kinder bueno")
    ) {
      return "encomendas";
    }

    if (
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
      )
    ) {
      return "encomendas";
    }

    return "cardapio";
  }

  function areaLabel(area) {
    return normalizeArea(area) ===
      "encomendas"
      ? "Encomendas"
      : "Delivery";
  }

  function getProductImage(
    product
  ) {
    return (
      product.image_url ||
      product.image ||
      product.photo_url ||
      product.photo ||
      product.imagem ||
      product.foto ||
      ""
    );
  }

  /* =========================================================
     CONFIGURAÇÕES
     ========================================================= */

  async function loadSettings() {
    if (!db) {
      throw new Error(
        "Supabase não está disponível."
      );
    }

    const { data, error } =
      await db
        .from("settings")
        .select("*")
        .eq("key", "site")
        .maybeSingle();

    if (error) {
      console.error(
        "Erro settings:",
        error
      );

      state.settings = {
        ...DEFAULTS
      };

      state.categories =
        defaultCategories();

      loadAdminLogo();

      return;
    }

    const value =
      data?.value || {};

    state.settings = {
      ...DEFAULTS,
      ...value
    };

    state.categories =
      normalizeCategories(
        value.categories ||
          DEFAULTS.categories
      );

    loadAdminLogo();
  }

  /* =========================================================
     PRODUTOS
     ========================================================= */

  async function loadProducts() {
    if (!db) {
      throw new Error(
        "Supabase não está disponível."
      );
    }

    const { data, error } =
      await db
        .from("products")
        .select("*")
        .order("sort", {
          ascending: true
        });
         if (error) {
      console.error(
        "Erro products:",
        error
      );

      state.products = [];

      return;
    }

    state.products =
      Array.isArray(data)
        ? data
        : [];

    state.products =
      state.products.map(
        (product) => ({
          ...product,
          area: normalizeArea(
            product.area,
            product
          )
        })
      );
  }

  function updateStats() {
    const statProducts =
      $("#statProducts");

    const statAvailable =
      $("#statAvailable");

    const statOrders =
      $("#statOrders");

    const statCakes =
      $("#statCakes");

    if (statProducts) {
      statProducts.textContent =
        state.products.length;
    }

    if (statAvailable) {
      statAvailable.textContent =
        state.products.filter(
          (product) =>
            product.available !==
              false &&
            product.available !==
              "false"
        ).length;
    }

    if (statOrders) {
      statOrders.textContent =
        "—";
    }

    if (statCakes) {
      statCakes.textContent =
        "—";
    }
  }

  /* =========================================================
     CAMPOS DO PRODUTO
     ========================================================= */

  function ensureProductFormFields() {
    const area =
      $("#productArea");

    if (area) {
      const current =
        area.value;

      const hasDelivery =
        Array.from(
          area.options
        ).some(
          (option) =>
            option.value ===
            "cardapio"
        );

      const hasPronta =
        Array.from(
          area.options
        ).some(
          (option) =>
            option.value ===
            "pronta-entrega"
        );

      const hasEncomendas =
        Array.from(
          area.options
        ).some(
          (option) =>
            option.value ===
            "encomendas"
        );

      if (!hasDelivery) {
        area.insertAdjacentHTML(
          "beforeend",
          `
            <option value="cardapio">
              Delivery
            </option>
          `
        );
      }

      if (!hasPronta) {
        area.insertAdjacentHTML(
          "beforeend",
          `
            <option value="pronta-entrega">
              Pronta entrega
            </option>
          `
        );
      }

      if (!hasEncomendas) {
        area.insertAdjacentHTML(
          "beforeend",
          `
            <option value="encomendas">
              Encomendas
            </option>
          `
        );
      }

      if (current) {
        area.value = current;
      }
    }
  }

  function getProductFormData() {
    const name =
      $("#productName")?.value
        ?.trim() || "";

    const area =
      $("#productArea")?.value ||
      "cardapio";

    const category =
      $("#productCategory")?.value
        ?.trim() || "";

    const price =
      Number(
        $("#productPrice")?.value ||
          0
      );

    const discount =
      Number(
        $("#productDiscount")?.value ||
          0
      );

    const sort =
      Number(
        $("#productSort")?.value ||
          0
      );

    const gramatura =
      $("#productGramatura")?.value
        ?.trim() || "";

    const serveAte =
      $("#productServeAte")?.value
        ?.trim() || "";

    const description =
      $("#productDescription")?.value
        ?.trim() || "";

    const available =
      $("#productAvailable")?.checked ??
      true;

    const featured =
      $("#productFeatured")?.checked ??
      false;

    const appointment =
      $("#productAppointment")?.checked ??
      false;

    return {
      name,
      area,
      category,
      price,
      discount,
      sort,
      gramatura,
      serve_ate: serveAte,
      description,
      available,
      featured,
      appointment
    };
  }

  function fillProductForm(
    product
  ) {
    if (!product) return;

    $("#productName").value =
      product.name || "";

    $("#productArea").value =
      normalizeArea(
        product.area,
        product
      );

    $("#productCategory").value =
      product.category || "";

    $("#productPrice").value =
      product.price ?? "";

    $("#productDiscount").value =
      product.discount ?? "";

    $("#productSort").value =
      product.sort ?? 0;

    $("#productGramatura").value =
      product.gramatura || "";

    $("#productServeAte").value =
      product.serve_ate || "";

    $("#productDescription").value =
      product.description || "";

    $("#productAvailable").checked =
      product.available !== false;

    $("#productFeatured").checked =
      product.featured === true;

    $("#productAppointment").checked =
      product.appointment === true;

    const image =
      getProductImage(product);

    const preview =
      $("#photoPreview");

    if (preview) {
      if (image) {
        preview.innerHTML = `
          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(
              product.name || ""
            )}"
          >
        `;
      } else {
        preview.innerHTML =
          "Nenhuma imagem";
      }
    }
  }

  function clearProductForm() {
    if (!productForm) return;

    productForm.reset();

    state.editingProductId =
      null;

    const title =
      $("#productModalTitle");

    if (title) {
      title.textContent =
        "Novo produto";
    }

    const preview =
      $("#photoPreview");

    if (preview) {
      preview.innerHTML =
        "Nenhuma imagem";
    }

    ensureProductFormFields();
  }

  function openProductModal(
    product = null
  ) {
    if (!productModal) return;

    clearProductForm();

    if (product) {
      state.editingProductId =
        product.id;

      const title =
        $("#productModalTitle");

      if (title) {
        title.textContent =
          "Editar produto";
      }

      fillProductForm(product);
    }

    productModal.classList.add(
      "open"
    );

    productModal.style.display =
      "flex";
  }

  function closeProductModal() {
    if (!productModal) return;

    productModal.classList.remove(
      "open"
    );

    productModal.style.display =
      "none";

    state.editingProductId =
      null;
  }

  /* =========================================================
     PRODUTOS — SALVAR
     ========================================================= */

  async function saveProduct(
    event
  ) {
    event?.preventDefault();

    if (!db) {
      toast(
        "Supabase não está disponível.",
        "error"
      );
      return;
    }

    const button =
      productForm?.querySelector(
        'button[type="submit"]'
      );

    setLoading(
      button,
      true,
      "Salvar produto"
    );

    try {
      const formData =
        getProductFormData();

      if (!formData.name) {
        throw new Error(
          "Informe o nome do produto."
        );
      }

      if (!formData.category) {
        throw new Error(
          "Informe a categoria do produto."
        );
      }

      const payload = {
        name: formData.name,
        area: formData.area,
        category:
          formData.category,
        price: formData.price,
        discount:
          formData.discount,
        sort: formData.sort,
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

      const file =
        $("#productPhoto")?.files?.[0];

      if (file) {
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
        } = await db.storage
          .from("images")
          .upload(
            filePath,
            file,
            {
              upsert: true
            }
          );

        if (uploadError) {
          throw uploadError;
        }

        const {
          data:
            publicUrlData
        } = db.storage
          .from("images")
          .getPublicUrl(
            filePath
          );

        payload.image_url =
          publicUrlData?.publicUrl ||
          "";
      }

      const editingId =
        state.editingProductId;

      if (editingId !== null &&
          editingId !== undefined &&
          editingId !== "") {

        const numericId =
          Number(editingId);

        const {
          error
        } = await db
          .from("products")
          .update(payload)
          .eq(
            "id",
            numericId
          );

        if (error) {
          throw error;
        }

        toast(
          "Produto atualizado com sucesso."
        );

      } else {
        const {
          data,
          error
        } = await db
          .from("products")
          .insert(payload)
          .select()
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          state.products.push(
            data
          );
        }

        toast(
          "Produto criado com sucesso."
        );
      }

      await loadProducts();

      updateStats();

      closeProductModal();

      renderProductTab();

    } catch (error) {
      console.error(error);

      toast(
        error.message ||
          "Não foi possível salvar o produto.",
        "error"
      );

    } finally {
      setLoading(
        button,
        false,
        "Salvar produto"
      );
    }
  }

  /* =========================================================
     PRODUTOS — EXCLUIR
     ========================================================= */

  async function deleteProduct(
    product
  ) {
    if (!product?.id) return;

    const confirmed =
      window.confirm(
        `Excluir o produto "${product.name || ""}"?`
      );

    if (!confirmed) return;

    try {
      const {
        error
      } = await db
        .from("products")
        .delete()
        .eq(
          "id",
          Number(product.id)
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

      updateStats();

      renderProductTab();

      toast(
        "Produto excluído com sucesso."
      );

    } catch (error) {
      console.error(error);

      toast(
        "Não foi possível excluir o produto.",
        "error"
      );
    }
  }
     /* =========================================================
     PRODUTOS — RENDERIZAÇÃO
     ========================================================= */

  function renderProductTab() {
    if (!tabContent) return;

    ensureProductFormFields();

    const prontaEntrega =
      state.products.filter(
        (product) =>
          normalizeArea(
            product.area,
            product
          ) === "pronta-entrega"
      );

    const delivery =
      state.products.filter(
        (product) =>
          normalizeArea(
            product.area,
            product
          ) === "cardapio"
      );

    const encomendas =
      state.products.filter(
        (product) =>
          normalizeArea(
            product.area,
            product
          ) === "encomendas"
      );

    tabContent.innerHTML = `
      <div class="product-toolbar">

        <div>
          <h2>
            Produtos
          </h2>

          <p>
            Gerencie os produtos do site.
          </p>
        </div>

        <div class="product-toolbar-actions">

          <button
            type="button"
            class="btn btn-primary"
            id="newProductBtn"
          >
            Novo produto
          </button>

        </div>

      </div>

      <div class="admin-panel-box">

        <div class="product-section">

          <div class="product-section-header">
            <div>
              <h3>
                Pronta Entrega
              </h3>

              <p>
                Produtos disponíveis para pronta entrega.
              </p>
            </div>

            <strong>
              ${prontaEntrega.length}
            </strong>
          </div>

          <div
            class="products-grid"
            id="prontaEntregaProducts"
          >
            ${
              prontaEntrega.length
                ? prontaEntrega
                    .map(
                      renderProductCard
                    )
                    .join("")
                : `
                  <div class="empty-state">
                    Nenhum produto cadastrado
                    em pronta entrega.
                  </div>
                `
            }
          </div>

        </div>

        <div class="product-section">

          <div class="product-section-header">
            <div>
              <h3>
                Delivery
              </h3>

              <p>
                Produtos do cardápio de delivery.
              </p>
            </div>

            <strong>
              ${delivery.length}
            </strong>
          </div>

          <div
            class="products-grid"
            id="deliveryProducts"
          >
            ${
              delivery.length
                ? delivery
                    .map(
                      renderProductCard
                    )
                    .join("")
                : `
                  <div class="empty-state">
                    Nenhum produto cadastrado
                    no delivery.
                  </div>
                `
            }
          </div>

        </div>

        <div class="product-section">

          <div class="product-section-header">
            <div>
              <h3>
                Encomendas
              </h3>

              <p>
                Produtos utilizados na área de encomendas.
              </p>
            </div>

            <strong>
              ${encomendas.length}
            </strong>
          </div>

          <div
            class="products-grid"
            id="encomendasProducts"
          >
            ${
              encomendas.length
                ? encomendas
                    .map(
                      renderProductCard
                    )
                    .join("")
                : `
                  <div class="empty-state">
                    Nenhum produto cadastrado
                    em encomendas.
                  </div>
                `
            }
          </div>

        </div>

      </div>
    `;

    $("#newProductBtn")
      ?.addEventListener(
        "click",
        () => {
          openProductModal();
        }
      );

    bindProductTabEvents();
  }

  function renderProductCard(
    product
  ) {
    const image =
      getProductImage(product);

    const area =
      normalizeArea(
        product.area,
        product
      );

    const available =
      product.available !== false &&
      product.available !== "false";

    const price =
      Number(product.price || 0);

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
                <div class="product-image-placeholder">
                  Sem imagem
                </div>
              `
          }

        </div>

        <div class="product-card-body">

          <div class="product-card-top">

            <span class="product-area-badge">
              ${escapeHtml(
                areaLabel(area)
              )}
            </span>

            ${
              available
                ? `
                  <span class="product-status available">
                    Disponível
                  </span>
                `
                : `
                  <span class="product-status">
                    Indisponível
                  </span>
                `
            }

          </div>

          <h3>
            ${escapeHtml(
              product.name || ""
            )}
          </h3>

          <p class="product-category">
            ${escapeHtml(
              product.category || ""
            )}
          </p>

          <div class="product-price">

            ${
              discount > 0
                ? `
                  <span class="old-price">
                    ${money(price)}
                  </span>
                `
                : ""
            }

            <strong>
              ${money(finalPrice)}
            </strong>

          </div>

          ${
            product.description
              ? `
                <p class="product-description">
                  ${escapeHtml(
                    product.description
                  )}
                </p>
              `
              : ""
          }

          <div class="product-card-actions">

            <button
              type="button"
              class="btn btn-secondary"
              data-product-edit="${escapeHtml(
                product.id
              )}"
            >
              Editar
            </button>

            <button
              type="button"
              class="btn btn-danger"
              data-product-delete="${escapeHtml(
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

  function bindProductTabEvents() {
    $$(
      "[data-product-edit]"
    ).forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const id =
              button.dataset
                .productEdit;

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
      "[data-product-delete]"
    ).forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const id =
              button.dataset
                .productDelete;

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
     PEDIDOS
     ========================================================= */

  async function loadOrders() {
    if (!db) {
      throw new Error(
        "Supabase não está disponível."
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
        "Erro orders:",
        error
      );

      return [];
    }

    return Array.isArray(data)
      ? data
      : [];
  }

  async function renderOrdersTab() {
    if (!tabContent) return;

    let orders = [];

    try {
      orders =
        await loadOrders();
    } catch (error) {
      console.error(error);
    }

    const prontaEntrega =
      orders.filter(
        (order) =>
          String(
            order.receiving ||
              order.area ||
              ""
          )
            .toLowerCase()
            .includes(
              "pronta"
            )
      );

    const encomendas =
      orders.filter(
        (order) =>
          !String(
            order.receiving ||
              order.area ||
              ""
          )
            .toLowerCase()
            .includes(
              "pronta"
            )
      );

    tabContent.innerHTML = `
      <div class="product-toolbar">

        <div>
          <h2>
            Pedidos
          </h2>

          <p>
            Acompanhe os pedidos recebidos pelo site.
          </p>
        </div>

        <div class="product-toolbar-actions">

          <button
            type="button"
            class="btn btn-secondary"
            id="refreshOrdersBtn"
          >
            Atualizar
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            id="printOrdersBtn"
          >
            Imprimir
          </button>

        </div>

      </div>

      <div class="admin-panel-box">

        <div class="product-section">

          <div class="product-section-header">
            <div>
              <h3>
                Pronta Entrega
              </h3>

              <p>
                Pedidos de produtos de pronta entrega.
              </p>
            </div>

            <strong>
              ${prontaEntrega.length}
            </strong>
          </div>

          <div
            class="orders-list"
            id="prontaEntregaOrders"
          >
            ${
              prontaEntrega.length
                ? prontaEntrega
                    .map(
                      renderOrderCard
                    )
                    .join("")
                : `
                  <div class="empty-state">
                    Nenhum pedido de pronta entrega.
                  </div>
                `
            }
          </div>

        </div>

        <div class="product-section">

          <div class="product-section-header">
            <div>
              <h3>
                Encomendas
              </h3>

              <p>
                Pedidos de encomendas recebidos pelo site.
              </p>
            </div>

            <strong>
              ${encomendas.length}
            </strong>
          </div>

          <div
            class="orders-list"
            id="encomendasOrders"
          >
            ${
              encomendas.length
                ? encomendas
                    .map(
                      renderOrderCard
                    )
                    .join("")
                : `
                  <div class="empty-state">
                    Nenhum pedido de encomenda.
                  </div>
                `
            }
          </div>

        </div>

      </div>
    `;

    $("#refreshOrdersBtn")
      ?.addEventListener(
        "click",
        async () => {
          await renderOrdersTab();
        }
      );

    $("#printOrdersBtn")
      ?.addEventListener(
        "click",
        printOrders
      );
  }

  function renderOrderCard(
    order
  ) {
    const customer =
      order.customer ||
      order.name ||
      "Cliente";

    const phone =
      order.phone ||
      "";

    const receiving =
      order.receiving ||
      "";

    const total =
      getOrderValue(order);

    const date =
      formatOrderDate(
        order.created_at
      );

    return `
      <article class="order-card">

        <div class="order-card-header">

          <div>
            <h3>
              ${escapeHtml(
                customer
              )}
            </h3>

            ${
              phone
                ? `
                  <p>
                    ${escapeHtml(
                      phone
                    )}
                  </p>
                `
                : ""
            }
          </div>

          <strong>
            ${money(total)}
          </strong>

        </div>

        <div class="order-card-body">

          ${
            receiving
              ? `
                <p>
                  <strong>
                    Recebimento:
                  </strong>
                  ${escapeHtml(
                    receiving
                  )}
                </p>
              `
              : ""
          }

          ${
            order.address
              ? `
                <p>
                  <strong>
                    Endereço:
                  </strong>
                  ${escapeHtml(
                    order.address
                  )}
                </p>
              `
              : ""
          }

          ${
            order.payment
              ? `
                <p>
                  <strong>
                    Pagamento:
                  </strong>
                  ${escapeHtml(
                    order.payment
                  )}
                </p>
              `
              : ""
          }

        </div>

      </article>
    `;
  }
     /* =========================================================
     PEDIDOS — UTILITÁRIOS
     ========================================================= */

  function getOrderValue(order) {
    const total =
      Number(order?.total || 0);

    if (Number.isFinite(total)) {
      return total;
    }

    return 0;
  }

  function formatOrderDate(
    value
  ) {
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

  function printOrders() {
    const printWindow =
      window.open(
        "",
        "_blank"
      );

    if (!printWindow) {
      toast(
        "Não foi possível abrir a impressão. Verifique o bloqueador de pop-ups.",
        "warning"
      );
      return;
    }

    const content =
      tabContent?.innerHTML ||
      "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>
          Pedidos — Martins Confeitaria
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
            color: #2b7896;
          }

          h2,
          h3 {
            margin-top: 0;
          }

          .product-toolbar,
          .product-toolbar-actions,
          button {
            display: none !important;
          }

          .admin-panel-box {
            width: 100%;
          }

          .product-section {
            margin-bottom: 35px;
            page-break-inside: avoid;
          }

          .product-section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding-bottom: 10px;
            margin-bottom: 15px;
            border-bottom:
              2px solid #67b0cb;
          }

          .orders-list {
            display: grid;
            gap: 14px;
          }

          .order-card {
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 16px;
            page-break-inside: avoid;
          }

          .order-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 12px;
          }

          .order-card-header h3 {
            margin: 0 0 5px;
          }

          .order-card-header p {
            margin: 0;
            color: #666;
          }

          .order-card-header strong {
            color: #2b7896;
            font-size: 18px;
          }

          .order-card-body p {
            margin: 7px 0;
          }

          .empty-state {
            padding: 20px;
            border: 1px dashed #ccc;
            border-radius: 10px;
            color: #777;
          }

          @media print {
            body {
              padding: 15px;
            }
          }
        </style>
      </head>

      <body>

        <h1>
          Martins Confeitaria
        </h1>

        <p>
          Relatório de pedidos
        </p>

        ${content}

      </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(
      () => {
        printWindow.print();
      },
      300
    );
  }

  /* =========================================================
     BOLOS PERSONALIZADOS
     ========================================================= */

  async function loadCustomCakes() {
    if (!db) {
      throw new Error(
        "Supabase não está disponível."
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
        "Erro custom_cakes:",
        error
      );

      return [];
    }

    return Array.isArray(data)
      ? data
      : [];
  }

  async function renderCakesTab() {
    if (!tabContent) return;

    let cakes = [];

    try {
      cakes =
        await loadCustomCakes();
    } catch (error) {
      console.error(error);
    }

    tabContent.innerHTML = `
      <div class="product-toolbar">

        <div>
          <h2>
            Bolos personalizados
          </h2>

          <p>
            Solicitações recebidas pela área de encomendas.
          </p>
        </div>

        <div class="product-toolbar-actions">

          <button
            type="button"
            class="btn btn-secondary"
            id="refreshCakesBtn"
          >
            Atualizar
          </button>

        </div>

      </div>

      <div class="admin-panel-box">

        <div
          class="orders-list"
          id="customCakesList"
        >

          ${
            cakes.length
              ? cakes
                  .map(
                    renderCustomCakeCard
                  )
                  .join("")
              : `
                <div class="empty-state">
                  Nenhuma encomenda personalizada recebida.
                </div>
              `
          }

        </div>

      </div>
    `;

    $("#refreshCakesBtn")
      ?.addEventListener(
        "click",
        async () => {
          await renderCakesTab();
        }
      );
  }

  function renderCustomCakeCard(
    cake
  ) {
    const customer =
      cake.customer ||
      cake.name ||
      "Cliente";

    const phone =
      cake.phone ||
      "";

    const date =
      formatOrderDate(
        cake.created_at
      );

    const fields = [];

    const possibleFields = [
      [
        "Data",
        cake.date ||
          cake.event_date
      ],
      [
        "Massa",
        cake.massa
      ],
      [
        "Recheio",
        cake.recheio
      ],
      [
        "Tamanho",
        cake.size
      ],
      [
        "Quantidade",
        cake.quantity
      ],
      [
        "Adicionais",
        cake.adicionais
      ],
      [
        "Personalização",
        cake.personalizacao
      ],
      [
        "Observações",
        cake.notes ||
          cake.observations
      ]
    ];

    possibleFields.forEach(
      ([label, value]) => {
        if (
          value !==
            undefined &&
          value !==
            null &&
          String(value).trim()
        ) {
          fields.push(`
            <p>
              <strong>
                ${escapeHtml(
                  label
                )}:
              </strong>
              ${escapeHtml(
                String(value)
              )}
            </p>
          `);
        }
      }
    );

    return `
      <article class="order-card">

        <div class="order-card-header">

          <div>
            <h3>
              ${escapeHtml(
                customer
              )}
            </h3>

            ${
              phone
                ? `
                  <p>
                    ${escapeHtml(
                      phone
                    )}
                  </p>
                `
                : ""
            }

            ${
              date
                ? `
                  <p>
                    ${escapeHtml(
                      date
                    )}
                  </p>
                `
                : ""
            }
          </div>

        </div>

        <div class="order-card-body">

          ${
            fields.length
              ? fields.join("")
              : `
                <p>
                  Nenhuma informação adicional.
                </p>
              `
          }

        </div>

      </article>
    `;
  }

  /* =========================================================
     CONTEÚDOS
     ========================================================= */

  function renderContentTab() {
    if (!tabContent) return;

    const settings =
      state.settings || {};

    tabContent.innerHTML = `
      <div class="product-toolbar">

        <div>
          <h2>
            Conteúdos
          </h2>

          <p>
            Edite as informações principais exibidas no site.
          </p>
        </div>

      </div>

      <div class="admin-panel-box">

        <form
          id="contentForm"
          class="admin-form"
        >

          <div class="form-group">
            <label for="contentTitle">
              Título principal
            </label>

            <input
              type="text"
              id="contentTitle"
              value="${escapeHtml(
                settings.title ||
                  ""
              )}"
            >
          </div>

          <div class="form-group">
            <label for="contentSubtitle">
              Subtítulo
            </label>

            <input
              type="text"
              id="contentSubtitle"
              value="${escapeHtml(
                settings.subtitle ||
                  ""
              )}"
            >
          </div>

          <div class="form-group">
            <label for="contentDescription">
              Descrição
            </label>

            <textarea
              id="contentDescription"
              rows="5"
            >${escapeHtml(
              settings.description ||
                ""
            )}</textarea>
          </div>

          <div class="form-group">
            <label for="contentInstagram">
              Instagram
            </label>

            <input
              type="text"
              id="contentInstagram"
              value="${escapeHtml(
                settings.instagram ||
                  ""
              )}"
            >
          </div>

          <div class="form-group">
            <label for="contentWhatsapp">
              WhatsApp
            </label>

            <input
              type="text"
              id="contentWhatsapp"
              value="${escapeHtml(
                settings.whatsapp ||
                  "5585981563070"
              )}"
            >
          </div>

          <div class="form-actions">

            <button
              type="submit"
              class="btn btn-primary"
            >
              Salvar alterações
            </button>

          </div>

        </form>

      </div>
    `;

    $("#contentForm")
      ?.addEventListener(
        "submit",
        saveContent
      );
  }

  async function saveContent(
    event
  ) {
    event.preventDefault();

    const form =
      event.currentTarget;

    const button =
      form.querySelector(
        'button[type="submit"]'
      );

    setLoading(
      button,
      true,
      "Salvar alterações"
    );

    try {
      const payload = {
        ...state.settings,

        title:
          $("#contentTitle")
            ?.value
            ?.trim() || "",

        subtitle:
          $("#contentSubtitle")
            ?.value
            ?.trim() || "",

        description:
          $("#contentDescription")
            ?.value
            ?.trim() || "",

        instagram:
          $("#contentInstagram")
            ?.value
            ?.trim() || "",

        whatsapp:
          $("#contentWhatsapp")
            ?.value
            ?.trim() ||
          "5585981563070"
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

      toast(
        "Conteúdos salvos com sucesso."
      );

    } catch (error) {
      console.error(error);

      toast(
        error.message ||
          "Não foi possível salvar os conteúdos.",
        "error"
      );

    } finally {
      setLoading(
        button,
        false,
        "Salvar alterações"
      );
    }
  }
     /* =========================================================
     HORÁRIOS
     ========================================================= */

  function renderHoursTab() {
    if (!tabContent) return;

    const hours =
      state.settings.hours ||
      {};

    const days = [
      ["segunda", "Segunda-feira"],
      ["terca", "Terça-feira"],
      ["quarta", "Quarta-feira"],
      ["quinta", "Quinta-feira"],
      ["sexta", "Sexta-feira"],
      ["sabado", "Sábado"],
      ["domingo", "Domingo"]
    ];

    tabContent.innerHTML = `
      <div class="product-toolbar">

        <div>
          <h2>
            Horários
          </h2>

          <p>
            Configure os horários de funcionamento da confeitaria.
          </p>
        </div>

      </div>

      <div class="admin-panel-box">

        <form
          id="hoursForm"
          class="admin-form"
        >

          <div class="hours-grid">

            ${days
              .map(
                ([key, label]) => {
                  const current =
                    hours[key] ||
                    {};

                  return `
                    <div class="hours-row">

                      <div class="hours-day">
                        <strong>
                          ${label}
                        </strong>
                      </div>

                      <div class="hours-fields">

                        <input
                          type="text"
                          name="${key}_open"
                          value="${escapeHtml(
                            current.open ||
                              ""
                          )}"
                          placeholder="Ex.: 11:00"
                        >

                        <span>
                          até
                        </span>

                        <input
                          type="text"
                          name="${key}_close"
                          value="${escapeHtml(
                            current.close ||
                              ""
                          )}"
                          placeholder="Ex.: 23:00"
                        >

                      </div>

                    </div>
                  `;
                }
              )
              .join("")}

          </div>

          <div class="form-actions">

            <button
              type="submit"
              class="btn btn-primary"
            >
              Salvar alterações
            </button>

          </div>

        </form>

      </div>
    `;

    $("#hoursForm")
      ?.addEventListener(
        "submit",
        saveHours
      );
  }

  async function saveHours(
    event
  ) {
    event.preventDefault();

    const form =
      event.currentTarget;

    const button =
      form.querySelector(
        'button[type="submit"]'
      );

    setLoading(
      button,
      true,
      "Salvar alterações"
    );

    try {
      const days = [
        "segunda",
        "terca",
        "quarta",
        "quinta",
        "sexta",
        "sabado",
        "domingo"
      ];

      const hours = {};

      days.forEach(
        (day) => {
          hours[day] = {
            open:
              form.elements[
                `${day}_open`
              ]?.value?.trim() ||
              "",
            close:
              form.elements[
                `${day}_close`
              ]?.value?.trim() ||
              ""
          };
        }
      );

      const payload = {
        ...state.settings,
        hours
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

      toast(
        "Horários salvos com sucesso."
      );

    } catch (error) {
      console.error(error);

      toast(
        error.message ||
          "Não foi possível salvar os horários.",
        "error"
      );

    } finally {
      setLoading(
        button,
        false,
        "Salvar alterações"
      );
    }
  }

  /* =========================================================
     REGRAS
     ========================================================= */

  function renderRulesTab() {
    if (!tabContent) return;

    const rules =
      state.settings.rules ||
      {};

    tabContent.innerHTML = `
      <div class="product-toolbar">

        <div>
          <h2>
            Regras
          </h2>

          <p>
            Configure informações e regras das encomendas.
          </p>
        </div>

      </div>

      <div class="admin-panel-box">

        <form
          id="rulesForm"
          class="admin-form"
        >

          <div class="form-group">

            <label for="ruleMinimum">
              Pedido mínimo
            </label>

            <input
              type="text"
              id="ruleMinimum"
              value="${escapeHtml(
                rules.minimum ||
                  ""
              )}"
              placeholder="Ex.: Pedido mínimo de 48h"
            >

          </div>

          <div class="form-group">

            <label for="rulePayment">
              Forma de pagamento
            </label>

            <textarea
              id="rulePayment"
              rows="4"
              placeholder="Informe as formas de pagamento aceitas."
            >${escapeHtml(
              rules.payment ||
                ""
            )}</textarea>

          </div>

          <div class="form-group">

            <label for="ruleDelivery">
              Entrega
            </label>

            <textarea
              id="ruleDelivery"
              rows="4"
              placeholder="Informe as regras de entrega."
            >${escapeHtml(
              rules.delivery ||
                ""
            )}</textarea>

          </div>

          <div class="form-group">

            <label for="ruleCancellation">
              Cancelamento
            </label>

            <textarea
              id="ruleCancellation"
              rows="4"
              placeholder="Informe as regras de cancelamento."
            >${escapeHtml(
              rules.cancellation ||
                ""
            )}</textarea>

          </div>

          <div class="form-actions">

            <button
              type="submit"
              class="btn btn-primary"
            >
              Salvar alterações
            </button>

          </div>

        </form>

      </div>
    `;

    $("#rulesForm")
      ?.addEventListener(
        "submit",
        saveRules
      );
  }

  async function saveRules(
    event
  ) {
    event.preventDefault();

    const form =
      event.currentTarget;

    const button =
      form.querySelector(
        'button[type="submit"]'
      );

    setLoading(
      button,
      true,
      "Salvar alterações"
    );

    try {
      const rules = {
        minimum:
          $("#ruleMinimum")
            ?.value
            ?.trim() || "",

        payment:
          $("#rulePayment")
            ?.value
            ?.trim() || "",

        delivery:
          $("#ruleDelivery")
            ?.value
            ?.trim() || "",

        cancellation:
          $("#ruleCancellation")
            ?.value
            ?.trim() || ""
      };

      const payload = {
        ...state.settings,
        rules
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

      toast(
        "Regras salvas com sucesso."
      );

    } catch (error) {
      console.error(error);

      toast(
        error.message ||
          "Não foi possível salvar as regras.",
        "error"
      );

    } finally {
      setLoading(
        button,
        false,
        "Salvar alterações"
      );
    }
  }

  /* =========================================================
     MÍDIA
     ========================================================= */

  function renderMediaTab() {
    if (!tabContent) return;

    const settings =
      state.settings || {};

    tabContent.innerHTML = `
      <div class="product-toolbar">

        <div>
          <h2>
            Mídia
          </h2>

          <p>
            Configure as imagens e vídeos utilizados no site.
          </p>
        </div>

      </div>

      <div class="admin-panel-box">

        <form
          id="mediaForm"
          class="admin-form"
        >

          <div class="form-group">

            <label for="mediaLogo">
              Logo
            </label>

            <input
              type="url"
              id="mediaLogo"
              value="${escapeHtml(
                settings.logo ||
                  settings.logo_url ||
                  ""
              )}"
              placeholder="URL da logo"
            >

          </div>

          <div class="form-group">

            <label for="mediaHero">
              Imagem principal
            </label>

            <input
              type="url"
              id="mediaHero"
              value="${escapeHtml(
                settings.hero ||
                  settings.hero_url ||
                  ""
              )}"
              placeholder="URL da imagem principal"
            >

          </div>

          <div class="form-group">

            <label for="mediaVideo">
              Vídeo principal
            </label>

            <input
              type="url"
              id="mediaVideo"
              value="${escapeHtml(
                settings.video ||
                  settings.video_url ||
                  ""
              )}"
              placeholder="URL do vídeo"
            >

          </div>

          <div class="form-actions">

            <button
              type="submit"
              class="btn btn-primary"
            >
              Salvar alterações
            </button>

          </div>

        </form>

      </div>
    `;

    $("#mediaForm")
      ?.addEventListener(
        "submit",
        saveMedia
      );
  }

  async function saveMedia(
    event
  ) {
    event.preventDefault();

    const form =
      event.currentTarget;

    const button =
      form.querySelector(
        'button[type="submit"]'
      );

    setLoading(
      button,
      true,
      "Salvar alterações"
    );

    try {
      const logo =
        $("#mediaLogo")
          ?.value
          ?.trim() || "";

      const hero =
        $("#mediaHero")
          ?.value
          ?.trim() || "";

      const video =
        $("#mediaVideo")
          ?.value
          ?.trim() || "";

      const payload = {
        ...state.settings,
        logo,
        logo_url: logo,
        hero,
        hero_url: hero,
        video,
        video_url: video
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

      loadAdminLogo();

      toast(
        "Mídia salva com sucesso."
      );

    } catch (error) {
      console.error(error);

      toast(
        error.message ||
          "Não foi possível salvar a mídia.",
        "error"
      );

    } finally {
      setLoading(
        button,
        false,
        "Salvar alterações"
      );
    }
  }
     /* =========================================================
     NAVEGAÇÃO ENTRE ABAS
     ========================================================= */

  function setActiveTab(
    tab
  ) {
    state.activeTab =
      tab || "products";

    $$("[data-tab]").forEach(
      (button) => {
        button.classList.toggle(
          "active",
          button.dataset.tab ===
            state.activeTab
        );
      }
    );

    const titles = {
      products: [
        "Produtos",
        "Gerencie os produtos cadastrados."
      ],

      orders: [
        "Pedidos",
        "Acompanhe os pedidos recebidos."
      ],

      cakes: [
        "Bolos personalizados",
        "Gerencie as encomendas personalizadas."
      ],

      content: [
        "Conteúdos",
        "Edite os conteúdos do site."
      ],

      hours: [
        "Horários",
        "Configure os horários de funcionamento."
      ],

      rules: [
        "Regras",
        "Configure as regras das encomendas."
      ],

      media: [
        "Mídia",
        "Gerencie imagens e vídeos do site."
      ]
    };

    const title =
      titles[
        state.activeTab
      ] || titles.products;

    const pageTitle =
      $("#pageTitle");

    const pageSubtitle =
      $("#pageSubtitle");

    if (pageTitle) {
      pageTitle.textContent =
        title[0];
    }

    if (pageSubtitle) {
      pageSubtitle.textContent =
        title[1];
    }

    switch (
      state.activeTab
    ) {
      case "orders":
        renderOrdersTab();
        break;

      case "cakes":
        renderCakesTab();
        break;

      case "content":
        renderContentTab();
        break;

      case "hours":
        renderHoursTab();
        break;

      case "rules":
        renderRulesTab();
        break;

      case "media":
        renderMediaTab();
        break;

      case "products":
      default:
        renderProductTab();
        break;
    }
  }

  function bindNavigation() {
    $$("[data-tab]").forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            setActiveTab(
              button.dataset.tab
            );
          }
        );
      }
    );
  }

  /* =========================================================
     MODAL DO PRODUTO
     ========================================================= */

  function bindProductModal() {
    if (productForm) {
      productForm.addEventListener(
        "submit",
        saveProduct
      );
    }

    const closeButtons =
      $$(
        "[data-close-product-modal]"
      );

    closeButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          closeProductModal
        );
      }
    );

    const modalClose =
      productModal?.querySelector(
        ".modal-close"
      );

    if (modalClose) {
      modalClose.addEventListener(
        "click",
        closeProductModal
      );
    }

    productModal?.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          productModal
        ) {
          closeProductModal();
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
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
     FOTO DO PRODUTO
     ========================================================= */

  function bindProductPhoto() {
    const input =
      $("#productPhoto");

    const preview =
      $("#photoPreview");

    if (!input || !preview) {
      return;
    }

    input.addEventListener(
      "change",
      () => {
        const file =
          input.files?.[0];

        if (!file) {
          preview.innerHTML =
            "Nenhuma imagem";
          return;
        }

        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          preview.innerHTML =
            "Arquivo inválido";

          input.value = "";

          toast(
            "Selecione uma imagem válida.",
            "warning"
          );

          return;
        }

        const reader =
          new FileReader();

        reader.onload = (
          event
        ) => {
          preview.innerHTML = `
            <img
              src="${event.target.result}"
              alt="Prévia"
            >
          `;
        };

        reader.readAsDataURL(
          file
        );
      }
    );
  }

  /* =========================================================
     CATEGORIAS
     ========================================================= */

  function renderCategoryOptions() {
    const select =
      $("#productCategory");

    if (!select) return;

    const current =
      select.value;

    const categories =
      normalizeCategories(
        state.categories
      );

    select.innerHTML = `
      <option value="">
        Selecione uma categoria
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
    `;

    if (current) {
      select.value =
        current;
    }
  }

  function bindCategoryControls() {
    const select =
      $("#productCategory");

    const newField =
      $("#newCategoryField");

    const newCategory =
      $("#newCategory");

    if (select) {
      select.addEventListener(
        "change",
        () => {
          if (
            select.value ===
            "__new__"
          ) {
            if (newField) {
              newField.style.display =
                "block";
            }

            if (newCategory) {
              newCategory.focus();
            }
          } else {
            if (newField) {
              newField.style.display =
                "none";
            }
          }
        }
      );
    }

    const addCategoryBtn =
      $("#addCategoryBtn");

    if (addCategoryBtn) {
      addCategoryBtn.addEventListener(
        "click",
        async () => {
          const value =
            newCategory
              ?.value
              ?.trim() || "";

          if (!value) {
            toast(
              "Digite o nome da classificação.",
              "warning"
            );
            return;
          }

          if (
            state.categories.some(
              (category) =>
                category.toLowerCase() ===
                value.toLowerCase()
            )
          ) {
            toast(
              "Essa classificação já existe.",
              "warning"
            );
            return;
          }

          state.categories.push(
            value
          );

          state.categories.sort(
            (a, b) =>
              a.localeCompare(
                b,
                "pt-BR"
              )
          );

          try {
            await saveCategories();

            renderCategoryOptions();

            if (select) {
              select.value =
                value;
            }

            if (newCategory) {
              newCategory.value =
                "";
            }

            if (newField) {
              newField.style.display =
                "none";
            }

            toast(
              "Classificação adicionada."
            );
          } catch (error) {
            state.categories =
              state.categories.filter(
                (category) =>
                  category !==
                  value
              );

            toast(
              "Não foi possível adicionar a classificação.",
              "error"
            );
          }
        }
      );
    }
  }

  /* =========================================================
     LOGIN
     ========================================================= */

  async function login(
    event
  ) {
    event.preventDefault();

    if (!db) {
      showLoginMessage(
        "Supabase não está disponível."
      );
      return;
    }

    const email =
      $("#loginEmail")
        ?.value
        ?.trim() || "";

    const password =
      $("#loginPassword")
        ?.value || "";

    if (!email || !password) {
      showLoginMessage(
        "Informe e-mail e senha."
      );
      return;
    }

    const button =
      loginForm?.querySelector(
        'button[type="submit"]'
      );

    setLoading(
      button,
      true,
      "Entrar"
    );

    showLoginMessage(
      "",
      false
    );

    try {
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

      if (!data?.session) {
        throw new Error(
          "Não foi possível iniciar a sessão."
        );
      }

      showLoginMessage(
        "Login realizado.",
        false
      );

      await initializeApp();

    } catch (error) {
      console.error(
        "Erro login:",
        error
      );

      showLoginMessage(
        error.message ||
          "E-mail ou senha incorretos."
      );

    } finally {
      setLoading(
        button,
        false,
        "Entrar"
      );
    }
  }

  async function logout() {
    if (!db) return;

    try {
      await db.auth.signOut();
    } catch (error) {
      console.error(
        "Erro logout:",
        error
      );
    }

    if (app) {
      app.style.display =
        "none";
    }

    if (loginScreen) {
      loginScreen.style.display =
        "flex";
    }

    if (loginForm) {
      loginForm.reset();
    }
  }
     /* =========================================================
     INICIALIZAÇÃO DO SUPABASE
     ========================================================= */

  function initializeSupabase() {
    if (
      typeof window.supabase ===
      "undefined"
    ) {
      console.error(
        "Supabase JS não foi carregado."
      );

      return false;
    }

    if (
      !SUPABASE_URL ||
      !SUPABASE_ANON_KEY
    ) {
      console.error(
        "Credenciais do Supabase não configuradas."
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
        "Erro ao criar cliente Supabase:",
        error
      );

      db = null;

      return false;
    }
  }

  /* =========================================================
     INTERFACE
     ========================================================= */

  function showApp() {
    if (loginScreen) {
      loginScreen.style.display =
        "none";
    }

    if (app) {
      app.style.display =
        "block";
    }
  }

  function showLogin() {
    if (app) {
      app.style.display =
        "none";
    }

    if (loginScreen) {
      loginScreen.style.display =
        "flex";
    }
  }

  /* =========================================================
     CARREGAMENTO INICIAL
     ========================================================= */

  async function initializeApp() {
    if (!db) {
      const initialized =
        initializeSupabase();

      if (!initialized) {
        showLoginMessage(
          "Não foi possível conectar ao Supabase."
        );

        return;
      }
    }

    try {
      showApp();

      await loadSettings();

      await loadProducts();

      updateStats();

      renderCategoryOptions();

      setActiveTab(
        state.activeTab
      );

      toast(
        "Painel carregado com sucesso."
      );

    } catch (error) {
      console.error(
        "Erro ao inicializar painel:",
        error
      );

      toast(
        error.message ||
          "Não foi possível carregar o painel.",
        "error"
      );
    }
  }

  /* =========================================================
     VERIFICAÇÃO DE SESSÃO
     ========================================================= */

  async function checkSession() {
    if (!db) {
      showLogin();

      return;
    }

    try {
      const {
        data,
        error
      } = await db.auth.getSession();

      if (error) {
        throw error;
      }

      if (
        data?.session
      ) {
        await initializeApp();
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

  /* =========================================================
     EVENTOS GERAIS
     ========================================================= */

  function bindGlobalEvents() {
    if (loginForm) {
      loginForm.addEventListener(
        "submit",
        login
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
        async () => {
          try {
            refreshBtn.disabled =
              true;

            await loadSettings();

            await loadProducts();

            updateStats();

            setActiveTab(
              state.activeTab
            );

            toast(
              "Dados atualizados."
            );

          } catch (error) {
            console.error(error);

            toast(
              "Não foi possível atualizar os dados.",
              "error"
            );

          } finally {
            refreshBtn.disabled =
              false;
          }
        }
      );
    }

    const mobileMenu =
      $("#mobileMenu");

    if (mobileMenu) {
      mobileMenu.addEventListener(
        "click",
        () => {
          document.body.classList.toggle(
            "sidebar-open"
          );
        }
      );
    }

    $$("[data-tab]").forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            document.body.classList.remove(
              "sidebar-open"
            );
          }
        );
      }
    );
  }

  /* =========================================================
     OBSERVADOR DE AUTENTICAÇÃO
     ========================================================= */

  function bindAuthListener() {
    if (!db) return;

    db.auth.onAuthStateChange(
      async (
        event,
        session
      ) => {
        if (
          event ===
            "SIGNED_IN" &&
          session
        ) {
          await initializeApp();

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
     PREPARAÇÃO DO FORMULÁRIO
     ========================================================= */

  function prepareProductForm() {
    ensureProductFormFields();

    renderCategoryOptions();

    bindCategoryControls();

    bindProductPhoto();
  }

  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  async function boot() {
    try {
      const connected =
        initializeSupabase();

      if (!connected) {
        showLogin();

        showLoginMessage(
          "Não foi possível conectar ao sistema."
        );

        return;
      }

      bindGlobalEvents();

      bindNavigation();

      bindProductModal();

      prepareProductForm();

      bindAuthListener();

      await checkSession();

    } catch (error) {
      console.error(
        "Erro fatal no painel:",
        error
      );

      showLogin();

      showLoginMessage(
        "Ocorreu um erro ao carregar o painel."
      );
    }
  }

  /* =========================================================
     DOM READY
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
     FUNÇÕES DE APOIO
     ========================================================= */

  function refreshProductData() {
    return Promise.all([
      loadSettings(),
      loadProducts()
    ]);
  }

  async function refreshCurrentTab() {
    try {
      await refreshProductData();

      updateStats();

      renderCategoryOptions();

      setActiveTab(
        state.activeTab
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
    }
  }

  /* =========================================================
     EXPOSIÇÃO PARA DEBUG
     ========================================================= */

  window.MartinsAdmin = {
    state,

    refresh: refreshCurrentTab,

    loadProducts,

    loadSettings,

    renderProductTab,

    renderOrdersTab,

    renderCakesTab,

    renderContentTab,

    renderHoursTab,

    renderRulesTab,

    renderMediaTab,

    openProductModal,

    closeProductModal
  };

  /* =========================================================
     FINAL
     ========================================================= */

})();
