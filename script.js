(() => {
  "use strict";

  /* =========================================================
     MARTINS CONFEITARIA
     SCRIPT PRINCIPAL
     Compatível com o index.html + style.css atuais
  ========================================================= */

  const DEFAULTS = window.MARTINS_DEFAULTS || {};
  const CONFIG = window.MARTINS_CONFIG || {};

  let state = JSON.parse(JSON.stringify(DEFAULTS));
  let currentCategory = "";
  let cart = [];

  const CART_STORAGE_KEY = "martins_confeitaria_cart";

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
              item.name || "Produto"
            ),
            price: Number(
              item.price || 0
            ),
            quantity: Number(
              item.quantity || 1
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
    /*
      Renderiza primeiro os dados locais.
      Assim o site nunca começa vazio.
    */

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
        ) &&
        productsResult.data.length
      ) {
        state.products =
          productsResult.data.map(
            (product) => ({
              ...product
            })
          );
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

    /* =====================================================
       CATEGORIAS
    ===================================================== */

    if (!categoryList.length) {
      categories.innerHTML = "";
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

    /* =====================================================
       PRODUTOS
    ===================================================== */

    const menuProducts =
      getMenuProducts();

    if (
      !menuProducts.length
    ) {
      products.innerHTML = "";

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

          <div class="product-row">

            <strong>
              ${money(
                product.price
              )}
            </strong>

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
      "pronta-entrega",
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

    if (ready.length) {
      return ready;
    }

    /*
      Se o Supabase ainda não marcou
      produtos como pronta entrega,
      mostra até 3 produtos disponíveis.
    */

    return products
      .filter((product) => {
        const area =
          normalizeArea(
            product.area
          );

        return (
          (!area ||
            area === "cardapio") &&
          product.available !== false
        );
      })
      .slice(0, 3);
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

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name:
          product.name ||
          "Produto",
        price: Number(
          product.price || 0
        ),
        quantity: 1
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

    items.innerHTML =
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
     WHATSAPP
  ========================================================= */

  function sendOrder(form) {
    if (!cart.length) {
      return;
    }

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

    let message =
      "Olá! Gostaria de fazer um pedido na Martins Confeitaria.\n\n";

    message +=
      "*PEDIDO*\n";

    cart.forEach((item) => {
      message +=
        `${item.quantity}x ${item.name} — ${money(
          Number(item.price) *
            Number(item.quantity)
        )}\n`;
    });

    message +=
      `\n*TOTAL:* ${money(
        getCartTotal()
      )}\n`;

    message +=
      `\n*Nome:* ${customer}`;

    message +=
      `\n*WhatsApp:* ${phone}`;

    message +=
      `\n*Recebimento:* ${receiving}`;

    if (
      receiving === "Entrega" &&
      address
    ) {
      message +=
        `\n*Endereço:* ${address}`;
    }

    message +=
      `\n*Pagamento:* ${payment}`;

    if (notes) {
      message +=
        `\n*Observações:* ${notes}`;
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

    if (!whatsapp) {
      alert(
        "Número de WhatsApp não configurado."
      );

      return;
    }

    const url =
      `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        message
      )}`;

    window.open(
      url,
      "_blank",
      "noopener"
    );

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

    /* =====================================================
       ENDEREÇO
    ===================================================== */

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

    /* =====================================================
       WHATSAPP
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

    if (
      contactWa &&
      whatsapp
    ) {
      contactWa.href =
        `https://wa.me/${whatsapp}`;
    }

    /* =====================================================
       INSTAGRAM
    ===================================================== */

    if (
      instagram &&
      state.instagram
    ) {
      instagram.href =
        state.instagram;
    }

    /* =====================================================
       MAPS
    ===================================================== */

    if (
      maps &&
      state.maps
    ) {
      maps.href =
        state.maps;
    }

    /* =====================================================
       AVALIAÇÃO
    ===================================================== */

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

    /*
      Horário normal
    */

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
          threshold:0.12
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
    /* =====================================================
       ABRIR CARRINHO
    ===================================================== */

    const openCartButton =
      $("#openCart");

    if (openCartButton) {
      openCartButton.addEventListener(
        "click",
        openCart
      );
    }

    /* =====================================================
       FECHAR CARRINHO
    ===================================================== */

    const closeCartButton =
      $("#closeCart");

    if (closeCartButton) {
      closeCartButton.addEventListener(
        "click",
        closeCart
      );
    }

    /* =====================================================
       FUNDO
    ===================================================== */

    const shade =
      $("#shade");

    if (shade) {
      shade.addEventListener(
        "click",
        closeCart
      );
    }

    /* =====================================================
       LIMPAR
    ===================================================== */

    const clearCartButton =
      $("#clearCart");

    if (clearCartButton) {
      clearCartButton.addEventListener(
        "click",
        clearCart
      );
    }

    /* =====================================================
       FINALIZAR
    ===================================================== */

    const checkoutButton =
      $("#checkoutBtn");

    if (checkoutButton) {
      checkoutButton.addEventListener(
        "click",
        openCheckout
      );
    }

    /* =====================================================
       ESC
    ===================================================== */

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
