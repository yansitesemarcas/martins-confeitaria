(() => {
  "use strict";

  /*
   * MARTINS CONFEITARIA
   * PAINEL ADMINISTRATIVO
   *
   * Não colocar nenhum código antes das constantes abaixo.
   * O antigo erro "$ is not defined" acontecia porque o JS
   * estava sendo executado antes de definir seus recursos.
   */

  const C = window.MARTINS_CONFIG || {};
  const D = window.MARTINS_DEFAULTS || {};

  if (
    !C.SUPABASE_URL ||
    !C.SUPABASE_ANON_KEY
  ) {
    document.body.innerHTML = `
      <div style="
        min-height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:24px;
        font-family:Arial,sans-serif;
      ">
        <div style="
          max-width:500px;
          text-align:center;
          padding:30px;
          border:1px solid #ddd;
          border-radius:18px;
        ">
          <h2>Supabase não configurado</h2>
          <p>
            Verifique SUPABASE_URL e SUPABASE_ANON_KEY
            no arquivo config.js.
          </p>
        </div>
      </div>
    `;

    return;
  }

  const client = supabase.createClient(
    C.SUPABASE_URL,
    C.SUPABASE_ANON_KEY
  );

  const $ = selector =>
    document.querySelector(selector);

  const $$ = selector =>
    [...document.querySelectorAll(selector)];

  const esc = value =>
    String(value ?? "").replace(
      /[&<>"']/g,
      char =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[char]
    );

  const money = value =>
    Number(value || 0).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );

  const clone = value => {
    try {
      return structuredClone(value);
    } catch {
      return JSON.parse(JSON.stringify(value));
    }
  };

  const AREAS = [
    {
      value: "cardapio",
      label: "Delivery"
    },
    {
      value: "pronta-entrega",
      label: "Pronta entrega"
    },
    {
      value: "encomendas",
      label: "Encomendas"
    }
  ];

  let S = clone(D || {});
  let currentTab = "products";
  let currentEditId = null;

  if (!Array.isArray(S.products)) {
    S.products = [];
  }

  if (!Array.isArray(S.categories)) {
    S.categories = [];
  }

  /*
   * =========================================================
   * ÁREA
   * =========================================================
   */

  function normalizeArea(area) {
    const value =
      String(area || "")
        .trim()
        .toLowerCase();

    if (
      value === "pronta" ||
      value === "ready" ||
      value === "pronta-entrega"
    ) {
      return "pronta-entrega";
    }

    if (
      value === "encomenda" ||
      value === "bolo-personalizado" ||
      value === "encomendas"
    ) {
      return "encomendas";
    }

    return "cardapio";
  }

  function areaLabel(area) {
    const normalized =
      normalizeArea(area);

    return (
      AREAS.find(
        item =>
          item.value === normalized
      )?.label || "Delivery"
    );
  }

  /*
   * =========================================================
   * CATEGORIAS
   * =========================================================
   */

  function categoryNames() {
    const result = [];

    if (Array.isArray(S.categories)) {
      result.push(...S.categories);
    }

    if (Array.isArray(S.products)) {
      result.push(
        ...S.products.map(
          product => product.category
        )
      );
    }

    return [
      ...new Map(
        result
          .map(value =>
            String(value || "").trim()
          )
          .filter(Boolean)
          .map(value => [
            value.toLowerCase(),
            value
          ])
      ).values()
    ].sort((a, b) =>
      a.localeCompare(
        b,
        "pt-BR"
      )
    );
  }

  function addCategory(category) {
    const clean =
      String(category || "").trim();

    if (!clean) {
      return;
    }

    const exists =
      categoryNames().some(
        item =>
          item.toLowerCase() ===
          clean.toLowerCase()
      );

    if (!exists) {
      S.categories.push(clean);
    }
  }

  /*
   * =========================================================
   * LOGIN
   * =========================================================
   */

  async function setupAuth() {

    const loginForm =
      $("#loginForm");

    if (!loginForm) {
      return;
    }

    loginForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const button =
          $("#loginButton");

        const msg =
          $("#loginMsg");

        button.disabled = true;
        button.textContent =
          "Entrando...";

        msg.textContent = "";

        const formData =
          new FormData(
            loginForm
          );

        const email =
          String(
            formData.get("email") || ""
          ).trim();

        const password =
          String(
            formData.get("password") || ""
          );

        const { error } =
          await client.auth.signInWithPassword({
            email,
            password
          });

        if (error) {

          msg.textContent =
            error.message;

          button.disabled = false;
          button.textContent =
            "Entrar";

          return;
        }

        button.disabled = false;
        button.textContent =
          "Entrar";

        await showApp();
      }
    );
  }

  async function checkSession() {

    const {
      data,
      error
    } =
      await client.auth.getSession();

    if (error) {
      console.error(error);
      return;
    }

    if (data?.session) {
      await showApp();
    } else {
      showLogin();
    }
  }

  function showLogin() {

    $("#loginScreen")
      ?.classList.remove("hidden");

    $("#app")
      ?.classList.add("hidden");
  }

  async function showApp() {

    $("#loginScreen")
      ?.classList.add("hidden");

    $("#app")
      ?.classList.remove("hidden");

    await load();
  }

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  function setupLogout() {

    $("#logout")?.addEventListener(
      "click",
      async () => {

        await client.auth.signOut();

        showLogin();
      }
    );
  }

  /*
   * =========================================================
   * TABS
   * =========================================================
   */

  function setupTabs() {

    $$("[data-tab]").forEach(
      button => {

        button.addEventListener(
          "click",
          async () => {

            currentTab =
              button.dataset.tab;

            $$("[data-tab]")
              .forEach(item =>
                item.classList.toggle(
                  "active",
                  item === button
                )
              );

            await render();
          }
        );
      }
    );
  }

  /*
   * =========================================================
   * CARREGAR DADOS
   * =========================================================
   */

  async function load() {

    const main =
      $("#main");

    if (main) {
      main.innerHTML = `
        <div class="loading">
          Carregando dados...
        </div>
      `;
    }

    const settingsResult =
      await client
        .from("settings")
        .select("value")
        .eq("key", "site")
        .maybeSingle();

    if (
      settingsResult.error &&
      settingsResult.error.code !==
        "PGRST116"
    ) {
      console.error(
        settingsResult.error
      );
    }

    const productsResult =
      await client
        .from("products")
        .select("*")
        .order(
          "sort",
          {
            ascending: true
          }
        );

    if (productsResult.error) {

      console.error(
        productsResult.error
      );

      main.innerHTML = `
        <div class="panel">
          <h3>Erro ao carregar produtos</h3>
          <p>
            ${esc(
              productsResult.error.message
            )}
          </p>
        </div>
      `;

      return;
    }

    if (
      settingsResult.data &&
      settingsResult.data.value
    ) {

      const saved =
        settingsResult.data.value;

      S = {
        ...clone(D || {}),
        ...saved,
        products:
          productsResult.data || []
      };

    } else {

      S = {
        ...clone(D || {}),
        products:
          productsResult.data || []
      };
    }

    if (!Array.isArray(S.categories)) {
      S.categories = [];
    }

    for (const product of S.products) {
      if (product.category) {
        addCategory(
          product.category
        );
      }
    }

    await render();
  }

  /*
   * =========================================================
   * SALVAR SETTINGS
   * =========================================================
   */

  async function saveSite() {

    const payload =
      clone(S);

    delete payload.products;

    const {
      error
    } =
      await client
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

      alert(
        "Erro ao salvar configurações:\n" +
        error.message
      );

      return false;
    }

    return true;
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  async function render() {

    switch (currentTab) {

      case "products":
        renderProducts();
        break;

      case "orders":
        await renderOrders();
        break;

      case "cakes":
        await renderCakes();
        break;

      case "content":
        renderContent();
        break;

      case "hours":
        renderHours();
        break;

      case "media":
        await renderMedia();
        break;

      default:
        renderProducts();
    }
  }

  /*
   * =========================================================
   * PRODUTOS
   * =========================================================
   */

  function renderProducts() {

    const main =
      $("#main");

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Produtos</h2>
          <p>
            Gerencie Delivery, pronta entrega e encomendas.
          </p>
        </div>

        <button
          class="btn btn-primary"
          id="newProduct"
          type="button"
        >
          + Novo produto
        </button>
      </div>

      ${AREAS.map(area => {

        const products =
          S.products.filter(
            product =>
              normalizeArea(
                product.area
              ) === area.value
          );

        return `
          <section class="area">

            <div class="area-title">

              <h3>
                ${esc(area.label)}
              </h3>

              <button
                class="btn btn-secondary btn-small"
                data-add-area="${esc(area.value)}"
                type="button"
              >
                + Adicionar aqui
              </button>

            </div>

            ${
              products.length
                ? `
                  <div class="cards">
                    ${products
                      .map(
                        renderProductCard
                      )
                      .join("")}
                  </div>
                `
                : `
                  <div class="empty">
                    Nenhum produto nesta área.
                  </div>
                `
            }

          </section>
        `;
      }).join("")}
    `;

    $("#newProduct")
      ?.addEventListener(
        "click",
        () =>
          editProduct(null)
      );

    $$("[data-add-area]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () =>
            editProduct(
              null,
              button.dataset.addArea
            )
        );
      });

    $$("[data-edit-product]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () =>
            editProduct(
              button.dataset.editProduct
            )
        );
      });

    $$("[data-delete-product]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () =>
            deleteProduct(
              button.dataset.deleteProduct
            )
        );
      });
  }

  function renderProductCard(product) {

    const price =
      Number(product.price || 0);

    const discount =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            product.discount_percent || 0
          )
        )
      );

    const finalPrice =
      price *
      (1 - discount / 100);

    const image =
      product.image ||
      "https://placehold.co/700x450?text=Sem+imagem";

    return `
      <article class="product-card">

        <img
          class="product-image"
          src="${esc(image)}"
          alt="${esc(product.name)}"
          loading="lazy"
        >

        <div class="product-body">

          <h4>
            ${esc(product.name)}
          </h4>

          <div class="meta">

            Área:
            ${esc(
              areaLabel(product.area)
            )}

            ${
              product.category
                ? `
                  <br>
                  Categoria:
                  ${esc(product.category)}
                `
                : ""
            }

            ${
              product.gramatura
                ? `
                  <br>
                  ${esc(product.gramatura)}
                `
                : ""
            }

            ${
              product.serve_ate
                ? `
                  <br>
                  Serve:
                  ${esc(product.serve_ate)}
                `
                : ""
            }

          </div>

          <div class="price">

            ${
              discount > 0
                ? `
                  <span style="text-decoration:line-through;color:#999;">
                    ${money(price)}
                  </span>

                  <br>

                  ${money(finalPrice)}

                  <div class="discount">
                    ${discount}% de desconto
                  </div>
                `
                : money(price)
            }

          </div>

          <div style="margin-top:8px;">

            ${
              product.available !== false
                ? `
                  <span class="status success">
                    Disponível
                  </span>
                `
                : `
                  <span class="status danger">
                    Indisponível
                  </span>
                `
            }

            ${
              product.featured
                ? `
                  <span class="status">
                    Destaque
                  </span>
                `
                : ""
            }

          </div>

          <div class="actions">

            <button
              class="btn btn-secondary btn-small"
              data-edit-product="${esc(product.id)}"
              type="button"
            >
              Editar
            </button>

            <button
              class="btn btn-danger btn-small"
              data-delete-product="${esc(product.id)}"
              type="button"
            >
              Excluir
            </button>

          </div>

        </div>

      </article>
    `;
  }

  /*
   * =========================================================
   * EDITAR PRODUTO
   * =========================================================
   */

  function editProduct(id, defaultArea = "cardapio") {

    currentEditId = id;

    const product =
      id
        ? S.products.find(
            item =>
              String(item.id) ===
              String(id)
          )
        : null;

    const area =
      product?.area ||
      defaultArea;

    const categories =
      categoryNames();

    const main =
      $("#main");

    main.innerHTML = `

      <div class="page-header">

        <div>
          <h2>
            ${product
              ? "Editar produto"
              : "Novo produto"}
          </h2>

          <p>
            Cadastre o produto sem precisar digitar a categoria toda vez.
          </p>
        </div>

        <button
          id="backProducts"
          class="btn btn-secondary"
          type="button"
        >
          ← Voltar
        </button>

      </div>

      <form
        id="productForm"
        class="panel"
      >

        <div class="grid-2">

          <div class="field">
            <label>
              Nome do produto
            </label>

            <input
              name="name"
              required
              value="${esc(product?.name || "")}"
            >
          </div>

          <div class="field">
            <label>
              Área
            </label>

            <select
              name="area"
              id="productArea"
            >
              ${AREAS.map(item => `
                <option
                  value="${esc(item.value)}"
                  ${
                    normalizeArea(area) ===
                    item.value
                      ? "selected"
                      : ""
                  }
                >
                  ${esc(item.label)}
                </option>
              `).join("")}
            </select>
          </div>

          <div class="field">

            <label>
              Categoria
            </label>

            <div class="category-row">

              <select
                name="category"
                id="productCategory"
                required
              >

                <option value="">
                  Selecione uma categoria
                </option>

                ${categories.map(category => `
                  <option
                    value="${esc(category)}"
                    ${
                      product?.category ===
                      category
                        ? "selected"
                        : ""
                    }
                  >
                    ${esc(category)}
                  </option>
                `).join("")}

                <option value="__new__">
                  + Criar nova categoria
                </option>

              </select>

              <button
                type="button"
                id="newCategoryButton"
                class="btn btn-secondary"
              >
                Nova
              </button>

            </div>

            <input
              id="newCategoryInput"
              class="hidden"
              placeholder="Nome da nova categoria"
              style="margin-top:8px;"
            >

          </div>

          <div class="field">
            <label>
              Preço
            </label>

            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              value="${esc(product?.price ?? "")}"
            >
          </div>

          <div class="field">
            <label>
              Desconto (%)
            </label>

            <input
              name="discount_percent"
              type="number"
              min="0"
              max="100"
              step="1"
              value="${esc(
                product?.discount_percent || 0
              )}"
            >
          </div>

          <div class="field">
            <label>
              Ordem
            </label>

            <input
              name="sort"
              type="number"
              step="1"
              value="${esc(
                product?.sort || 0
              )}"
            >
          </div>

          <div class="field">
            <label>
              Gramatura / tamanho
            </label>

            <input
              name="gramatura"
              placeholder="Ex.: 500g, 1kg, 10 unidades"
              value="${esc(
                product?.gramatura || ""
              )}"
            >
          </div>

          <div class="field">
            <label>
              Serve
            </label>

            <input
              name="serve_ate"
              placeholder="Ex.: 10 pessoas"
              value="${esc(
                product?.serve_ate || ""
              )}"
            >
          </div>

          <div class="field full">
            <label>
              Descrição
            </label>

            <textarea
              name="description"
            >${esc(
              product?.description || ""
            )}</textarea>
          </div>

          <div class="field">

            <label>
              Foto do produto
            </label>

            <input
              id="productImageFile"
              type="file"
              accept="image/*"
            >

            <img
              id="imagePreview"
              class="preview"
              ${
                product?.image
                  ? `src="${esc(product.image)}"`
                  : "style=\"display:none;\""
              }
              alt="Pré-visualização"
            >

          </div>

          <div class="field">

            <label>
              URL da imagem
            </label>

            <input
              name="image"
              id="imageUrl"
              placeholder="https://..."
              value="${esc(
                product?.image || ""
              )}"
            >

          </div>

          <div class="field">

            <label>
              Opções
            </label>

            <label style="display:block;margin-bottom:8px;">
              <input
                name="available"
                type="checkbox"
                ${
                  product?.available !== false
                    ? "checked"
                    : ""
                }
              >
              Produto disponível
            </label>

            <label style="display:block;margin-bottom:8px;">
              <input
                name="featured"
                type="checkbox"
                ${
                  product?.featured
                    ? "checked"
                    : ""
                }
              >
              Produto em destaque
            </label>

            <label style="display:block;">
              <input
                name="appointment_required"
                type="checkbox"
                ${
                  product?.appointment_required
                    ? "checked"
                    : ""
                }
              >
              Exige agendamento
            </label>

          </div>

        </div>

        <div class="form-actions">

          <button
            class="btn btn-primary"
            type="submit"
            id="saveProductButton"
          >
            Salvar produto
          </button>

          <button
            class="btn btn-secondary"
            id="cancelProduct"
            type="button"
          >
            Cancelar
          </button>

        </div>

      </form>
    `;

    $("#backProducts")
      ?.addEventListener(
        "click",
        () => {
          currentEditId = null;
          renderProducts();
        }
      );

    $("#cancelProduct")
      ?.addEventListener(
        "click",
        () => {
          currentEditId = null;
          renderProducts();
        }
      );

    const category =
      $("#productCategory");

    const newCategoryInput =
      $("#newCategoryInput");

    function toggleNewCategory() {

      const isNew =
        category.value ===
        "__new__";

      newCategoryInput.classList.toggle(
        "hidden",
        !isNew
      );

      if (!isNew) {
        newCategoryInput.value = "";
      }
    }

    category?.addEventListener(
      "change",
      toggleNewCategory
    );

    $("#newCategoryButton")
      ?.addEventListener(
        "click",
        () => {

          category.value =
            "__new__";

          toggleNewCategory();

          newCategoryInput.focus();
        }
      );

    $("#productImageFile")
      ?.addEventListener(
        "change",
        event => {

          const file =
            event.target.files?.[0];

          if (!file) {
            return;
          }

          const preview =
            $("#imagePreview");

          preview.src =
            URL.createObjectURL(file);

          preview.style.display =
            "block";
        }
      );

    $("#imageUrl")
      ?.addEventListener(
        "input",
        event => {

          const value =
            event.target.value.trim();

          if (!value) {
            return;
          }

          const preview =
            $("#imagePreview");

          preview.src = value;
          preview.style.display =
            "block";
        }
      );

    $("#productForm")
      ?.addEventListener(
        "submit",
        saveProduct
      );
  }

  /*
   * =========================================================
   * SALVAR PRODUTO
   * =========================================================
   */

  async function saveProduct(event) {

    event.preventDefault();

    const form =
      event.currentTarget;

    const button =
      $("#saveProductButton");

    button.disabled = true;
    button.textContent =
      "Salvando...";

    try {

      const formData =
        new FormData(form);

      const name =
        String(
          formData.get("name") || ""
        ).trim();

      const price =
        Number(
          formData.get("price")
        );

      let area =
        normalizeArea(
          formData.get("area")
        );

      let category =
        String(
          formData.get("category") || ""
        ).trim();

      if (
        category ===
        "__new__"
      ) {

        category =
          String(
            $("#newCategoryInput")
              ?.value || ""
          ).trim();

        if (!category) {
          throw new Error(
            "Informe o nome da nova categoria."
          );
        }
      }

      if (!name) {
        throw new Error(
          "Informe o nome do produto."
        );
      }

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        throw new Error(
          "Informe um preço válido."
        );
      }

      if (!category) {
        throw new Error(
          "Selecione uma categoria."
        );
      }

      let discount =
        Number(
          formData.get(
            "discount_percent"
          ) || 0
        );

      discount =
        Math.max(
          0,
          Math.min(
            100,
            discount
          )
        );

      addCategory(category);

      /*
       * FOTO
       */

      let image =
        String(
          formData.get("image") || ""
        ).trim();

      const file =
        $("#productImageFile")
          ?.files?.[0];

      if (file) {

        const safeName =
          file.name
            .replace(
              /[^a-zA-Z0-9._-]/g,
              "-"
            );

        const path =
          `products/${Date.now()}-${safeName}`;

        const upload =
          await client.storage
            .from("media")
            .upload(
              path,
              file,
              {
                upsert: false,
                contentType:
                  file.type ||
                  "image/jpeg"
              }
            );

        if (upload.error) {
          throw new Error(
            "Erro ao enviar imagem: " +
            upload.error.message
          );
        }

        const publicData =
          client.storage
            .from("media")
            .getPublicUrl(path);

        image =
          publicData.data
            ?.publicUrl || image;
      }

      const productData = {

        name,

        description:
          String(
            formData.get(
              "description"
            ) || ""
          ).trim(),

        price,

        image,

        category,

        area,

        gramatura:
          String(
            formData.get(
              "gramatura"
            ) || ""
          ).trim(),

        serve_ate:
          String(
            formData.get(
              "serve_ate"
            ) || ""
          ).trim(),

        discount_percent:
          discount,

        sort:
          Number(
            formData.get(
              "sort"
            ) || 0
          ),

        available:
          formData.get(
            "available"
          ) === "on",

        featured:
          formData.get(
            "featured"
          ) === "on",

        appointment_required:
          formData.get(
            "appointment_required"
          ) === "on"
      };

      let result;

      if (currentEditId) {

        result =
          await client
            .from("products")
            .update(productData)
            .eq(
              "id",
              currentEditId
            );

      } else {

        result =
          await client
            .from("products")
            .insert(
              productData
            );
      }

      if (result.error) {
        throw new Error(
          result.error.message
        );
      }

      await saveSite();

      currentEditId = null;

      alert(
        "Produto salvo com sucesso."
      );

      await load();

    } catch (error) {

      console.error(error);

      alert(
        "Não foi possível salvar:\n\n" +
        error.message
      );

      button.disabled = false;
      button.textContent =
        "Salvar produto";
    }
  }

  /*
   * =========================================================
   * EXCLUIR PRODUTO
   * =========================================================
   */

  async function deleteProduct(id) {

    const product =
      S.products.find(
        item =>
          String(item.id) ===
          String(id)
      );

    if (!product) {
      return;
    }

    const confirmed =
      confirm(
        `Excluir "${product.name}"?`
      );

    if (!confirmed) {
      return;
    }

    const {
      error
    } =
      await client
        .from("products")
        .delete()
        .eq("id", id);

    if (error) {

      alert(
        "Erro ao excluir:\n" +
        error.message
      );

      return;
    }

    await load();
  }

  /*
   * =========================================================
   * PEDIDOS
   * =========================================================
   */

  async function renderOrders() {

    const main =
      $("#main");

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Pedidos</h2>
          <p>
            Pedidos recebidos pelo site.
          </p>
        </div>

        <button
          id="refreshOrders"
          class="btn btn-secondary"
          type="button"
        >
          Atualizar
        </button>
      </div>

      <div id="ordersList">
        <div class="loading">
          Carregando pedidos...
        </div>
      </div>
    `;

    $("#refreshOrders")
      ?.addEventListener(
        "click",
        renderOrders
      );

    const {
      data,
      error
    } =
      await client
        .from("orders")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (error) {

      $("#ordersList").innerHTML = `
        <div class="panel">
          <h3>Erro</h3>
          <p>
            ${esc(error.message)}
          </p>
        </div>
      `;

      return;
    }

    const orders =
      data || [];

    if (!orders.length) {

      $("#ordersList").innerHTML = `
        <div class="empty">
          Nenhum pedido recebido.
        </div>
      `;

      return;
    }

    $("#ordersList").innerHTML =
      orders
        .map(renderOrder)
        .join("");

    $$("[data-order-status]")
      .forEach(select => {

        select.addEventListener(
          "change",
          async () => {

            const id =
              select.dataset.orderStatus;

            await updateOrderStatus(
              id,
              select.value
            );
          }
        );
      });

    $$("[data-print-order]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () =>
            printOrder(
              orders.find(
                order =>
                  String(order.id) ===
                  String(
                    button.dataset.printOrder
                  )
              )
            )
        );
      });
  }

  function renderOrder(order) {

    const created =
      order.created_at
        ? new Date(
            order.created_at
          ).toLocaleString(
            "pt-BR"
          )
        : "";

    const items =
      order.items || [];

    let itemsText = "";

    if (Array.isArray(items)) {

      itemsText =
        items
          .map(item =>
            `${item.quantity || 1}x ${item.name || "Produto"}`
          )
          .join("\n");

    } else if (
      typeof items === "object"
    ) {

      itemsText =
        JSON.stringify(
          items,
          null,
          2
        );

    } else {

      itemsText =
        String(items || "");
    }

    const statuses = [
      "novo",
      "em preparo",
      "pronto",
      "concluído",
      "cancelado"
    ];

    return `
      <article class="order-card">

        <div class="order-head">

          <div>
            <h3>
              Pedido #${esc(order.id)}
            </h3>

            <div class="meta">
              ${esc(created)}
            </div>
          </div>

          <select
            class="field"
            data-order-status="${esc(order.id)}"
            style="width:auto;"
          >
            ${statuses.map(status => `
              <option
                value="${esc(status)}"
                ${
                  String(
                    order.status || "novo"
                  ) === status
                    ? "selected"
                    : ""
                }
              >
                ${esc(status)}
              </option>
            `).join("")}
          </select>

        </div>

        <div style="margin-top:14px;">

          <strong>
            ${esc(
              order.customer_name ||
              order.name ||
              "Cliente"
            )}
          </strong>

          ${
            order.phone
              ? `<div class="meta">
                  Telefone: ${esc(order.phone)}
                </div>`
              : ""
          }

          ${
            order.receiving
              ? `<div class="meta">
                  Recebimento: ${esc(order.receiving)}
                </div>`
              : ""
          }

          ${
            order.address
              ? `<div class="meta">
                  Endereço: ${esc(order.address)}
                </div>`
              : ""
          }

          ${
            order.payment
              ? `<div class="meta">
                  Pagamento: ${esc(order.payment)}
                </div>`
              : ""
          }

        </div>

        <div class="items">
          ${esc(itemsText)}
        </div>

        ${
          order.notes
            ? `
              <div class="meta">
                <strong>Observações:</strong><br>
                ${esc(order.notes)}
              </div>
            `
            : ""
        }

        ${
          order.total != null
            ? `
              <div class="price">
                Total:
                ${money(order.total)}
              </div>
            `
            : ""
        }

        <div class="actions">

          <button
            class="btn btn-secondary btn-small"
            data-print-order="${esc(order.id)}"
            type="button"
          >
            Imprimir comanda
          </button>

        </div>

      </article>
    `;
  }

  async function updateOrderStatus(
    id,
    status
  ) {

    const {
      error
    } =
      await client
        .from("orders")
        .update({
          status
        })
        .eq(
          "id",
          id
        );

    if (error) {

      alert(
        "Erro ao atualizar pedido:\n" +
        error.message
      );
    }
  }

  /*
   * =========================================================
   * BOLOS PERSONALIZADOS
   * =========================================================
   */

  async function renderCakes() {

    const main =
      $("#main");

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Bolos personalizados</h2>
          <p>
            Solicitações de encomendas personalizadas.
          </p>
        </div>
      </div>

      <div id="cakesList">
        <div class="loading">
          Carregando...
        </div>
      </div>
    `;

    const {
      data,
      error
    } =
      await client
        .from("custom_cakes")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (error) {

      $("#cakesList").innerHTML = `
        <div class="panel">
          <h3>Erro</h3>
          <p>${esc(error.message)}</p>
        </div>
      `;

      return;
    }

    const cakes =
      data || [];

    if (!cakes.length) {

      $("#cakesList").innerHTML = `
        <div class="empty">
          Nenhuma solicitação de bolo personalizado.
        </div>
      `;

      return;
    }

    $("#cakesList").innerHTML =
      cakes
        .map(renderCake)
        .join("");

    $$("[data-cake-status]")
      .forEach(select => {

        select.addEventListener(
          "change",
          async () => {

            const id =
              select.dataset.cakeStatus;

            const {
              error
            } =
              await client
                .from("custom_cakes")
                .update({
                  status:
                    select.value
                })
                .eq(
                  "id",
                  id
                );

            if (error) {
              alert(
                error.message
              );
            }
          }
        );
      });
  }

  function renderCake(cake) {

    const statuses = [
      "novo",
      "em contato",
      "orçamento enviado",
      "concluído",
      "cancelado"
    ];

    const date =
      cake.created_at
        ? new Date(
            cake.created_at
          ).toLocaleString(
            "pt-BR"
          )
        : "";

    return `
      <article class="cake-card">

        <div class="cake-head">

          <div>
            <h3>
              Solicitação #${esc(cake.id)}
            </h3>

            <div class="meta">
              ${esc(date)}
            </div>
          </div>

          <select
            data-cake-status="${esc(cake.id)}"
          >
            ${statuses.map(status => `
              <option
                value="${esc(status)}"
                ${
                  String(
                    cake.status || "novo"
                  ) === status
                    ? "selected"
                    : ""
                }
              >
                ${esc(status)}
              </option>
            `).join("")}
          </select>

        </div>

        <div style="margin-top:15px;">
          ${
            Object.entries(cake)
              .filter(
                ([key]) =>
                  ![
                    "id",
                    "created_at",
                    "updated_at",
                    "status"
                  ].includes(key)
              )
              .map(
                ([key, value]) => `
                  <div
                    class="meta"
                    style="margin-bottom:6px;"
                  >
                    <strong>
                      ${esc(key)}:
                    </strong>
                    ${esc(
                      typeof value ===
                      "object"
                        ? JSON.stringify(
                            value
                          )
                        : value
                    )}
                  </div>
                `
              )
              .join("")
          }
        </div>

        <div class="actions">

          <button
            class="btn btn-secondary btn-small"
            type="button"
            data-print-cake="${esc(cake.id)}"
          >
            Imprimir comanda
          </button>

        </div>

      </article>
    `;
  }

  /*
   * =========================================================
   * CONTEÚDO
   * =========================================================
   */

  function renderContent() {

    const about =
      S.about || {};

    const main =
      $("#main");

    main.innerHTML = `

      <div class="page-header">

        <div>
          <h2>Conteúdo</h2>
          <p>
            Informações exibidas no site.
          </p>
        </div>

      </div>

      <form
        id="contentForm"
        class="panel"
      >

        <div class="grid-2">

          <div class="field">
            <label>
              Nome
            </label>

            <input
              name="name"
              value="${esc(
                about.name || ""
              )}"
            >
          </div>

          <div class="field">
            <label>
              Título
            </label>

            <input
              name="title"
              value="${esc(
                about.title || ""
              )}"
            >
          </div>

          <div class="field">
            <label>
              Instagram
            </label>

            <input
              name="instagram"
              value="${esc(
                S.instagram || ""
              )}"
            >
          </div>

          <div class="field">
            <label>
              WhatsApp
            </label>

            <input
              name="whatsapp"
              value="${esc(
                S.whatsapp || ""
              )}"
            >
          </div>

          <div class="field">
            <label>
              Foto
            </label>

            <input
              name="photo"
              value="${esc(
                about.photo || ""
              )}"
            >
          </div>

          <div class="field">
            <label>
              Frase
            </label>

            <input
              name="quote"
              value="${esc(
                about.quote || ""
              )}"
            >
          </div>

          <div class="field full">
            <label>
              Texto
            </label>

            <textarea
              name="text"
            >${esc(
              about.text || ""
            )}</textarea>
          </div>

        </div>

        <div class="form-actions">

          <button
            class="btn btn-primary"
            type="submit"
          >
            Salvar conteúdo
          </button>

        </div>

      </form>
    `;

    $("#contentForm")
      ?.addEventListener(
        "submit",
        async event => {

          event.preventDefault();

          const data =
            new FormData(
              event.currentTarget
            );

          S.about = {
            ...about,

            name:
              String(
                data.get("name") || ""
              ).trim(),

            title:
              String(
                data.get("title") || ""
              ).trim(),

            photo:
              String(
                data.get("photo") || ""
              ).trim(),

            quote:
              String(
                data.get("quote") || ""
              ).trim(),

            text:
              String(
                data.get("text") || ""
              ).trim()
          };

          S.instagram =
            String(
              data.get("instagram") ||
              ""
            ).trim();

          S.whatsapp =
            String(
              data.get("whatsapp") ||
              ""
            ).trim();

          if (
            await saveSite()
          ) {
            alert(
              "Conteúdo salvo."
            );
          }
        }
      );
  }

  /*
   * =========================================================
   * HORÁRIOS
   * =========================================================
   */

  function renderHours() {

    const hours =
      S.hours || {};

    const main =
      $("#main");

    const days = [
      ["0", "Domingo"],
      ["1", "Segunda-feira"],
      ["2", "Terça-feira"],
      ["3", "Quarta-feira"],
      ["4", "Quinta-feira"],
      ["5", "Sexta-feira"],
      ["6", "Sábado"]
    ];

    main.innerHTML = `

      <div class="page-header">

        <div>
          <h2>Horários</h2>
          <p>
            Controle os horários exibidos no site.
          </p>
        </div>

      </div>

      <form
        id="hoursForm"
        class="panel"
      >

        ${days.map(
          ([key, label]) => {

            const item =
              hours[key] || {};

            return `
              <div
                class="grid-3"
                style="
                  margin-bottom:12px;
                  align-items:end;
                "
              >

                <div>
                  <strong>
                    ${label}
                  </strong>
                </div>

                <div class="field">
                  <label>
                    Abertura
                  </label>

                  <input
                    type="time"
                    name="o${key}"
                    value="${esc(
                      item.open || ""
                    )}"
                  >
                </div>

                <div class="field">
                  <label>
                    Fechamento
                  </label>

                  <input
                    type="time"
                    name="c${key}"
                    value="${esc(
                      item.close || ""
                    )}"
                  >
                </div>

              </div>
            `;
          }
        ).join("")}

        <div class="field">
          <label>
            Informações de delivery
          </label>

          <textarea
            name="deliveryInfo"
          >${esc(
            S.deliveryInfo || ""
          )}</textarea>
        </div>

        <div class="field">
          <label>
            Formas de pagamento
          </label>

          <textarea
            name="payments"
          >${esc(
            Array.isArray(S.payments)
              ? S.payments.join("\n")
              : S.payments || ""
          )}</textarea>
        </div>

        <div class="form-actions">

          <button
            class="btn btn-primary"
            type="submit"
          >
            Salvar horários
          </button>

        </div>

      </form>
    `;

    $("#hoursForm")
      ?.addEventListener(
        "submit",
        async event => {

          event.preventDefault();

          const data =
            new FormData(
              event.currentTarget
            );

          S.hours = {};

          days.forEach(
            ([key]) => {

              S.hours[key] = {
                open:
                  String(
                    data.get(
                      `o${key}`
                    ) || ""
                  ),

                close:
                  String(
                    data.get(
                      `c${key}`
                    ) || ""
                  )
              };
            }
          );

          S.deliveryInfo =
            String(
              data.get(
                "deliveryInfo"
              ) || ""
            ).trim();

          S.payments =
            String(
              data.get(
                "payments"
              ) || ""
            )
              .split("\n")
              .map(
                item =>
                  item.trim()
              )
              .filter(Boolean);

          if (
            await saveSite()
          ) {
            alert(
              "Horários salvos."
            );
          }
        }
      );
  }

  /*
   * =========================================================
   * MÍDIA
   * =========================================================
   */

  async function renderMedia() {

    const main =
      $("#main");

    main.innerHTML = `

      <div class="page-header">

        <div>
          <h2>Mídia</h2>
          <p>
            Arquivos armazenados no bucket media.
          </p>
        </div>

      </div>

      <div class="panel">

        <div class="field">
          <label>
            Enviar imagem
          </label>

          <input
            id="mediaUpload"
            type="file"
            accept="image/*"
          >
        </div>

      </div>

      <div
        id="mediaList"
        class="media-grid"
      >
        <div class="loading">
          Carregando arquivos...
        </div>
      </div>
    `;

    $("#mediaUpload")
      ?.addEventListener(
        "change",
        uploadMedia
      );

    const {
      data,
      error
    } =
      await client.storage
        .from("media")
        .list(
          "",
          {
            limit: 100
          }
        );

    if (error) {

      $("#mediaList").innerHTML = `
        <div class="panel">
          <p>
            ${esc(error.message)}
          </p>
        </div>
      `;

      return;
    }

    const files =
      data || [];

    if (!files.length) {

      $("#mediaList").innerHTML = `
        <div class="empty">
          Nenhum arquivo encontrado.
        </div>
      `;

      return;
    }

    $("#mediaList").innerHTML =
      files
        .filter(
          file =>
            file.name !==
            ".emptyFolderPlaceholder"
        )
        .map(file => {

          const url =
            client.storage
              .from("media")
              .getPublicUrl(
                file.name
              )
              .data
              .publicUrl;

          return `
            <div class="media-card">

              <img
                src="${esc(url)}"
                alt="${esc(file.name)}"
                loading="lazy"
              >

              <div class="media-name">
                ${esc(file.name)}
              </div>

              <button
                class="btn btn-secondary btn-small"
                data-copy-media="${esc(url)}"
                type="button"
              >
                Copiar URL
              </button>

            </div>
          `;
        })
        .join("");

    $$("[data-copy-media]")
      .forEach(button => {

        button.addEventListener(
          "click",
          async () => {

            try {

              await navigator.clipboard.writeText(
                button.dataset.copyMedia
              );

              button.textContent =
                "Copiado!";

              setTimeout(
                () =>
                  button.textContent =
                    "Copiar URL",
                1500
              );

            } catch {

              alert(
                button.dataset.copyMedia
              );
            }
          }
        );
      });
  }

  async function uploadMedia(event) {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const safeName =
      file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "-"
      );

    const path =
      `${Date.now()}-${safeName}`;

    const {
      error
    } =
      await client.storage
        .from("media")
        .upload(
          path,
          file,
          {
            upsert: false,
            contentType:
              file.type ||
              "image/jpeg"
          }
        );

    if (error) {

      alert(
        "Erro ao enviar arquivo:\n" +
        error.message
      );

      return;
    }

    alert(
      "Arquivo enviado."
    );

    await renderMedia();
  }

  /*
   * =========================================================
   * COMANDA DE PEDIDO
   * =========================================================
   */

  function printOrder(order) {

    if (!order) {
      return;
    }

    const items =
      Array.isArray(order.items)
        ? order.items
        : [];

    const itemHTML =
      items
        .map(
          item => `
            <tr>
              <td>
                ${esc(
                  item.quantity || 1
                )}x
              </td>

              <td>
                ${esc(
                  item.name || "Produto"
                )}
              </td>

              <td>
                ${money(
                  item.price || 0
                )}
              </td>
            </tr>
          `
        )
        .join("");

    const html = `
      <!DOCTYPE html>

      <html lang="pt-BR">

      <head>

        <meta charset="UTF-8">

        <title>
          Comanda
        </title>

        <style>

          body {
            font-family: Arial, sans-serif;
            padding: 25px;
            color: #000;
          }

          h1 {
            text-align: center;
            font-size: 20px;
          }

          .meta {
            font-size: 13px;
            margin: 4px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          th,
          td {
            padding: 7px;
            border-bottom: 1px solid #ddd;
            text-align: left;
          }

          .total {
            margin-top: 20px;
            text-align: right;
            font-weight: bold;
            font-size: 18px;
          }

          @media print {
            body {
              padding: 0;
            }
          }

        </style>

      </head>

      <body>

        <h1>
          MARTINS CONFEITARIA ARTESANAL
        </h1>

        <div class="meta">
          Pedido:
          ${esc(order.id)}
        </div>

        <div class="meta">
          Cliente:
          ${esc(
            order.customer_name ||
            order.name ||
            ""
          )}
        </div>

        <div class="meta">
          Telefone:
          ${esc(
            order.phone || ""
          )}
        </div>

        <div class="meta">
          Recebimento:
          ${esc(
            order.receiving || ""
          )}
        </div>

        <table>

          <thead>
            <tr>
              <th>Qtd.</th>
              <th>Produto</th>
              <th>Valor</th>
            </tr>
          </thead>

          <tbody>
            ${itemHTML}
          </tbody>

        </table>

        <div class="total">
          Total:
          ${money(order.total)}
        </div>

        ${
          order.notes
            ? `
              <p>
                <strong>
                  Observações:
                </strong>
                ${esc(order.notes)}
              </p>
            `
            : ""
        }

        <script>
          window.onload = () => {
            window.print();
            window.close();
          };
        </script>

      </body>

      </html>
    `;

    const popup =
      window.open(
        "",
        "_blank"
      );

    if (!popup) {

      alert(
        "O navegador bloqueou a janela de impressão."
      );

      return;
    }

    popup.document.write(
      html
    );

    popup.document.close();
  }

  /*
   * =========================================================
   * COMANDA DE BOLO
   * =========================================================
   */

  function printCake(cake) {

    if (!cake) {
      return;
    }

    const fields =
      Object.entries(cake)
        .filter(
          ([key]) =>
            ![
              "id",
              "created_at",
              "updated_at",
              "status"
            ].includes(key)
        )
        .map(
          ([key, value]) => `
            <p>
              <strong>
                ${esc(key)}:
              </strong>
              ${esc(
                typeof value ===
                "object"
                  ? JSON.stringify(
                      value
                    )
                  : value
              )}
            </p>
          `
        )
        .join("");

    const popup =
      window.open(
        "",
        "_blank"
      );

    if (!popup) {
      alert(
        "O navegador bloqueou a impressão."
      );
      return;
    }

    popup.document.write(`
      <!DOCTYPE html>

      <html lang="pt-BR">

      <head>

        <meta charset="UTF-8">

        <title>
          Comanda de bolo
        </title>

        <style>

          body {
            font-family: Arial, sans-serif;
            padding: 25px;
          }

          h1 {
            text-align: center;
          }

          p {
            border-bottom: 1px solid #ddd;
            padding: 7px 0;
          }

        </style>

      </head>

      <body>

        <h1>
          COMANDA DE BOLO PERSONALIZADO
        </h1>

        ${fields}

        <script>
          window.onload = () => {
            window.print();
            window.close();
          };
        </script>

      </body>

      </html>
    `);

    popup.document.close();
  }

  /*
   * =========================================================
   * EVENTOS DE BOLOS
   * =========================================================
   */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-print-cake]"
        );

      if (!button) {
        return;
      }

      const id =
        button.dataset.printCake;

      client
        .from("custom_cakes")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then(
          ({ data, error }) => {

            if (error) {
              alert(
                error.message
              );
              return;
            }

            printCake(data);
          }
        );
    }
  );

  /*
   * =========================================================
   * AUTH STATE
   * =========================================================
   */

  client.auth.onAuthStateChange(
    async (_event, session) => {

      if (session) {
        await showApp();
      } else {
        showLogin();
      }
    }
  );

  /*
   * =========================================================
   * INICIALIZAÇÃO
   * =========================================================
   */

  async function init() {

    setupAuth();
    setupLogout();
    setupTabs();

    await checkSession();
  }

  init();

})();
