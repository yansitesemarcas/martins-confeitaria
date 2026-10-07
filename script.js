(() => {
  "use strict";

  /* =========================================================
     MARTINS CONFEITARIA
     SCRIPT PRINCIPAL
     Compatível com o index.html + style.css atuais

     ATUALIZAÇÃO:
     - Pedidos de PRONTA ENTREGA são gravados em "orders"
     - Encomendas continuam sendo gravadas em "custom_cakes"
       pelo encomendas.html
  ========================================================= */

  const DEFAULTS = window.MARTINS_DEFAULTS || {};
  const CONFIG = window.MARTINS_CONFIG || {};

  let state = JSON.parse(
    JSON.stringify(DEFAULTS)
  );

  let currentCategory = "";
  let cart = [];

  const CART_STORAGE_KEY =
    "martins_confeitaria_cart";

  /* =========================================================
     HELPERS
  ========================================================= */

  const $ = (selector) =>
    document.querySelector(selector);

  const money = (value) => {
    const number = Number(value || 0);

    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  const escapeHTML = (value) => {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char])
    );
  };

  const getProductImage = (product) => {
    return (
      product?.image ||
      product?.image_url ||
      product?.photo ||
      product?.photo_url ||
      product?.imagem ||
      product?.foto ||
      ""
    );
  };

  const normalizeArea = (area) => {
    return String(area || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/\s+/g, "-");
  };

  /* =========================================================
     DESCONTO / PREÇO FINAL
  ========================================================= */

  function getDiscountPercent(product) {
    const value = Number(
      product?.discount_percent || 0
    );

    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(100, value)
    );
  }

  function getProductFinalPrice(product) {
    const price =
      Number(product?.price || 0);

    const discount =
      getDiscountPercent(product);

    return (
      price *
      (1 - discount / 100)
    );
  }

  /* =========================================================
     INFORMAÇÕES DO PRODUTO
  ========================================================= */

  function getProductMeta(product) {
    const parts = [];

    if (
      product?.gramatura !== null &&
      product?.gramatura !== undefined &&
      product?.gramatura !== ""
    ) {
      const grams =
        Number(product.gramatura);

      if (
        Number.isFinite(grams) &&
        grams > 0
      ) {
        parts.push(
          `${grams} g`
        );
      }
    }

    if (
      product?.serve_ate !== null &&
      product?.serve_ate !== undefined &&
      product?.serve_ate !== ""
    ) {
      const people =
        Math.round(
          Number(product.serve_ate)
        );

      if (
        Number.isFinite(people) &&
        people > 0
      ) {
        parts.push(
          `Serve até ${people} ${
            people === 1
              ? "pessoa"
              : "pessoas"
          }`
        );
      }
    }

    return parts;
  }

  /* =========================================================
     SUPABASE
  ========================================================= */

  function getSupabase() {
    if (
      !window.supabase ||
      !CONFIG.SUPABASE_URL ||
      !CONFIG.SUPABASE_ANON_KEY
    ) {
      return null;
    }

    try {
      return window.supabase.createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_ANON_KEY
      );
    } catch (error) {
      console.warn(
        "Erro ao iniciar o Supabase:",
        error
      );

      return null;
    }
  }

  /* =========================================================
     LOCAL STORAGE
  ========================================================= */

  function loadCart() {
    try {
      const saved =
        localStorage.getItem(
          CART_STORAGE_KEY
        );

      if (!saved) {
        cart = [];
        return;
      }

      const parsed =
        JSON.parse(saved);

      if (Array.isArray(parsed)) {
        cart = parsed
          .filter(
            (item) =>
              item &&
              item.id &&
              Number(item.quantity) > 0
          )
          .map((item) => ({
            id: item.id,

            name: String(
              item.name ||
                "Produto"
            ),

            price: Number(
              item.price || 0
            ),

            quantity: Number(
              item.quantity || 1
            ),

            appointment_required:
              Boolean(
                item.appointment_required
              )
          }));
      }
    } catch (error) {
      console.warn(
        "Não foi possível carregar o carrinho:",
        error
      );

      cart = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch (error) {
      console.warn(
        "Não foi possível salvar o carrinho:",
        error
      );
    }
  }

  /* =========================================================
     CARREGAR DADOS
  ========================================================= */

  async function loadData() {

    render();

    const client =
      getSupabase();

    if (!client) {
      return;
    }

    try {

      const [
        settingsResult,
        productsResult
      ] = await Promise.all([

        client
          .from("settings")
          .select("value")
          .eq("key", "site")
          .maybeSingle(),

        client
          .from("products")
          .select("*")
          .order("sort", {
            ascending: true
          })

      ]);

      /* =====================================================
         SETTINGS
      ===================================================== */

      if (
        settingsResult &&
        settingsResult.data &&
        settingsResult.data.value
      ) {

        const remote =
          settingsResult.data.value;

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

      /* =====================================================
         PRODUTOS
      ===================================================== */

      if (
        productsResult &&
        Array.isArray(
          productsResult.data
        )
      ) {

        state.products =
          productsResult.data.map(
            (product) => ({
              ...product
            })
          );

      } else {

        state.products = [];

      }

    } catch (error) {

      console.warn(
        "Não foi possível carregar os dados do Supabase:",
        error
      );

    }

    render();

  }

  /* =========================================================
     RENDER GERAL
  ========================================================= */

  function render() {

    renderAbout();
    renderContact();
    renderHours();
    renderMenu();
    renderReadyProducts();
    renderYear();
    renderCart();
    setupReveal();

  }

  /* =========================================================
     HISTÓRIA
  ========================================================= */

  function renderAbout() {

    const about =
      state.about || {};

    const title =
      $("#aboutTitle");

    const quote =
      $("#aboutQuote");

    const text =
      $("#aboutText");

    if (
      title &&
      about.title
    ) {
      title.textContent =
        about.title;
    }

    if (
      quote &&
      about.quote
    ) {
      quote.textContent =
        about.quote;
    }

    if (
      !text ||
      !about.text
    ) {
      return;
    }

    const paragraphs =
      String(about.text)
        .split(/\n\s*\n/)
        .map((paragraph) =>
          paragraph.trim()
        )
        .filter(Boolean);

    const signature = `
      <div class="about-signature">

        <span>
          🩵 Feito com carinho, sabor e muitos sonhos
        </span>

        <strong>
          👨‍🍳 Chef Denilson Martins ✨
        </strong>

        <small>
          O coração por trás de cada doce da
          Martins Confeitaria.
        </small>

      </div>
    `;

    text.innerHTML =
      paragraphs
        .map(
          (paragraph) => `
            <p>
              ${escapeHTML(
                paragraph
              )}
            </p>
          `
        )
        .join("") +
      signature;

  }

  /* =========================================================
     ANO
  ========================================================= */

  function renderYear() {

    const year =
      $("#year");

    if (year) {

      year.textContent =
        new Date()
          .getFullYear();

    }

  }

  /* =========================================================
     CATEGORIAS
  ========================================================= */

  function getCategories() {

    const products =
      Array.isArray(
        state.products
      )
        ? state.products
        : [];

    if (
      state.categoriesByArea &&
      Array.isArray(
        state.categoriesByArea.cardapio
      ) &&
      state.categoriesByArea.cardapio.length
    ) {

      return [
        ...state.categoriesByArea.cardapio
      ];

    }

    if (
      Array.isArray(
        state.categories
      ) &&
      state.categories.length
    ) {

      return [
        ...state.categories
      ];

    }

    return [
      ...new Set(
        products
          .filter((product) => {

            const area =
              normalizeArea(
                product.area
              );

            return (
              !area ||
              area === "cardapio"
            );

          })
          .map(
            (product) =>
              product.category
          )
          .filter(Boolean)
      )
    ];

  }

  /* =========================================================
     PRODUTOS DO CARDÁPIO
  ========================================================= */

  function getMenuProducts() {

    const products =
      Array.isArray(
        state.products
      )
        ? state.products
        : [];

    return products
      .filter((product) => {

        const area =
          normalizeArea(
            product.area
          );

        const isMenuProduct =
          !area ||
          area === "cardapio";

        const sameCategory =
          !currentCategory ||
          product.category ===
            currentCategory;

        return (
          isMenuProduct &&
          sameCategory
        );

      })
      .sort((a, b) => {

        return (
          Number(a.sort || 0) -
          Number(b.sort || 0)
        );

      });

  }

  /* =========================================================
     CARDÁPIO
  ========================================================= */

  function renderMenu() {

    const categories =
      $("#categories");

    const products =
      $("#products");

    const emptyMenu =
      $("#emptyMenu");

    if (
      !categories ||
      !products
    ) {
      return;
    }

    const categoryList =
      getCategories();

    if (
      !currentCategory ||
      !categoryList.includes(
        currentCategory
      )
    ) {

      currentCategory =
        categoryList[0] || "";

    }

    if (!categoryList.length) {

      categories.innerHTML =
        "";

    } else {

      categories.innerHTML =
        categoryList
          .map((category) => {

            const active =
              category ===
              currentCategory;

            return `
              <button
                type="button"
                class="tab ${
                  active
                    ? "active"
                    : ""
                }"
                data-category="${escapeHTML(
                  category
                )}"
                role="tab"
                aria-selected="${
                  active
                }"
              >
                ${escapeHTML(
                  category
                )}
              </button>
            `;

          })
          .join("");

    }

    categories
      .querySelectorAll(
        "[data-category]"
      )
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            currentCategory =
              button.dataset.category ||
              "";

            renderMenu();

          }
        );

      });

    const menuProducts =
      getMenuProducts();

    if (
      !menuProducts.length
    ) {

      products.innerHTML =
        "";

      if (emptyMenu) {

        emptyMenu.classList.remove(
          "hidden"
        );

      }

      return;
    }

    if (emptyMenu) {

      emptyMenu.classList.add(
        "hidden"
      );

    }

    products.innerHTML =
      menuProducts
        .map((product) =>
          createProductCard(
            product
          )
        )
        .join("");

    bindProductButtons(
      products
    );

  }

  /* =========================================================
     CARD DE PRODUTO
  ========================================================= */

  function createProductCard(
    product,
    ready = false
  ) {

    const available =
      product.available !== false;

    const image =
      getProductImage(
        product
      );

    const imageHTML =
      image
        ? `
          <img
            src="${escapeHTML(
              image
            )}"
            alt="${escapeHTML(
              product.name ||
                "Produto"
            )}"
            loading="lazy"
          >
        `
        : `
          <span>
            🧁
          </span>
        `;

    const description =
      product.description ||
      "";

    const buttonClass =
      ready
        ? "add-ready"
        : "add";

    const originalPrice =
      Number(
        product.price || 0
      );

    const discount =
      getDiscountPercent(
        product
      );

    const finalPrice =
      getProductFinalPrice(
        product
      );

    const meta =
      getProductMeta(
        product
      );

    const metaHTML =
      meta.length
        ? `
          <div class="product-meta">

            ${meta
              .map(
                (item) => `
                  <span>
                    ${escapeHTML(
                      item
                    )}
                  </span>
                `
              )
              .join("")}

          </div>
        `
        : "";

    const discountHTML =
      discount > 0
        ? `
          <div class="product-discount">

            <span class="old-price">
              ${money(
                originalPrice
              )}
            </span>

            <span class="discount-badge">
              ${discount}% OFF
            </span>

          </div>
        `
        : "";

    const appointmentHTML =
      product.appointment_required
        ? `
          <div class="appointment-required">
            📅 Agendamento obrigatório
          </div>
        `
        : "";

    return `
      <article
        class="product"
        data-product-id="${escapeHTML(
          product.id || ""
        )}"
      >

        <div class="product-img">
          ${imageHTML}
        </div>

        <div class="product-body">

          ${
            product.category
              ? `
                <span class="tag">
                  ${escapeHTML(
                    product.category
                  )}
                </span>
              `
              : ""
          }

          <h3>
            ${escapeHTML(
              product.name ||
                "Produto"
            )}
          </h3>

          ${
            description
              ? `
                <p>
                  ${escapeHTML(
                    description
                  )}
                </p>
              `
              : ""
          }

          ${metaHTML}

          ${appointmentHTML}

          <div class="product-row">

            <div class="product-price">

              ${discountHTML}

              <strong>
                ${money(
                  finalPrice
                )}
              </strong>

            </div>

            ${
              available
                ? `
                  <button
                    type="button"
                    class="${buttonClass}"
                    data-add-product="${escapeHTML(
                      product.id || ""
                    )}"
                  >
                    Adicionar
                  </button>
                `
                : `
                  <span class="unavailable">
                    Indisponível
                  </span>
                `
            }

          </div>

        </div>

      </article>
    `;

  }

  function bindProductButtons(
    container
  ) {

    if (!container) {
      return;
    }

    container
      .querySelectorAll(
        "[data-add-product]"
      )
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            addToCart(
              button.dataset
                .addProduct
            );

          }
        );

      });

  }

  /* =========================================================
     PRONTA ENTREGA
  ========================================================= */

  function getReadyProducts() {

    const products =
      Array.isArray(
        state.products
      )
        ? state.products
        : [];

    const readyAreas = [
      "pronta-entrega",
      "pronta",
      "ready",
      "delivery"
    ];

    const ready =
      products.filter(
        (product) => {

          const area =
            normalizeArea(
              product.area
            );

          return (
            readyAreas.includes(
              area
            ) &&
            product.available !== false
          );

        }
      );

    return ready;

  }

  function renderReadyProducts() {

    const container =
      $("#readyProducts");

    if (!container) {
      return;
    }

    const products =
      getReadyProducts();

    if (!products.length) {

      container.innerHTML = `
        <div class="empty">
          Nenhum produto disponível
          no momento.
        </div>
      `;

      return;
    }

    container.innerHTML =
      products
        .map((product) =>
          createProductCard(
            product,
            true
          )
        )
        .join("");

    bindProductButtons(
      container
    );

  }

  /* =========================================================
     PRODUTOS / CARRINHO
  ========================================================= */

  function findProduct(id) {

    const products =
      Array.isArray(
        state.products
      )
        ? state.products
        : [];

    return products.find(
      (product) =>
        String(product.id) ===
        String(id)
    );

  }

  function addToCart(id) {

    const product =
      findProduct(id);

    if (!product) {

      console.warn(
        "Produto não encontrado:",
        id
      );

      return;
    }

    if (
      product.available === false
    ) {
      return;
    }

    const existing =
      cart.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    const finalPrice =
      getProductFinalPrice(
        product
      );

    if (existing) {

      existing.quantity += 1;

      existing.price =
        finalPrice;

      existing.appointment_required =
        Boolean(
          product.appointment_required
        );

    } else {

      cart.push({

        id:
          product.id,

        name:
          product.name ||
          "Produto",

        price:
          finalPrice,

        quantity:
          1,

        appointment_required:
          Boolean(
            product.appointment_required
          )

      });

    }

    saveCart();
    renderCart();
    openCart();

  }

  function removeFromCart(id) {

    cart =
      cart.filter(
        (item) =>
          String(item.id) !==
          String(id)
      );

    saveCart();
    renderCart();

  }

  function changeQuantity(
    id,
    amount
  ) {

    const item =
      cart.find(
        (product) =>
          String(product.id) ===
          String(id)
      );

    if (!item) {
      return;
    }

    item.quantity += amount;

    if (item.quantity <= 0) {

      removeFromCart(id);

      return;
    }

    saveCart();
    renderCart();

  }

  function clearCart() {

    cart = [];

    saveCart();
    renderCart();

  }

  function getCartCount() {

    return cart.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );

  }

  function getCartTotal() {

    return cart.reduce(
      (total, item) =>
        total +
        Number(
          item.price || 0
        ) *
          Number(
            item.quantity || 0
          ),
      0
    );

  }

  function cartRequiresAppointment() {

    return cart.some(
      (item) =>
        item.appointment_required
    );

  }

  /* =========================================================
     RENDER CARRINHO
  ========================================================= */

  function renderCart() {

    const count =
      $("#cartCount");

    const items =
      $("#cartItems");

    const total =
      $("#cartTotal");

    const checkoutBtn =
      $("#checkoutBtn");

    if (count) {

      count.textContent =
        getCartCount();

    }

    if (total) {

      total.textContent =
        money(
          getCartTotal()
        );

    }

    if (checkoutBtn) {

      checkoutBtn.disabled =
        cart.length === 0;

    }

    if (!items) {
      return;
    }

    if (!cart.length) {

      items.innerHTML = `
        <div class="empty">
          Seu carrinho está vazio.
        </div>
      `;

      return;
    }

    const appointmentNotice =
      cartRequiresAppointment()
        ? `
          <div class="cart-appointment-notice">
            📅 Este pedido possui produto com
            agendamento obrigatório.
          </div>
        `
        : "";

    items.innerHTML =
      appointmentNotice +

      cart
        .map(
          (item) => `
            <div
              class="cart-item"
              data-cart-item="${escapeHTML(
                item.id
              )}"
            >

              <div>

                <b>
                  ${escapeHTML(
                    item.name
                  )}
                </b>

                <small>
                  ${money(
                    item.price
                  )}
                  cada
                </small>

              </div>

              <div class="qty">

                <button
                  type="button"
                  data-cart-minus="${escapeHTML(
                    item.id
                  )}"
                  aria-label="Diminuir quantidade"
                >
                  −
                </button>

                <span>
                  ${item.quantity}
                </span>

                <button
                  type="button"
                  data-cart-plus="${escapeHTML(
                    item.id
                  )}"
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>

              </div>

            </div>
          `
        )
        .join("");

    items
      .querySelectorAll(
        "[data-cart-minus]"
      )
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            changeQuantity(
              button.dataset
                .cartMinus,
              -1
            );

          }
        );

      });

    items
      .querySelectorAll(
        "[data-cart-plus]"
      )
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            changeQuantity(
              button.dataset
                .cartPlus,
              1
            );

          }
        );

      });

  }

  /* =========================================================
     ABRIR CARRINHO
  ========================================================= */

  function openCart() {

    const drawer =
      $("#drawer");

    const shade =
      $("#shade");

    if (drawer) {

      drawer.classList.add(
        "show"
      );

      drawer.setAttribute(
        "aria-hidden",
        "false"
      );

    }

    if (shade) {

      shade.classList.add(
        "show"
      );

      shade.setAttribute(
        "aria-hidden",
        "false"
      );

    }

    document.body.style.overflow =
      "hidden";

  }

  /* =========================================================
     FECHAR CARRINHO
  ========================================================= */

  function closeCart() {

    const drawer =
      $("#drawer");

    const shade =
      $("#shade");

    if (drawer) {

      drawer.classList.remove(
        "show"
      );

      drawer.setAttribute(
        "aria-hidden",
        "true"
      );

    }

    if (shade) {

      shade.classList.remove(
        "show"
      );

      shade.setAttribute(
        "aria-hidden",
        "true"
      );

    }

    document.body.style.overflow =
      "";

  }

  /* =========================================================
     CHECKOUT
  ========================================================= */

  function openCheckout() {

    if (!cart.length) {
      return;
    }

    const checkout =
      $("#checkout");

    if (!checkout) {
      return;
    }

    closeCart();

    if (
      typeof checkout.showModal ===
      "function"
    ) {

      checkout.showModal();

    } else {

      checkout.setAttribute(
        "open",
        ""
      );

    }

  }

  function closeCheckout() {

    const checkout =
      $("#checkout");

    if (!checkout) {
      return;
    }

    if (
      typeof checkout.close ===
      "function"
    ) {

      checkout.close();

    } else {

      checkout.removeAttribute(
        "open"
      );

    }

  }

  /* =========================================================
     FORMULÁRIO
  ========================================================= */

  function setupCheckoutForm() {

    const form =
      $("#checkoutForm");

    if (!form) {
      return;
    }

    const receiving =
      form.elements.receiving;

    const addressWrap =
      $("#addressWrap");

    if (receiving) {

      receiving.addEventListener(
        "change",
        () => {

          if (!addressWrap) {
            return;
          }

          if (
            receiving.value ===
            "Entrega"
          ) {

            addressWrap.classList.remove(
              "hidden"
            );

          } else {

            addressWrap.classList.add(
              "hidden"
            );

          }

        }
      );

    }

    form.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        sendOrder(form);

      }
    );

  }

  /* =========================================================
     MONTAR DADOS DO PEDIDO
  ========================================================= */

  function buildReadyOrderData(form) {

    const formData =
      new FormData(form);

    const customer =
      String(
        formData.get(
          "customer"
        ) || ""
      ).trim();

    const phone =
      String(
        formData.get(
          "phone"
        ) || ""
      ).trim();

    const receiving =
      String(
        formData.get(
          "receiving"
        ) || ""
      ).trim();

    const address =
      String(
        formData.get(
          "address"
        ) || ""
      ).trim();

    const payment =
      String(
        formData.get(
          "payment"
        ) || ""
      ).trim();

    const notes =
      String(
        formData.get(
          "notes"
        ) || ""
      ).trim();

    const items =
      cart.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: Number(
          item.quantity || 0
        ),
        unit_price: Number(
          item.price || 0
        ),
        total: Number(
          item.price || 0
        ) *
          Number(
            item.quantity || 0
          ),
        appointment_required:
          Boolean(
            item.appointment_required
          )
      }));

    return {
      tipo: "pronta_entrega",

      cliente: customer,

      whatsapp: phone,

      recebimento: receiving,

      endereco:
        receiving === "Entrega"
          ? address
          : "",

      pagamento: payment,

      observacoes: notes,

      itens: items,

      total: Number(
        getCartTotal()
          .toFixed(2)
      ),

      criado_em:
        new Date().toISOString()
    };

  }

  /* =========================================================
     SALVAR PEDIDO DE PRONTA ENTREGA
  ========================================================= */

  async function saveReadyOrder(
    orderData
  ) {

    const client =
      getSupabase();

    if (!client) {

      console.warn(
        "Supabase não disponível. Pedido não foi salvo no banco."
      );

      return {
        success: false,
        reason: "no-client"
      };

    }

    try {

      const payload = {
        data: orderData,
        status: "novo"
      };

      const result =
        await client
          .from("orders")
          .insert(payload)
          .select()
          .maybeSingle();

      if (result.error) {

        console.warn(
          "Não foi possível salvar o pedido de pronta entrega:",
          result.error
        );

        return {
          success: false,
          reason: "supabase-error",
          error: result.error
        };

      }

      return {
        success: true,
        data: result.data
      };

    } catch (error) {

      console.warn(
        "Erro ao registrar pedido:",
        error
      );

      return {
        success: false,
        reason: "exception",
        error
      };

    }

  }

  /* =========================================================
     WHATSAPP
  ========================================================= */

  async function sendOrder(form) {

    if (!cart.length) {
      return;
    }

    const orderData =
      buildReadyOrderData(
        form
      );

    const {
      cliente,
      whatsapp: customerPhone,
      recebimento,
      endereco,
      pagamento,
      observacoes
    } = orderData;

    let message =
      "Olá! Gostaria de fazer um pedido na Martins Confeitaria.\n\n";

    message +=
      "*PEDIDO*\n";

    orderData.itens.forEach(
      (item) => {

        message +=
          `${item.quantity}x ${item.name} — ${money(
            item.total
          )}`;

        if (
          item.appointment_required
        ) {

          message +=
            " — *AGENDAMENTO OBRIGATÓRIO*";

        }

        message += "\n";

      }
    );

    message +=
      `\n*TOTAL:* ${money(
        orderData.total
      )}\n`;

    if (
      cartRequiresAppointment()
    ) {

      message +=
        "\n📅 *ATENÇÃO:* Este pedido possui produto com agendamento obrigatório.\n";

    }

    message +=
      `\n*Nome:* ${cliente}`;

    message +=
      `\n*WhatsApp:* ${customerPhone}`;

    message +=
      `\n*Recebimento:* ${recebimento}`;

    if (
      recebimento === "Entrega" &&
      endereco
    ) {

      message +=
        `\n*Endereço:* ${endereco}`;

    }

    message +=
      `\n*Pagamento:* ${pagamento}`;

    if (observacoes) {

      message +=
        `\n*Observações:* ${observacoes}`;

    }

    /* =====================================================
       WHATSAPP DA MARTINS
    ===================================================== */

    const whatsapp =
      String(
        state.whatsapp ||
        DEFAULTS.whatsapp ||
        ""
      ).replace(
        /\D/g,
        ""
      );

    if (!whatsapp) {

      alert(
        "Número de WhatsApp não configurado."
      );

      return;
    }

    /* =====================================================
       SALVAR NO SUPABASE

       O pedido é salvo antes de abrir
       o WhatsApp.

       Mesmo que o banco apresente erro,
       o pedido continua sendo enviado
       pelo WhatsApp.
    ===================================================== */

    await saveReadyOrder(
      orderData
    );

    /* =====================================================
       ABRIR WHATSAPP
    ===================================================== */

    const url =
      `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        message
      )}`;

    window.open(
      url,
      "_blank",
      "noopener"
    );

    /* =====================================================
       LIMPAR PEDIDO
    ===================================================== */

    clearCart();

    form.reset();

    const addressWrap =
      $("#addressWrap");

    if (addressWrap) {

      addressWrap.classList.add(
        "hidden"
      );

    }

    closeCheckout();

  }

  /* =========================================================
     CONTATO
  ========================================================= */

  function renderContact() {

    const address =
      $("#address");

    const contactWa =
      $("#contactWa");

    const instagram =
      $("#instagram");

    const maps =
      $("#maps");

    const review =
      $("#review");

    if (
      address &&
      Array.isArray(
        state.address
      )
    ) {

      address.innerHTML =
        state.address
          .map(
            (line) =>
              escapeHTML(line)
          )
          .join("<br>");

    }

    const whatsapp =
      String(
        state.whatsapp ||
        DEFAULTS.whatsapp ||
        ""
      ).replace(
        /\D/g,
        ""
      );

    if (
      contactWa &&
      whatsapp
    ) {

      contactWa.href =
        `https://wa.me/${whatsapp}`;

    }

    if (
      instagram &&
      state.instagram
    ) {

      instagram.href =
        state.instagram;

    }

    if (
      maps &&
      state.maps
    ) {

      maps.href =
        state.maps;

    }

    if (
      review &&
      state.review
    ) {

      review.href =
        state.review;

    }

  }

  /* =========================================================
     HORÁRIOS
  ========================================================= */

  function renderHours() {

    const hoursContainer =
      $("#hours");

    const openState =
      $("#openState");

    if (!hoursContainer) {
      return;
    }

    const hours =
      Array.isArray(
        state.hours
      )
        ? state.hours
        : [];

    const dayNames = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado"
    ];

    if (!hours.length) {

      hoursContainer.innerHTML =
        "";

      if (openState) {

        openState.textContent =
          "Consulte nossos horários.";

      }

      return;
    }

    hoursContainer.innerHTML =
      hours
        .map((day, index) => {

          let value =
            "Horário não informado";

          if (
            day &&
            day.s === "closed"
          ) {

            value =
              "Fechado";

          } else if (
            day &&
            day.s === "open"
          ) {

            value =
              `${day.o} às ${day.c}`;

          } else if (
            day &&
            day.s === "tbd"
          ) {

            value =
              "A confirmar";

          }

          return `
            <div class="hour">

              <span>
                ${escapeHTML(
                  dayNames[index] ||
                    ""
                )}
              </span>

              <b>
                ${escapeHTML(
                  value
                )}
              </b>

            </div>
          `;

        })
        .join("");

    updateOpenState(
      hours,
      openState
    );

  }

  function updateOpenState(
    hours,
    element
  ) {

    if (!element) {
      return;
    }

    const now =
      new Date();

    const day =
      now.getDay();

    const current =
      hours[day];

    element.classList.remove(
      "is-open"
    );

    if (
      !current ||
      current.s ===
        "closed"
    ) {

      element.textContent =
        "🔴 Fechado agora";

      return;
    }

    if (
      current.s ===
      "tbd"
    ) {

      element.textContent =
        "🟡 Horário a confirmar";

      return;
    }

    if (
      current.s !==
      "open"
    ) {

      element.textContent =
        "🟡 Horário não informado";

      return;
    }

    const currentMinutes =
      now.getHours() * 60 +
      now.getMinutes();

    const [openHour, openMinute] =
      String(
        current.o || "00:00"
      )
        .split(":")
        .map(Number);

    const [closeHour, closeMinute] =
      String(
        current.c || "00:00"
      )
        .split(":")
        .map(Number);

    const openMinutes =
      openHour * 60 +
      openMinute;

    const closeMinutes =
      closeHour * 60 +
      closeMinute;

    if (
      currentMinutes >=
        openMinutes &&
      currentMinutes <=
        closeMinutes
    ) {

      element.textContent =
        "🟢 Aberto agora";

      element.classList.add(
        "is-open"
      );

    } else {

      element.textContent =
        "🔴 Fechado agora";

    }

  }

  /* =========================================================
     ANIMAÇÕES REVEAL
  ========================================================= */

  function setupReveal() {

    const elements =
      document.querySelectorAll(
        ".reveal"
      );

    if (!elements.length) {
      return;
    }

    if (
      !("IntersectionObserver" in window)
    ) {

      elements.forEach(
        (element) => {

          element.classList.add(
            "visible"
          );

        }
      );

      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {

          entries.forEach(
            (entry) => {

              if (
                entry.isIntersecting
              ) {

                entry.target.classList.add(
                  "visible"
                );

                observer.unobserve(
                  entry.target
                );

              }

            }
          );

        },
        {
          threshold: 0.12
        }
      );

    elements.forEach(
      (element) => {

        if (
          !element.classList.contains(
            "visible"
          )
        ) {

          observer.observe(
            element
          );

        }

      }
    );

  }

  /* =========================================================
     EVENTOS
  ========================================================= */

  function setupEvents() {

    const openCartButton =
      $("#openCart");

    if (openCartButton) {

      openCartButton.addEventListener(
        "click",
        openCart
      );

    }

    const closeCartButton =
      $("#closeCart");

    if (closeCartButton) {

      closeCartButton.addEventListener(
        "click",
        closeCart
      );

    }

    const shade =
      $("#shade");

    if (shade) {

      shade.addEventListener(
        "click",
        closeCart
      );

    }

    const clearCartButton =
      $("#clearCart");

    if (clearCartButton) {

      clearCartButton.addEventListener(
        "click",
        clearCart
      );

    }

    const checkoutButton =
      $("#checkoutBtn");

    if (checkoutButton) {

      checkoutButton.addEventListener(
        "click",
        openCheckout
      );

    }

    document.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key ===
          "Escape"
        ) {

          closeCart();

        }

      }
    );

  }

  /* =========================================================
     PROTEÇÃO CONTRA ERROS
  ========================================================= */

  window.addEventListener(
    "error",
    (event) => {

      console.warn(
        "Erro no site:",
        event.error ||
          event.message
      );

    }
  );

  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  function init() {

    loadCart();

    setupEvents();

    setupCheckoutForm();

    render();

    loadData();

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
