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
      value === 'bolo-personalizado' ||
      value === 'encomendas'
    ) {
      return 'encomendas';
    }

    return 'cardapio';
  }

  function areaLabel(area) {

    const normalized =
      normalizeArea(area);

    const found =
      AREAS.find(
        x => x.value === normalized
      );

    return found
      ? found.label
      : 'Delivery';
  }

  function categoryNames(current = '') {

    const list = [];

    if (Array.isArray(S.categories)) {
      list.push(...S.categories);
    }

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
          .map(x =>
            String(x || '').trim()
          )
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

            alert(
              'Novo pedido recebido!'
            );
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

  /* =========================
     LOGIN
  ========================= */

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

        } else {

          $('#loginMsg').textContent =
            '';

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
        .order(
          'sort',
          {
            ascending: true
          }
        )

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

    categoryNames().forEach(
      category => {
        addCategory(category);
      }
    );

    render();
  }

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
      names[tab] ||
      'Administração';

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

  /* =========================
     PRODUTOS
  ========================= */

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
                String(
                  button.dataset.id
                )
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

  /*
    A parte de edição de produto, conteúdo,
    horários, pedidos, bolos personalizados
    e mídia deve permanecer exatamente na
    versão anterior completa que estava no
    commit b138afb.
  */

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

  init();

})();
