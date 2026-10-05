```javascript
(() => {
  'use strict';

  /*
    ============================================================
    MARTINS CONFEITARIA
    ADMINISTRATIVO DE PRODUTOS
    ============================================================

    Estrutura:

    ÁREA
      ↓
    CATEGORIA
      ↓
    PRODUTO

    A área define onde o produto será exibido.

    Exemplos:

    Pronta-entrega
      ├── Brownies
      ├── Brigadeiros
      └── Doces

    Bolo personalizado
      ├── Bolos personalizados
      ├── Chantininho
      └── Topos 3D

    Encomendas
      ├── Kit Festa
      ├── Salgados
      └── Doces

    ============================================================
  */


  /* ==========================================================
     CONFIGURAÇÃO
  ========================================================== */

  const CONFIG =
    window.MARTINS_CONFIG || {};

  const DEFAULTS =
    window.MARTINS_DEFAULTS || {};


  const client =
    CONFIG.SUPABASE_URL &&
    CONFIG.SUPABASE_ANON_KEY
      ? window.supabase.createClient(
          CONFIG.SUPABASE_URL,
          CONFIG.SUPABASE_ANON_KEY
        )
      : null;


  /* ==========================================================
     ESTADO
  ========================================================== */

  const S = {

    products: [],

    settings: {},

    editingId: null,

    categories: [],

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
    ]

  };


  /* ==========================================================
     HELPERS
  ========================================================== */

  const $ =
    selector =>
      document.querySelector(selector);


  const $$ =
    selector =>
      [
        ...document.querySelectorAll(
          selector
        )
      ];


  function esc(value) {

    return String(
      value ?? ''
    ).replace(
      /[&<>"']/g,
      char =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        }[char])
    );

  }


  function money(value) {

    return Number(
      value || 0
    ).toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL'
      }
    );

  }


  function normalize(value) {

    return String(
      value || ''
    )
      .trim()
      .toLowerCase();

  }


  function slug(value) {

    return normalize(
      value
    )
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /[^a-z0-9]+/g,
        '-'
      )
      .replace(
        /^-+|-+$/g,
        '');

  }


  function areaLabel(value) {

    const area =
      S.areas.find(
        item =>
          item.value ===
          value
      );

    return area
      ? area.label
      : value || '';

  }


  function getFinalPrice(product) {

    const price =
      Number(
        product?.price || 0
      );

    const discount =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            product?.discount_percent ||
              0
          )
        )
      );

    return (
      price *
      (1 - discount / 100)
    );

  }


  /* ==========================================================
     CATEGORIAS
  ========================================================== */

  /*
    As categorias são obtidas dos próprios produtos existentes.

    Isso significa que não precisamos manter uma lista fixa
    espalhada pelo código.

    A categoria pertence à área através dos produtos que usam
    aquela combinação.

    Exemplo:

    produto:
      area = pronta-entrega
      category = brownies

    então "Brownies" aparece para Pronta-entrega.

    produto:
      area = bolo-personalizado
      category = brownies

    seria outra categoria dentro de outra área.
  */

  function buildCategories() {

    const map =
      new Map();


    S.products.forEach(
      product => {

        const area =
          String(
            product.area || ''
          ).trim();


        const category =
          String(
            product.category || ''
          ).trim();


        if (
          !area ||
          !category
        ) {
          return;
        }


        if (
          !map.has(area)
        ) {

          map.set(
            area,
            new Map()
          );

        }


        const areaMap =
          map.get(area);


        const key =
          normalize(
            category
          );


        if (
          !areaMap.has(key)
        ) {

          areaMap.set(
            key,
            category
          );

        }

      }
    );


    S.categories =
      map;

  }


  function getCategoriesForArea(
    area
  ) {

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
            sensitivity:
              'base'
          }
        )
    );

  }


  /*
    Cria uma nova categoria dentro da área selecionada.

    Como a tabela atual de produtos não possui uma tabela
    separada de categorias, a categoria passa a existir
    oficialmente quando o primeiro produto daquela categoria
    é salvo.

    Por isso, depois de salvar um novo produto, ela passa a
    aparecer automaticamente no select.
  */

  async function createCategoryFromPrompt() {

    const area =
      getFieldValue(
        'productArea'
      );


    if (!area) {

      alert(
        'Selecione a área primeiro.'
      );

      return null;

    }


    const name =
      window.prompt(
        `Nova categoria para "${areaLabel(
          area
        )}":`
      );


    if (
      name === null
    ) {

      return null;

    }


    const category =
      name.trim();


    if (!category) {

      alert(
        'Informe um nome para a categoria.'
      );

      return null;

    }


    const exists =
      getCategoriesForArea(
        area
      ).some(
        item =>
          normalize(
            item
          ) ===
          normalize(
            category
          )
      );


    if (exists) {

      alert(
        'Essa categoria já existe nessa área.'
      );

      setCategoryValue(
        category
      );

      return category;

    }


    /*
      A categoria ainda não existe no banco.

      Ela será criada junto com o próximo produto.
    */

    setCategoryValue(
      category
    );


    return category;

  }


  /* ==========================================================
     CAMPOS
  ========================================================== */

  function getField(
    ...selectors
  ) {

    for (
      const selector
      of selectors
    ) {

      const element =
        $(selector);

      if (element) {
        return element;
      }

    }

    return null;

  }


  function getFieldValue(
    id
  ) {

    const element =
      document.getElementById(
        id
      );

    return element
      ? element.value
      : '';

  }


  function setFieldValue(
    id,
    value
  ) {

    const element =
      document.getElementById(
        id
      );

    if (element) {

      element.value =
        value ?? '';

    }

  }


  function setCategoryValue(
    value
  ) {

    const select =
      $('#productCategory');

    if (!select) {
      return;
    }


    const normalized =
      normalize(
        value
      );


    let option =
      [
        ...select.options
      ].find(
        item =>
          normalize(
            item.value
          ) ===
          normalized
      );


    /*
      Categoria recém-criada ainda pode não existir
      nas opções.

      Nesse caso, adicionamos temporariamente.
    */

    if (!option) {

      option =
        document.createElement(
          'option'
        );

      option.value =
        value;

      option.textContent =
        value;

      select.appendChild(
        option
      );

    }


    select.value =
      option.value;

  }


  /* ==========================================================
     ÁREAS
  ========================================================== */

  function renderAreaSelect() {

    const select =
      $('#productArea');

    if (!select) {
      return;
    }


    const current =
      select.value;


    select.innerHTML = `
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
            >
              ${esc(
                area.label
              )}
            </option>
          `
        )
        .join('')}
    `;


    if (
      current
    ) {

      select.value =
        current;

    }

  }


  /* ==========================================================
     CATEGORIA SELECT
  ========================================================== */

  function renderCategorySelect(
    selectedValue = ''
  ) {

    const select =
      $('#productCategory');

    if (!select) {
      return;
    }


    const area =
      getFieldValue(
        'productArea'
      );


    const categories =
      getCategoriesForArea(
        area
      );


    select.innerHTML = `
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
    `;


    if (
      selectedValue
    ) {

      const found =
        categories.find(
          category =>
            normalize(
              category
            ) ===
            normalize(
              selectedValue
            )
        );


      if (found) {

        select.value =
          found;

      } else {

        const option =
          document.createElement(
            'option'
          );

        option.value =
          selectedValue;

        option.textContent =
          selectedValue;

        select.insertBefore(
          option,
          select.lastElementChild
        );

        select.value =
          selectedValue;

      }

    }

  }


  /* ==========================================================
     QUANDO A ÁREA MUDA
  ========================================================== */

  function onAreaChange() {

    const oldCategory =
      getFieldValue(
        'productCategory'
      );


    renderCategorySelect(
      ''
    );


    /*
      Só reaproveitamos a categoria se ela existir
      na nova área.

      Isso impede que alguém troque:

      Pronta-entrega → Encomendas

      e continue com uma categoria que pertence
      à área anterior.
    */

    const available =
      getCategoriesForArea(
        getFieldValue(
          'productArea'
        )
      );


    const match =
      available.find(
        category =>
          normalize(
            category
          ) ===
          normalize(
            oldCategory
          )
      );


    if (match) {

      setCategoryValue(
        match
      );

    }

  }


  /* ==========================================================
     ORDEM AUTOMÁTICA
  ========================================================== */

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
              normalize(
                category
              )
        )
        .map(
          product =>
            Number(
              product.sort || 0
            )
        )
        .filter(
          value =>
            Number.isFinite(
              value
            )
        );


    if (!numbers.length) {

      return 1;

    }


    return (
      Math.max(
        ...numbers
      ) + 1
    );

  }


  /* ==========================================================
     FORMULÁRIO
  ========================================================== */

  function getProductForm() {

    const form =
      $('#productForm');


    if (!form) {

      return null;

    }


    const data =
      new FormData(
        form
      );


    const area =
      String(
        data.get(
          'area'
        ) ||
        getFieldValue(
          'productArea'
        ) ||
        ''
      ).trim();


    const category =
      String(
        data.get(
          'category'
        ) ||
        getFieldValue(
          'productCategory'
        ) ||
        ''
      ).trim();


    const name =
      String(
        data.get(
          'name'
        ) ||
        getFieldValue(
          'productName'
        ) ||
        ''
      ).trim();


    const description =
      String(
        data.get(
          'description'
        ) ||
        getFieldValue(
          'productDescription'
        ) ||
        ''
      ).trim();


    const priceRaw =
      data.get(
        'price'
      ) ??
      getFieldValue(
        'productPrice'
      );


    const gramaturaRaw =
      data.get(
        'gramatura'
      ) ??
      getFieldValue(
        'productGramatura'
      );


    const serveRaw =
      data.get(
        'serve_ate'
      ) ??
      getFieldValue(
        'productServe'
      );


    const discountRaw =
      data.get(
        'discount_percent'
      ) ??
      getFieldValue(
        'productDiscount'
      );


    const image =
      String(
        data.get(
          'image'
        ) ||
        getFieldValue(
          'productImage'
        ) ||
        ''
      ).trim();


    const appointment =
      getBooleanField(
        [
          '#productAppointment',
          '[name="appointment_required"]'
        ]
      );


    const available =
      getBooleanField(
        [
          '#productAvailable',
          '[name="available"]'
        ],
        true
      );


    const price =
      Number(
        String(
          priceRaw || '0'
        )
          .replace(
            /\./g,
            ''
          )
          .replace(
            ',',
            '.'
          )
      );


    const gramatura =
      Number(
        gramaturaRaw || 0
      );


    const serve_ate =
      Number(
        serveRaw || 0
      );


    const discount_percent =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            discountRaw || 0
          )
        )
      );


    return {

      area,

      category,

      name,

      description,

      price,

      gramatura:
        gramatura > 0
          ? gramatura
          : null,

      serve_ate:
        serve_ate > 0
          ? serve_ate
          : null,

      discount_percent,

      appointment_required:
        appointment,

      available,

      image

    };

  }


  function getBooleanField(
    selectors,
    defaultValue = false
  ) {

    for (
      const selector
      of selectors
    ) {

      const element =
        $(selector);

      if (!element) {
        continue;
      }


      if (
        element.type ===
        'checkbox'
      ) {

        return element.checked;

      }


      return (
        element.value ===
          'true' ||
        element.value ===
          '1' ||
        element.value ===
          'on' ||
        element.value ===
          'sim'
      );

    }


    return defaultValue;

  }


  /* ==========================================================
     VALIDAÇÃO
  ========================================================== */

  function validateProduct(
    product
  ) {

    const errors = [];


    if (!product.name) {

      errors.push(
        'Informe o nome do produto.'
      );

    }


    if (!product.area) {

      errors.push(
        'Selecione a área do produto.'
      );

    }


    if (!product.category) {

      errors.push(
        'Selecione uma categoria.'
      );

    }


    if (
      product.price <= 0
    ) {

      errors.push(
        'Informe um preço maior que zero.'
      );

    }


    if (
      product.discount_percent < 0 ||
      product.discount_percent > 100
    ) {

      errors.push(
        'O desconto deve estar entre 0% e 100%.'
      );

    }


    return errors;

  }


  /* ==========================================================
     ID
  ========================================================== */

  function generateId() {

    if (
      crypto &&
      crypto.randomUUID
    ) {

      return crypto.randomUUID();

    }


    return (
      Date.now()
        .toString(36) +
      Math.random()
        .toString(36)
        .slice(2)
    );

  }


  /* ==========================================================
     CARREGAR PRODUTOS
  ========================================================== */

  async function loadProducts() {

    if (!client) {

      console.error(
        'Supabase não configurado.'
      );

      return;

    }


    const {
      data,
      error
    } =
      await client
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
      Array.isArray(
        data
      )
        ? data
        : [];


    buildCategories();

    renderProductList();

    renderCategorySelect();

  }


  /* ==========================================================
     LISTA DE PRODUTOS
  ========================================================== */

  function renderProductList() {

    const container =
      getField(
        '#productsList',
        '#productList',
        '#products'
      );


    if (!container) {
      return;
    }


    if (
      !S.products.length
    ) {

      container.innerHTML = `
        <div class="empty">
          Nenhum produto cadastrado.
        </div>
      `;

      return;

    }


    const products =
      [
        ...S.products
      ].sort(
        (a, b) => {

          const areaA =
            areaLabel(
              a.area
            );

          const areaB =
            areaLabel(
              b.area
            );


          const areaCompare =
            areaA.localeCompare(
              areaB,
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
            categoryCompare !== 0
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
                data-product-id="${esc(
                  product.id
                )}"
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


                  <small>
                    Ordem:
                    ${Number(
                      product.sort || 0
                    )}
                  </small>


                  <small>
                    ${
                      product.available !== false
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


    bindProductActions();

  }


  /* ==========================================================
     AÇÕES DOS PRODUTOS
  ========================================================== */

  function bindProductActions() {

    $$(
      '[data-edit-product]'
    ).forEach(
      button => {

        button.onclick =
          () =>
            editProduct(
              button.dataset
                .editProduct
            );

      }
    );


    $$(
      '[data-delete-product]'
    ).forEach(
      button => {

        button.onclick =
          () =>
            deleteProduct(
              button.dataset
                .deleteProduct
            );

      }
    );

  }


  /* ==========================================================
     EDITAR
  ========================================================== */

  function editProduct(
    id
  ) {

    const product =
      S.products.find(
        item =>
          String(
            item.id
          ) ===
          String(id)
      );


    if (!product) {

      return;

    }


    S.editingId =
      product.id;


    setFieldValue(
      'productName',
      product.name
    );


    setFieldValue(
      'productDescription',
      product.description
    );


    setFieldValue(
      'productPrice',
      product.price
    );


    setFieldValue(
      'productGramatura',
      product.gramatura || ''
    );


    setFieldValue(
      'productServe',
      product.serve_ate || ''
    );


    setFieldValue(
      'productDiscount',
      product.discount_percent || 0
    );


    setFieldValue(
      'productImage',
      product.image || ''
    );


    setFieldValue(
      'productArea',
      product.area || ''
    );


    renderCategorySelect(
      product.category || ''
    );


    setCheckbox(
      'productAppointment',
      Boolean(
        product.appointment_required
      )
    );


    setCheckbox(
      'productAvailable',
      product.available !== false
    );


    const sort =
      getField(
        '#productSort'
      );


    if (sort) {

      sort.value =
        product.sort || 1;

    }


    const submit =
      getField(
        '#saveProduct',
        '#productSubmit',
        '#productForm button[type="submit"]'
      );


    if (submit) {

      submit.textContent =
        'Salvar alterações';

    }


    const form =
      $('#productForm');


    if (form) {

      form.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

    }

  }


  function setCheckbox(
    id,
    value
  ) {

    const element =
      document.getElementById(
        id
      );

    if (
      element &&
      element.type ===
        'checkbox'
    ) {

      element.checked =
        Boolean(value);

    }

  }


  /* ==========================================================
     LIMPAR FORMULÁRIO
  ========================================================== */

  function resetProductForm() {

    S.editingId =
      null;


    const form =
      $('#productForm');


    if (form) {

      form.reset();

    }


    setFieldValue(
      'productDiscount',
      0
    );


    setFieldValue(
      'productSort',
      ''
    );


    renderCategorySelect();


    const submit =
      getField(
        '#saveProduct',
        '#productSubmit',
        '#productForm button[type="submit"]'
      );


    if (submit) {

      submit.textContent =
        'Adicionar produto';

    }

  }


  /* ==========================================================
     SALVAR PRODUTO
  ========================================================== */

  async function saveProduct(
    event
  ) {

    if (event) {

      event.preventDefault();

    }


    if (!client) {

      alert(
        'Supabase não está configurado.'
      );

      return;

    }


    const product =
      getProductForm();


    if (!product) {

      alert(
        'Formulário de produto não encontrado.'
      );

      return;

    }


    const errors =
      validateProduct(
        product
      );


    if (
      errors.length
    ) {

      alert(
        errors.join(
          '\n'
        )
      );

      return;

    }


    /*
      Se o produto for novo e a ordem estiver vazia,
      o sistema calcula automaticamente a próxima posição.
    */

    let sort =
      Number(
        getFieldValue(
          'productSort'
        )
      );


    if (
      !sort ||
      sort < 1
    ) {

      if (
        S.editingId
      ) {

        const old =
          S.products.find(
            item =>
              String(
                item.id
              ) ===
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
            product.area,
            product.category
          );

      }

    }


    const payload = {

      name:
        product.name,

      description:
        product.description,

      price:
        product.price,

      category:
        product.category,

      area:
        product.area,

      image:
        product.image,

      gramatura:
        product.gramatura,

      serve_ate:
        product.serve_ate,

      discount_percent:
        product.discount_percent,

      appointment_required:
        product.appointment_required,

      available:
        product.available,

      sort

    };


    let result;


    if (
      S.editingId
    ) {

      result =
        await client
          .from('products')
          .update(
            payload
          )
          .eq(
            'id',
            S.editingId
          );

    } else {

      payload.id =
        generateId();


      result =
        await client
          .from('products')
          .insert(
            payload
          );

    }


    if (
      result.error
    ) {

      console.error(
        'Erro ao salvar produto:',
        result.error
      );


      alert(
        `Erro ao salvar produto:\n\n${
          result.error.message ||
          'Erro desconhecido'
        }`
      );

      return;

    }


    alert(
      S.editingId
        ? 'Produto atualizado com sucesso.'
        : 'Produto adicionado com sucesso.'
    );


    resetProductForm();

    await loadProducts();

  }


  /* ==========================================================
     EXCLUIR PRODUTO
  ========================================================== */

  async function deleteProduct(
    id
  ) {

    const product =
      S.products.find(
        item =>
          String(
            item.id
          ) ===
          String(id)
      );


    if (!product) {

      return;

    }


    const confirmed =
      window.confirm(
        `Excluir "${product.name}"?\n\nEssa ação não pode ser desfeita.`
      );


    if (!confirmed) {

      return;

    }


    if (!client) {

      alert(
        'Supabase não está configurado.'
      );

      return;

    }


    const {
      error
    } =
      await client
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
          error.message ||
          ''
        }`
      );

      return;

    }


    S.products =
      S.products.filter(
        item =>
          String(
            item.id
          ) !==
          String(id)
      );


    buildCategories();

    renderProductList();

    renderCategorySelect();


    alert(
      'Produto excluído com sucesso.'
    );

  }


  /* ==========================================================
     CONFIGURAÇÕES DO SITE
  ========================================================== */

  async function loadSettings() {

    if (!client) {
      return;
    }


    const {
      data,
      error
    } =
      await client
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

    /*
      IMPORTANTE:

      Produtos NÃO são salvos em settings.

      Produtos pertencem exclusivamente à tabela products.
    */

    fillSettingsForm();

  }


  function fillSettingsForm() {

    const settings =
      S.settings || {};


    /*
      Campos comuns de configuração.
      Só preenche se eles existirem na página.
    */

    setIfExists(
      '#siteName',
      settings.site_name
    );


    setIfExists(
      '#siteDescription',
      settings.site_description
    );


    setIfExists(
      '#siteWhatsapp',
      settings.whatsapp
    );


    setIfExists(
      '#siteInstagram',
      settings.instagram
    );


    setIfExists(
      '#siteAddress',
      Array.isArray(
        settings.address
      )
        ? settings.address.join(
            '\n'
          )
        : settings.address
    );

  }


  function setIfExists(
    selector,
    value
  ) {

    const element =
      $(selector);

    if (
      element &&
      value !== undefined &&
      value !== null
    ) {

      element.value =
        value;

    }

  }


  async function saveSite() {

    if (!client) {

      alert(
        'Supabase não está configurado.'
      );

      return;

    }


    /*
      Copiamos somente as configurações.

      NUNCA colocamos S.products dentro de settings.
    */

    const payload = {

      ...S.settings

    };


    delete payload.products;


    const siteName =
      getField(
        '#siteName'
      );


    const siteDescription =
      getField(
        '#siteDescription'
      );


    const whatsapp =
      getField(
        '#siteWhatsapp'
      );


    const instagram =
      getField(
        '#siteInstagram'
      );


    const address =
      getField(
        '#siteAddress'
      );


    if (siteName) {

      payload.site_name =
        siteName.value.trim();

    }


    if (siteDescription) {

      payload.site_description =
        siteDescription.value.trim();

    }


    if (whatsapp) {

      payload.whatsapp =
        whatsapp.value.trim();

    }


    if (instagram) {

      payload.instagram =
        instagram.value.trim();

    }


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


    /*
      Preserva o ID da configuração,
      caso exista.
    */

    if (
      S.settings.id
    ) {

      payload.id =
        S.settings.id;

    }


    const {
      data,
      error
    } =
      await client
        .from('settings')
        .upsert(
          payload
        )
        .select()
        .maybeSingle();


    if (error) {

      console.error(
        'Erro ao salvar configurações:',
        error
      );


      alert(
        `Erro ao salvar configurações:\n\n${
          error.message ||
          ''
        }`
      );

      return;

    }


    S.settings =
      data ||
      payload;


    alert(
      'Configurações salvas com sucesso.'
    );

  }


  /* ==========================================================
     EVENTOS
  ========================================================== */

  function bindEvents() {

    const area =
      $('#productArea');


    if (area) {

      area.addEventListener(
        'change',
        onAreaChange
      );

    }


    const category =
      $('#productCategory');


    if (category) {

      category.addEventListener(
        'change',
        async event => {

          if (
            event.target.value !==
            '__new__'
          ) {

            return;

          }


          const value =
            await createCategoryFromPrompt();


          if (!value) {

            renderCategorySelect();

          }

        }
      );

    }


    const form =
      $('#productForm');


    if (form) {

      form.addEventListener(
        'submit',
        saveProduct
      );

    }


    const newButton =
      getField(
        '#newProduct',
        '#addProduct',
        '[data-new-product]'
      );


    if (newButton) {

      newButton.addEventListener(
        'click',
        event => {

          event.preventDefault();

          resetProductForm();

        }
      );

    }


    const saveSettings =
      getField(
        '#saveSite',
        '#saveSettings',
        '[data-save-site]'
      );


    if (saveSettings) {

      saveSettings.addEventListener(
        'click',
        event => {

          event.preventDefault();

          saveSite();

        }
      );

    }

  }


  /* ==========================================================
     INICIALIZAÇÃO
  ========================================================== */

  async function init() {

    renderAreaSelect();

    bindEvents();

    await Promise.all([
      loadProducts(),
      loadSettings()
    ]);

    renderCategorySelect();

  }


  init();

})();
```

### Importante antes de colar

Esse código pressupõe que seu formulário do `admin.html` tenha estes IDs:

```text
productForm
productName
productDescription
productPrice
productArea
productCategory
productGramatura
productServe
productDiscount
productImage
productAppointment
productAvailable
productSort
```

