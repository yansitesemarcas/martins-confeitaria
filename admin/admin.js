(() => {

  const C = window.MARTINS_CONFIG || {};
  const D = window.MARTINS_DEFAULTS || {};

  const client =
    C.SUPABASE_URL && C.SUPABASE_ANON_KEY
      ? supabase.createClient(
          C.SUPABASE_URL,
          C.SUPABASE_ANON_KEY
        )
      : null;

  const $ = s => document.querySelector(s);

  const esc = s =>
    String(s ?? '').replace(
      /[&<>"']/g,
      m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[m])
    );

  let S = structuredClone(D);
  let tab = 'products';

  /* =========================================================
     ÁREAS
  ========================================================= */

  const AREAS = [
    {
      value: 'cardapio',
      label: 'Delivery'
    },
    {
      value: 'pronta-entrega',
      label: 'Pronta entrega'
    },
    {
      value: 'encomendas',
      label: 'Encomendas'
    }
  ];

  function normalizeArea(area) {

    const value =
      String(area || 'cardapio')
        .trim()
        .toLowerCase()
        .replace(/_/g, '-')
        .replace(/\s+/g, '-');

    if (
      value === 'pronta' ||
      value === 'ready' ||
      value === 'delivery'
    ) {
      return 'pronta-entrega';
    }

    if (
      value === 'encomenda' ||
      value === 'bolo-personalizado'
    ) {
      return 'encomendas';
    }

    if (value === 'encomendas') {
      return 'encomendas';
    }

    return 'cardapio';
  }

  function areaLabel(area) {

    const normalized = normalizeArea(area);

    const found =
      AREAS.find(x => x.value === normalized);

    return found
      ? found.label
      : 'Delivery';
  }

  /* =========================================================
     CATEGORIAS
     ========================================================= */

  function categoryNames(current = '') {

    const list = [];

    if (Array.isArray(S.categories)) {
      list.push(...S.categories);
    }

    /*
      Também pega categorias que já existem nos produtos.
      Assim um produto antigo com categoria "Bolos"
      não desaparece do seletor.
    */

    if (Array.isArray(S.products)) {
      S.products.forEach(p => {
        if (p.category) {
          list.push(p.category);
        }
      });
    }

    if (current) {
      list.push(current);
    }

    return [
      ...new Set(
        list
          .map(x => String(x || '').trim())
          .filter(Boolean)
      )
    ];
  }

  function addCategory(category) {

    category =
      String(category || '').trim();

    if (!category) {
      return;
    }

    if (!Array.isArray(S.categories)) {
      S.categories = [];
    }

    const exists =
      S.categories.some(
        x =>
          String(x).toLowerCase() ===
          category.toLowerCase()
      );

    if (!exists) {
      S.categories.push(category);
    }
  }

  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  async function init() {

    if (!client) {

      $('#loginMsg').textContent =
        'Configure SUPABASE_URL e SUPABASE_ANON_KEY em config.js.';

      return;
    }

    const { data } =
      await client.auth.getSession();

    if (data.session) {
      show();
    }

    client.auth.onAuthStateChange(
      (_, session) => {

        if (session) {
          show();
        } else {
          hide();
        }

      }
    );
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  function show() {

    $('#login')
      ?.classList
      .add('hidden');

    $('#app')
      ?.classList
      .remove('hidden');

    load();

    if (!window.__martinsRealtime) {

      window.__martinsRealtime = true;

      client
        .channel('admin-live')

        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders'
          },
          () => {

            if (tab === 'orders') {
              orders();
            }

            try {

              new Audio(
                'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
              ).play();

            } catch (e) {}

            alert('Novo pedido recebido!');
          }
        )

        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'custom_cakes'
          },
          () => {

            if (tab === 'cakes') {
              cakes();
            }

            alert(
              'Novo pedido de bolo personalizado!'
            );
          }
        )

        .subscribe();
    }
  }

  function hide() {

    $('#app')
      ?.classList
      .add('hidden');

    $('#login')
      ?.classList
      .remove('hidden');
  }

  /* =========================================================
     LOGIN FORM
  ========================================================= */

  if ($('#loginForm')) {

    $('#loginForm').onsubmit =
      async e => {

        e.preventDefault();

        const f =
          new FormData(e.target);

        const { error } =
          await client.auth.signInWithPassword({
            email: f.get('email'),
            password: f.get('password')
          });

        if (error) {

          $('#loginMsg').textContent =
            error.message;
        }
      };
  }

  if ($('#logout')) {

    $('#logout').onclick =
      () => client.auth.signOut();
  }

  document
    .querySelectorAll('[data-tab]')
    .forEach(button => {

      button.onclick = () => {

        tab = button.dataset.tab;

        document
          .querySelectorAll('[data-tab]')
          .forEach(x =>
            x.classList.toggle(
              'active',
              x === button
            )
          );

        render();
      };
    });

  /* =========================================================
     CARREGAR DADOS
  ========================================================= */

  async function load() {

    const [
      settingsResult,
      productsResult
    ] = await Promise.all([

      client
        .from('settings')
        .select('value')
        .eq('key', 'site')
        .maybeSingle(),

      client
        .from('products')
        .select('*')
        .order('sort', {
          ascending: true
        })

    ]);

    if (settingsResult.error) {

      console.error(
        'Erro ao carregar configurações:',
        settingsResult.error
      );
    }

    if (productsResult.error) {

      console.error(
        'Erro ao carregar produtos:',
        productsResult.error
      );

      alert(
        'Erro ao carregar produtos: ' +
        productsResult.error.message
      );

      return;
    }

    if (settingsResult.data?.value) {

      S = {
        ...S,
        ...settingsResult.data.value
      };
    }

    S.products =
      Array.isArray(productsResult.data)
        ? productsResult.data
        : [];

    /*
      Mantém categorias antigas e também
      descobre categorias existentes nos produtos.
    */

    categoryNames().forEach(category => {
      addCategory(category);
    });

    render();
  }

  /* =========================================================
     RENDER
  ========================================================= */

  function render() {

    const names = {

      products: 'Produtos',
      orders: 'Pedidos',
      cakes: 'Bolos personalizados',
      content: 'Conteúdo',
      hours: 'Horários e regras',
      media: 'Mídia'

    };

    $('#title').textContent =
      names[tab] || 'Administração';

    const pages = {
      products,
      orders,
      cakes,
      content,
      hours,
      media
    };

    if (pages[tab]) {
      pages[tab]();
    }
  }

  /* =========================================================
     PRODUTOS
  ========================================================= */

  function products() {

    const groups = [

      {
        key: 'cardapio',
        title: 'Delivery',
        className: 'delivery'
      },

      {
        key: 'pronta-entrega',
        title: 'Pronta entrega',
        className: 'ready'
      },

      {
        key: 'encomendas',
        title: 'Encomendas',
        className: 'orders'
      }

    ];

    $('#view').innerHTML = `

      <div class="card">

        <div class="toolbar">

          <div>

            <h2>Produtos</h2>

            <p>
              Organize os produtos entre
              Delivery, Pronta entrega e
              Encomendas.
            </p>

          </div>

          <button
            class="btn"
            id="new"
          >
            + Novo produto
          </button>

        </div>

      </div>

      <div class="product-groups">

        ${groups.map(group => {

          const items =
            S.products.filter(
              p =>
                normalizeArea(p.area) ===
                group.key
            );

          return `

            <section class="card area-section">

              <div class="area-section-head">

                <div>

                  <span
                    class="
                      area-badge
                      ${group.className}
                    "
                  >
                    ${group.title}
                  </span>

                  <h2>
                    ${group.title}
                  </h2>

                  <p>
                    ${items.length}
                    produto(s)
                  </p>

                </div>

                <button
                  class="btn alt"
                  data-new-area="${group.key}"
                >
                  + Adicionar aqui
                </button>

              </div>

              <div class="table-wrap">

                <table class="table">

                  <thead>

                    <tr>

                      <th>Foto</th>
                      <th>Produto</th>
                      <th>Categoria</th>
                      <th>Preço</th>
                      <th>Desconto</th>
                      <th>Disponível</th>
                      <th>Ações</th>

                    </tr>

                  </thead>

                  <tbody>

                    ${
                      items.length

                        ? items.map(p => {

                            const discount =
                              Number(
                                p.discount_percent || 0
                              );

                            const finalPrice =
                              Number(
                                p.price || 0
                              ) *
                              (
                                1 -
                                discount / 100
                              );

                            return `

                              <tr>

                                <td>

                                  ${
                                    p.image

                                      ? `
                                        <img
                                          src="${esc(p.image)}"
                                          alt="${esc(p.name)}"
                                        >
                                      `

                                      : `
                                        <span class="status">
                                          Sem foto
                                        </span>
                                      `
                                  }

                                </td>

                                <td>

                                  <b>
                                    ${esc(p.name)}
                                  </b>

                                  <br>

                                  <small>
                                    ${esc(
                                      p.description || ''
                                    )}
                                  </small>

                                </td>

                                <td>
                                  ${esc(
                                    p.category ||
                                    'Sem categoria'
                                  )}
                                </td>

                                <td>

                                  ${
                                    discount > 0

                                      ? `
                                        <del>
                                          R$
                                          ${Number(
                                            p.price || 0
                                          )
                                            .toFixed(2)
                                            .replace('.', ',')}
                                        </del>

                                        <br>

                                        <b>
                                          R$
                                          ${finalPrice
                                            .toFixed(2)
                                            .replace('.', ',')}
                                        </b>
                                      `

                                      : `
                                        R$
                                        ${Number(
                                          p.price || 0
                                        )
                                          .toFixed(2)
                                          .replace('.', ',')}
                                      `
                                  }

                                </td>

                                <td>
                                  ${
                                    discount > 0
                                      ? discount + '%'
                                      : 'Sem desconto'
                                  }
                                </td>

                                <td>
                                  ${
                                    p.available !== false
                                      ? 'Sim'
                                      : 'Não'
                                  }
                                </td>

                                <td>

                                  <button
                                    class="btn alt edit"
                                    data-id="${p.id}"
                                  >
                                    Editar
                                  </button>

                                  <button
                                    class="btn alt del"
                                    data-id="${p.id}"
                                  >
                                    Excluir
                                  </button>

                                </td>

                              </tr>

                            `;

                          }).join('')

                        : `

                          <tr>

                            <td colspan="7">

                              <div class="empty">
                                Nenhum produto nesta área.
                              </div>

                            </td>

                          </tr>

                        `
                    }

                  </tbody>

                </table>

              </div>

            </section>

          `;

        }).join('')}

      </div>

    `;

    $('#new').onclick =
      () => editProduct();

    document
      .querySelectorAll('[data-new-area]')
      .forEach(button => {

        button.onclick = () => {

          editProduct({

            name: '',
            description: '',
            price: '',
            category: '',
            image: '',

            available: true,
            featured: false,
            sort: 0,

            area:
              button.dataset.newArea,

            gramatura: '',
            serve_ate: '',

            discount_percent: 0,

            appointment_required: false

          });

        };
      });

    document
      .querySelectorAll('.edit')
      .forEach(button => {

        button.onclick = () => {

          const product =
            S.products.find(
              p =>
                String(p.id) ===
                String(button.dataset.id)
            );

          if (product) {
            editProduct(product);
          }
        };
      });

    document
      .querySelectorAll('.del')
      .forEach(button => {

        button.onclick =
          async () => {

            if (
              !confirm(
                'Excluir este produto?'
              )
            ) {
              return;
            }

            const { error } =
              await client
                .from('products')
                .delete()
                .eq(
                  'id',
                  button.dataset.id
                );

            if (error) {

              alert(
                'Erro ao excluir produto: ' +
                error.message
              );

              return;
            }

            await load();
          };
      });
  }

  /* =========================================================
     EDITAR / CRIAR PRODUTO
  ========================================================= */

  function editProduct(

    p = {

      name: '',
      description: '',
      price: '',

      category:
        categoryNames()[0] || '',

      image: '',

      available: true,
      featured: false,
      sort: 0,

      area: 'cardapio',

      gramatura: '',
      serve_ate: '',

      discount_percent: 0,

      appointment_required: false

    }

  ) {

    const currentArea =
      normalizeArea(p.area);

    const categories =
      categoryNames(p.category);

    $('#view').innerHTML = `

      <div class="card">

        <div class="toolbar">

          <div>

            <span
              class="
                area-badge
                ${
                  currentArea === 'pronta-entrega'
                    ? 'ready'
                    :
                  currentArea === 'encomendas'
                    ? 'orders'
                    : 'delivery'
                }
              "
            >
              ${areaLabel(currentArea)}
            </span>

            <h2>
              ${
                p.id
                  ? 'Editar produto'
                  : 'Novo produto'
              }
            </h2>

            <p>
              Escolha a área, categoria e foto.
            </p>

          </div>

        </div>

        <form
          id="pf"
          class="formgrid"
        >

          <label class="field">

            Nome

            <input
              name="name"
              required
              maxlength="120"
              value="${esc(p.name)}"
            >

          </label>

          <label class="field">

            Preço

            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              value="${p.price}"
            >

          </label>

          <label class="field">

            Área

            <select name="area">

              ${AREAS.map(area => `

                <option
                  value="${area.value}"
                  ${
                    currentArea === area.value
                      ? 'selected'
                      : ''
                  }
                >
                  ${area.label}
                </option>

              `).join('')}

            </select>

          </label>

          <label class="field">

            Categoria

            <select
              name="category"
              id="productCategory"
              required
            >

              ${
                categories.length
                  ? categories.map(category => `

                      <option
                        value="${esc(category)}"
                        ${
                          String(category) ===
                          String(p.category || '')
                            ? 'selected'
                            : ''
                        }
                      >
                        ${esc(category)}
                      </option>

                    `).join('')
                  : `
                      <option value="">
                        Selecione uma categoria
                      </option>
                    `
              }

              <option value="__new__">
                + Criar nova categoria
              </option>

            </select>

          </label>

          <label
            class="
              field
              full
              category-new
              hidden
            "
            id="newCategoryWrap"
          >

            Nova categoria

            <input
              name="new_category"
              id="newCategory"
              maxlength="80"
              placeholder="Ex.: Bolos"
            >

            <small>
              A categoria ficará disponível
              nos próximos produtos.
            </small>

          </label>

          <label class="field">

            Gramatura (g)

            <input
              name="gramatura"
              type="number"
              min="0"
              step="1"
              value="${p.gramatura ?? ''}"
              placeholder="Ex.: 220"
            >

          </label>

          <label class="field">

            Serve até (pessoas)

            <input
              name="serve_ate"
              type="number"
              min="1"
              step="1"
              value="${p.serve_ate ?? ''}"
              placeholder="Ex.: 5"
            >

          </label>

          <label class="field">

            Desconto (%)

            <input
              name="discount_percent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value="${p.discount_percent ?? 0}"
            >

          </label>

          <label class="field">

            Ordem

            <input
              name="sort"
              type="number"
              min="0"
              value="${p.sort || 0}"
            >

          </label>

          <label class="field full">

            Foto do produto

            <div class="product-image-box">

              <img
                id="productImagePreview"
                class="product-image-preview"
                src="${esc(p.image || '')}"
                alt="Prévia da foto"
                ${
                  p.image
                    ? ''
                    : 'hidden'
                }
              >

              <input
                id="productImageFile"
                type="file"
                accept="image/*"
              >

              <small>
                Escolha uma foto do celular
                ou computador.
              </small>

              <input
                name="image"
                id="productImageUrl"
                value="${esc(p.image || '')}"
                placeholder="Ou cole uma URL pública"
              >

            </div>

          </label>

          <label class="field full">

            Descrição

            <textarea
              name="description"
              maxlength="500"
            >${esc(
              p.description || ''
            )}</textarea>

          </label>

          <label>

            <input
              name="available"
              type="checkbox"
              ${
                p.available !== false
                  ? 'checked'
                  : ''
              }
            >

            Disponível

          </label>

          <label>

            <input
              name="featured"
              type="checkbox"
              ${
                p.featured
                  ? 'checked'
                  : ''
              }
            >

            Destaque

          </label>

          <label>

            <input
              name="appointment_required"
              type="checkbox"
              ${
                p.appointment_required
                  ? 'checked'
                  : ''
              }
            >

            Agendamento obrigatório

          </label>

          <div class="row">

            <button class="btn">
              Salvar
            </button>

            <button
              type="button"
              class="btn alt"
              id="back"
            >
              Cancelar
            </button>

          </div>

          <small
            id="productMsg"
            class="field full"
          ></small>

        </form>

      </div>

    `;

    const categorySelect =
      $('#productCategory');

    const newCategoryWrap =
      $('#newCategoryWrap');

    const newCategoryInput =
      $('#newCategory');

    function syncCategoryField() {

      const isNew =
        categorySelect.value === '__new__';

      newCategoryWrap
        .classList
        .toggle(
          'hidden',
          !isNew
        );

      newCategoryInput.required =
        isNew;
    }

    categorySelect.onchange =
      syncCategoryField;

    syncCategoryField();

    const imageFile =
      $('#productImageFile');

    const imagePreview =
      $('#productImagePreview');

    const imageUrl =
      $('#productImageUrl');

    imageFile.onchange =
      () => {

        const file =
          imageFile.files?.[0];

        if (!file) {
          return;
        }

        imagePreview.src =
          URL.createObjectURL(file);

        imagePreview.hidden = false;
      };

    imageUrl.oninput =
      () => {

        const value =
          imageUrl.value.trim();

        if (value) {

          imagePreview.src = value;
          imagePreview.hidden = false;

        }
      };

    $('#back').onclick =
      products;

    $('#pf').onsubmit =
      async e => {

        e.preventDefault();

        const msg =
          $('#productMsg');

        const f =
          new FormData(e.target);

        msg.textContent =
          'Salvando...';

        const area =
          normalizeArea(
            f.get('area')
          );

        let category =
          String(
            f.get('category') || ''
          ).trim();

        /* NOVA CATEGORIA */

        if (category === '__new__') {

          category =
            String(
              f.get('new_category') || ''
            ).trim();

          if (!category) {

            msg.textContent =
              'Informe o nome da nova categoria.';

            return;
          }

          addCategory(category);

          const saved =
            await saveSite();

          if (!saved) {

            msg.textContent =
              'Não foi possível salvar a categoria.';

            return;
          }
        }

        if (!category) {

          msg.textContent =
            'Selecione uma categoria.';

          return;
        }

        const price =
          Number(
            f.get('price')
          );

        if (!Number.isFinite(price)) {

          msg.textContent =
            'Informe um preço válido.';

          return;
        }

        const discount =
          Math.max(
            0,
            Math.min(
              100,
              Number(
                f.get(
                  'discount_percent'
                ) || 0
              )
            )
          );

        let image =
          String(
            f.get('image') || ''
          ).trim();

        /* UPLOAD DA FOTO */

        const file =
          imageFile.files?.[0];

        if (file) {

          const safeName =
            file.name
              .normalize('NFD')
              .replace(
                /[\u0300-\u036f]/g,
                ''
              )
              .replace(
                /[^a-zA-Z0-9._-]/g,
                '-'
              );

          const path =
            `products/${Date.now()}-${safeName}`;

          const {
            error: uploadError
          } =
            await client
              .storage
              .from('media')
              .upload(
                path,
                file,
                {
                  cacheControl: '3600',
                  upsert: false,
                  contentType:
                    file.type || undefined
                }
              );

          if (uploadError) {

            msg.textContent =
              'Erro ao enviar a foto: ' +
              uploadError.message;

            return;
          }

          const {
            data: publicData
          } =
            client
              .storage
              .from('media')
              .getPublicUrl(path);

          image =
            publicData?.publicUrl ||
            image;
        }

        const gramaturaValue =
          String(
            f.get('gramatura') || ''
          ).trim();

        const serveValue =
          String(
            f.get('serve_ate') || ''
          ).trim();

        const obj = {

          name:
            String(
              f.get('name') || ''
            ).trim(),

          description:
            String(
              f.get('description') || ''
            ).trim(),

          price,

          category,

          image,

          available:
            f.has('available'),

          featured:
            f.has('featured'),

          sort:
            Number(
              f.get('sort') || 0
            ),

          area,

          gramatura:
            gramaturaValue === ''
              ? null
              : Number(
                  gramaturaValue
                ),

          serve_ate:
            serveValue === ''
              ? null
              : Number(
                  serveValue
                ),

          discount_percent:
            discount,

          appointment_required:
            f.has(
              'appointment_required'
            )

        };

        let result;

        if (p.id) {

          result =
            await client
              .from('products')
              .update(obj)
              .eq(
                'id',
                p.id
              );

        } else {

          result =
            await client
              .from('products')
              .insert(obj);

        }

        if (result.error) {

          msg.textContent =
            'Erro ao salvar produto: ' +
            result.error.message;

          return;
        }

        /*
          Salva categorias no settings.
        */

        addCategory(category);

        await saveSite();

        await load();
      };
  }

  /* =========================================================
     SALVAR CONFIGURAÇÕES
  ========================================================= */

  async function saveSite() {

    const payload =
      structuredClone(S);

    delete payload.products;

    const { error } =
      await client
        .from('settings')
        .upsert(
          {
            key: 'site',
            value: payload
          },
          {
            onConflict: 'key'
          }
        );

    if (error) {

      alert(
        'Erro ao salvar configurações: ' +
        error.message
      );

      return false;
    }

    return true;
  }

  /* =========================================================
     CONTEÚDO
  ========================================================= */

  function content() {

    const a =
      S.about || {};

    $('#view').innerHTML = `

      <div class="card">

        <h2>
          Conteúdo do site
        </h2>

        <form
          id="cf"
          class="formgrid"
        >

          <label class="field">

            Nome da pessoa responsável

            <input
              name="about.name"
              value="${esc(a.name)}"
            >

          </label>

          <label class="field">

            Foto (URL)

            <input
              name="about.photo"
              value="${esc(a.photo)}"
            >

          </label>

          <label class="field full">

            Título

            <input
              name="about.title"
              value="${esc(a.title)}"
            >

          </label>

          <label class="field full">

            Frase

            <input
              name="about.quote"
              value="${esc(a.quote)}"
            >

          </label>

          <label class="field full">

            História

            <textarea
              name="about.text"
            >${esc(a.text)}</textarea>

          </label>

          <label class="field">

            Instagram

            <input
              name="instagram"
              value="${esc(
                S.instagram || ''
              )}"
            >

          </label>

          <label class="field">

            WhatsApp

            <input
              name="whatsapp"
              value="${esc(
                S.whatsapp || ''
              )}"
            >

          </label>

          <label class="field">

            Google Maps (URL)

            <input
              name="maps"
              value="${esc(
                S.maps || ''
              )}"
            >

          </label>

          <label class="field">

            Google Avaliações (URL)

            <input
              name="review"
              value="${esc(
                S.review || ''
              )}"
            >

          </label>

          <div class="row">

            <button class="btn">
              Salvar
            </button>

          </div>

        </form>

      </div>

    `;

    $('#cf').onsubmit =
      saveSettings;
  }

  async function saveSettings(e) {

    e.preventDefault();

    const f =
      new FormData(e.target);

    S.instagram =
      f.get('instagram');

    S.whatsapp =
      f.get('whatsapp');

    S.maps =
      f.get('maps');

    S.review =
      f.get('review');

    S.about = {

      ...S.about,

      name:
        f.get('about.name'),

      photo:
        f.get('about.photo'),

      title:
        f.get('about.title'),

      quote:
        f.get('about.quote'),

      text:
        f.get('about.text')

    };

    const saved =
      await saveSite();

    if (saved) {
      alert('Salvo!');
    }
  }

  /* =========================================================
     HORÁRIOS
  ========================================================= */

  function hours() {

    const days = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado'
    ];

    const hoursData =
      Array.isArray(S.hours)
        ? S.hours
        : days.map(() => ({
            s: 'closed',
            o: '',
            c: ''
          }));

    $('#view').innerHTML = `

      <div class="card">

        <h2>
          Horários
        </h2>

        <form id="hf">

          ${days.map(
            (day, i) => {

              const h =
                hoursData[i] || {
                  s: 'closed',
                  o: '',
                  c: ''
                };

              return `

                <div class="formgrid">

                  <label class="field">

                    ${day}

                    <select
                      name="s${i}"
                    >

                      <option
                        value="open"
                        ${
                          h.s === 'open'
                            ? 'selected'
                            : ''
                        }
                      >
                        Aberto
                      </option>

                      <option
                        value="closed"
                        ${
                          h.s === 'closed'
                            ? 'selected'
                            : ''
                        }
                      >
                        Fechado
                      </option>

                      <option
                        value="tbd"
                        ${
                          h.s === 'tbd'
                            ? 'selected'
                            : ''
                        }
                      >
                        A confirmar
                      </option>

                    </select>

                  </label>

                  <label class="field">

                    Abertura

                    <input
                      name="o${i}"
                      type="time"
                      value="${h.o || ''}"
                    >

                  </label>

                  <label class="field">

                    Fechamento

                    <input
                      name="c${i}"
                      type="time"
                      value="${h.c || ''}"
                    >

                  </label>

                </div>

              `;
            }
          ).join('')}

          <hr>

          <label class="field">

            Opções de recebimento
            (uma por linha)

            <textarea
              name="delivery"
            >${(
              S.delivery || []
            ).join('\n')}</textarea>

          </label>

          <label class="field">

            Informação de entrega

            <textarea
              name="deliveryInfo"
            >${esc(
              S.deliveryInfo || ''
            )}</textarea>

          </label>

          <label class="field">

            Formas de pagamento
            (uma por linha)

            <textarea
              name="payments"
            >${(
              S.payments || []
            ).join('\n')}</textarea>

          </label>

          <label class="field">

            Categorias
            (uma por linha)

            <textarea
              name="categories"
            >${(
              S.categories || []
            ).join('\n')}</textarea>

          </label>

          <button class="btn">
            Salvar
          </button>

        </form>

      </div>

    `;

    $('#hf').onsubmit =
      saveHours;
  }

  async function saveHours(e) {

    e.preventDefault();

    const f =
      new FormData(e.target);

    const currentHours =
      Array.isArray(S.hours)
        ? S.hours
        : [];

    S.hours =
      Array.from(
        { length: 7 },
        (_, i) => ({

          s:
            f.get('s' + i) ||
            'closed',

          o:
            f.get('o' + i) ||
            '',

          c:
            f.get('c' + i) ||
            ''

        })
      );

    S.delivery =
      String(
        f.get('delivery') || ''
      )
        .split('\n')
        .map(x => x.trim())
        .filter(Boolean);

    S.deliveryInfo =
      String(
        f.get('deliveryInfo') || ''
      ).trim();

    S.payments =
      String(
        f.get('payments') || ''
      )
        .split('\n')
        .map(x => x.trim())
        .filter(Boolean);

    S.categories =
      String(
        f.get('categories') || ''
      )
        .split('\n')
        .map(x => x.trim())
        .filter(Boolean);

    const saved =
      await saveSite();

    if (saved) {
      alert('Salvo!');
    }
  }

  /* =========================================================
     IMPRESSÃO
  ========================================================= */

  function printComanda(
    title,
    data,
    total = ''
  ) {

    const escPrint =
      v =>
        String(v ?? '').replace(
          /[&<>"']/g,
          m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
          }[m])
        );

    const rows =
      Object
        .entries(data || {})
        .map(
          ([k, v]) => `

            <div class="pr">

              <b>
                ${escPrint(k)}
              </b>

              <span>
                ${escPrint(v)
                  .replace(
                    /\n/g,
                    '<br>'
                  )}
              </span>

            </div>

          `
        )
        .join('');

    const w =
      window.open(
        '',
        '_blank',
        'width=850,height=900'
      );

    if (!w) {

      alert(
        'Permita pop-ups no navegador para imprimir a comanda.'
      );

      return;
    }

    w.document.write(`

      <!doctype html>

      <html lang="pt-BR">

      <head>

        <meta charset="utf-8">

        <title>
          ${escPrint(title)}
        </title>

        <style>

          body{
            font-family:Arial,sans-serif;
            color:#222;
            margin:28px;
            max-width:760px
          }

          .head{
            text-align:center;
            border-bottom:2px solid #222;
            padding-bottom:12px;
            margin-bottom:14px
          }

          .head h1{
            font-size:20px;
            margin:0 0 4px
          }

          .head p{
            margin:3px 0;
            font-size:12px
          }

          .pr{
            display:grid;
            grid-template-columns:180px 1fr;
            gap:12px;
            padding:8px 0;
            border-bottom:1px solid #ddd;
            white-space:pre-wrap
          }

          .total{
            margin-top:16px;
            border-top:3px solid #222;
            padding-top:12px;
            text-align:right;
            font-size:18px;
            font-weight:bold
          }

          @media print{

            body{
              margin:12mm
            }

            button{
              display:none
            }

          }

        </style>

      </head>

      <body>

        <div class="head">

          <h1>
            MARTINS CONFEITARIA ARTESANAL
          </h1>

          <p>
            ${escPrint(title)}
          </p>

          <p>
            ${new Date().toLocaleString('pt-BR')}
          </p>

        </div>

        ${rows}

        ${
          total
            ? `
              <div class="total">
                TOTAL:
                ${escPrint(total)}
              </div>
            `
            : ''
        }

        <script>

          window.onload = () => {

            window.print();

            window.onafterprint =
              () => window.close();

          }

        <\/script>

      </body>

      </html>

    `);

    w.document.close();
  }

  /* =========================================================
     PEDIDOS
  ========================================================= */

  async function orders() {

    const {
      data,
      error
    } =
      await client
        .from('orders')
        .select('*')
        .order(
          'created_at',
          {
            ascending: false
          }
        );

    if (error) {

      $('#view').innerHTML = `

        <div class="card">

          <p>
            Erro ao carregar pedidos:
            ${esc(error.message)}
          </p>

        </div>

      `;

      return;
    }

    $('#view').innerHTML = `

      <div class="card">

        <h2>
          Pedidos
        </h2>

        <div class="table-wrap">

          <table class="table">

            <thead>

              <tr>

                <th>Data</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Status</th>
                <th>Ação</th>

              </tr>

            </thead>

            <tbody>

              ${(data || [])
                .map(
                  o => `

                    <tr>

                      <td>
                        ${new Date(
                          o.created_at
                        ).toLocaleString('pt-BR')}
                      </td>

                      <td>

                        <b>
                          ${esc(o.customer)}
                        </b>

                        <br>

                        📱
                        ${esc(o.phone)}

                        <br>

                        📦
                        ${esc(o.receiving || '')}

                        <br>

                        ${
                          o.address
                            ? '📍 ' +
                              esc(o.address) +
                              '<br>'
                            : ''
                        }

                        ${
                          o.payment
                            ? '💳 ' +
                              esc(o.payment) +
                              '<br>'
                            : ''
                        }

                        ${
                          o.notes
                            ? '📝 ' +
                              esc(o.notes)
                            : ''
                        }

                      </td>

                      <td>

                        ${(o.items || [])
                          .map(
                            i =>
                              `${i.qty}x ${esc(i.name)}`
                          )
                          .join('<br>')}

                      </td>

                      <td>

                        R$

                        ${Number(
                          o.total || 0
                        )
                          .toFixed(2)
                          .replace('.', ',')}

                      </td>

                      <td>

                        <select
                          class="order-status"
                          data-id="${o.id}"
                        >

                          ${
                            [
                              'novo',
                              'em preparo',
                              'pronto',
                              'concluído',
                              'cancelado'
                            ]
                              .map(
                                s =>
                                  `<option
                                    ${
                                      o.status === s
                                        ? 'selected'
                                        : ''
                                    }
                                    value="${esc(s)}"
                                  >
                                    ${esc(s)}
                                  </option>`
                              )
                              .join('')
                          }

                        </select>

                      </td>

                      <td>

                        <button
                          class="
                            btn
                            alt
                            print-order
                          "
                          data-id="${o.id}"
                        >
                          🖨️ Imprimir
                        </button>

                      </td>

                    </tr>

                  `
                )
                .join('')}

            </tbody>

          </table>

        </div>

      </div>

    `;

    document
      .querySelectorAll('.order-status')
      .forEach(select => {

        select.onchange =
          async () => {

            const { error } =
              await client
                .from('orders')
                .update({
                  status:
                    select.value
                })
                .eq(
                  'id',
                  select.dataset.id
                );

            if (error) {

              alert(
                'Erro ao atualizar pedido: ' +
                error.message
              );
            }
          };
      });

    document
      .querySelectorAll('.print-order')
      .forEach(button => {

        button.onclick = () => {

          const o =
            (data || []).find(
              x =>
                String(x.id) ===
                String(
                  button.dataset.id
                )
            );

          if (!o) {
            return;
          }

          const items =
            (o.items || [])
              .map(
                i =>
                  `${i.qty}x ${i.name} — R$ ${
                    Number(
                      i.price * i.qty || 0
                    )
                      .toFixed(2)
                      .replace('.', ',')
                  }`
              )
              .join('\n') ||
            'Nenhum';

          printComanda(

            'COMANDA DE PEDIDO',

            {

              Cliente:
                o.customer ||
                'Não informado',

              WhatsApp:
                o.phone ||
                'Não informado',

              Recebimento:
                o.receiving ||
                'Não informado',

              Endereço:
                o.address ||
                'Não informado',

              Pagamento:
                o.payment ||
                'Não informado',

              Itens:
                items,

              Observações:
                o.notes ||
                'Nenhuma'

            },

            `R$ ${
              Number(o.total || 0)
                .toFixed(2)
                .replace('.', ',')
            }`

          );
        };
      });
  }

  /* =========================================================
     BOLOS PERSONALIZADOS
  ========================================================= */

  async function cakes() {

    const {
      data,
      error
    } =
      await client
        .from('custom_cakes')
        .select('*')
        .order(
          'created_at',
          {
            ascending: false
          }
        );

    if (error) {

      $('#view').innerHTML = `

        <div class="card">

          <p>
            Erro ao carregar bolos:
            ${esc(error.message)}
          </p>

        </div>

      `;

      return;
    }

    $('#view').innerHTML = `

      <div class="card">

        <h2>
          Solicitações de bolo personalizado
        </h2>

        ${
          (data || [])
            .map(
              o => `

                <article class="card">

                  <b>
                    ${new Date(
                      o.created_at
                    ).toLocaleString('pt-BR')}
                  </b>

                  <p>

                    ${Object
                      .entries(o.data || {})
                      .map(
                        ([k, v]) => `
                          <b>
                            ${esc(k)}:
                          </b>

                          ${esc(v)}
                        `
                      )
                      .join('<br>')}

                  </p>

                  <div class="row">

                    <select
                      class="cake-status"
                      data-id="${o.id}"
                    >

                      ${
                        [
                          'novo',
                          'em contato',
                          'orçamento enviado',
                          'concluído',
                          'cancelado'
                        ]
                          .map(
                            s =>
                              `
                                <option
                                  value="${esc(s)}"
                                  ${
                                    o.status === s
                                      ? 'selected'
                                      : ''
                                  }
                                >
                                  ${esc(s)}
                                </option>
                              `
                          )
                          .join('')
                      }

                    </select>

                    <button
                      class="
                        btn
                        alt
                        print-cake
                      "
                      data-id="${o.id}"
                    >
                      🖨️ Imprimir comanda
                    </button>

                  </div>

                </article>

              `
            )
            .join('') ||

          `
            <div class="empty">
              Nenhuma solicitação ainda.
            </div>
          `
        }

      </div>

    `;

    document
      .querySelectorAll('.cake-status')
      .forEach(select => {

        select.onchange =
          async () => {

            const { error } =
              await client
                .from('custom_cakes')
                .update({
                  status:
                    select.value
                })
                .eq(
                  'id',
                  select.dataset.id
                );

            if (error) {

              alert(
                'Erro ao atualizar bolo: ' +
                error.message
              );
            }
          };
      });

    document
      .querySelectorAll('.print-cake')
      .forEach(button => {

        button.onclick = () => {

          const o =
            (data || []).find(
              x =>
                String(x.id) ===
                String(
                  button.dataset.id
                )
            );

          if (!o) {
            return;
          }

          const d =
            o.data || {};

          printComanda(
            'COMANDA DE BOLO PERSONALIZADO',
            d,
            d['Total estimado'] || ''
          );
        };
      });
  }

  /* =========================================================
     MÍDIA
  ========================================================= */

  async function media() {

    const {
      data,
      error
    } =
      await client
        .storage
        .from('media')
        .list(
          '',
          {
            limit: 100
          }
        );

    if (error) {

      $('#view').innerHTML = `

        <div class="card">

          <p>
            Erro ao carregar mídia:
            ${esc(error.message)}
          </p>

        </div>

      `;

      return;
    }

    $('#view').innerHTML = `

      <div class="card">

        <h2>
          Enviar mídia
        </h2>

        <p>
          Envie fotos e vídeos para usar no site.
        </p>

        <input
          id="file"
          type="file"
          accept="image/*,video/*"
        >

        <button
          class="btn"
          id="up"
        >
          Enviar
        </button>

      </div>

      <div class="media-list">

        ${(data || [])
          .map(
            x => `

              <div class="card">

                <b>
                  ${esc(x.name)}
                </b>

              </div>

            `
          )
          .join('')}

      </div>

    `;

    $('#up').onclick =
      async () => {

        const file =
          $('#file').files?.[0];

        if (!file) {

          alert(
            'Selecione um arquivo.'
          );

          return;
        }

        const safeName =
          file.name
            .normalize('NFD')
            .replace(
              /[\u0300-\u036f]/g,
              ''
            )
            .replace(
              /[^a-zA-Z0-9._-]/g,
              '-'
            );

        const path =
          `${Date.now()}-${safeName}`;

        const { error } =
          await client
            .storage
            .from('media')
            .upload(
              path,
              file,
              {
                upsert: false,
                contentType:
                  file.type || undefined
              }
            );

        if (error) {

          alert(error.message);

          return;
        }

        const {
          data: u
        } =
          client
            .storage
            .from('media')
            .getPublicUrl(path);

        try {

          await navigator
            .clipboard
            ?.writeText(
              u.publicUrl
            );

        } catch (e) {}

        alert(
          'Enviado. URL copiada quando o navegador permitiu.'
        );

        media();
      };
  }

  /* =========================================================
     INICIAR
  ========================================================= */

  init();

})();
