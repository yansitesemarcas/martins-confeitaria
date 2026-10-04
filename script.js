(() => {
  "use strict";

  /* =========================================================
     MARTINS CONFEITARIA
     SCRIPT COMPATÍVEL COM O index.html ATUAL
     ========================================================= */

  const DEFAULTS = window.MARTINS_DEFAULTS || {};
  const CONFIG = window.MARTINS_CONFIG || {};

  let state = JSON.parse(JSON.stringify(DEFAULTS));
  let currentCategory = "";
  let cart = [];

  /* =========================================================
     HELPERS
     ========================================================= */

  const $ = (selector) =>
    document.querySelector(selector);

  const $$ = (selector) =>
    document.querySelectorAll(selector);

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
     CARREGAR DADOS
     ========================================================= */

  async function loadData() {
    /*
      Primeiro mostra os dados locais.
      Assim o site não fica vazio enquanto
      o Supabase carrega.
    */

    render();

    const client = getSupabase();

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

      /* -----------------------------
         CONFIGURAÇÕES
      ----------------------------- */

      if (
        settingsResult &&
        settingsResult.data &&
        settingsResult.data.value
      ) {
        state = {
          ...state,
          ...settingsResult.data.value
        };
      }

      /* -----------------------------
         PRODUTOS
      ----------------------------- */

      if (
        productsResult &&
        Array.isArray(productsResult.data) &&
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
  }

  /* =========================================================
     HISTÓRIA
     ========================================================= */

  function renderAbout() {
    const about = state.about || {};

    const title = $("#aboutTitle");
    const quote = $("#aboutQuote");
    const text = $("#aboutText");

    if (title && about.title) {
      title.textContent = about.title;
    }

    if (quote && about.quote) {
      quote.textContent = about.quote;
    }

    /*
      O texto completo vem do defaults.js /
      Supabase.

      A história é convertida em parágrafos
      automaticamente.
    */

    if (
      text &&
      about.text
    ) {
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
                ${escapeHTML(paragraph)}
              </p>
            `
          )
          .join("") +
        signature;
    }
  }

  /* =========================================================
     ANO
     ========================================================= */

  function renderYear() {
    const year =
      $("#year");

    if (year) {
      year.textContent =
        new Date().getFullYear();
    }
  }

  /* =========================================================
     CATEGORIAS
     ========================================================= */

  function getCategories() {
    const products =
      Array.isArray(state.products)
        ? state.products
        : [];

    /*
      Primeiro tenta categorias configuradas
      especificamente para o cardápio.
    */

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

    /*
      Depois usa as categorias do defaults.js.
    */

    if (
      Array.isArray(state.categories) &&
      state.categories.length
    ) {
      return [
        ...state.categories
      ];
    }

    /*
      Fallback:
      cria categorias a partir dos produtos.
    */

    return [
      ...new Set(
        products
          .filter((product) => {
            return (
              !product.area ||
              product.area === "cardapio"
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
      Array.isArray(state.products)
        ? state.products
        : [];

    return products
      .filter((product) => {
        const isMenuProduct =
          !product.area ||
          product.area === "cardapio";

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
    /*
      IDs reais do index.html atual:
      #categories
      #products
    */

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

    /*
      Mantém a categoria selecionada.
    */

    if (
      !currentCategory ||
      !categoryList.includes(
        currentCategory
      )
    ) {
      currentCategory =
        categoryList[0] || "";
    }

    /* -----------------------------
       CATEGORIAS
    ----------------------------- */

    categories.innerHTML =
      categoryList
        .map((category) => {
          const active =
            category ===
            currentCategory;

          return `
            <button
              type="button"
              class="menu-category ${
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

    /* -----------------------------
       PRODUTOS
    ----------------------------- */

    const menuProducts =
      getMenuProducts();

    if (!menuProducts.length) {
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
        .map((product) => {
          const available =
            product.available !== false;

          const image =
            product.image
              ? `
                <img
                  src="${escapeHTML(
                    product.image
                  )}"
                  alt="${escapeHTML(
                    product.name ||
                    "Produto"
                  )}"
                  loading="lazy"
                >
              `
              : `
                <div class="product-placeholder">
                  <span>🧁</span>
                </div>
              `;

          const description =
            product.description ||
            "";

          return `
            <article
              class="product-card"
              data-product-id="${escapeHTML(
                product.id || ""
              )}"
            >

              <div class="product-img">
                ${image}
              </div>

              <div class="product-body">

                ${
                  product.category
                    ? `
                      <span class="product-tag">
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

                <div class="product-footer">

                  <strong class="product-price">
                    ${money(
                      product.price
                    )}
                  </strong>

                  ${
                    available
                      ? `
                        <button
                          type="button"
                          class="btn primary product-order-btn"
                          data-add-product="${
                            escapeHTML(
                              product.id || ""
                            )
                          }"
                        >
                          Adicionar
                        </button>
                      `
                      : `
                        <span class="product-unavailable">
                          Indisponível
                        </span>
                      `
                  }

                </div>

              </div>

            </article>
          `;
        })
        .join("");

    /*
      Botões de adicionar ao carrinho.
    */

    products
      .querySelectorAll(
        "[data-add-product]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const id =
              button.dataset.addProduct;

            addToCart(id);
          }
        );
      });
  }

  /* =========================================================
     PRONTA ENTREGA
     ========================================================= */

  function getReadyProducts() {
    const products =
      Array.isArray(state.products)
        ? state.products
        : [];

    /*
      Se houver produtos marcados como
      pronta entrega, usa esses.

      Caso não exista nenhum produto com
      area="pronta-entrega", mostra alguns
      produtos disponíveis do cardápio.
    */

    const ready =
      products.filter((product) => {
        return (
          product.area ===
            "pronta-entrega" &&
          product.available !== false
        );
      });

    if (ready.length) {
      return ready;
    }

    return products
      .filter((product) => {
        return (
          (!product.area ||
            product.area ===
              "cardapio") &&
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
        <div class="menu-empty">
          <p>
            Nenhum produto disponível
            no momento.
          </p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      products
        .map((product) => {
          const image =
            product.image
              ? `
                <img
                  src="${escapeHTML(
                    product.image
                  )}"
                  alt="${escapeHTML(
                    product.name ||
                    "Produto"
                  )}"
                  loading="lazy"
                >
              `
              : `
                <div class="product-placeholder">
                  <span>🧁</span>
                </div>
              `;

          return `
            <article
              class="product-card"
            >

              <div class="product-img">
                ${image}
              </div>

              <div class="product-body">

                ${
                  product.category
                    ? `
                      <span class="product-tag">
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

                <div class="product-footer">

                  <strong
                    class="product-price"
                  >
                    ${money(
                      product.price
                    )}
                  </strong>

                  <button
                    type="button"
                    class="btn primary product-order-btn"
                    data-ready-product="${
                      escapeHTML(
                        product.id || ""
                      )
                    }"
                  >
                    Adicionar
                  </button>

                </div>

              </div>

            </article>
          `;
        })
        .join("");

    container
      .querySelectorAll(
        "[data-ready-product]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            addToCart(
              button.dataset.readyProduct
            );
          }
        );
      });
  }

  /* =========================================================
     CARRINHO
     ========================================================= */

  function findProduct(id) {
    const products =
      Array.isArray(state.products)
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
      return;
    }

    if (product.available === false) {
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
        name: product.name,
        price: Number(
          product.price || 0
        ),
        quantity: 1
      });
    }

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

    renderCart();
  }

  function clearCart() {
    cart = [];
    renderCart();
  }

  function getCartCount() {
    return cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );
  }

  function getCartTotal() {
    return cart.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );
  }

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
              data-cart-item="${
                escapeHTML(
                  item.id
                )
              }"
            >

              <div class="cart-item-info">

                <strong>
                  ${escapeHTML(
                    item.name
                  )}
                </strong>

                <span>
                  ${money(
                    item.price
                  )}
                </span>

              </div>

              <div class="cart-item-actions">

                <button
                  type="button"
                  class="cart-qty-btn"
                  data-cart-minus="${
                    escapeHTML(
                      item.id
                    )
                  }"
                  aria-label="Diminuir quantidade"
                >
                  −
                </button>

                <span>
                  ${item.quantity}
                </span>

                <button
                  type="button"
                  class="cart-qty-btn"
                  data-cart-plus="${
                    escapeHTML(
                      item.id
                    )
                  }"
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>

                <button
                  type="button"
                  class="cart-remove-btn"
                  data-cart-remove="${
                    escapeHTML(
                      item.id
                    )
                  }"
                  aria-label="Remover item"
                >
                  ×
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
              button.dataset.cartMinus,
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
              button.dataset.cartPlus,
              1
            );
          }
        );
      });

    items
      .querySelectorAll(
        "[data-cart-remove]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            removeFromCart(
              button.dataset.cartRemove
            );
          }
        );
      });
  }

  /* =========================================================
     ABRIR / FECHAR CARRINHO
     ========================================================= */

  function openCart() {
    const drawer =
      $("#drawer");

    const shade =
      $("#shade");

    if (drawer) {
      drawer.classList.add(
        "open"
      );

      drawer.setAttribute(
        "aria-hidden",
        "false"
      );
    }

    if (shade) {
      shade.classList.add(
        "open"
      );

      shade.setAttribute(
        "aria-hidden",
        "false"
      );
    }

    document.body.classList.add(
      "cart-open"
    );
  }

  function closeCart() {
    const drawer =
      $("#drawer");

    const shade =
      $("#shade");

    if (drawer) {
      drawer.classList.remove(
        "open"
      );

      drawer.setAttribute(
        "aria-hidden",
        "true"
      );
    }

    if (shade) {
      shade.classList.remove(
        "open"
      );

      shade.setAttribute(
        "aria-hidden",
        "true"
      );
    }

    document.body.classList.remove(
      "cart-open"
    );
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
     FORMULÁRIO DE CHECKOUT
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
     ENVIAR PEDIDO PELO WHATSAPP
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
      "Olá! Gostaria de fazer um pedido na Martins Confeitaria.%0A%0A";

    message +=
      "*Pedido:*%0A";

    cart.forEach((item) => {
      message +=
        `${item.quantity}x ${item.name} — ${money(
          item.price *
            item.quantity
        )}%0A`;
    });

    message +=
      `%0A*Total:* ${money(
        getCartTotal()
      )}%0A`;

    message +=
      `%0A*Nome:* ${encodeURIComponent(
        customer
      )}`;

    message +=
      `%0A*WhatsApp:* ${encodeURIComponent(
        phone
      )}`;

    message +=
      `%0A*Recebimento:* ${encodeURIComponent(
        receiving
      )}`;

    if (
      receiving ===
        "Entrega" &&
      address
    ) {
      message +=
        `%0A*Endereço:* ${encodeURIComponent(
          address
        )}`;
    }

    message +=
      `%0A*Pagamento:* ${encodeURIComponent(
        payment
      )}`;

    if (notes) {
      message +=
        `%0A*Observações:* ${encodeURIComponent(
          notes
        )}`;
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
      `https://wa.me/${whatsapp}?text=${message}`;

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

    const mapFrame =
      $("#mapFrame");

    /* -----------------------------
       ENDEREÇO
    ----------------------------- */

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

    /* -----------------------------
       WHATSAPP
    ----------------------------- */

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

    /* -----------------------------
       INSTAGRAM
    ----------------------------- */

    if (
      instagram &&
      state.instagram
    ) {
      instagram.href =
        state.instagram;
    }

    /* -----------------------------
       MAPS
    ----------------------------- */

    if (
      maps &&
      state.maps
    ) {
      maps.href =
        state.maps;
    }

    /* -----------------------------
       AVALIAÇÃO
    ----------------------------- */

    if (
      review &&
      state.review
    ) {
      review.href =
        state.review;
    }

    /* -----------------------------
       MAPA EMBUTIDO
    ----------------------------- */

    if (
      mapFrame &&
      state.maps
    ) {
      /*
        Mantém o mapa atual do HTML.
        Não substituímos por um link
        externo para não quebrar o iframe.
      */
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

    if (
      !hoursContainer
    ) {
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
            <div class="hours-row">
              <span>
                ${dayNames[index] ||
                  ""}
              </span>

              <strong>
                ${escapeHTML(
                  value
                )}
              </strong>
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
        current.o
      )
        .split(":")
        .map(Number);

    const [closeHour, closeMinute] =
      String(
        current.c
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
    } else {
      element.textContent =
        "🔴 Fechado agora";
    }
  }

  /* =========================================================
     EVENTOS DO SITE
     ========================================================= */

  function setupEvents() {
    /* -----------------------------
       ABRIR CARRINHO
    ----------------------------- */

    const openCartButton =
      $("#openCart");

    if (openCartButton) {
      openCartButton.addEventListener(
        "click",
        openCart
      );
    }

    /* -----------------------------
       FECHAR CARRINHO
    ----------------------------- */

    const closeCartButton =
      $("#closeCart");

    if (closeCartButton) {
      closeCartButton.addEventListener(
        "click",
        closeCart
      );
    }

    /* -----------------------------
       CLICAR NO FUNDO
    ----------------------------- */

    const shade =
      $("#shade");

    if (shade) {
      shade.addEventListener(
        "click",
        closeCart
      );
    }

    /* -----------------------------
       LIMPAR CARRINHO
    ----------------------------- */

    const clearCartButton =
      $("#clearCart");

    if (clearCartButton) {
      clearCartButton.addEventListener(
        "click",
        clearCart
      );
    }

    /* -----------------------------
       FINALIZAR
    ----------------------------- */

    const checkoutButton =
      $("#checkoutBtn");

    if (checkoutButton) {
      checkoutButton.addEventListener(
        "click",
        openCheckout
      );
    }

    /* -----------------------------
       ESC
    ----------------------------- */

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
