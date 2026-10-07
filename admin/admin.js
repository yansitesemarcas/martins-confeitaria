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

  const ORDER_DEFAULTS = {
    cakes: [
      {name:"Naked Cake",options:["06/08 pessoas","10/12 pessoas","15/20 pessoas","20/25 pessoas","25/30 pessoas","30/40 pessoas","40/50 pessoas","50/60 pessoas"],prices:[55,80,108,125,155,198,250,290],active:true},
      {name:"Chantininho",options:["06/08 pessoas","10/12 pessoas","15/20 pessoas","20/25 pessoas","25/30 pessoas","30/40 pessoas","40/50 pessoas","50/60 pessoas"],prices:[70,90,130,150,180,230,270,310],active:true}
    ],
    extras:[["Abacaxi",10],["Morango",16],["Crocante de Castanha",10],["Kit Kat",12],["Geleia de Morango",16],["Ouro Branco",10],["Nutella",16],["Kinder Bueno",16]],
    personalizations:[["Topo simples",20],["Topo 3D",30],["Flores naturais",70],["Scrap Cake",30]],
    brigadeiros:{classicaPrices:[62.5,125],premiumPrices:[72.5,145]},
    otherItems:[{name:"Petit Brownie",packages:[{qty:50,total:90},{qty:100,total:180}]},{name:"Mini Brownie Recheado",unit:3.5,discountUnit:2.8,discountFrom:20},{name:"Bem Casado no papel crepom",unit:6,discountUnit:4.8,discountFrom:20},{name:"Bem Casado na folha de celofane",unit:5,discountUnit:4,discountFrom:20},{name:"Cupcakes com plaquinha",unit:6.5},{name:"Cupcakes sem plaquinha",unit:5.5}],
    kits:[{id:"pb1",group:"Kits com Petit Brownie",name:"Kit Petit Brownie 01",price:150},{id:"pb2",group:"Kits com Petit Brownie",name:"Kit Petit Brownie 02",price:200},{id:"pb3",group:"Kits com Petit Brownie",name:"Kit Petit Brownie 03",price:250},{id:"pb4",group:"Kits com Petit Brownie",name:"Kit Petit Brownie 04",price:430},{id:"pb5",group:"Kits com Petit Brownie",name:"Kit Petit Brownie 05",price:500},{id:"pr1",group:"Kits com Pirulitos",name:"Kit Pirulito 01",price:130},{id:"pr2",group:"Kits com Pirulitos",name:"Kit Pirulito 02",price:160},{id:"pr3",group:"Kits com Pirulitos",name:"Kit Pirulito 03",price:210},{id:"pr4",group:"Kits com Pirulitos",name:"Kit Pirulito 04",price:350},{id:"pr5",group:"Kits com Pirulitos",name:"Kit Pirulito 05",price:450}]
  };

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

    const [siteResult, orderResult] = await Promise.all([
      db
        .from("settings")
        .select("*")
        .eq("key", "site")
        .maybeSingle(),
      db
        .from("settings")
        .select("*")
        .eq("key", "encomendas")
        .maybeSingle()
    ]);

    if (siteResult.error) {
      console.error("Erro ao carregar settings:", siteResult.error);
    }

    if (orderResult.error) {
      console.error("Erro ao carregar configuração de encomendas:", orderResult.error);
    }

    const savedOrderConfig =
      orderResult.data?.value &&
      typeof orderResult.data.value === "object"
        ? orderResult.data.value
        : {};

    const defaultOrderConfig =
      JSON.parse(JSON.stringify(ORDER_DEFAULTS));

    const mergeNamedOptions = (defaults, saved, key = "name") => {
      const savedList = Array.isArray(saved) ? saved : [];
      const result = defaults.map(item => {
        const savedItem = savedList.find(
          candidate =>
            String(candidate?.[key] || "").trim().toLowerCase() ===
            String(item?.[key] || "").trim().toLowerCase()
        );
        return savedItem ? { ...item, ...savedItem } : { ...item };
      });

      savedList.forEach(item => {
        const exists = result.some(
          candidate =>
            String(candidate?.[key] || "").trim().toLowerCase() ===
            String(item?.[key] || "").trim().toLowerCase()
        );
        if (!exists) result.push(item);
      });

      return result;
    };

    const mergePairOptions = (defaults, saved) => {
      const savedList = Array.isArray(saved) ? saved : [];
      return defaults.map(item => {
        const savedItem = savedList.find(
          candidate =>
            String(candidate?.[0] || "").trim().toLowerCase() ===
            String(item?.[0] || "").trim().toLowerCase()
        );
        return savedItem
          ? [item[0], Number(savedItem[1] ?? item[1])]
          : [...item];
      });
    };

    const mergeKits = (defaults, saved) => {
      const savedList = Array.isArray(saved) ? saved : [];
      return defaults.map(item => {
        const savedItem = savedList.find(
          candidate =>
            String(candidate?.id || "").trim().toLowerCase() ===
            String(item?.id || "").trim().toLowerCase()
        );
        return savedItem
          ? { ...item, ...savedItem }
          : { ...item };
      });
    };

    const mergeOtherItems = (defaults, saved) => {
      const savedList = Array.isArray(saved) ? saved : [];
      return defaults.map(item => {
        const savedItem = savedList.find(
          candidate =>
            String(candidate?.name || "").trim().toLowerCase() ===
            String(item?.name || "").trim().toLowerCase()
        );
        if (!savedItem) return { ...item };

        return {
          ...item,
          ...savedItem,
          packages: Array.isArray(savedItem.packages)
            ? savedItem.packages
            : item.packages
        };
      });
    };

    const orderConfig = {
      ...defaultOrderConfig,
      ...savedOrderConfig,
      cakes: mergeNamedOptions(
        defaultOrderConfig.cakes,
        savedOrderConfig.cakes
      ),
      extras: mergePairOptions(
        defaultOrderConfig.extras,
        savedOrderConfig.extras
      ),
      personalizations: mergePairOptions(
        defaultOrderConfig.personalizations,
        savedOrderConfig.personalizations
      ),
      brigadeiros: {
        ...defaultOrderConfig.brigadeiros,
        ...(savedOrderConfig.brigadeiros || {}),
        classicaPrices:
          Array.isArray(savedOrderConfig.brigadeiros?.classicaPrices) &&
          savedOrderConfig.brigadeiros.classicaPrices.length
            ? [
                savedOrderConfig.brigadeiros.classicaPrices[0] ?? defaultOrderConfig.brigadeiros.classicaPrices[0],
                savedOrderConfig.brigadeiros.classicaPrices[1] ?? defaultOrderConfig.brigadeiros.classicaPrices[1]
              ]
            : [...defaultOrderConfig.brigadeiros.classicaPrices],
        premiumPrices:
          Array.isArray(savedOrderConfig.brigadeiros?.premiumPrices) &&
          savedOrderConfig.brigadeiros.premiumPrices.length
            ? [
                savedOrderConfig.brigadeiros.premiumPrices[0] ?? defaultOrderConfig.brigadeiros.premiumPrices[0],
                savedOrderConfig.brigadeiros.premiumPrices[1] ?? defaultOrderConfig.brigadeiros.premiumPrices[1]
              ]
            : [...defaultOrderConfig.brigadeiros.premiumPrices]
      },
      otherItems: mergeOtherItems(
        defaultOrderConfig.otherItems,
        savedOrderConfig.otherItems
      ),
      kits: mergeKits(
        defaultOrderConfig.kits,
        savedOrderConfig.kits
      )
    };

    state.settings = {
      ...DEFAULTS,
      ...(siteResult.data?.value || {}),
      encomendas: orderConfig
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

        ${area === "encomendas" ? "" : `
          <button
            type="button"
            class="btn primary"
            data-action="new-product"
          >
            + Novo produto
          </button>
        `}

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
    const settings = state.settings || {};
    const instagram = settings.instagram || settings.instagram_url || "";
    const whatsapp = settings.whatsapp || settings.phone || settings.telefone || "";
    const address = Array.isArray(settings.address) ? settings.address.join(", ") : (settings.address || settings.endereco || "");
    const maps = settings.maps || settings.maps_url || "";
    const defaultHours = Array.isArray(DEFAULTS.hours) ? DEFAULTS.hours : [
      {s:"closed",o:"",c:""},{s:"tbd",o:"",c:""},
      {s:"open",o:"11:00",c:"23:00"},{s:"open",o:"11:00",c:"18:30"},
      {s:"open",o:"11:00",c:"23:00"},{s:"open",o:"11:00",c:"23:00"},
      {s:"open",o:"12:00",c:"17:00"}
    ];
    const hours = Array.isArray(settings.hours) && settings.hours.length === 7
      ? settings.hours : defaultHours;
    const days = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];

    return `
      <div class="page-head settings-page-head">
        <div><h2>Configurações do site</h2><p class="muted">Altere as informações e os horários que aparecem no site.</p></div>
        <button type="button" class="btn primary" data-action="save-settings">Salvar alterações</button>
      </div>

      <section class="settings-card">
        <div class="settings-card-head"><span class="settings-icon">🍰</span><div><h3>Informações da Martins Confeitaria</h3><p>Esses dados são usados diretamente no site.</p></div></div>
        <div class="settings-grid">
          <label>Instagram<input id="s-instagram" type="text" value="${escapeHtml(instagram)}" placeholder="@martins_confeitariaartesanal"></label>
          <label>WhatsApp<input id="s-whatsapp" type="text" value="${escapeHtml(whatsapp)}" placeholder="5585981563070"></label>
          <label class="full">Endereço<input id="s-address" type="text" value="${escapeHtml(address)}" placeholder="Rua 1018, 65, Conjunto Ceará II, Fortaleza-CE"></label>
          <label class="full">Link do Google Maps<input id="s-maps" type="url" value="${escapeHtml(maps)}" placeholder="https://maps.google.com/..."></label>
        </div>
      </section>

      <section class="settings-card hours-settings-card">
        <div class="settings-card-head"><span class="settings-icon">🕐</span><div><h3>Horário de funcionamento</h3><p>Escolha o horário de cada dia. Ao salvar, o site passa a usar esses horários.</p></div></div>
        <div class="hours-admin-list">
          ${days.map((day,i) => {
            const h = hours[i] || {s:"tbd",o:"",c:""};
            return `
              <div class="hours-admin-row">
                <div class="hours-day"><strong>${day}</strong><small>Dia ${i + 1}</small></div>
                <select class="hours-status" data-hour-index="${i}">
                  <option value="open" ${h.s==="open"?"selected":""}>Aberto</option>
                  <option value="closed" ${h.s==="closed"?"selected":""}>Fechado</option>
                  <option value="tbd" ${h.s==="tbd"?"selected":""}>A confirmar</option>
                </select>
                <label>Abre<input class="hours-open" data-hour-index="${i}" type="time" value="${escapeHtml(h.o || "")}"></label>
                <label>Fecha<input class="hours-close" data-hour-index="${i}" type="time" value="${escapeHtml(h.c || "")}"></label>
              </div>`;
          }).join("")}
        </div>
        <div class="hours-note">💡 Se estiver como <b>Fechado</b> ou <b>A confirmar</b>, os horários ficam desativados para aquele dia.</div>
      </section>

      <section class="settings-card">
        <div class="settings-card-head"><span class="settings-icon">🏷️</span><div><h3>Classificações</h3><p>Categorias utilizadas nos produtos.</p></div>
          <button type="button" class="btn soft" data-action="new-category">+ Nova classificação</button>
        </div>
        <div class="category-list">${getCategories().map(category => `<span class="badge">${escapeHtml(category)}</span>`).join("")}</div>
      </section>
    `;
  }

  async function saveSettings() {
    if (!db) {
      showToast("Supabase não está conectado.", "error");
      return;
    }

    const button = document.querySelector('[data-action="save-settings"]');
    setButtonLoading(button, true, "Salvando...");

    try {
      const next = { ...(state.settings || {}) };
      next.instagram = $("#s-instagram")?.value?.trim() || "";
      next.whatsapp = $("#s-whatsapp")?.value?.trim() || "";
      next.address = $("#s-address")?.value?.trim() || "";
      next.maps = $("#s-maps")?.value?.trim() || "";

      const currentHours = Array.isArray(next.hours) && next.hours.length === 7
        ? next.hours : (Array.isArray(DEFAULTS.hours) ? DEFAULTS.hours : []);
      next.hours = Array.from({length:7}, (_,i) => {
        const status = document.querySelector(`.hours-status[data-hour-index="${i}"]`)?.value || currentHours[i]?.s || "tbd";
        const open = document.querySelector(`.hours-open[data-hour-index="${i}"]`)?.value || "";
        const close = document.querySelector(`.hours-close[data-hour-index="${i}"]`)?.value || "";
        return { s: status, o: status === "open" ? open : "", c: status === "open" ? close : "" };
      });

      const {data,error} = await db.from("settings").upsert(
        {key:"site", value:next},
        {onConflict:"key"}
      ).select().single();

      if (error) throw error;

      state.settings = data?.value || next;
      showToast("Configurações e horários salvos. O site já está usando os novos horários.");
      renderCurrentView();
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      showToast(error?.message || "Não foi possível salvar as configurações.", "error");
    } finally {
      setButtonLoading(button, false);
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

  function renderOrderPricingView() {
    const cfg = state.settings?.encomendas || {};
    const cakes = Array.isArray(cfg.cakes) ? cfg.cakes : [];
    const extras = Array.isArray(cfg.extras) ? cfg.extras : [];
    const personalizations = Array.isArray(cfg.personalizations) ? cfg.personalizations : [];
    const brigadeiros = cfg.brigadeiros || {};
    const otherItems = Array.isArray(cfg.otherItems) ? cfg.otherItems : [];
    const kits = Array.isArray(cfg.kits) ? cfg.kits : [];

    const priceInput = (type, i, value, extra = "") => `
      <input class="price-input" type="number" min="0" step="0.01"
        data-order-price="${type}" data-i="${i}" ${extra}
        value="${Number(value || 0)}">
    `;

    return `
      <div class="page-head pricing-page-head">
        <div>
          <h2>Valores de Encomendas</h2>
          <p class="muted">Altere somente os preços. Os produtos, sabores e opções permanecem definidos no sistema.</p>
        </div>
      </div>

      <section class="pricing-section">
        <div class="pricing-section-head">
          <div><span class="pricing-icon">🍰</span><div><h3>Bolos</h3><p>Valores por tamanho e quantidade de pessoas.</p></div></div>
        </div>
        <div class="pricing-cake-grid">
          ${cakes.map((cake, ci) => `
            <article class="pricing-card cake-pricing-card">
              <div class="pricing-card-title"><strong>${escapeHtml(cake.name)}</strong><span>Preço por tamanho</span></div>
              <div class="price-list">
                ${(cake.options || []).map((option, oi) => `
                  <label class="price-row">
                    <span>${escapeHtml(option)}</span>
                    ${priceInput("cake", ci, cake.prices?.[oi], `data-oi="${oi}"`)}
                  </label>
                `).join("")}
              </div>
            </article>
          `).join("")}
        </div>
      </section>

      <section class="pricing-section">
        <div class="pricing-section-head"><div><span class="pricing-icon">➕</span><div><h3>Adicionais</h3><p>Itens extras que podem ser acrescentados ao bolo.</p></div></div></div>
        <div class="pricing-grid">
          ${extras.map((item, i) => `
            <label class="pricing-item-card"><span>${escapeHtml(item[0])}</span>${priceInput("extra", i, item[1])}</label>
          `).join("")}
        </div>
      </section>

      <section class="pricing-section">
        <div class="pricing-section-head"><div><span class="pricing-icon">🎀</span><div><h3>Personalizações</h3><p>Valores das opções de decoração e acabamento.</p></div></div></div>
        <div class="pricing-grid">
          ${personalizations.map((item, i) => `
            <label class="pricing-item-card"><span>${escapeHtml(item[0])}</span>${priceInput("personalization", i, item[1])}</label>
          `).join("")}
        </div>
      </section>

      <section class="pricing-section">
        <div class="pricing-section-head"><div><span class="pricing-icon">🍬</span><div><h3>Brigadeiros</h3><p>Os sabores e limites são fixos. Aqui você altera apenas os valores.</p></div></div></div>
        <div class="pricing-grid brigadeiro-grid">
          <label class="pricing-item-card"><span>Clássicos · 50 unidades</span>${priceInput("brig-classic", 0, brigadeiros.classicaPrices?.[0])}</label>
          <label class="pricing-item-card"><span>Clássicos · 100 unidades</span>${priceInput("brig-classic", 1, brigadeiros.classicaPrices?.[1])}</label>
          <label class="pricing-item-card"><span>Premium · 50 unidades</span>${priceInput("brig-premium", 0, brigadeiros.premiumPrices?.[0])}</label>
          <label class="pricing-item-card"><span>Premium · 100 unidades</span>${priceInput("brig-premium", 1, brigadeiros.premiumPrices?.[1])}</label>
        </div>
      </section>

      <section class="pricing-section">
        <div class="pricing-section-head"><div><span class="pricing-icon">🍫</span><div><h3>Outros Itens</h3><p>Somente os valores dos itens existentes podem ser alterados.</p></div></div></div>
        <div class="pricing-grid other-items-grid">
          ${otherItems.map((item, i) => {
            const packages = Array.isArray(item.packages) ? item.packages : [];
            if (packages.length) {
              return `
                <article class="pricing-item-card pricing-item-wide">
                  <div class="item-card-name">${escapeHtml(item.name)}</div>
                  <div class="item-price-options">
                    ${packages.map((pkg, pi) => `
                      <label><span>${Number(pkg.qty || 0)} unidades</span>${priceInput("package", i, pkg.total, `data-pi="${pi}"`)}</label>
                    `).join("")}
                  </div>
                </article>`;
            }
            return `
              <article class="pricing-item-card pricing-item-wide">
                <div class="item-card-name">${escapeHtml(item.name)}</div>
                <label><span>Preço unitário</span>${priceInput("other-unit", i, item.unit)}</label>
                ${item.discountUnit != null ? `
                  <label><span>A partir de ${Number(item.discountFrom || 0)} unidades</span>${priceInput("other-discount", i, item.discountUnit)}</label>
                ` : ""}
              </article>`;
          }).join("")}
        </div>
      </section>

      <section class="pricing-section">
        <div class="pricing-section-head"><div><span class="pricing-icon">🎉</span><div><h3>Kit Festa</h3><p>Os kits são fixos. Altere somente o preço de cada kit.</p></div></div></div>
        <div class="pricing-kit-groups">
          ${[...new Set(kits.map(k => k.group || "Kit Festa"))].map(group => `
            <div class="kit-group-card">
              <div class="kit-group-title">${escapeHtml(group)}</div>
              <div class="pricing-grid">
                ${kits.map((kit, i) => kit.group === group ? `
                  <label class="pricing-item-card"><span>${escapeHtml(kit.name || kit.id)}</span>${priceInput("kit", i, kit.price)}</label>
                ` : "").join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </section>

      <div class="pricing-save-bar">
        <div><strong>Pronto para atualizar?</strong><span>Confira os valores antes de salvar.</span></div>
        <button type="button" class="btn primary" data-action="save-order-pricing">Salvar valores</button>
      </div>
    `;
  }

  async function saveOrderPricing() {
    if (!db) {
      showToast("Supabase não está conectado.", "error");
      return;
    }

    const current = state.settings?.encomendas;
    if (!current || typeof current !== "object") {
      showToast("Configuração de encomendas não encontrada.", "error");
      return;
    }

    const cfg = JSON.parse(JSON.stringify(current));

    $("[data-order-price]").forEach(input => {
      const value = Number(input.value || 0);
      const type = input.dataset.orderPrice;
      const i = Number(input.dataset.i);

      if (type === "cake") {
        const oi = Number(input.dataset.oi);
        if (cfg.cakes?.[i]?.prices) cfg.cakes[i].prices[oi] = value;
      } else if (type === "extra" && cfg.extras?.[i]) {
        cfg.extras[i][1] = value;
      } else if (type === "personalization" && cfg.personalizations?.[i]) {
        cfg.personalizations[i][1] = value;
      } else if (type === "brig-classic" && cfg.brigadeiros?.classicaPrices) {
        cfg.brigadeiros.classicaPrices[i] = value;
      } else if (type === "brig-premium" && cfg.brigadeiros?.premiumPrices) {
        cfg.brigadeiros.premiumPrices[i] = value;
      } else if (type === "package" && cfg.otherItems?.[i]?.packages?.[Number(input.dataset.pi)]) {
        cfg.otherItems[i].packages[Number(input.dataset.pi)].total = value;
      } else if (type === "other-unit" && cfg.otherItems?.[i]) {
        cfg.otherItems[i].unit = value;
      } else if (type === "other-discount" && cfg.otherItems?.[i]) {
        cfg.otherItems[i].discountUnit = value;
      } else if (type === "kit" && cfg.kits?.[i]) {
        cfg.kits[i].price = value;
      }
    });

    const button = document.querySelector('[data-action="save-order-pricing"]');
    setButtonLoading(button, true, "Salvando...");

    try {
      const { data, error } = await db.from("settings").upsert(
        { key: "encomendas", value: cfg },
        { onConflict: "key" }
      ).select().single();

      if (error) throw error;

      state.settings = {
        ...(state.settings || {}),
        encomendas: data?.value || cfg
      };
      showToast("Valores de encomendas salvos com sucesso.");
      renderCurrentView();
    } catch (error) {
      console.error("Erro ao salvar valores de encomendas:", error);
      showToast(error?.message || "Não foi possível salvar os valores.", "error");
    } finally {
      setButtonLoading(button, false);
    }
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
          renderOrderPricingView();
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
          if (state.activeView === "prod-orders") {
            showToast("Na área de Encomendas não é possível criar novos produtos.", "warning");
            return;
          }

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

        if (
          action ===
          "save-order-pricing"
        ) {
          saveOrderPricing();

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
