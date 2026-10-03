```js
(() => {
  const D = window.MARTINS_DEFAULTS || {};
  const C = window.MARTINS_CONFIG || {};

  let S = structuredClone(D);
  let cart = JSON.parse(localStorage.getItem("martins_cart") || "[]");
  let currentCategory = "";

  const $ = (selector) => document.querySelector(selector);

  const $$ = (selector) => [
    ...document.querySelectorAll(selector)
  ];

  const money = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  // =========================
  // WHATSAPP
  // =========================

  const wa = (text) => {
    return (
      "https://wa.me/" +
      S.whatsapp +
      "?text=" +
      encodeURIComponent(text)
    );
  };

  // =========================
  // SUPABASE
  // =========================

  function supabaseClient() {
    if (
      !window.supabase ||
      !C.SUPABASE_URL ||
      !C.SUPABASE_ANON_KEY
    ) {
      return null;
    }

    return window.supabase.createClient(
      C.SUPABASE_URL,
      C.SUPABASE_ANON_KEY
    );
  }

  // =========================
  // CARREGAR DADOS
  // =========================

  async function load() {

    // PRIMEIRO:
    // mostra imediatamente os dados padrão
    render();

    const client = supabaseClient();

    if (!client) {
      return;
    }

    try {

      const settingsResult =
        await client
          .from("settings")
          .select("value")
          .eq("key", "site")
          .maybeSingle();

      const productsResult =
        await client
          .from("products")
          .select("*")
          .order("sort");

      // Mantém os dados padrão
      // e só substitui o que realmente existir
      if (
        settingsResult &&
        !settingsResult.error &&
        settingsResult.data &&
        settingsResult.data.value
      ) {
        S = {
          ...S,
          ...settingsResult.data.value
        };
      }

      if (
        productsResult &&
        !productsResult.error &&
        Array.isArray(productsResult.data) &&
        productsResult.data.length
      ) {
        S.products = productsResult.data;
      }

      // Renderiza novamente caso o Supabase
      // tenha fornecido dados válidos
      render();

    } catch (error) {

      console.warn(
        "Supabase não carregado. Usando dados padrão.",
        error
      );

      // Mantém o site funcionando
      // mesmo sem Supabase
      render();
    }
  }

  // =========================
  // RENDER PRINCIPAL
  // =========================

  function render() {

    const year = $("#year");

    if (year) {
      year.textContent =
        new Date().getFullYear();
    }

    // WhatsApp
    const contactWa = $("#contactWa");

    if (contactWa) {
      contactWa.href = wa(
        "Olá! Vim pelo site da Martins Confeitaria e gostaria de fazer um pedido."
      );
    }

    // Instagram
    const instagram = $("#instagram");

    if (instagram) {
      instagram.href =
        S.instagram || "#";
    }

    // Google Maps
    const maps = $("#maps");

    if (maps) {
      maps.href =
        S.maps || "#";
    }

    // Avaliação
    const review = $("#review");

    if (review) {
      review.href =
        S.review ||
        S.maps ||
        "#";
    }

    // Endereço
    const address = $("#address");

    if (address) {
      address.innerHTML =
        (S.address || [])
          .map(esc)
          .join("<br>");
    }

    // Mapa
    const mapFrame =
      $("#mapFrame");

    if (
      mapFrame &&
      Array.isArray(S.address)
    ) {
      const addressQuery =
        S.address.join(", ");

      mapFrame.src =
        "https://www.google.com/maps?q=" +
        encodeURIComponent(addressQuery) +
        "&output=embed";
    }

    // =========================
    // HISTÓRIA
    // =========================

    const aboutTitle =
      $("#aboutTitle");

    if (aboutTitle) {
      aboutTitle.textContent =
        S.about?.title || "";
    }

    const aboutQuote =
      $("#aboutQuote");

    if (aboutQuote) {
      aboutQuote.textContent =
        "“" +
        (S.about?.quote || "") +
        "”";
    }

    const aboutText =
      $("#aboutText");

    if (aboutText) {

      aboutText.innerHTML =
        String(
          S.about?.text || ""
        )
          .split(/\n\n+/)
          .map(
            (paragraph) =>
              "<p>" +
              esc(paragraph)
                .replace(/\n/g, "<br>") +
              "</p>"
          )
          .join("");
    }

    renderHours();
    renderMenu();
    renderCart();
    updateCartEvents();
  }

  // =========================
  // HORÁRIOS
  // =========================

  const days = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado"
  ];

  function renderHours() {

    const hoursElement =
      $("#hours");

    if (!hoursElement) {
      return;
    }

    hoursElement.innerHTML =
      (S.hours || [])
        .map((hour, index) => {

          let text = "Fechado";

          if (hour?.s === "open") {
            text =
              hour.o +
              " – " +
              hour.c;
          }

          if (hour?.s === "tbd") {
            text = "A confirmar";
          }

          return `
            <div class="hour">
              <span>
                ${days[index] || ""}
              </span>

              <b>
                ${esc(text)}
              </b>
            </div>
          `;
        })
        .join("");
  }

  // =========================
  // CARDÁPIO
  // =========================

  function renderMenu() {

    const categoriesElement =
      $("#categories");

    const productsElement =
      $("#products");

    const emptyMenu =
      $("#emptyMenu");

    if (
      !categoriesElement ||
      !productsElement
    ) {
      return;
    }

    const products =
      Array.isArray(S.products)
        ? S.products
        : [];

    const categories =
      Array.isArray(S.categories) &&
      S.categories.length
        ? S.categories
        : [
            ...new Set(
              products.map(
                (product) =>
                  product.category
              )
            )
          ];

    if (
      !currentCategory ||
      !categories.includes(
        currentCategory
      )
    ) {
      currentCategory =
        categories[0] || "";
    }

    categoriesElement.innerHTML =
      categories
        .map(
          (category) => `
            <button
              type="button"
              class="${
                category === currentCategory
                  ? "active"
                  : ""
              }"
              data-category="${esc(category)}"
            >
              ${esc(category)}
            </button>
          `
        )
        .join("");

    $$("#categories button")
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

    const list =
      products.filter(
        (product) =>
          product.available !== false &&
          product.category ===
            currentCategory
      );

    productsElement.innerHTML =
      list
        .map(
          (product) => `
            <article class="product">

              <div class="product-img">

                ${
                  product.image
                    ? `
                      <img
                        src="${esc(product.image)}"
                        alt="${esc(product.name)}"
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
                  ${esc(product.category)}
                </span>

                <h3>
                  ${esc(product.name)}
                </h3>

                ${
                  product.description
                    ? `
                      <p>
                        ${esc(
                          product.description
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

                  <button
                    type="button"
                    class="add"
                    data-product-id="${esc(
                      product.id
                    )}"
                  >
                    Adicionar
                  </button>

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

        button.addEventListener(
          "click",
          () => {
            addToCart(
              button.dataset.productId
            );
          }
        );

      }
    );
  }

  // =========================
  // CARRINHO
  // =========================

  function addToCart(id) {

    const product =
      S.products?.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!product) {
      return;
    }

    const existing =
      cart.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (existing) {
      existing.qty++;
    } else {
      cart.push({
        id: product.id,
        qty: 1
      });
    }

    saveCart();
    openDrawer();
  }

  function saveCart() {

    localStorage.setItem(
      "martins_cart",
      JSON.stringify(cart)
    );

    renderCart();
  }

  function renderCart() {

    const cartCount =
      $("#cartCount");

    const cartTotal =
      $("#cartTotal");

    const cartItems =
      $("#cartItems");

    const checkoutButton =
      $("#checkoutBtn");

    if (!cartItems) {
      return;
    }

    const items =
      cart
        .map((cartItem) => {

          const product =
            S.products?.find(
              (item) =>
                String(item.id) ===
                String(cartItem.id)
            );

          if (!product) {
            return null;
          }

          return {
            ...product,
            qty: cartItem.qty
          };
        })
        .filter(Boolean);

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

    if (!items.length) {

      cartItems.innerHTML = `
        <div class="empty">
          Seu carrinho está vazio.
        </div>
      `;

    } else {

      cartItems.innerHTML =
        items
          .map(
            (item) => `
              <div class="cart-item">

                <div>

                  <b>
                    ${esc(item.name)}
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
                    data-cart-minus="${esc(
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
                    data-cart-plus="${esc(
                      item.id
                    )}"
                  >
                    +
                  </button>

                </div>

              </div>
            `
          )
          .join("");
    }

    if (checkoutButton) {
      checkoutButton.disabled =
        !items.length;
    }

    $$("[data-cart-plus]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () =>
            changeCart(
              button.dataset.cartPlus,
              1
            )
        );

      });

    $$("[data-cart-minus]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () =>
            changeCart(
              button.dataset.cartMinus,
              -1
            )
        );

      });
  }

  function changeCart(
    id,
    amount
  ) {

    const item =
      cart.find(
        (cartItem) =>
          String(cartItem.id) ===
          String(id)
      );

    if (!item) {
      return;
    }

    item.qty += amount;

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

  // =========================
  // CARRINHO — ABRIR
  // =========================

  function openDrawer() {

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
      shade.classList.add("open");
    }
  }

  // =========================
  // CARRINHO — FECHAR
  // =========================

  function closeDrawer() {

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
    }
  }

  // =========================
  // CHECKOUT
  // =========================

  function setupCheckout() {

    const checkoutForm =
      $("#checkoutForm");

    const receiving =
      checkoutForm?.querySelector(
        '[name="receiving"]'
      );

    const addressWrap =
      $("#addressWrap");

    if (
      receiving &&
      addressWrap
    ) {

      receiving.addEventListener(
        "change",
        (event) => {

          addressWrap.classList.toggle(
            "hidden",
            event.target.value !==
              "Entrega"
          );

        }
      );
    }

    if (!checkoutForm) {
      return;
    }

    checkoutForm.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        const form =
          new FormData(
            checkoutForm
          );

        const items =
          cart
            .map((cartItem) => {

              const product =
                S.products?.find(
                  (item) =>
                    String(item.id) ===
                    String(
                      cartItem.id
                    )
                );

              if (!product) {
                return null;
              }

              return {
                ...product,
                qty: cartItem.qty
              };

            })
            .filter(Boolean);

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
                "• " +
                item.qty +
                "x " +
                item.name +
                " — " +
                money(
                  item.price *
                  item.qty
                )
            )
            .join("\n");

        const address =
          form.get("address");

        const message =
          "Olá! Quero fazer um pedido na Martins Confeitaria.\n\n" +
          "*Cliente:* " +
          form.get("customer") +
          "\n" +
          "*WhatsApp:* " +
          form.get("phone") +
          "\n" +
          "*Recebimento:* " +
          form.get("receiving") +
          "\n" +
          (
            address
              ? "*Endereço:* " +
                address +
                "\n"
              : ""
          ) +
          "*Pagamento:* " +
          form.get("payment") +
          "\n\n" +
          "*Itens:*\n" +
          lines +
          "\n\n" +
          "*Total:* " +
          money(total) +
          "\n\n" +
          "*Observações:* " +
          (
            form.get("notes") ||
            "Nenhuma"
          );

        window.open(
          wa(message),
          "_blank",
          "noopener"
        );

        cart = [];

        saveCart();
        closeDrawer();

        const checkout =
          $("#checkout");

        if (
          checkout &&
          typeof checkout.close ===
            "function"
        ) {
          checkout.close();
        }

        checkoutForm.reset();

        if (addressWrap) {
          addressWrap.classList.add(
            "hidden"
          );
        }
      }
    );
  }

  // =========================
  // EVENTOS
  // =========================

  function updateCartEvents() {

    const openCart =
      $("#openCart");

    if (openCart) {
      openCart.onclick =
        openDrawer;
    }

    const closeCart =
      $("#closeCart");

    if (closeCart) {
      closeCart.onclick =
        closeDrawer;
    }

    const shade =
      $("#shade");

    if (shade) {
      shade.onclick =
        closeDrawer;
    }

    const clearCart =
      $("#clearCart");

    if (clearCart) {

      clearCart.onclick = () => {

        cart = [];

        saveCart();
      };
    }

    const checkoutButton =
      $("#checkoutBtn");

    if (checkoutButton) {

      checkoutButton.onclick =
        () => {

          if (!cart.length) {
            return;
          }

          const checkout =
            $("#checkout");

          if (
            checkout &&
            typeof checkout.showModal ===
              "function"
          ) {
            checkout.showModal();
          }
        };
    }
  }

  // =========================
  // INICIAR
  // =========================

  setupCheckout();

  // Renderiza imediatamente
  // e depois sincroniza com Supabase
  load();

})();
```
