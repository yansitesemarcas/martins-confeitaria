(() => {
  'use strict';

  const CONFIG = window.MARTINS_CONFIG || {};
  const DEFAULTS = window.MARTINS_DEFAULTS || {};

  const client =
    CONFIG.SUPABASE_URL &&
    CONFIG.SUPABASE_ANON_KEY &&
    window.supabase
      ? window.supabase.createClient(
          CONFIG.SUPABASE_URL,
          CONFIG.SUPABASE_ANON_KEY
        )
      : null;

  const S = {
    products: [],
    settings: {},
    orders: [],
    editingId: null,
    currentTab: 'products',

    areas: [
      {
        value: 'pronta-entrega',
        label: 'Pronta-entrega'
      },
      {
        value: 'bolo-personalizado',
        label: 'Bolo personalizado'
      },
      {
        value: 'encomendas',
        label: 'Encomendas'
      },
      {
        value: 'cardapio',
        label: 'Cardápio / Delivery'
      }
    ],

    categories: new Map()
  };

  const $ = selector =>
    document.querySelector(selector);

  function esc(value) {
    return String(value ?? '').replace(
      /[&<>"']/g,
      char =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        })[char]
    );
  }

  function money(value) {
    return Number(value || 0).toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL'
      }
    );
  }

  function normalize(value) {
    return String(value || '')
      .trim()
      .toLowerCase();
  }

  function areaLabel(value) {
    const area = S.areas.find(
      item => item.value === value
    );

    return area
      ? area.label
      : value || '';
  }

  function getFinalPrice(product) {
    const price = Number(
      product?.price || 0
    );

    const discount = Math.max(
      0,
      Math.min(
        100,
        Number(
          product?.discount_percent || 0
        )
      )
    );

    return price * (1 - discount / 100);
  }

  function showApp() {
    $('#login')?.classList.add('hidden');
    $('#app')?.classList.remove('hidden');
  }

  function showLogin() {
    $('#app')?.classList.add('hidden');
    $('#login')?.classList.remove('hidden');
  }

  function setLoginMessage(message, error = false) {
    const element = $('#loginMsg');

    if (!element) return;

    element.textContent = message || '';
    element.style.color = error
      ? '#c62828'
      : '';
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  async function checkSession() {
    if (!client) {
      setLoginMessage(
        'Supabase não está configurado.',
        true
      );
      showLogin();
      return;
    }

    const {
      data,
      error
    } = await client.auth.getSession();

    if (error) {
      console.error(
        'Erro ao verificar sessão:',
        error
      );

      showLogin();
      return;
    }

    if (data?.session) {
      showApp();
      await initPanel();
    } else {
      showLogin();
    }
  }

  async function login(event) {
    event.preventDefault();

    if (!client) {
      setLoginMessage(
        'Supabase não está configurado.',
        true
      );
      return;
    }

    const form = event.target;

    const email =
      form.email?.value.trim() || '';

    const password =
      form.password?.value || '';

    if (!email || !password) {
      setLoginMessage(
        'Informe o e-mail e a senha.',
        true
      );
      return;
    }

    setLoginMessage(
      'Entrando...'
    );

    const {
      data,
      error
    } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error(
        'Erro no login:',
        error
      );

      setLoginMessage(
        'E-mail ou senha incorretos.',
        true
      );

      return;
    }

    if (!data?.session) {
      setLoginMessage(
        'Não foi possível iniciar a sessão.',
        true
      );
      return;
    }

    setLoginMessage('');

    showApp();

    await initPanel();
  }

  async function logout() {
    if (!client) return;

    const {
      error
    } = await client.auth.signOut();

    if (error) {
      console.error(
        'Erro ao sair:',
        error
      );

      alert(
        'Não foi possível sair.'
      );

      return;
    }

    showLogin();

    const form = $('#loginForm');

    if (form) {
      form.reset();
    }

    setLoginMessage('');
  }

  /* =========================================================
     CATEGORIAS
  ========================================================= */

  function buildCategories() {
    const map = new Map();

    S.products.forEach(product => {
      const area =
        String(
          product.area || ''
        ).trim();

      const category =
        String(
          product.category || ''
        ).trim();

      if (!area || !category) {
        return;
      }

      if (!map.has(area)) {
        map.set(
          area,
          new Map()
        );
      }

      const areaMap =
        map.get(area);

      const key =
        normalize(category);

      if (!areaMap.has(key)) {
        areaMap.set(
          key,
          category
        );
      }
    });

    S.categories = map;
  }

  function getCategoriesForArea(area) {
    if (
      !area ||
      !S.categories.has(area)
    ) {
      return [];
    }

    return [
      ...S.categories
        .get(area)
        .values()
    ].sort(
      (a, b) =>
        a.localeCompare(
          b,
          'pt-BR',
          {
            sensitivity: 'base'
          }
        )
    );
  }

  /* =========================================================
     PRODUTOS
  ========================================================= */

  async function loadProducts() {
    if (!client) return;

    const {
      data,
      error
    } = await client
      .from('products')
      .select('*')
      .order(
        'sort',
        {
          ascending: true
        }
      );

    if (error) {
      console.error(
        'Erro ao carregar produtos:',
        error
      );

      alert(
        'Não foi possível carregar os produtos.'
      );

      return;
    }

    S.products =
      Array.isArray(data)
        ? data
        : [];

    buildCategories();
  }

  function getNextSort(
    area,
    category
  ) {
    const numbers =
      S.products
        .filter(
          product =>
            String(
              product.area || ''
            ) ===
              String(area || '') &&
            normalize(
              product.category
            ) ===
              normalize(category)
        )
        .map(
          product =>
            Number(
              product.sort || 0
            )
        )
        .filter(
          value =>
            Number.isFinite(value)
        );

    if (!numbers.length) {
      return 1;
    }

    return (
      Math.max(...numbers) + 1
    );
  }

  function renderProductPanel() {
    const view = $('#view');

    if (!view) return;

    view.innerHTML = `
      <div class="admin-section">

        <div class="section-header">
          <div>
            <h2>Produtos</h2>

            <p>
              Cadastre e organize os produtos
              por área e categoria.
            </p>
          </div>

          <button
            type="button"
            id="newProduct"
            class="btn"
          >
            + Novo produto
          </button>
        </div>

        <div id="productFormArea"></div>

        <div
          id="productsList"
          class="products-list"
        >
          Carregando produtos...
        </div>

      </div>
    `;

    renderProductForm();
    renderProductList();
  }

  function renderProductForm(
    product = null
  ) {
    const container =
      $('#productFormArea');

    if (!container) return;

    const isEditing =
      Boolean(product);

    const categories =
      getCategoriesForArea(
        product?.area || ''
      );

    container.innerHTML = `
      <div class="product-editor">

        <div class="editor-header">
          <h2>
            ${
              isEditing
                ? 'Editar produto'
                : 'Novo produto'
            }
          </h2>
        </div>

        <form
          id="productForm"
          class="product-form"
        >

          <div class="form-grid">

            <div class="field">
              <label>
                Nome do produto
              </label>

              <input
                id="productName"
                name="name"
                type="text"
                value="${esc(
                  product?.name || ''
                )}"
                required
              >
            </div>

            <div class="field">
              <label>
                Área
              </label>

              <select
                id="productArea"
                name="area"
                required
              >

                <option value="">
                  Selecione uma área
                </option>

                ${S.areas
                  .map(
                    area => `
                      <option
                        value="${esc(
                          area.value
                        )}"
                        ${
                          product?.area ===
                          area.value
                            ? 'selected'
                            : ''
                        }
                      >
                        ${esc(
                          area.label
                        )}
                      </option>
                    `
                  )
                  .join('')}

              </select>
            </div>

            <div class="field">
              <label>
                Categoria
              </label>

              <select
                id="productCategory"
                name="category"
                required
              >

                <option value="">
                  Selecione uma categoria
                </option>

                ${categories
                  .map(
                    category => `
                      <option
                        value="${esc(
                          category
                        )}"
                        ${
                          normalize(
                            product?.category
                          ) ===
                          normalize(
                            category
                          )
                            ? 'selected'
                            : ''
                        }
                      >
                        ${esc(
                          category
                        )}
                      </option>
                    `
                  )
                  .join('')}

                <option value="__new__">
                  + Nova categoria
                </option>

              </select>
            </div>

            <div class="field">
              <label>
                Preço
              </label>

              <input
                id="productPrice"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value="${
                  product?.price || ''
                }"
                required
              >
            </div>

            <div class="field">
              <label>
                Gramatura
              </label>

              <input
                id="productGramatura"
                name="gramatura"
                type="number"
                min="0"
                step="1"
                value="${
                  product?.gramatura || ''
                }"
                placeholder="Ex.: 220"
              >

              <small>
                Em gramas.
              </small>
            </div>

            <div class="field">
              <label>
                Serve até
              </label>

              <input
                id="productServe"
                name="serve_ate"
                type="number"
                min="0"
                step="1"
                value="${
                  product?.serve_ate || ''
                }"
                placeholder="Ex.: 5"
              >

              <small>
                Número de pessoas.
              </small>
            </div>

            <div class="field">
              <label>
                Desconto
              </label>

              <input
                id="productDiscount"
                name="discount_percent"
                type="number"
                min="0"
                max="100"
                step="1"
                value="${
                  product?.discount_percent || 0
                }"
                placeholder="Ex.: 15"
              >

              <small>
                Percentual de desconto.
              </small>
            </div>

            <div class="field">
              <label>
                Imagem
              </label>

              <input
                id="productImage"
                name="image"
                type="text"
                value="${esc(
                  product?.image || ''
                )}"
                placeholder="URL da imagem"
              >
            </div>

          </div>

          <div class="field">
            <label>
              Descrição
            </label>

            <textarea
              id="productDescription"
              name="description"
              rows="4"
              placeholder="Descrição do produto"
            >${esc(
              product?.description || ''
            )}</textarea>
          </div>

          <div class="form-grid">

            <div class="field">
              <label>
                Agendamento obrigatório
              </label>

              <select
                id="productAppointment"
                name="appointment_required"
              >
                <option
                  value="false"
                  ${
                    !product?.appointment_required
                      ? 'selected'
                      : ''
                  }
                >
                  Não
                </option>

                <option
                  value="true"
                  ${
                    product?.appointment_required
                      ? 'selected'
                      : ''
                  }
                >
                  Sim
                </option>
              </select>
            </div>

            <div class="field">
              <label>
                Disponibilidade
              </label>

              <select
                id="productAvailable"
                name="available"
              >
                <option
                  value="true"
                  ${
                    product?.available !== false
                      ? 'selected'
                      : ''
                  }
                >
                  Disponível
                </option>

                <option
                  value="false"
                  ${
                    product?.available === false
                      ? 'selected'
                      : ''
                  }
                >
                  Indisponível
                </option>
              </select>
            </div>

            <div class="field">
              <label>
                Ordem
              </label>

              <input
                id="productSort"
                name="sort"
                type="number"
                min="1"
                step="1"
                value="${
                  product?.sort || ''
                }"
                placeholder="Automática"
              >

              <small>
                Deixe vazio para colocar
                automaticamente no final.
              </small>
            </div>

          </div>

          <div class="form-actions">

            <button
              type="submit"
              class="btn"
            >
              ${
                isEditing
                  ? 'Salvar alterações'
                  : 'Adicionar produto'
              }
            </button>

            ${
              isEditing
                ? `
                  <button
                    type="button"
                    id="cancelEdit"
                    class="btn secondary"
                  >
                    Cancelar
                  </button>
                `
                : ''
            }

          </div>

        </form>

      </div>
    `;

    bindProductForm();
  }

  function bindProductForm() {
    const form =
      $('#productForm');

    if (!form) return;

    const area =
      $('#productArea');

    const category =
      $('#productCategory');

    const cancel =
      $('#cancelEdit');

    area?.addEventListener(
      'change',
      () => {
        renderCategoryOptions();
      }
    );

    category?.addEventListener(
      'change',
      async event => {
        if (
          event.target.value !==
          '__new__'
        ) {
          return;
        }

        const areaValue =
          $('#productArea')?.value;

        if (!areaValue) {
          alert(
            'Selecione a área primeiro.'
          );

          renderCategoryOptions();

          return;
        }

        const name =
          window.prompt(
            `Nova categoria para "${areaLabel(
              areaValue
            )}":`
          );

        if (
          name === null ||
          !name.trim()
        ) {
          renderCategoryOptions();
          return;
        }

        const categoryName =
          name.trim();

        const exists =
          getCategoriesForArea(
            areaValue
          ).some(
            item =>
              normalize(item) ===
              normalize(
                categoryName
              )
          );

        if (exists) {
          alert(
            'Essa categoria já existe nessa área.'
          );

          renderCategoryOptions(
            categoryName
          );

          return;
        }

        renderCategoryOptions(
          categoryName
        );
      }
    );

    form.addEventListener(
      'submit',
      saveProduct
    );

    cancel?.addEventListener(
      'click',
      () => {
        S.editingId = null;

        renderProductPanel();
      }
    );
  }

  function renderCategoryOptions(
    selectedValue = ''
  ) {
    const select =
      $('#productCategory');

    if (!select) return;

    const area =
      $('#productArea')?.value || '';

    const categories =
      getCategoriesForArea(area);

    const current =
      selectedValue ||
      select.value;

    select.innerHTML = `
      <option value="">
        Selecione uma categoria
      </option>

      ${categories
        .map(
          category => `
            <option
              value="${esc(category)}"
            >
              ${esc(category)}
            </option>
          `
        )
        .join('')}

      <option value="__new__">
        + Nova categoria
      </option>
    `;

    if (current) {
      const existing =
        categories.find(
          item =>
            normalize(item) ===
            normalize(current)
        );

      if (existing) {
        select.value =
          existing;

        return;
      }

      const option =
        document.createElement(
          'option'
        );

      option.value =
        current;

      option.textContent =
        current;

      select.insertBefore(
        option,
        select.lastElementChild
      );

      select.value =
        current;
    }
  }

  async function saveProduct(
    event
  ) {
    event.preventDefault();

    if (!client) {
      alert(
        'Supabase não está configurado.'
      );
      return;
    }

    const form =
      event.target;

    const data =
      new FormData(form);

    const name =
      String(
        data.get('name') || ''
      ).trim();

    const description =
      String(
        data.get(
          'description'
        ) || ''
      ).trim();

    const area =
      String(
        data.get('area') || ''
      ).trim();

    const category =
      String(
        data.get('category') || ''
      ).trim();

    const price =
      Number(
        data.get('price') || 0
      );

    const gramaturaRaw =
      Number(
        data.get(
          'gramatura'
        ) || 0
      );

    const serveRaw =
      Number(
        data.get(
          'serve_ate'
        ) || 0
      );

    const discount =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            data.get(
              'discount_percent'
            ) || 0
          )
        )
      );

    const image =
      String(
        data.get('image') || ''
      ).trim();

    const appointment =
      data.get(
        'appointment_required'
      ) === 'true';

    const available =
      data.get(
        'available'
      ) !== 'false';

    let sort =
      Number(
        data.get('sort') || 0
      );

    if (!name) {
      alert(
        'Informe o nome do produto.'
      );
      return;
    }

    if (!area) {
      alert(
        'Selecione a área.'
      );
      return;
    }

    if (!category) {
      alert(
        'Selecione uma categoria.'
      );
      return;
    }

    if (price <= 0) {
      alert(
        'Informe um preço maior que zero.'
      );
      return;
    }

    if (!sort || sort < 1) {
      if (S.editingId) {
        const old =
          S.products.find(
            item =>
              String(item.id) ===
              String(
                S.editingId
              )
          );

        sort =
          Number(
            old?.sort || 1
          );
      } else {
        sort =
          getNextSort(
            area,
            category
          );
      }
    }

    const payload = {
      name,
      description,
      price,
      category,
      area,
      image,
      gramatura:
        gramaturaRaw > 0
          ? gramaturaRaw
          : null,
      serve_ate:
        serveRaw > 0
          ? serveRaw
          : null,
      discount_percent:
        discount,
      appointment_required:
        appointment,
      available,
      sort
    };

    let result;

    if (S.editingId) {
      result =
        await client
          .from('products')
          .update(payload)
          .eq(
            'id',
            S.editingId
          );
    } else {
      result =
        await client
          .from('products')
          .insert(payload);
    }

    if (result.error) {
      console.error(
        'Erro ao salvar produto:',
        result.error
      );

      alert(
        `Erro ao salvar produto:\n\n${
          result.error.message ||
          'Erro desconhecido.'
        }`
      );

      return;
    }

    alert(
      S.editingId
        ? 'Produto atualizado com sucesso.'
        : 'Produto adicionado com sucesso.'
    );

    S.editingId = null;

    await loadProducts();

    renderProductPanel();
  }

  function renderProductList() {
    const container =
      $('#productsList');

    if (!container) return;

    if (!S.products.length) {
      container.innerHTML = `
        <div class="empty">
          Nenhum produto cadastrado.
        </div>
      `;

      return;
    }

    const products =
      [...S.products].sort(
        (a, b) => {
          const areaCompare =
            areaLabel(
              a.area
            ).localeCompare(
              areaLabel(
                b.area
              ),
              'pt-BR'
            );

          if (
            areaCompare !== 0
          ) {
            return areaCompare;
          }

          const categoryCompare =
            String(
              a.category || ''
            ).localeCompare(
              String(
                b.category || ''
              ),
              'pt-BR'
            );

          if (
            categoryCompare !==
            0
          ) {
            return categoryCompare;
          }

          return (
            Number(
              a.sort || 0
            ) -
            Number(
              b.sort || 0
            )
          );
        }
      );

    container.innerHTML =
      products
        .map(
          product => {
            const discount =
              Math.max(
                0,
                Math.min(
                  100,
                  Number(
                    product.discount_percent ||
                      0
                  )
                )
              );

            const finalPrice =
              getFinalPrice(
                product
              );

            return `
              <article
                class="admin-product"
              >

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
                      >
                    `
                    : `
                      <div class="admin-product-placeholder">
                        Sem imagem
                      </div>
                    `
                }

                <div
                  class="admin-product-info"
                >

                  <small>
                    ÁREA:
                    <strong>
                      ${esc(
                        areaLabel(
                          product.area
                        )
                      )}
                    </strong>
                  </small>

                  <small>
                    CATEGORIA:
                    <strong>
                      ${esc(
                        product.category ||
                          'Sem categoria'
                      )}
                    </strong>
                  </small>

                  <h3>
                    ${esc(
                      product.name
                    )}
                  </h3>

                  <p>
                    ${esc(
                      product.description ||
                        ''
                    )}
                  </p>

                  <div>

                    ${
                      discount > 0
                        ? `
                          <del>
                            ${money(
                              product.price
                            )}
                          </del>
                        `
                        : ''
                    }

                    <strong>
                      ${money(
                        finalPrice
                      )}
                    </strong>

                  </div>

                  ${
                    product.gramatura
                      ? `
                        <small>
                          ${product.gramatura} g
                        </small>
                      `
                      : ''
                  }

                  ${
                    product.serve_ate
                      ? `
                        <small>
                          Serve até
                          ${product.serve_ate}
                          ${
                            product.serve_ate ===
                            1
                              ? 'pessoa'
                              : 'pessoas'
                          }
                        </small>
                      `
                      : ''
                  }

                  <small>
                    Ordem:
                    ${Number(
                      product.sort || 0
                    )}
                  </small>

                  <small>
                    ${
                      product.available !==
                      false
                        ? 'Disponível'
                        : 'Indisponível'
                    }
                  </small>

                </div>

                <div
                  class="admin-product-actions"
                >

                  <button
                    type="button"
                    class="btn"
                    data-edit-product="${esc(
                      product.id
                    )}"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    class="btn danger"
                    data-delete-product="${esc(
                      product.id
                    )}"
                  >
                    Excluir
                  </button>

                </div>

              </article>
            `;
          }
        )
        .join('');

    container
      .querySelectorAll(
        '[data-edit-product]'
      )
      .forEach(button => {
        button.addEventListener(
          'click',
          () => {
            editProduct(
              button.dataset
                .editProduct
            );
          }
        );
      });

    container
      .querySelectorAll(
        '[data-delete-product]'
      )
      .forEach(button => {
        button.addEventListener(
          'click',
          () => {
            deleteProduct(
              button.dataset
                .deleteProduct
            );
          }
        );
      });
  }

  function editProduct(id) {
    const product =
      S.products.find(
        item =>
          String(item.id) ===
          String(id)
      );

    if (!product) return;

    S.editingId =
      product.id;

    renderProductPanel();

    renderProductForm(
      product
    );

    $('#productFormArea')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
  }

  async function deleteProduct(id) {
    const product =
      S.products.find(
        item =>
          String(item.id) ===
          String(id)
      );

    if (!product) return;

    const confirmed =
      window.confirm(
        `Excluir "${product.name}"?\n\nEssa ação não pode ser desfeita.`
      );

    if (!confirmed) return;

    const {
      error
    } = await client
      .from('products')
      .delete()
      .eq(
        'id',
        id
      );

    if (error) {
      console.error(
        'Erro ao excluir produto:',
        error
      );

      alert(
        `Não foi possível excluir o produto.\n\n${
          error.message || ''
        }`
      );

      return;
    }

    S.products =
      S.products.filter(
        item =>
          String(item.id) !==
          String(id)
      );

    buildCategories();

    renderProductPanel();

    alert(
      'Produto excluído com sucesso.'
    );
  }

  /* =========================================================
     CONFIGURAÇÕES
  ========================================================= */

  async function loadSettings() {
    if (!client) return;

    const {
      data,
      error
    } = await client
      .from('settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(
        'Erro ao carregar configurações:',
        error
      );

      return;
    }

    S.settings =
      data || {};
  }

  async function saveSettings() {
    if (!client) return;

    const payload = {
      ...S.settings
    };

    delete payload.products;

    const fields = {
      site_name:
        $('#siteName')?.value.trim(),

      site_description:
        $('#siteDescription')?.value.trim(),

      whatsapp:
        $('#siteWhatsapp')?.value.trim(),

      instagram:
        $('#siteInstagram')?.value.trim()
    };

    Object.entries(fields)
      .forEach(
        ([key, value]) => {
          if (
            value !==
            undefined
          ) {
            payload[key] =
              value;
          }
        }
      );

    const address =
      $('#siteAddress');

    if (address) {
      payload.address =
        address.value
          .split('\n')
          .map(
            line =>
              line.trim()
          )
          .filter(Boolean);
    }

    if (S.settings.id) {
      payload.id =
        S.settings.id;
    }

    const {
      data,
      error
    } = await client
      .from('settings')
      .upsert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.error(
        'Erro ao salvar configurações:',
        error
      );

      alert(
        `Erro ao salvar configurações:\n\n${
          error.message || ''
        }`
      );

      return;
    }

    S.settings =
      data || payload;

    alert(
      'Configurações salvas com sucesso.'
    );
  }

  function renderContentPanel() {
    const view = $('#view');

    if (!view) return;

    view.innerHTML = `
      <div class="admin-section">

        <div class="section-header">
          <div>
            <h2>Conteúdo do site</h2>

            <p>
              Edite as informações principais
              da confeitaria.
            </p>
          </div>
        </div>

        <form id="settingsForm">

          <div class="form-grid">

            <div class="field">
              <label>
                Nome do site
              </label>

              <input
                id="siteName"
                type="text"
                value="${esc(
                  S.settings.site_name ||
                  ''
                )}"
              >
            </div>

            <div class="field">
              <label>
                WhatsApp
              </label>

              <input
                id="siteWhatsapp"
                type="text"
                value="${esc(
                  S.settings.whatsapp ||
                  ''
                )}"
              >
            </div>

            <div class="field">
              <label>
                Instagram
              </label>

              <input
                id="siteInstagram"
                type="text"
                value="${esc(
                  S.settings.instagram ||
                  ''
                )}"
              >
            </div>

          </div>

          <div class="field">
            <label>
              Descrição
            </label>

            <textarea
              id="siteDescription"
              rows="5"
            >${esc(
              S.settings.site_description ||
              ''
            )}</textarea>
          </div>

          <div class="field">
            <label>
              Endereço
            </label>

            <textarea
              id="siteAddress"
              rows="4"
            >${esc(
              Array.isArray(
                S.settings.address
              )
                ? S.settings.address.join(
                    '\n'
                  )
                : S.settings.address ||
                    ''
            )}</textarea>
          </div>

          <button
            type="button"
            id="saveSettings"
            class="btn"
          >
            Salvar alterações
          </button>

        </form>

      </div>
    `;

    $('#saveSettings')
      ?.addEventListener(
        'click',
        saveSettings
      );
  }

  /* =========================================================
     OUTRAS ABAS
  ========================================================= */

  function renderPlaceholder(
    title,
    message
  ) {
    const view = $('#view');

    if (!view) return;

    view.innerHTML = `
      <div class="admin-section">

        <h2>
          ${esc(title)}
        </h2>

        <p>
          ${esc(message)}
        </p>

      </div>
    `;
  }

  function renderTab(tab) {
    S.currentTab =
      tab;

    const title =
      $('#title');

    const titles = {
      products:
        'Produtos',

      orders:
        'Pedidos',

      cakes:
        'Bolos personalizados',

      content:
        'Conteúdo',

      hours:
        'Horários e regras',

      media:
        'Mídia'
    };

    if (title) {
      title.textContent =
        titles[tab] ||
        'Painel';
    }

    switch (tab) {
      case 'products':
        renderProductPanel();
        break;

      case 'content':
        renderContentPanel();
        break;

      case 'orders':
        renderPlaceholder(
          'Pedidos',
          'Área de pedidos será conectada ao banco.'
        );
        break;

      case 'cakes':
        renderPlaceholder(
          'Bolos personalizados',
          'Área específica para bolos personalizados.'
        );
        break;

      case 'hours':
        renderPlaceholder(
          'Horários e regras',
          'Área para horários, agendamentos e regras.'
        );
        break;

      case 'media':
        renderPlaceholder(
          'Mídia',
          'Área para gerenciamento de imagens e mídia.'
        );
        break;

      default:
        renderProductPanel();
    }
  }

  function bindTabs() {
    document
      .querySelectorAll(
        '[data-tab]'
      )
      .forEach(button => {
        button.addEventListener(
          'click',
          () => {
            renderTab(
              button.dataset.tab
            );
          }
        );
      });
  }

  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  async function initPanel() {
    bindTabs();

    await Promise.all([
      loadProducts(),
      loadSettings()
    ]);

    renderTab(
      'products'
    );
  }

  function bindLogin() {
    const form =
      $('#loginForm');

    if (form) {
      form.addEventListener(
        'submit',
        login
      );
    }

    const logoutButton =
      $('#logout');

    if (logoutButton) {
      logoutButton.addEventListener(
        'click',
        logout
      );
    }
  }

  function listenAuth() {
    if (!client) return;

    client.auth.onAuthStateChange(
      async (
        event,
        session
      ) => {
        if (
          event ===
          'SIGNED_IN'
        ) {
          showApp();

          await initPanel();

          return;
        }

        if (
          event ===
          'SIGNED_OUT'
        ) {
          showLogin();
        }
      }
    );
  }

  async function init() {
    bindLogin();

    listenAuth();

    await checkSession();
  }

  init();

})();
