const { createClient } = window.supabase;

const CONFIG = window.MARTINS_CONFIG || {};

const client = createClient(
  CONFIG.url,
  CONFIG.anonKey
);

const view = document.getElementById("view");
const login = document.getElementById("login");
const app = document.getElementById("app");
const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");
const title = document.getElementById("title");

const S = {
  products: [],
  categories: [],
  settings: {},
  currentTab: "products",
  editingId: null
};

const AREAS = [
  {
    value: "cardapio",
    label: "Cardápio / Delivery"
  },
  {
    value: "pronta-entrega",
    label: "Pronta-entrega"
  },
  {
    value: "bolo-personalizado",
    label: "Bolo personalizado"
  },
  {
    value: "encomendas",
    label: "Encomendas"
  }
];


/* =========================================================
   AUTH
========================================================= */

async function checkSession() {
  const { data, error } = await client.auth.getSession();

  if (error) {
    console.error(error);
    showLogin();
    return;
  }

  if (data.session) {
    showApp();
    await load();
  } else {
    showLogin();
  }
}


loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginMsg.textContent = "Entrando...";

  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;

  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    loginMsg.textContent = error.message;
    return;
  }

  loginMsg.textContent = "";

  showApp();
  await load();
});


document.getElementById("logout")?.addEventListener("click", async () => {
  await client.auth.signOut();
  showLogin();
});


client.auth.onAuthStateChange((event, session) => {
  if (session) {
    showApp();
  } else {
    showLogin();
  }
});


function showLogin() {
  login?.classList.remove("hidden");
  app?.classList.add("hidden");
}


function showApp() {
  login?.classList.add("hidden");
  app?.classList.remove("hidden");
}


/* =========================================================
   LOAD
========================================================= */

async function load() {
  await Promise.all([
    loadProducts(),
    loadCategories(),
    loadSettings()
  ]);

  render();
}


async function loadProducts() {
  const { data, error } = await client
    .from("products")
    .select("*")
    .order("sort", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar produtos:", error);
    S.products = [];
    return;
  }

  S.products = Array.isArray(data) ? data : [];
}


async function loadCategories() {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("sort", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Erro ao carregar categorias:", error);
    S.categories = [];
    return;
  }

  S.categories = Array.isArray(data) ? data : [];
}


async function loadSettings() {
  const { data, error } = await client
    .from("settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar configurações:", error);
    S.settings = {};
    return;
  }

  S.settings = data || {};
}


/* =========================================================
   TABS
========================================================= */

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    S.currentTab = button.dataset.tab;

    if (S.currentTab !== "products") {
      S.editingId = null;
    }

    render();
  });
});


function render() {
  switch (S.currentTab) {
    case "products":
      title.textContent = "Produtos";
      renderProducts();
      break;

    case "content":
      title.textContent = "Conteúdo";
      renderContent();
      break;

    case "orders":
      title.textContent = "Pedidos";
      renderPlaceholder("Pedidos");
      break;

    case "cakes":
      title.textContent = "Bolos personalizados";
      renderPlaceholder("Bolos personalizados");
      break;

    case "hours":
      title.textContent = "Horários e regras";
      renderPlaceholder("Horários e regras");
      break;

    case "media":
      title.textContent = "Mídia";
      renderPlaceholder("Mídia");
      break;

    default:
      title.textContent = "Produtos";
      renderProducts();
  }
}


/* =========================================================
   PRODUCTS
========================================================= */

