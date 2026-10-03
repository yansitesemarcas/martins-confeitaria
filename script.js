(() => {
  "use strict";

  const D = window.MARTINS_DEFAULTS || {};
  const C = window.MARTINS_CONFIG || {};

  let S = structuredClone(D);

  let cart = [];

  try {
    cart = JSON.parse(
      localStorage.getItem("martins_cart") || "[]"
    );
  } catch {
    cart = [];
  }

  const $ = (selector) =>
    document.querySelector(selector);

  const $$ = (selector) =>
    [...document.querySelectorAll(selector)];

  const money = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[char])
    );

  const wa = (text) =>
    "https://wa.me/" +
    String(S.whatsapp || "") +
    "?text=" +
    encodeURIComponent(text);

  /* =====================================================
     SUPABASE
     ===================================================== */

  const getSupabase = () => {
    if (
      !window.supabase ||
      !C.SUPABASE_URL ||
      !C.SUPABASE_ANON_KEY
    ) {
      return null;
    }

    try {
      return window.supabase.createClient(
        C.SUPABASE_URL,
        C.SUPABASE_ANON_KEY
      );
    } catch (error) {
      console.warn(
        "Não foi possível iniciar o Supabase:",
        error
      );

      return null;
    }
  };

  /* =====================================================
     CARREGAMENTO
     ===================================================== */

  async function load() {
    /*
      Primeiro renderiza os dados padrão.
      Assim o site nunca fica vazio enquanto
      o Supabase está carregando.
    */
    render();

    const client = getSupabase();

    if (!client) {
      return;
    }

    try {
      const [settingsResult, productsResult] =
        await Promise.all([
          client
            .from("settings")
            .select("value")
            .eq("key", "site")
            .maybeSingle(),

          client
            .from("products")
            .select("*")
            .order("sort")
        ]);

      /*
        Configurações do site
      */
      if (settingsResult?.data?.value) {
        S = {
          ...S,
          ...settingsResult.data.value
        };
      }

      /*
        Produtos
      */
      if (
        Array.isArray(productsResult?.data)
      ) {
        S.products =
          productsResult.data.map((product) => ({
            ...product
          }));
      }

    } catch (error) {
      console.warn(
        "Erro ao carregar dados do Supabase:",
        error
      );
    }

    /*
      Renderiza novamente com os dados
      vindos do banco.
    */
    render();
  }

  /* =====================================================
     RENDER PRINCIPAL
     ===================================================== */

  function render() {
    renderBasicInfo();
    renderStory();
    renderMaps();
    renderHours();
    renderMenu();
    renderReady();
    renderCake();
    renderCart();
    currentStatus();
  }

  /* =====================================================
     INFORMAÇÕES BÁSICAS
     ===================================================== */

  function renderBasicInfo() {
    const contactWa = $("#contactWa");

    if (contactWa) {
      contactWa.href = wa(
        "Olá! Vim pelo site da Martins Confeitaria e gostaria de fazer um pedido."
      );
    }

    const instagram = $("#instagram");

    if (instagram) {
      instagram.href = S.instagram || "#";
    }

    const year = $("#year");

    if (year) {
      year.textContent =
        new Date().getFullYear();
    }

    const address = $("#address");

    if (address) {
      address.innerHTML = (
        Array.isArray(S.address)
          ? S.address
          : []
      )
        .map(esc)
        .join("<br>");
    }

    const delivery = $("#delivery");

    if (delivery) {
      delivery.textContent = [
        ...(S.delivery || []),
        S.deliveryInfo
      ]
        .filter(Boolean)
        .join(" • ");
    }
  }

  /* =====================================================
     HISTÓRIA
     ===================================================== */

  function renderStory() {
    const title = $("#aboutTitle");
    const quote = $("#aboutQuote");
    const aboutText = $("#aboutText");

    if (title) {
      title.textContent =
        S.about?.title ||
        "✨ De um sonho na calçada para a realização de um grande sonho 🤍";
    }

    if (quote) {
      quote.textContent =
        "“" +
        String(
          S.about?.quote ||
          "Por uma vida mais doce e feliz."
        ) +
        "”";
    }

    if (!aboutText) {
      return;
    }

    const story = String(
      S.about?.text || ""
    );

    const paragraphs = story
      .split(/\n\n+/)
      .filter(Boolean)
      .map((paragraph) => {
        return (
          "<p>" +
          esc(paragraph).replace(
            /\n/g,
            "<br>"
          ) +
          "</p>"
        );
      })
      .join("");

    /*
      Nome do chef fica garantido aqui,
      mesmo se o Supabase estiver com
      uma versão antiga da história.
    */
    aboutText.innerHTML =
      `
        <div class="chef-signature">
          👨‍🍳 Chef Denilson Martins
        </div>
      ` +
      paragraphs +
      `
        <div class="about-signature">
          <span>
            🩵 Feito com carinho, sabor e muitos sonhos
          </span>

          <strong>
            Chef Denilson Martins ✨
          </strong>

          <small>
            O coração por trás de cada doce da Martins Confeitaria.
          </small>
        </div>
      `;
  }

  /* =====================================================
     MAPAS
     ===================================================== */

  function renderMaps() {
    const maps = $("#maps");
    const mapFrame = $("#mapFrame");
    const review = $("#review");

    if (maps && S.maps) {
      maps.href = S.maps;
    }

    if (mapFrame && Array.isArray(S.address)) {
      const query = encodeURIComponent(
        S.address.join(", ")
      );

      mapFrame.src =
        "https://www.google.com/maps?q=" +
        query +
        "&output=embed";
    }

    if (review && S.review) {
      review.href = S.review;
    }
  }

  /* =====================================================
     HORÁRIOS
     ===================================================== */

  const dayNames = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado"
  ];

  function renderHours() {
    const hours = $("#hours");

    if (!hours) {
      return;
    }

    const list = Array.isArray(S.hours)
      ? S.hours
      : [];

    hours.innerHTML = list
      .map((hour, index) => {
        const status =
          hour?.s === "closed"
            ? "Fechado"
            : hour?.s === "tbd"
            ? "A confirmar"
            : `${hour?.o || ""} – ${
                hour?.c || ""
              }`;

        return `
          <div class="hour">
            <span>
              ${dayNames[index] || ""}
            </span>

            <b>
              ${esc(status)}
            </b>
          </div>
        `;
      })
      .join("");
  }

  /* =====================================================
     STATUS DA LOJA
     ===================================================== */

  function currentStatus() {
    const element = $("#openState");

    if (!element) {
      return;
    }

    const now = new Date(
      new Date().toLocaleString(
        "en-US",
        {
          timeZone: "America/Fortaleza"
        }
      )
    );

    const hour =
      S.hours?.[now.getDay()];

    let open = false;

    if (hour?.s === "open") {
      const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();

      const [openHour, openMinute] =
        String(hour.o || "00:00")
          .split(":")
          .map(Number);

      const [closeHour, closeMinute] =
        String(hour.c || "00:00")
          .split(":")
          .map(Number);

      const opening =
        openHour * 60 + openMinute;

      const closing =
        closeHour * 60 + closeMinute;

      open =
        currentMinutes >= opening &&
        currentMinutes < closing;
    }

    element.textContent =
      hour?.s === "tbd"
        ? "Horário de terça-feira: a confirmar"
        : open
        ? "● Aberta agora"
        : "● Fechada agora";

    element.className =
      "open-state " +
      (open ? "is-open" : "");
  }

  /* =====================================================
     CARDÁPIO
     ===================================================== */

  let currentCategory = "";

  function getMenuCategories() {
    const categoriesByArea =
      S.categoriesByArea || {};

    if (
      Array.isArray(
        categoriesByArea.cardapio
      ) &&
      categoriesByArea.cardapio.length
    ) {
      return categoriesByArea.cardapio;
    }

    if (
      Array.isArray(S.categories) &&
      S.categories.length
    ) {
      return S.categories;
    }

    return [
      ...new Set(
        (S.products || [])
          .filter(
            (product) =>
              !product.area ||
              product.area === "cardapio"
          )
          .map(
            (product) =>
              product.category
          )
          .filter(Boolean)
      )
    ];
  }

  function renderMenu() {
    const categories = $(
      "#categories"
    );

    const products = $(
      "#products"
    );

    const emptyMenu = $(
      "#emptyMenu"
    );

    if (!categories || !products) {
      return;
    }

    const cats =
      getMenuCategories();

    if (
      !currentCategory ||
      !cats.includes(
        currentCategory
      )
    ) {
      currentCategory =
        cats[0] || "";
    }

    categories.innerHTML =
      cats
        .map(
          (category) => `
            <button
              type="button"
              class="tab ${
                category ===
                currentCategory
                  ? "active"
                  : ""
              }"
              data-cat="${esc(
                category
              )}"
            >
              ${esc(category)}
            </button>
          `
        )
        .join("");

    $$("#categories .tab")
      .forEach((button) => {
        button.onclick = () => {
          currentCategory =
            button.dataset.cat || "";

          renderMenu();
        };
      });

    const list =
      (S.products || [])
        .filter(
          (product) =>
            (!product.area ||
              product.area ===
                "cardapio") &&
            product.category ===
              currentCategory
        )
        .sort(
          (a, b) =>
            Number(a.sort || 0) -
            Number(b.sort || 0)
        );

    products.innerHTML =
      list
        .map(
          (product) => `
            <article class="product">

              <div class="product-img">
                ${
                  product.image
                    ? `
                      <img
                        src="${esc(
                          product.image
                        )}"
                        alt="${esc(
                          product.name
                        )}"
                        loading="lazy"
                      >
                    `
                    : `
                      <span>
                        Martins
                      </span>
                    `
                }
              </div>

              <div class="product-body">

                <span class="tag">
                  ${esc(
                    product.category ||
                      ""
                  )}
                </span>

                <h3>
                  ${esc(
                    product.name
                  )}
                </h3>

                <p>
                  ${esc(
                    product.description ||
                      ""
                  )}
                </p>

                <div class="product-row">

                  <strong>
                    ${money(
                      product.price
                    )}
                  </strong>

                  ${
                    product.available ===
                    false
                      ? `
                        <span
                          class="unavailable"
                        >
                          Temporariamente indisponível
                        </span>
                      `
                      : `
                        <button
                          type="button"
                          class="add"
                          data-id="${esc(
                            product.id
                          )}"
                        >
                          Adicionar
                        </button>
                      `
                  }

                </div>

              </div>

            </article>
          `
        )
        .join("");

    if (emptyMenu) {
      emptyMenu.classList.toggle(
        "hidden",
        list.length > 0
      );
    }

    $$(".add").forEach(
      (button) => {
        button.onclick = () => {
          add(
            button.dataset.id
          );
        };
      }
    );
  }

  /* =====================================================
     CARRINHO — ADICIONAR
     ===================================================== */

  function add(id) {
    const product =
      (S.products || []).find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!product) {
      return;
    }

    if (
      product.available === false
    ) {
      alert(
        "Este produto está temporariamente indisponível."
      );

      return;
    }

    if (
      product.category === "Kits"
    ) {
      window.location.href =
        "encomendas.html?kit=" +
        encodeURIComponent(
          product.id
        );

      return;
    }

    const item =
      cart.find(
        (cartItem) =>
          String(cartItem.id) ===
          String(id)
      );

    if (item) {
      item.qty++;
    } else {
      cart.push({
        id: product.id,
        qty: 1
      });
    }

    saveCart();
    openDrawer();
  }

  /* =====================================================
     CARRINHO
     ===================================================== */

  function saveCart() {
    try {
      localStorage.setItem(
        "martins_cart",
        JSON.stringify(cart)
      );
    } catch (error) {
      console.warn(
        "Não foi possível salvar o carrinho:",
        error
      );
    }

    renderCart();
  }

  function getCartItems() {
    return cart
      .map((item) => {
        const product =
          (S.products || []).find(
            (productItem) =>
              String(
                productItem.id
              ) ===
              String(item.id)
          );

        if (!product) {
          return null;
        }

        return {
          ...product,
          qty: Number(
            item.qty || 1
          )
        };
      })
      .filter(Boolean);
  }

  function renderCart() {
    const cartItemsElement =
      $("#cartItems");

    const cartCount =
      $("#cartCount");

    const cartTotal =
      $("#cartTotal");

    const checkoutButton =
      $("#checkoutBtn");

    if (
      !cartItemsElement
    ) {
      return;
    }

    const items =
      getCartItems();

    const total =
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            Number(item.qty || 0),
        0
      );

    if (cartCount) {
      cartCount.textContent =
        items.reduce(
          (sum, item) =>
            sum +
            Number(item.qty || 0),
          0
        );
    }

    if (cartTotal) {
      cartTotal.textContent =
        money(total);
    }

    cartItemsElement.innerHTML =
      items.length
        ? items
            .map(
              (item) => `
                <div class="cart-item">

                  <div>
                    <b>
                      ${esc(
                        item.name
                      )}
                    </b>

                    <small>
                      ${money(
                        item.price
                      )} cada
                    </small>
                  </div>

                  <div class="qty">

                    <button
                      type="button"
                      data-dec="${esc(
                        item.id
                      )}"
                    >
                      −
                    </button>

                    <b>
                      ${item.qty}
                    </b>

                    <button
                      type="button"
                      data-inc="${esc(
                        item.id
                      )}"
                    >
                      +
                    </button>

                  </div>

                </div>
              `
            )
            .join("")
        : `
          <div class="empty">
            Seu carrinho está vazio.
          </div>
        `;

    $$("[data-inc]").forEach(
      (button) => {
        button.onclick = () => {
          change(
            button.dataset.inc,
            1
          );
        };
      }
    );

    $$("[data-dec]").forEach(
      (button) => {
        button.onclick = () => {
          change(
            button.dataset.dec,
            -1
          );
        };
      }
    );

    if (checkoutButton) {
      checkoutButton.disabled =
        !items.length;
    }
  }

  function change(id, delta) {
    const item =
      cart.find(
        (cartItem) =>
          String(cartItem.id) ===
          String(id)
      );

    if (!item) {
      return;
    }

    item.qty += delta;

    if (item.qty < 1) {
      cart =
        cart.filter(
          (cartItem) =>
            String(cartItem.id) !==
            String(id)
        );
    }

    saveCart();
  }

  /* =====================================================
     DRAWER
     ===================================================== */

  function openDrawer() {
    const drawer = $("#drawer");
    const shade = $("#shade");

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
    }
  }

  function closeDrawer() {
    const drawer = $("#drawer");
    const shade = $("#shade");

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
    }
  }

  /* =====================================================
     PRONTA ENTREGA
     ===================================================== */

  function renderReady() {
    const container =
      $("#readyProducts");

    if (!container) {
      return;
    }

    const list =
      (S.products || []).filter(
        (product) =>
          product.area ===
          "pronta_entrega"
      );

    container.innerHTML =
      list
        .map(
          (product) => `
            <article class="product">

              <div class="product-img">
                ${
                  product.image
                    ? `
                      <img
                        src="${esc(
                          product.image
                        )}"
                        alt="${esc(
                          product.name
                        )}"
                        loading="lazy"
                      >
                    `
                    : `
                      <span>
                        Pronta entrega
                      </span>
                    `
                }
              </div>

              <div class="product-body">

                <span class="tag">
                  ${
                    product.available ===
                    false
                      ? "TEMPORARIAMENTE INDISPONÍVEL"
                      : "DISPONÍVEL AGORA"
                  }
                </span>

                <h3>
                  ${esc(
                    product.name
                  )}
                </h3>

                <p>
                  ${esc(
                    product.description ||
                      ""
                  )}
                </p>

                <div class="product-row">

                  <strong>
                    ${money(
                      product.price
                    )}
                  </strong>

                  ${
                    product.available ===
                    false
                      ? `
                        <span class="unavailable">
                          Temporariamente indisponível
                        </span>
                      `
                      : `
                        <button
                          type="button"
                          class="add-ready"
                          data-id="${esc(
                            product.id
                          )}"
                        >
                          Adicionar
                        </button>
                      `
                  }

                </div>

              </div>

            </article>
          `
        )
        .join("");

    $$(".add-ready").forEach(
      (button) => {
        button.onclick = () => {
          add(
            button.dataset.id
          );
        };
      }
    );
  }

  /* =====================================================
     BOLO PERSONALIZADO
     ===================================================== */

  function renderCake() {
    const cakeForm =
      $("#cakeForm");

    if (!cakeForm) {
      return;
    }

    const cake =
      S.cake || D.cake;

    if (!cake) {
      return;
    }

    const cakeType =
      $("#cakeType");

    const cakeMass =
      $("#cakeMass");

    const cakeFilling =
      $("#cakeFilling");

    const cakeExtras =
      $("#cakeExtras");

    if (
      cakeType &&
      Array.isArray(cake.types)
    ) {
      cakeType.innerHTML =
        `
          <option value="">
            Escolha o tipo e tamanho
          </option>
        ` +
        cake.types
          .map(
            ([name, price]) => `
              <option
                value="${esc(
                  name
                )}"
                data-price="${Number(
                  price
                )}"
              >
                ${esc(
                  name
                )} — ${money(
                  price
                )}
              </option>
            `
          )
          .join("");
    }

    if (
      cakeMass &&
      Array.isArray(cake.masses)
    ) {
      cakeMass.innerHTML =
        `
          <option value="">
            Escolha 1 massa
          </option>
        ` +
        cake.masses
          .map(
            (mass) => `
              <option value="${esc(
                mass
              )}">
                ${esc(mass)}
              </option>
            `
          )
          .join("");
    }

    if (
      cakeFilling &&
      Array.isArray(
        cake.fillings
      )
    ) {
      cakeFilling.innerHTML =
        `
          <option value="">
            Escolha 1 recheio
          </option>
        ` +
        cake.fillings
          .map(
            (filling) => `
              <option value="${esc(
                filling
              )}">
                ${esc(
                  filling
                )}
              </option>
            `
          )
          .join("");
    }

    if (
      cakeExtras &&
      Array.isArray(cake.extras)
    ) {
      cakeExtras.innerHTML =
        cake.extras
          .map(
            ([name, price]) => `
              <label class="extra-option">

                <input
                  type="checkbox"
                  name="Adicional"
                  value="${esc(
                    name
                  )}"
                  data-price="${Number(
                    price
                  )}"
                >

                <span>
                  ${esc(name)}
                  (+${money(price)})
                </span>

              </label>
            `
          )
          .join("");
    }

    const calculate =
      () => {
        const selected =
          cakeType?.selectedOptions
            ?. [0];

        let total =
          Number(
            selected?.dataset
              ?.price || 0
          );

        $$("#cakeExtras input:checked")
          .forEach(
            (input) => {
              total += Number(
                input.dataset
                  .price || 0
              );
            }
          );

        const totalElement =
          $("#cakeTotal");

        if (totalElement) {
          totalElement.textContent =
            money(total);
        }

        return total;
      };

    if (cakeType) {
      cakeType.onchange =
        calculate;
    }

    $$("#cakeExtras input")
      .forEach((input) => {
        input.onchange =
          calculate;
      });

    const openCake =
      $("#openCake");

    if (openCake) {
      openCake.onclick = () => {
        cakeForm.classList.toggle(
          "hidden"
        );

        if (
          !cakeForm.classList.contains(
            "hidden"
          )
        ) {
          cakeForm.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }
      };
    }

    calculate();
  }

  /* =====================================================
     CHECKOUT
     ===================================================== */

  function checkout() {
    if (!cart.length) {
      return;
    }

    const dialog =
      $("#checkout");

    if (!dialog) {
      return;
    }

    if (
      typeof dialog.showModal ===
      "function"
    ) {
      dialog.showModal();
    } else {
      dialog.setAttribute(
        "open",
        ""
      );
    }
  }

  function closeCheckout() {
    const dialog =
      $("#checkout");

    if (!dialog) {
      return;
    }

    if (
      typeof dialog.close ===
      "function"
    ) {
      dialog.close();
    } else {
      dialog.removeAttribute(
        "open"
      );
    }
  }

  /* =====================================================
     CONFIGURAÇÃO DOS EVENTOS
     ===================================================== */

  function setupEvents() {
    const openCart =
      $("#openCart");

    const closeCart =
      $("#closeCart");

    const shade =
      $("#shade");

    const clearCart =
      $("#clearCart");

    const checkoutButton =
      $("#checkoutBtn");

    if (openCart) {
      openCart.onclick =
        openDrawer;
    }

    if (closeCart) {
      closeCart.onclick =
        closeDrawer;
    }

    if (shade) {
      shade.onclick =
        closeDrawer;
    }

    if (clearCart) {
      clearCart.onclick = () => {
        cart = [];
        saveCart();
      };
    }

    if (checkoutButton) {
      checkoutButton.onclick =
        checkout;
    }

    setupCheckoutForm();
    setupCakeForm();
  }

  /* =====================================================
     FORMULÁRIO DO CARRINHO
     ===================================================== */

  function setupCheckoutForm() {
    const form =
      $("#checkoutForm");

    if (!form) {
      return;
    }

    form.addEventListener(
      "change",
      (event) => {
        if (
          event.target?.name !==
          "receiving"
        ) {
          return;
        }

        const addressWrap =
          $("#addressWrap");

        if (!addressWrap) {
          return;
        }

        addressWrap.classList.toggle(
          "hidden",
          event.target.value !==
            "Entrega"
        );
      }
    );

    form.onsubmit =
      async (event) => {
        event.preventDefault();

        const data =
          new FormData(
            form
          );

        const items =
          getCartItems();

        if (!items.length) {
          return;
        }

        const total =
          items.reduce(
            (sum, item) =>
              sum +
              Number(
                item.price || 0
              ) *
                Number(
                  item.qty || 0
                ),
            0
          );

        const lines =
          items
            .map(
              (item) =>
                `• ${item.qty}x ${item.name} — ${money(
                  Number(
                    item.price || 0
                  ) *
                    Number(
                      item.qty || 0
                    )
                )}`
            )
            .join("\n");

        const customer =
          data.get(
            "customer"
          ) || "";

        const phone =
          data.get(
            "phone"
          ) || "";

        const receiving =
          data.get(
            "receiving"
          ) || "";

        const address =
          data.get(
            "address"
          ) || "";

        const payment =
          data.get(
            "payment"
          ) || "";

        const notes =
          data.get(
            "notes"
          ) || "";

        const message =
          "Olá! Quero fazer um pedido na Martins Confeitaria.\n\n" +
          `*Cliente:* ${customer}\n` +
          `*WhatsApp:* ${phone}\n` +
          `*Recebimento:* ${receiving}` +
          (address
            ? `\n*Endereço:* ${address}`
            : "") +
          `\n*Pagamento:* ${payment}\n\n` +
          `*Itens:*\n${lines}\n\n` +
          `*Total:* ${money(
            total
          )}\n` +
          `*Observações:* ${
            notes ||
            "Nenhuma"
          }`;

        /*
          Salva no Supabase sem impedir
          o envio para o WhatsApp caso
          o banco apresente algum erro.
        */
        const client =
          getSupabase();

        if (client) {
          try {
            await client
              .from("orders")
              .insert({
                customer,
                phone,
                receiving,
                address,
                payment,
                notes,
                items,
                total,
                status: "novo"
              });
          } catch (error) {
            console.warn(
              "Não foi possível salvar o pedido:",
              error
            );
          }
        }

        window.open(
          wa(message),
          "_blank",
          "noopener"
        );

        closeCheckout();

        cart = [];

        saveCart();
        closeDrawer();
      };
  }

  /* =====================================================
     FORMULÁRIO DE BOLO
     ===================================================== */

  function setupCakeForm() {
    const form =
      $("#cakeForm");

    if (!form) {
      return;
    }

    form.onsubmit =
      async (event) => {
        event.preventDefault();

        const data =
          new FormData(
            form
          );

        const extras =
          data.getAll(
            "Adicional"
          );

        const cakeType =
          $("#cakeType");

        const selected =
          cakeType
            ?.selectedOptions
            ?.[0];

        let total =
          Number(
            selected?.dataset
              ?.price || 0
          );

        $$("#cakeExtras input:checked")
          .forEach(
            (input) => {
              total += Number(
                input.dataset
                  .price || 0
              );
            }
          );

        const cakeData = {
          "Tipo e tamanho":
            data.get(
              "Tipo e tamanho"
            ),

          Massa:
            data.get(
              "Massa"
            ),

          Recheio:
            data.get(
              "Recheio"
            ),

          Adicionais:
            extras.length
              ? extras.join(", ")
              : "Nenhum",

          Nome:
            data.get(
              "Nome"
            ),

          WhatsApp:
            data.get(
              "WhatsApp"
            ),

          "Data desejada":
            data.get(
              "Data desejada"
            ),

          Observações:
            data.get(
              "Observações"
            ),

          "Total estimado":
            money(total)
        };

        const message =
          "Olá! Quero encomendar um bolo personalizado.\n\n" +
          Object.entries(
            cakeData
          )
            .map(
              ([key, value]) =>
                `*${key}:* ${
                  value ||
                  "Não informado"
                }`
            )
            .join("\n");

        const client =
          getSupabase();

        if (client) {
          try {
            await client
              .from(
                "custom_cakes"
              )
              .insert({
                data: cakeData,
                status: "novo"
              });
          } catch (error) {
            console.warn(
              "Não foi possível salvar a encomenda do bolo:",
              error
            );
          }
        }

        window.open(
          wa(message),
          "_blank",
          "noopener"
        );
      };
  }

  /* =====================================================
     ANIMAÇÕES DE SCROLL
     ===================================================== */

  function setupReveal() {
    const elements =
      $$(".reveal");

    if (
      !elements.length
    ) {
      return;
    }

    /*
      Fallback caso o navegador
      não tenha IntersectionObserver.
    */
    if (
      !("IntersectionObserver" in
        window)
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
        observer.observe(
          element
        );
      }
    );
  }

  /* =====================================================
     INICIALIZAÇÃO
     ===================================================== */

  function init() {
    setupEvents();
    setupReveal();
    load();
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
