/* =========================================================
   MARTINS CONFEITARIA
   PAINEL ADMINISTRATIVO
   ADMIN.JS — VERSÃO ATUALIZADA
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

  const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  const DEFAULTS = window.MARTINS_DEFAULTS || {};

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

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

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

  /* =========================================================
     NORMALIZAÇÃO DA ÁREA
     ========================================================= */

  function normalizeArea(area, product = {}) {
    const value = String(area || "")
      .toLowerCase()
      .trim();

    /*
      Se o produto já estiver marcado explicitamente
      como Encomendas, mantém Encomendas.
    */

    if (
      value === "encomendas" ||
      value === "encomenda"
    ) {
      return "encomendas";
    }

    /*
      Delivery e Pronta Entrega representam a mesma área.
    */

    if (
      value === "pronta-entrega" ||
      value === "pronta entrega" ||
      value === "cardapio" ||
      value === "delivery" ||
      value === "pronta_entrega"
    ) {
      /*
        Mesmo que esteja salvo como Delivery,
        verificamos o nome do produto abaixo porque
        alguns produtos antigos podem ter sido cadastrados
        na área errada.
      */
    }

    /*
      Produtos que pertencem às ENCOMENDAS.

      Essas regras também corrigem produtos antigos que
      estejam registrados como Delivery no banco.
    */

    const name = String(product.name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    /*
      Bolos de encomenda
    */

    if (
      name.includes("naked cake") ||
      name.includes("chantininho")
    ) {
      return "encomendas";
    }

    /*
      Sabores/itens de encomenda
    */

    if (
      name.includes("oreo") ||
      name.includes("kit kat") ||
      name.includes("kitkat") ||
      name.includes("nutella") ||
      name.includes("kinder bueno")
    ) {
      return "encomendas";
    }

    /*
      Brigadeiros de encomenda.

      NÃO colocamos simplesmente "brigadeiro",
      porque o produto Delivery chamado apenas
      "Brigadeiro" deve continuar no Delivery.

      Aqui entram somente as versões Clássicas e Premium.
    */

    if (
      name.includes("brigadeiro classico") ||
      name.includes("brigadeiros classicos") ||
      name.includes("brigadeiro premium") ||
      name.includes("brigadeiros premium")
    ) {
      return "encomendas";
    }

    /*
      Qualquer outro produto segue a área cadastrada.

      Se estiver como Encomendas, permanece Encomendas.
      Caso contrário, fica em Delivery.
    */

    if (
      value === "encomendas" ||
      value === "encomenda"
    ) {
      return "encomendas";
    }

    return "cardapio";
  }

  function areaLabel(area) {
    return normalizeArea(area) === "encomendas"
      ? "Encomendas"
      : "Delivery";
  }

  function getProductImage(product) {
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

  function toast(message, type = "success") {
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
        boxShadow: "0 8px 30px rgba(0,0,0,.18)",
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

  function showLoginMessage(message, error = true) {
    if (!loginMsg) return;

    loginMsg.textContent = message;
    loginMsg.style.color = error ? "#c0392b" : "#2b7896";
  }

  function setLoading(button, loading, originalText = "Salvar") {
    if (!button) return;

    if (loading) {
      button.dataset.originalText =
        button.textContent || originalText;

      button.disabled = true;
      button.textContent = "Salvando...";
    } else {
      button.disabled = false;
      button.textContent =
        button.dataset.originalText || originalText;
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
    return Array.isArray(DEFAULTS.categories)
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

  function normalizeCategories(categories) {
    if (!Array.isArray(categories)) {
      return defaultCategories();
    }

    return [
      ...new Set(
        categories
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      )
    ];
  }

  async function saveCategories() {
    const payload = {
      ...state.settings,
      categories: state.categories
    };

    const { error } = await db
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

    const cleanName = name.trim();

    if (!cleanName) {
      toast("Digite um nome válido.", "warning");
      return;
    }

    const alreadyExists = state.categories.some(
      (category) =>
        category.toLowerCase() === cleanName.toLowerCase()
    );

    if (alreadyExists) {
      toast("Essa classificação já existe.", "warning");
      return;
    }

    state.categories.push(cleanName);
    state.categories.sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );

    try {
      await saveCategories();
      renderProductTab();
      toast("Classificação criada com sucesso.");
    } catch (error) {
      state.categories = state.categories.filter(
        (category) => category !== cleanName
      );

      toast(
        "Não foi possível salvar a classificação: " +
          (error.message || "erro desconhecido"),
        "error"
      );
    }
  }

  async function deleteClassification(name) {
    const used = state.products.some(
      (product) =>
        String(product.category || "").trim() ===
        String(name).trim()
    );

    if (used) {
      toast(
        "Essa classificação está sendo usada por um produto.",
        "warning"
      );
      return;
    }

    const confirmed = window.confirm(
      `Excluir a classificação "${name}"?`
    );

    if (!confirmed) return;

    const oldCategories = [...state.categories];

    state.categories = state.categories.filter(
      (category) => category !== name
    );

    try {
      await saveCategories();
      renderProductTab();
      toast("Classificação excluída.");
    } catch (error) {
      state.categories = oldCategories;

      toast(
        "Não foi possível excluir a classificação.",
        "error"
      );
    }
  }

  /* =========================================================
     CARREGAR CONFIGURAÇÕES
     ========================================================= */

  async function loadSettings() {
    const { data, error } = await db
      .from("settings")
      .select("*")
      .eq("key", "site")
      .maybeSingle();

    if (error) {
      console.error("Erro settings:", error);
      state.settings = {};
      state.categories = defaultCategories();
      return;
    }

    const value = data?.value || {};

    state.settings = {
      ...DEFAULTS,
      ...value
    };

    state.categories = normalizeCategories(
      value.categories || DEFAULTS.categories
    );

    loadAdminLogo();
  }

  /* =========================================================
     CARREGAR PRODUTOS
     ========================================================= */

  async function loadProducts() {
    const { data, error } = await db
      .from("products")
      .select("*")
      .order("sort", {
        ascending: true,
        nullsFirst: false
      });

    if (error) {
      console.error("Erro produtos:", error);
      throw error;
    }

    state.products = Array.isArray(data)
      ? data.map((product) => ({
          ...product,
          area: normalizeArea(product.area, product)
        }))
      : [];
  }

  /* =========================================================
     ESTATÍSTICAS
     ========================================================= */

  function updateStats() {
    const total = state.products.length;

    const available = state.products.filter(
      (product) => product.available !== false
    ).length;

    const delivery = state.products.filter(
      (product) =>
        normalizeArea(product.area, product) ===
        "cardapio"
    ).length;

    const encomendas = state.products.filter(
      (product) =>
        normalizeArea(product.area, product) ===
        "encomendas"
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
      statOrders.textContent = encomendas;
    }

    if (statCakes) {
      statCakes.textContent = delivery;
    }
  }

  /* =========================================================
     PRODUTO — MODAL
     ========================================================= */

  function getField(id) {
    return document.getElementById(id);
  }

  function setField(id, value) {
    const field = getField(id);

    if (!field) return;

    if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = value ?? "";
    }
  }

  function getFieldValue(id) {
    const field = getField(id);

    if (!field) return "";

    if (field.type === "checkbox") {
      return field.checked;
    }

    return field.value;
  }

  function populateClassificationSelect(selected = "") {
    const select = getField("productCategory");

    if (!select) return;

    const categories = normalizeCategories([
      ...state.categories,
      selected
    ]);

    select.innerHTML = `
      <option value="">Selecione uma classificação</option>
      ${categories
        .map(
          (category) => `
            <option value="${escapeHtml(category)}">
              ${escapeHtml(category)}
            </option>
          `
        )
        .join("")}
    `;

    select.value = selected || "";
  }

  function populateAreaSelect(selected = "cardapio") {
    const select = getField("productArea");

    if (!select) return;

    const normalized = normalizeArea(selected);

    select.innerHTML = `
      <option value="cardapio">Delivery</option>
      <option value="encomendas">Encomendas</option>
    `;

    select.value = normalized;
  }

  function ensureProductFormFields() {
    if (!productForm) return;

    if (!getField("productCategory")) {
      const areaField =
        getField("productArea")?.closest(".field") ||
        getField("productArea")?.parentElement;

      if (areaField) {
        const wrapper = document.createElement("div");

        wrapper.className = "field";

        wrapper.innerHTML = `
          <label for="productCategory">
            Classificação
          </label>

          <div style="
            display:flex;
            gap:8px;
            align-items:center;
          ">
            <select
              id="productCategory"
              name="category"
              style="flex:1"
            ></select>

            <button
              type="button"
              class="btn btn-secondary"
              id="newClassificationBtn"
              style="white-space:nowrap"
            >
              + Nova
            </button>
          </div>

          <small style="
            display:block;
            margin-top:6px;
            opacity:.7;
          ">
            Ex.: Bolo, Brownie, Sobremesa...
          </small>
        `;

        areaField.parentNode.insertBefore(
          wrapper,
          areaField
        );
      }
    }

    if (getField("productArea")) {
      populateAreaSelect(
        getFieldValue("productArea") || "cardapio"
      );
    }

    const newClassificationBtn =
      $("#newClassificationBtn");

    if (
      newClassificationBtn &&
      !newClassificationBtn.dataset.bound
    ) {
      newClassificationBtn.dataset.bound = "true";

      newClassificationBtn.addEventListener(
        "click",
        async () => {
          await createClassification();
        }
      );
    }

    populateClassificationSelect(
      getFieldValue("productCategory")
    );
  }

  function openProductModal(product = null) {
    if (!productModal || !productForm) return;

    state.editingProductId = product?.id || null;

    ensureProductFormFields();

    productForm.reset();

    const normalizedArea = product
      ? normalizeArea(product.area, product)
      : "cardapio";

    setField(
      "productPhoto",
      ""
    );

    setField(
      "productName",
      product?.name || ""
    );

    setField(
      "productPrice",
      product?.price ?? ""
    );

    setField(
      "productDiscount",
      product?.discount_percent ?? ""
    );

    setField(
      "productSort",
      product?.sort ?? ""
    );

    setField(
      "productGramatura",
      product?.gramatura ?? ""
    );

    setField(
      "productServeAte",
      product?.serve_ate ?? ""
    );

    setField(
      "productDescription",
      product?.description ?? ""
    );

    setField(
      "productAvailable",
      product ? product.available !== false : true
    );

    setField(
      "productFeatured",
      product?.featured ?? false
    );

    setField(
      "productAppointment",
      product?.appointment_required ?? false
    );

    populateClassificationSelect(
      product?.category || ""
    );

    /*
      Aqui usamos o próprio produto para determinar
      automaticamente a área correta.
    */

    populateAreaSelect(
      normalizeArea(
        product?.area,
        product || {}
      )
    );

    const title = productModal.querySelector(
      ".modal-title, h2, h3"
    );

    if (title) {
      title.textContent = product
        ? "Editar produto"
        : "Novo produto";
    }

    productModal.classList.remove("hidden");

    productModal.style.display = "flex";
  }

  function closeProductModal() {
    if (!productModal) return;

    productModal.classList.add("hidden");
    productModal.style.display = "";

    state.editingProductId = null;
  }

  /* =========================================================
     IMAGEM
     ========================================================= */

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }

      if (!file.type.startsWith("image/")) {
        reject(
          new Error("O arquivo selecionado não é uma imagem.")
        );
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();

        img.onload = () => {
          const maxSize = 1000;

          let width = img.width;
          let height = img.height;

          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(
              maxSize / width,
              maxSize / height
            );

            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");

          ctx.drawImage(
            img,
            0,
            0,
            width,
            height
          );

          const result = canvas.toDataURL(
            "image/jpeg",
            0.78
          );

          resolve(result);
        };

        img.onerror = () => {
          reject(
            new Error("Não foi possível processar a imagem.")
          );
        };

        img.src = reader.result;
      };

      reader.onerror = () => {
        reject(
          new Error("Não foi possível ler a imagem.")
        );
      };

      reader.readAsDataURL(file);
    });
  }

  /* =========================================================
     SALVAR PRODUTO
     ========================================================= */

  async function saveProduct(event) {
    event.preventDefault();

    if (!productForm) return;

    const submitButton =
      productForm.querySelector(
        'button[type="submit"]'
      );

    setLoading(
      submitButton,
      true,
      "Salvar produto"
    );

    try {
      const editingId =
        state.editingProductId;

      const name = String(
        getFieldValue("productName") || ""
      ).trim();

      if (!name) {
        throw new Error(
          "Informe o nome do produto."
        );
      }

      const category = String(
        getFieldValue("productCategory") || ""
      ).trim();

      if (!category) {
        throw new Error(
          "Selecione uma classificação."
        );
      }

      const area = normalizeArea(
        getFieldValue("productArea"),
        { name }
      );

      const priceValue =
        getFieldValue("productPrice");

      const price =
        priceValue === ""
          ? 0
          : Number(
              String(priceValue)
                .replace(",", ".")
            );

      if (Number.isNaN(price)) {
        throw new Error(
          "Informe um preço válido."
        );
      }

      const discountValue =
        getFieldValue("productDiscount");

      const discount =
        discountValue === ""
          ? 0
          : Number(
              String(discountValue)
                .replace(",", ".")
            );

      const sortValue =
        getFieldValue("productSort");

      const sort =
        sortValue === ""
          ? 0
          : Number(sortValue);

      const file =
        getField("productPhoto")?.files?.[0];

      let imageUrl = "";

      if (file) {
        imageUrl = await compressImage(file);
      }

      const currentProduct =
        state.products.find(
          (product) =>
            product.id === editingId
        );

      if (!imageUrl && currentProduct) {
        imageUrl = getProductImage(currentProduct);
      }

      const payload = {
        id:
          editingId ||
          `${slugify(name)}-${Date.now()}`,

        name,

        price,

        category,

        /*
          Delivery = cardapio
          Encomendas = encomendas
        */

        area,

        discount_percent:
          Number.isFinite(discount)
            ? discount
            : 0,

        sort:
          Number.isFinite(sort)
            ? sort
            : 0,

        gramatura:
          getFieldValue("productGramatura"),

        serve_ate:
          getFieldValue("productServeAte"),

        description:
          getFieldValue("productDescription"),

        available:
          Boolean(
            getFieldValue("productAvailable")
          ),

        featured:
          Boolean(
            getFieldValue("productFeatured")
          ),

        appointment_required:
          Boolean(
            getFieldValue("productAppointment")
          )
      };

      if (imageUrl) {
        payload.image_url = imageUrl;
      }

      const { data, error } = await db
        .from("products")
        .upsert(payload, {
          onConflict: "id"
        })
        .select()
        .single();

      if (error) {
        console.error(
          "Erro ao salvar produto:",
          error
        );

        throw error;
      }

      const normalizedProduct = {
        ...data,
        area: normalizeArea(
          data.area,
          data
        )
      };

      const existingIndex =
        state.products.findIndex(
          (product) =>
            product.id === normalizedProduct.id
        );

      if (existingIndex >= 0) {
        state.products[existingIndex] =
          normalizedProduct;
      } else {
        state.products.push(
          normalizedProduct
        );
      }

      state.products.sort(
        (a, b) =>
          Number(a.sort || 0) -
          Number(b.sort || 0)
      );

      closeProductModal();

      updateStats();
      renderProductTab();

      toast(
        editingId
          ? "Produto atualizado com sucesso."
          : "Produto criado com sucesso."
      );

    } catch (error) {
      console.error(error);

      toast(
        error.message ||
          "Não foi possível salvar o produto.",
        "error"
      );
    } finally {
      setLoading(
        submitButton,
        false,
        "Salvar produto"
      );
    }
  }

  /* =========================================================
     EXCLUIR PRODUTO
     ========================================================= */

  async function deleteProduct(id) {
    const product = state.products.find(
      (item) => item.id === id
    );

    if (!product) return;

    const confirmed = window.confirm(
      `Excluir "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      const { error } = await db
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      state.products =
        state.products.filter(
          (item) => item.id !== id
        );

      updateStats();
      renderProductTab();

      toast("Produto excluído.");
    } catch (error) {
      console.error(error);

      toast(
        "Não foi possível excluir o produto.",
        "error"
      );
    }
  }

  /* =========================================================
     DUPLICAR PRODUTO
     ========================================================= */

  async function duplicateProduct(id) {
    const original = state.products.find(
      (product) => product.id === id
    );

    if (!original) return;

    const copy = {
      ...original,

      id:
        `${slugify(original.name)}-` +
        `${Date.now()}`,

      name:
        `${original.name} — cópia`
    };

    try {
      const { data, error } = await db
        .from("products")
        .insert(copy)
        .select()
        .single();

      if (error) {
        throw error;
      }

      state.products.push({
        ...data,
        area: normalizeArea(
          data.area,
          data
        )
      });

      updateStats();
      renderProductTab();

      toast("Produto duplicado.");
    } catch (error) {
      console.error(error);

      toast(
        "Não foi possível duplicar o produto.",
        "error"
      );
    }
  }

  /* =========================================================
     ALTERAR DISPONIBILIDADE
     ========================================================= */

  async function toggleProductAvailability(id) {
    const product = state.products.find(
      (item) => item.id === id
    );

    if (!product) return;

    const newValue =
      product.available === false;

    try {
      const { error } = await db
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
      renderProductTab();

      toast(
        newValue
          ? "Produto ativado."
          : "Produto ocultado."
      );
    } catch (error) {
      console.error(error);

      toast(
        "Não foi possível alterar a disponibilidade.",
        "error"
      );
    }
  }

  /* =========================================================
     RENDER — PRODUTOS
     ========================================================= */

  function renderProductTab() {
    if (!tabContent) return;

    ensureProductFormFields();

    const deliveryProducts =
      state.products.filter(
        (product) =>
          normalizeArea(
            product.area,
            product
          ) === "cardapio"
      );

    const orderProducts =
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
          <h2>Produtos</h2>
          <p>
            Gerencie os produtos do Delivery e das Encomendas.
          </p>
        </div>

        <div style="
          display:flex;
          gap:10px;
          flex-wrap:wrap;
        ">
          <button
            type="button"
            class="btn btn-secondary"
            id="manageCategoriesBtn"
          >
            Classificações
          </button>

          <button
            type="button"
            class="btn btn-primary"
            id="newProductBtn"
          >
            + Novo produto
          </button>
        </div>

      </div>

      <div
        id="classificationManager"
        class="classification-list"
        style="display:none;"
      >
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
          margin-bottom:12px;
        ">
          <strong>Classificações</strong>

          <button
            type="button"
            class="btn btn-primary"
            id="addClassificationBtn"
          >
            + Nova classificação
          </button>
        </div>

        <div id="classificationItems">
          ${renderClassificationItems()}
        </div>
      </div>

      <div class="admin-products-area">

        ${renderAreaSection(
          "Delivery",
          "cardapio",
          deliveryProducts
        )}

        ${renderAreaSection(
          "Encomendas",
          "encomendas",
          orderProducts
        )}

      </div>
    `;

    bindProductTabEvents();
  }

  function renderClassificationItems() {
    if (!state.categories.length) {
      return `
        <div class="admin-empty">
          Nenhuma classificação cadastrada.
        </div>
      `;
    }

    return state.categories
      .map(
        (category) => `
          <div class="classification-chip">
            <span>
              ${escapeHtml(category)}
            </span>

            <button
              type="button"
              data-delete-category="${escapeHtml(
                category
              )}"
              title="Excluir classificação"
            >
              ×
            </button>
          </div>
        `
      )
      .join("");
  }

  function renderAreaSection(
    title,
    area,
    products
  ) {
    return `
      <section class="admin-product-section">

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          margin:24px 0 12px;
        ">
          <div>
            <h3 style="margin:0;">
              ${escapeHtml(title)}
            </h3>

            <small style="opacity:.7;">
              ${products.length} produto${
      products.length === 1 ? "" : "s"
    }
            </small>
          </div>
        </div>

        ${
          products.length
            ? `
              <div class="admin-products-list">
                ${products
                  .map(
                    (product) =>
                      renderProductCard(product)
                  )
                  .join("")}
              </div>
            `
            : `
              <div class="admin-empty">
                Nenhum produto cadastrado nesta área.
              </div>
            `
        }

      </section>
    `;
  }

  function renderProductCard(product) {
    const image = getProductImage(product);

    const available =
      product.available !== false;

    const category =
      product.category ||
      "Sem classificação";

    const area = areaLabel(
      product.area
    );

    return `
      <article
        class="admin-product-card"
        data-product-id="${escapeHtml(
          product.id
        )}"
      >

        <div class="admin-product-image">
          ${
            image
              ? `
                <img
                  src="${escapeHtml(image)}"
                  alt="${escapeHtml(product.name)}"
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

          <div style="
            display:flex;
            gap:6px;
            flex-wrap:wrap;
            margin-bottom:7px;
          ">

            <span class="product-area-choice">
              ${escapeHtml(area)}
            </span>

            <span class="product-classification">
              ${escapeHtml(category)}
            </span>

            ${
              available
                ? `
                  <span class="status-badge status-active">
                    Disponível
                  </span>
                `
                : `
                  <span class="status-badge status-inactive">
                    Oculto
                  </span>
                `
            }

          </div>

          <h4>
            ${escapeHtml(product.name)}
          </h4>

          <strong>
            ${money(product.price)}
          </strong>

          ${
            product.description
              ? `
                <p>
                  ${escapeHtml(
                    product.description
                  )}
                </p>
              `
              : ""
          }

        </div>

        <div class="admin-product-actions">

          <button
            type="button"
            class="btn btn-secondary"
            data-edit-product="${escapeHtml(
              product.id
            )}"
          >
            Editar
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            data-toggle-product="${escapeHtml(
              product.id
            )}"
          >
            ${
              available
                ? "Ocultar"
                : "Ativar"
            }
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            data-duplicate-product="${escapeHtml(
              product.id
            )}"
          >
            Duplicar
          </button>

          <button
            type="button"
            class="btn btn-danger"
            data-delete-product="${escapeHtml(
              product.id
            )}"
          >
            Excluir
          </button>

        </div>

      </article>
    `;
  }

  /* =========================================================
     EVENTOS — PRODUTOS
     ========================================================= */

  function bindProductTabEvents() {
    const newProductBtn =
      $("#newProductBtn");

    if (newProductBtn) {
      newProductBtn.addEventListener(
        "click",
        () => openProductModal()
      );
    }

    const manageCategoriesBtn =
      $("#manageCategoriesBtn");

    const classificationManager =
      $("#classificationManager");

    if (
      manageCategoriesBtn &&
      classificationManager
    ) {
      manageCategoriesBtn.addEventListener(
        "click",
        () => {
          classificationManager.style.display =
            classificationManager.style.display ===
            "none"
              ? "block"
              : "none";
        }
      );
    }

    const addClassificationBtn =
      $("#addClassificationBtn");

    if (addClassificationBtn) {
      addClassificationBtn.addEventListener(
        "click",
        createClassification
      );
    }

    $$("[data-delete-category]").forEach(
      (button) => {
        button.addEventListener(
          "click",
          () =>
            deleteClassification(
              button.dataset.deleteCategory
            )
        );
      }
    );

    $$("[data-edit-product]").forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const product =
              state.products.find(
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
      }
    );

    $$("[data-delete-product]").forEach(
      (button) => {
        button.addEventListener(
          "click",
          () =>
            deleteProduct(
              button.dataset.deleteProduct
            )
        );
      }
    );

    $$("[data-duplicate-product]").forEach(
      (button) => {
        button.addEventListener(
          "click",
          () =>
            duplicateProduct(
              button.dataset.duplicateProduct
            )
        );
      }
    );

    $$("[data-toggle-product]").forEach(
      (button) => {
        button.addEventListener(
          "click",
          () =>
            toggleProductAvailability(
              button.dataset.toggleProduct
            )
        );
      }
    );
  }

  /* =========================================================
     PEDIDOS
     ========================================================= */

  async function loadOrders() {
    const possibleTables = [
      "orders",
      "pedidos"
    ];

    for (const table of possibleTables) {
      try {
        const result = await db
          .from(table)
          .select("*")
          .order("created_at", {
            ascending: false
          })
          .limit(100);

        if (!result.error) {
          return result.data || [];
        }
      } catch (_) {}
    }

    return [];
  }

  async function renderOrdersTab() {
    if (!tabContent) return;

    tabContent.innerHTML = `
      <div class="product-toolbar">
        <div>
          <h2>Pedidos</h2>
          <p>Pedidos recebidos pelo sistema.</p>
        </div>
      </div>

      <div id="ordersContainer">
        <div class="admin-empty">
          Carregando pedidos...
        </div>
      </div>
    `;

    const orders =
      await loadOrders();

    const container =
      $("#ordersContainer");

    if (!container) return;

    if (!orders.length) {
      container.innerHTML = `
        <div class="admin-empty">
          Nenhum pedido encontrado.
        </div>
      `;
      return;
    }

    container.innerHTML = orders
      .map(
        (order) => `
          <article class="admin-order-card">
            <strong>
              Pedido #${escapeHtml(
                order.id || ""
              )}
            </strong>

            <p>
              ${
                escapeHtml(
                  order.customer_name ||
                    order.name ||
                    "Cliente"
                )
              }
            </p>

            <small>
              ${escapeHtml(
                order.created_at || ""
              )}
            </small>
          </article>
        `
      )
      .join("");
  }

  /* =========================================================
     ENCOMENDAS DE BOLOS
     ========================================================= */

  async function renderCakesTab() {
    if (!tabContent) return;

    const cake =
      state.settings.cake ||
      DEFAULTS.cake ||
      {};

    const types =
      Array.isArray(cake.types)
        ? cake.types
        : [];

    tabContent.innerHTML = `
      <div class="product-toolbar">
        <div>
          <h2>Encomendas</h2>
          <p>
            Configurações de bolos para encomenda.
          </p>
        </div>
      </div>

      <div class="admin-panel-box">

        <h3>Tipos de bolo</h3>

        ${
          types.length
            ? `
              <div class="cake-list">
                ${types
                  .map(
                    (item) => `
                      <div class="cake-item">
                        <span>
                          ${escapeHtml(
                            item[0]
                          )}
                        </span>

                        <strong>
                          ${money(item[1])}
                        </strong>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            `
            : `
              <div class="admin-empty">
                Nenhum bolo configurado.
              </div>
            `
        }

      </div>
    `;
  }

  /* =========================================================
     CONTEÚDO
     ========================================================= */

  async function saveSettingObject() {
    const { error } = await db
      .from("settings")
      .upsert(
        {
          key: "site",
          value: state.settings
        },
        {
          onConflict: "key"
        }
      );

    if (error) {
      throw error;
    }
  }

  function renderContentTab() {
    if (!tabContent) return;

    const about =
      state.settings.about ||
      DEFAULTS.about ||
      {};

    tabContent.innerHTML = `
      <div class="product-toolbar">
        <div>
          <h2>Conteúdo</h2>
          <p>
            Edite o conteúdo principal do site.
          </p>
        </div>
      </div>

      <div class="admin-panel-box">

        <div class="field">
          <label for="adminAboutTitle">
            Título da história
          </label>

          <input
            id="adminAboutTitle"
            value="${escapeHtml(
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
            value="${escapeHtml(
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
            rows="14"
          >${escapeHtml(
            about.text || ""
          )}</textarea>
        </div>

        <button
          type="button"
          class="btn btn-primary"
          id="saveContentBtn"
        >
          Salvar conteúdo
        </button>

      </div>
    `;

    $("#saveContentBtn")?.addEventListener(
      "click",
      async () => {
        const button =
          $("#saveContentBtn");

        setLoading(
          button,
          true,
          "Salvar conteúdo"
        );

        try {
          state.settings.about = {
            ...(state.settings.about || {}),
            title:
              $("#adminAboutTitle")?.value || "",
            quote:
              $("#adminAboutQuote")?.value || "",
            text:
              $("#adminAboutText")?.value || ""
          };

          await saveSettingObject();

          toast(
            "Conteúdo salvo com sucesso."
          );
        } catch (error) {
          console.error(error);

          toast(
            "Não foi possível salvar o conteúdo.",
            "error"
          );
        } finally {
          setLoading(
            button,
            false,
            "Salvar conteúdo"
          );
        }
      }
    );
  }

  /* =========================================================
     HORÁRIOS
     ========================================================= */

  function renderHoursTab() {
    if (!tabContent) return;

    const hours =
      Array.isArray(state.settings.hours)
        ? state.settings.hours
        : Array.isArray(DEFAULTS.hours)
        ? DEFAULTS.hours
        : [];

    const names = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado"
    ];

    tabContent.innerHTML = `
      <div class="product-toolbar">
        <div>
          <h2>Horários</h2>
          <p>
            Horários de funcionamento.
          </p>
        </div>
      </div>

      <div class="admin-panel-box">

        ${names
          .map((name, index) => {
            const item =
              hours[index] || {
                s: "closed",
                o: "",
                c: ""
              };

            return `
              <div class="hours-row">

                <strong>
                  ${name}
                </strong>

                <select
                  data-hours-status="${index}"
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
                  data-hours-open="${index}"
                  value="${escapeHtml(
                    item.o || ""
                  )}"
                >

                <input
                  type="time"
                  data-hours-close="${index}"
                  value="${escapeHtml(
                    item.c || ""
                  )}"
                >

              </div>
            `;
          })
          .join("")}

        <button
          type="button"
          class="btn btn-primary"
          id="saveHoursBtn"
        >
          Salvar horários
        </button>

      </div>
    `;

    $("#saveHoursBtn")?.addEventListener(
      "click",
      async () => {
        const button =
          $("#saveHoursBtn");

        setLoading(
          button,
          true,
          "Salvar horários"
        );

        try {
          const newHours =
            names.map((_, index) => ({
              s:
                $(
                  `[data-hours-status="${index}"]`
                )?.value || "closed",

              o:
                $(
                  `[data-hours-open="${index}"]`
                )?.value || "",

              c:
                $(
                  `[data-hours-close="${index}"]`
                )?.value || ""
            }));

          state.settings.hours =
            newHours;

          await saveSettingObject();

          toast(
            "Horários salvos com sucesso."
          );
        } catch (error) {
          console.error(error);

          toast(
            "Não foi possível salvar os horários.",
            "error"
          );
        } finally {
          setLoading(
            button,
            false,
            "Salvar horários"
          );
        }
      }
    );
  }

  /* =========================================================
     REGRAS
     ========================================================= */

  function renderRulesTab() {
    if (!tabContent) return;

    const rules =
      state.settings.rules || {};

    tabContent.innerHTML = `
      <div class="product-toolbar">
        <div>
          <h2>Regras</h2>
          <p>
            Informações e regras das encomendas.
          </p>
        </div>
      </div>

      <div class="admin-panel-box">

        <div class="field">
          <label>
            Prazo / observações
          </label>

          <textarea
            id="adminRulesText"
            rows="10"
          >${escapeHtml(
            rules.text || ""
          )}</textarea>
        </div>

        <button
          type="button"
          class="btn btn-primary"
          id="saveRulesBtn"
        >
          Salvar regras
        </button>

      </div>
    `;

    $("#saveRulesBtn")?.addEventListener(
      "click",
      async () => {
        const button =
          $("#saveRulesBtn");

        setLoading(
          button,
          true,
          "Salvar regras"
        );

        try {
          state.settings.rules = {
            ...(state.settings.rules || {}),
            text:
              $("#adminRulesText")?.value || ""
          };

          await saveSettingObject();

          toast(
            "Regras salvas com sucesso."
          );
        } catch (error) {
          console.error(error);

          toast(
            "Não foi possível salvar as regras.",
            "error"
          );
        } finally {
          setLoading(
            button,
            false,
            "Salvar regras"
          );
        }
      }
    );
  }

  /* =========================================================
     MÍDIA
     ========================================================= */

  function renderMediaTab() {
    if (!tabContent) return;

    tabContent.innerHTML = `
      <div class="product-toolbar">
        <div>
          <h2>Mídia</h2>
          <p>
            Imagens e materiais utilizados pelo site.
          </p>
        </div>
      </div>

      <div class="admin-panel-box">

        <p>
          As imagens dos produtos podem ser adicionadas
          diretamente pelo cadastro de cada produto.
        </p>

        <p style="opacity:.7;">
          O sistema mantém a imagem atual quando nenhum
          novo arquivo é selecionado.
        </p>

      </div>
    `;
  }

  /* =========================================================
     ABAS
     ========================================================= */

  async function activateTab(tab) {
    state.activeTab = tab;

    $$(".sidebar-item, [data-tab]").forEach(
      (element) => {
        if (
          element.dataset.tab === tab
        ) {
          element.classList.add("active");
        } else {
          element.classList.remove("active");
        }
      }
    );

    if (tab === "products") {
      renderProductTab();
      return;
    }

    if (tab === "orders") {
      await renderOrdersTab();
      return;
    }

    if (tab === "cakes") {
      await renderCakesTab();
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

    renderProductTab();
  }

  function bindTabs() {
    $$("[data-tab]").forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            activateTab(
              button.dataset.tab
            );
          }
        );
      }
    );
  }

  /* =========================================================
     LOGIN
     ========================================================= */

  async function handleLogin(event) {
    event.preventDefault();

    if (!loginForm) return;

    const email =
      $("#loginEmail")?.value?.trim();

    const password =
      $("#loginPassword")?.value || "";

    if (!email || !password) {
      showLoginMessage(
        "Informe e-mail e senha."
      );
      return;
    }

    const submitButton =
      loginForm.querySelector(
        'button[type="submit"]'
      );

    setLoading(
      submitButton,
      true,
      "Entrar"
    );

    showLoginMessage(
      "Entrando...",
      false
    );

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
          "Login realizado, mas a sessão não foi criada."
        );
      }

      showLoginMessage(
        "Login realizado.",
        false
      );

      await showApp();

    } catch (error) {
      console.error(error);

      showLoginMessage(
        error.message ||
          "Não foi possível entrar."
      );
    } finally {
      setLoading(
        submitButton,
        false,
        "Entrar"
      );
    }
  }

  async function handleLogout() {
    try {
      await db.auth.signOut();
    } catch (error) {
      console.error(error);
    }

    showLogin();
  }

  function showLogin() {
    if (loginScreen) {
      loginScreen.classList.remove("hidden");
      loginScreen.style.display = "";
    }

    if (app) {
      app.classList.add("hidden");
      app.style.display = "";
    }
  }

  async function showApp() {
    if (loginScreen) {
      loginScreen.classList.add("hidden");
      loginScreen.style.display = "none";
    }

    if (app) {
      app.classList.remove("hidden");
      app.style.display = "";
    }

    try {
      await loadSettings();
      await loadProducts();

      updateStats();
      bindTabs();

      await activateTab(
        state.activeTab || "products"
      );

    } catch (error) {
      console.error(error);

      toast(
        "Não foi possível carregar o painel: " +
          (error.message || "erro desconhecido"),
        "error"
      );
    }
  }

  /* =========================================================
     REFRESH
     ========================================================= */

  async function refreshAdmin() {
    const oldText =
      refreshBtn?.textContent ||
      "Atualizar";

    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent =
        "Atualizando...";
    }

    try {
      await loadSettings();
      await loadProducts();

      updateStats();

      await activateTab(
        state.activeTab || "products"
      );

      toast("Painel atualizado.");
    } catch (error) {
      console.error(error);

      toast(
        "Não foi possível atualizar o painel.",
        "error"
      );
    } finally {
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent =
          oldText;
      }
    }
  }

  /* =========================================================
     MODAL — EVENTOS
     ========================================================= */

  function bindModalEvents() {
    if (!productModal) return;

    productModal.addEventListener(
      "click",
      (event) => {
        if (
          event.target === productModal
        ) {
          closeProductModal();
        }
      }
    );

    const closeButtons =
      productModal.querySelectorAll(
        "[data-close], .modal-close, .close-modal"
      );

    closeButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          closeProductModal
        );
      }
    );
  }

  /* =========================================================
     GARANTIR CAMPOS DO FORMULÁRIO
     ========================================================= */

  function normalizeExistingProductAreaField() {
    const area =
      getField("productArea");

    if (!area) return;

    const current =
      area.value || "cardapio";

    populateAreaSelect(current);
  }

  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  async function init() {
    console.log(
      "Martins Admin — versão atualizada"
    );

    if (!window.supabase) {
      console.error(
        "Supabase JS não foi carregado."
      );

      showLoginMessage(
        "Erro: biblioteca do Supabase não carregada."
      );

      return;
    }

    ensureProductFormFields();
    normalizeExistingProductAreaField();

    if (loginForm) {
      loginForm.addEventListener(
        "submit",
        handleLogin
      );
    }

    if (logoutBtn) {
      logoutBtn.addEventListener(
        "click",
        handleLogout
      );
    }

    if (refreshBtn) {
      refreshBtn.addEventListener(
        "click",
        refreshAdmin
      );
    }

    if (productForm) {
      productForm.addEventListener(
        "submit",
        saveProduct
      );
    }

    bindModalEvents();

    /*
      Verifica se já existe uma sessão.
    */

    const {
      data: {
        session
      }
    } = await db.auth.getSession();

    if (session) {
      await showApp();
    } else {
      showLogin();
    }

    /*
      Escuta mudanças de autenticação.
    */

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

  /* =========================================================
     INICIAR
     ========================================================= */

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})();