function renderProducts() {
  const editing = S.products.find(
    product => product.id === S.editingId
  );

  view.innerHTML = `
    <div class="panel">

      <div class="panel-head">
        <div>
          <h2>${editing ? "Editar produto" : "Novo produto"}</h2>
          <p>
            Cadastre o produto e escolha exatamente onde ele aparecerá.
          </p>
        </div>

        ${
          editing
            ? `<button class="secondary" id="cancelEdit">
                Cancelar edição
              </button>`
            : ""
        }
      </div>

      <form id="productForm">

        <div class="grid">

          <label>
            Nome
            <input
              name="name"
              required
              value="${escapeAttr(editing?.name || "")}"
              placeholder="Ex.: Brownie Ninho"
            >
          </label>


          <label>
            Área
            <select name="area" id="productArea" required>
              ${renderAreaOptions(editing?.area || "")}
            </select>
          </label>


          <label>
            Categoria
            <div class="category-row">

              <select
                name="category"
                id="productCategory"
                required
              ></select>

              <button
                type="button"
                class="secondary"
                id="newCategory"
              >
                + Nova categoria
              </button>

            </div>
          </label>


          <label>
            Preço
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              value="${editing?.price ?? ""}"
              placeholder="0,00"
            >
          </label>


          <label>
            Gramatura
            <input
              name="gramatura"
              type="number"
              step="1"
              min="0"
              value="${editing?.gramatura ?? ""}"
              placeholder="Ex.: 220"
            >
          </label>


          <label>
            Serve até
            <input
              name="serve_ate"
              type="number"
              min="1"
              value="${editing?.serve_ate ?? ""}"
              placeholder="Ex.: 5"
            >
          </label>


          <label>
            Desconto (%)
            <input
              name="discount_percent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value="${editing?.discount_percent ?? 0}"
              placeholder="0"
            >
          </label>


          <label>
            Imagem
            <input
              name="image"
              value="${escapeAttr(editing?.image || "")}"
              placeholder="URL da imagem"
            >
          </label>


          <label>
            Ordem
            <input
              name="sort"
              type="number"
              min="0"
              value="${editing?.sort ?? ""}"
              placeholder="Automático"
            >
          </label>


          <label>
            Agendamento obrigatório
            <select name="appointment_required">
              <option
                value="false"
                ${editing?.appointment_required === true ? "" : "selected"}
              >
                Não
              </option>

              <option
                value="true"
                ${editing?.appointment_required === true ? "selected" : ""}
              >
                Sim
              </option>
            </select>
          </label>


          <label>
            Disponível
            <select name="available">
              <option
                value="true"
                ${editing?.available === false ? "" : "selected"}
              >
                Sim
              </option>

              <option
                value="false"
                ${editing?.available === false ? "selected" : ""}
              >
                Não
              </option>
            </select>
          </label>

        </div>


        <label>
          Descrição
          <textarea
            name="description"
            rows="4"
            placeholder="Descrição do produto"
          >${escapeHtml(editing?.description || "")}</textarea>
        </label>


        <div class="form-actions">

          <button type="submit">
            ${editing ? "Salvar alterações" : "Adicionar produto"}
          </button>

          ${
            editing
              ? `<button
                   type="button"
                   class="danger"
                   id="deleteProduct"
                 >
                   Excluir produto
                 </button>`
              : ""
          }

        </div>

        <small id="productMsg"></small>

      </form>

    </div>


    <div class="panel">

      <div class="panel-head">
        <div>
          <h2>Produtos cadastrados</h2>
          <p>${S.products.length} produto(s)</p>
        </div>
      </div>

      <div class="product-list">

        ${
          S.products.length
            ? S.products.map(renderProductItem).join("")
            : `<p>Nenhum produto cadastrado.</p>`
        }

      </div>

    </div>
  `;


  const areaSelect = document.getElementById("productArea");
  const categorySelect = document.getElementById("productCategory");

  function refreshCategories(selectedValue = "") {
    const area = areaSelect.value;

    const categories = S.categories
      .filter(category => category.area === area)
      .sort((a, b) => {
        if (a.sort !== b.sort) {
          return a.sort - b.sort;
        }

        return a.name.localeCompare(
          b.name,
          "pt-BR",
          { sensitivity: "base" }
        );
      });

    categorySelect.innerHTML = `
      <option value="">Selecione uma categoria</option>

      ${categories.map(category => `
        <option
          value="${escapeAttr(category.name)}"
          ${category.name === selectedValue ? "selected" : ""}
        >
          ${escapeHtml(category.name)}
        </option>
      `).join("")}
    `;
  }


  refreshCategories(editing?.category || "");


  areaSelect.addEventListener("change", () => {
    refreshCategories("");
  });


  document
    .getElementById("newCategory")
    ?.addEventListener("click", async () => {

      const area = areaSelect.value;

      if (!area) {
        alert("Selecione primeiro a área do produto.");
        return;
      }

      const name = prompt(
        `Nome da nova categoria para "${getAreaLabel(area)}":`
      );

      if (!name) {
        return;
      }

      const cleanName = name.trim();

      if (!cleanName) {
        return;
      }

      const existing = S.categories.find(category =>
        category.area === area &&
        category.name.toLowerCase() === cleanName.toLowerCase()
      );

      if (existing) {
        refreshCategories(existing.name);
        categorySelect.value = existing.name;
        return;
      }

      const maxSort = S.categories
        .filter(category => category.area === area)
        .reduce(
          (max, category) =>
            Math.max(max, Number(category.sort) || 0),
          0
        );

      const { error } = await client
        .from("categories")
        .insert({
          name: cleanName,
          area,
          sort: maxSort + 1,
          active: true
        });

      if (error) {
        console.error(error);

        alert(
          "Não foi possível criar a categoria:\n\n" +
          error.message
        );

        return;
      }

      await loadCategories();

      refreshCategories(cleanName);

      categorySelect.value = cleanName;
    });


  document
    .getElementById("cancelEdit")
    ?.addEventListener("click", () => {
      S.editingId = null;
      renderProducts();
    });


  document
    .getElementById("deleteProduct")
    ?.addEventListener("click", async () => {

      if (!S.editingId) {
        return;
      }

      const product = S.products.find(
        item => item.id === S.editingId
      );

      if (!product) {
        return;
      }

      const confirmed = confirm(
        `Excluir "${product.name}"?\n\nEssa ação não pode ser desfeita.`
      );

      if (!confirmed) {
        return;
      }

      const { error } = await client
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) {
        console.error(error);

        alert(
          "Não foi possível excluir o produto:\n\n" +
          error.message
        );

        return;
      }

      S.editingId = null;

      await loadProducts();

      renderProducts();
    });


  document
    .getElementById("productForm")
    ?.addEventListener("submit", saveProduct);


  document
    .querySelectorAll("[data-edit-product]")
    .forEach(button => {

      button.addEventListener("click", () => {

        S.editingId = button.dataset.editProduct;

        renderProducts();
      });

    });
}


async function saveProduct(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const msg = document.getElementById("productMsg");

  msg.textContent = "Salvando...";

  const data = new FormData(form);

  const name = String(data.get("name") || "").trim();
  const area = String(data.get("area") || "").trim();
  const category = String(data.get("category") || "").trim();

  if (!name) {
    msg.textContent = "Informe o nome do produto.";
    return;
  }

  if (!area) {
    msg.textContent = "Selecione uma área.";
    return;
  }

  if (!category) {
    msg.textContent = "Selecione uma categoria.";
    return;
  }


  let sort = Number(data.get("sort"));

  if (!Number.isFinite(sort) || sort <= 0) {
    sort = getNextProductSort(area);
  }


  const product = {
    name,
    area,
    category,

    price: Number(data.get("price")) || 0,

    gramatura:
      data.get("gramatura")
        ? Number(data.get("gramatura"))
        : null,

    serve_ate:
      data.get("serve_ate")
        ? Number(data.get("serve_ate"))
        : null,

    discount_percent:
      Number(data.get("discount_percent")) || 0,

    image: String(data.get("image") || "").trim(),

    description:
      String(data.get("description") || "").trim(),

    appointment_required:
      data.get("appointment_required") === "true",

    available:
      data.get("available") === "true",

    sort
  };


  let result;

  if (S.editingId) {

    result = await client
      .from("products")
      .update(product)
      .eq("id", S.editingId);

  } else {

    result = await client
      .from("products")
      .insert(product);

  }


  if (result.error) {

    console.error(result.error);

    msg.textContent =
      "Erro ao salvar: " +
      result.error.message;

    return;
  }


  msg.textContent = "Produto salvo com sucesso.";

  S.editingId = null;

  await loadProducts();

  renderProducts();
}


/* =========================================================
   PRODUCT LIST
========================================================= */

function renderProductItem(product) {

  const discount =
    Number(product.discount_percent) || 0;

  const price =
    Number(product.price) || 0;

  const finalPrice =
    price * (1 - discount / 100);


  const metadata = [];

  if (product.gramatura) {
    metadata.push(`${product.gramatura} g`);
  }

  if (product.serve_ate) {
    metadata.push(`serve até ${product.serve_ate}`);
  }

  if (product.appointment_required) {
    metadata.push("agendamento obrigatório");
  }


  return `
    <div class="product-item">

      <div>

        <strong>
          ${escapeHtml(product.name || "Sem nome")}
        </strong>

        <div>
          <small>
            ${escapeHtml(getAreaLabel(product.area))}
            /
            ${escapeHtml(product.category || "Sem categoria")}
          </small>
        </div>

        ${
          metadata.length
            ? `
              <small>
                ${metadata
                  .map(escapeHtml)
                  .join(" • ")}
              </small>
            `
            : ""
        }

      </div>


      <div>

        ${
          discount > 0
            ? `
              <small>
                <s>
                  ${formatMoney(price)}
                </s>
              </small>

              <strong>
                ${formatMoney(finalPrice)}
              </strong>

              <small>
                -${discount}%
              </small>
            `
            : `
              <strong>
                ${formatMoney(price)}
              </strong>
            `
        }

      </div>


      <button
        type="button"
        class="secondary"
        data-edit-product="${escapeAttr(product.id)}"
      >
        Editar
      </button>

    </div>
  `;
}


/* =========================================================
   CONTENT
========================================================= */

function renderContent() {

  view.innerHTML = `
    <div class="panel">

      <div class="panel-head">
        <div>
          <h2>Conteúdo do site</h2>
          <p>Configurações gerais.</p>
        </div>
      </div>

      <form id="contentForm">

        <label>
          Nome da confeitaria
          <input
            name="business_name"
            value="${escapeAttr(
              S.settings.business_name || ""
            )}"
          >
        </label>

        <label>
          WhatsApp
          <input
            name="whatsapp"
            value="${escapeAttr(
              S.settings.whatsapp || ""
            )}"
          >
        </label>

        <label>
          Instagram
          <input
            name="instagram"
            value="${escapeAttr(
              S.settings.instagram || ""
            )}"
          >
        </label>

        <label>
          Descrição
          <textarea name="description" rows="5">${escapeHtml(
            S.settings.description || ""
          )}</textarea>
        </label>

        <button type="submit">
          Salvar conteúdo
        </button>

        <small id="contentMsg"></small>

      </form>

    </div>
  `;


  document
    .getElementById("contentForm")
    ?.addEventListener("submit", saveContent);
}


async function saveContent(event) {

  event.preventDefault();

  const form = event.currentTarget;
  const msg = document.getElementById("contentMsg");

  msg.textContent = "Salvando...";

  const data = new FormData(form);

  const payload = {
    business_name:
      String(data.get("business_name") || "").trim(),

    whatsapp:
      String(data.get("whatsapp") || "").trim(),

    instagram:
      String(data.get("instagram") || "").trim(),

    description:
      String(data.get("description") || "").trim()
  };


  /*
    IMPORTANTE:
    Os produtos NÃO são salvos em settings.
    Eles pertencem à tabela products.
  */

  const { error } = await client
    .from("settings")
    .upsert(payload);


  if (error) {

    console.error(error);

    msg.textContent =
      "Erro ao salvar: " +
      error.message;

    return;
  }


  S.settings = {
    ...S.settings,
    ...payload
  };

  msg.textContent = "Salvo com sucesso.";
}


/* =========================================================
   PLACEHOLDER
========================================================= */

function renderPlaceholder(name) {

  view.innerHTML = `
    <div class="panel">

      <h2>${escapeHtml(name)}</h2>

      <p>
        Esta seção será configurada posteriormente.
      </p>

    </div>
  `;
}


/* =========================================================
   HELPERS
========================================================= */

function renderAreaOptions(selected) {

  return `
    <option value="">
      Selecione uma área
    </option>

    ${AREAS.map(area => `
      <option
        value="${area.value}"
        ${area.value === selected ? "selected" : ""}
      >
        ${area.label}
      </option>
    `).join("")}
  `;
}


function getAreaLabel(value) {

  const area = AREAS.find(
    item => item.value === value
  );

  return area
    ? area.label
    : value || "Sem área";
}


function getNextProductSort(area) {

  const products = S.products.filter(
    product => product.area === area
  );

  if (!products.length) {
    return 1;
  }

  return (
    Math.max(
      ...products.map(
        product => Number(product.sort) || 0
      )
    ) + 1
  );
}


function formatMoney(value) {

  return Number(value || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );
}


function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeAttr(value) {
  return escapeHtml(value);
}


/* =========================================================
   START
========================================================= */

checkSession();
