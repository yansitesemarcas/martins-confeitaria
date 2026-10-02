(() => {
  const C = window.MARTINS_CONFIG || {};
  const D = window.MARTINS_DEFAULTS;

  const client =
    C.SUPABASE_URL && C.SUPABASE_ANON_KEY
      ? supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY)
      : null;

  const $ = s => document.querySelector(s);

  const esc = s =>
    String(s ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));

  let S = structuredClone(D);
  let tab = 'products';

  const AREAS = {
    cardapio: 'Cardápio',
    pronta_entrega: 'Pronta entrega',
    bolo_personalizado: 'Bolo personalizado'
  };

  function ensureCategories() {
    if (!S.categoriesByArea || typeof S.categoriesByArea !== 'object') {
      S.categoriesByArea = {};
    }

    if (!Array.isArray(S.categoriesByArea.cardapio)) {
      S.categoriesByArea.cardapio = Array.isArray(S.categories)
        ? [...S.categories]
        : [
            'Bolos no Pote',
            'Sobremesas',
            'Copos da Felicidade',
            'Bolos 8 fatias',
            'Bolos 10 a 12 fatias',
            'Afogadinhos Baby',
            'Brownies',
            'Kits'
          ];
    }

    if (!Array.isArray(S.categoriesByArea.pronta_entrega)) {
      S.categoriesByArea.pronta_entrega = [
        'Brownies',
        'Bolos',
        'Kits',
        'Sobremesas'
      ];
    }

    if (!Array.isArray(S.categoriesByArea.bolo_personalizado)) {
      S.categoriesByArea.bolo_personalizado = [
        'Bolos personalizados'
      ];
    }

    S.categories = S.categoriesByArea.cardapio;
  }

  ensureCategories();

  async function init() {
    if (!client) {
      $('#loginMsg').textContent =
        'Configure SUPABASE_URL e SUPABASE_ANON_KEY em config.js.';
      return;
    }

    const { data } = await client.auth.getSession();

    if (data.session) show();

    client.auth.onAuthStateChange((_, s) => {
      if (s) {
        show();
      } else {
        hide();
      }
    });
  }

  function show() {
    $('#login').classList.add('hidden');
    $('#app').classList.remove('hidden');

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
            if (tab === 'orders') orders();

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
            if (tab === 'cakes') cakes();

            alert('Novo pedido de bolo personalizado!');
          }
        )
        .subscribe();
    }
  }

  function hide() {
    $('#app').classList.add('hidden');
    $('#login').classList.remove('hidden');
  }

  $('#loginForm').onsubmit = async e => {
    e.preventDefault();

    const f = new FormData(e.target);

    const { error } = await client.auth.signInWithPassword({
      email: f.get('email'),
      password: f.get('password')
    });

    if (error) {
      $('#loginMsg').textContent = error.message;
    }
  };

  $('#logout').onclick = () => client.auth.signOut();

  document.querySelectorAll('[data-tab]').forEach(b => {
    b.onclick = () => {
      tab = b.dataset.tab;

      document
        .querySelectorAll('[data-tab]')
        .forEach(x => x.classList.toggle('active', x === b));

      render();
    };
  });

  async function load() {
    const st = await client
      .from('settings')
      .select('value')
      .eq('key', 'site')
      .maybeSingle();

    const pr = await client
      .from('products')
      .select('*')
      .order('sort');

    if (st.data?.value) {
      S = {
        ...S,
        ...st.data.value
      };
    }

    ensureCategories();

    if (pr.data?.length) {
      S.products = pr.data;
    }

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

    $('#title').textContent = names[tab];

    ({
      products,
      orders,
      cakes,
      content,
      hours,
      media
    })[tab]();
  }

  function products() {
    ensureCategories();

    const areaNames = Object.keys(AREAS);

    $('#view').innerHTML = `
      <div class="card">
        <div class="toolbar">
          <div>
            <h2>Produtos</h2>
            <p>
              Organize os produtos por área e classificação.
            </p>
          </div>

          <button class="btn" id="new">
            + Novo produto
          </button>
        </div>
      </div>

      <div class="card">
        <h2>Classificações</h2>

        <p>
          Crie e organize as classificações usadas em cada área.
        </p>

        <div class="formgrid">
          ${areaNames.map(area => `
            <div class="card">
              <h3>${AREAS[area]}</h3>

              <div id="categories-${area}">
                ${
                  (S.categoriesByArea[area] || []).map((cat, index) => `
                    <div
                      style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:10px;
                        padding:8px 0;
                        border-bottom:1px solid #eee;
                      "
                    >
                      <span>${esc(cat)}</span>

                      <button
                        class="btn alt delete-category"
                        data-area="${area}"
                        data-index="${index}"
                        type="button"
                      >
                        Excluir
                      </button>
                    </div>
                  `).join('') ||
                  '<p>Nenhuma classificação cadastrada.</p>'
                }
              </div>

              <br>

              <button
                class="btn add-category"
                data-area="${area}"
                type="button"
              >
                + Nova classificação
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card table-wrap">
        <h2>Produtos cadastrados</h2>

        <table class="table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Produto</th>
              <th>Área</th>
              <th>Classificação</th>
              <th>Preço</th>
              <th>Desconto</th>
              <th>Agendamento</th>
              <th>Disponível</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            ${
              (S.products || []).map(p => {
                const price = Number(p.price || 0);
                const discount = Number(p.discount_percent || 0);

                const finalPrice =
                  discount > 0
                    ? price - (price * discount / 100)
                    : price;

                return `
                  <tr>
                    <td>
                      ${
                        p.image
                          ? `<img src="${esc(p.image)}">`
                          : ''
                      }
                    </td>

                    <td>
                      <b>${esc(p.name)}</b>
                      <br>
                      <small>${esc(p.description || '')}</small>

                      ${
                        p.portion_size
                          ? `<br><small>Porção: ${esc(p.portion_size)}</small>`
                          : ''
                      }

                      ${
                        p.serves_up_to
                          ? `<br><small>Serve até: ${esc(p.serves_up_to)} pessoas</small>`
                          : ''
                      }

                      ${
                        p.weight_grams
                          ? `<br><small>${esc(p.weight_grams)} g</small>`
                          : ''
                      }
                    </td>

                    <td>
                      ${esc(AREAS[p.area] || 'Cardápio')}
                    </td>

                    <td>
                      ${esc(p.category || '')}
                    </td>

                    <td>
                      ${
                        discount > 0
                          ? `
                            <span
                              style="
                                text-decoration:line-through;
                                opacity:.6;
                              "
                            >
                              R$ ${price
                                .toFixed(2)
                                .replace('.', ',')}
                            </span>
                            <br>
                            <b>
                              R$ ${finalPrice
                                .toFixed(2)
                                .replace('.', ',')}
                            </b>
                          `
                          : `
                            R$ ${price
                              .toFixed(2)
                              .replace('.', ',')}
                          `
                      }
                    </td>

                    <td>
                      ${
                        discount > 0
                          ? `<b style="color:#b00020">${discount}%</b>`
                          : '—'
                      }
                    </td>

                    <td>
                      ${
                        p.requires_scheduling
                          ? '<b style="color:#b00020">Obrigatório</b>'
                          : 'Não'
                      }
                    </td>

                    <td>
                      ${
                        p.available !== false
                          ? '<b style="color:green">Disponível</b>'
                          : '<b style="color:#b00020">Pausado</b>'
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
              }).join('') ||
              `
                <tr>
                  <td colspan="9">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>
      </div>
    `;

    $('#new').onclick = () => editProduct();

    document.querySelectorAll('.edit').forEach(b => {
      b.onclick = () => {
        editProduct(
          S.products.find(
            p => String(p.id) === String(b.dataset.id)
          )
        );
      };
    });

    document.querySelectorAll('.del').forEach(b => {
      b.onclick = async () => {
        if (!confirm('Excluir este produto?')) return;

        await client
          .from('products')
          .delete()
          .eq('id', b.dataset.id);

        await load();
      };
    });

    document.querySelectorAll('.add-category').forEach(b => {
      b.onclick = async () => {
        const area = b.dataset.area;

        const name = prompt(
          `Digite o nome da nova classificação para ${AREAS[area]}:`
        );

        if (!name) return;

        const clean = name.trim();

        if (!clean) return;

        if (
          S.categoriesByArea[area]
            .some(x => x.toLowerCase() === clean.toLowerCase())
        ) {
          alert('Essa classificação já existe nessa área.');
          return;
        }

        S.categoriesByArea[area].push(clean);

        await saveSite();

        render();
      };
    });

    document.querySelectorAll('.delete-category').forEach(b => {
      b.onclick = async () => {
        const area = b.dataset.area;
        const index = Number(b.dataset.index);
        const category = S.categoriesByArea[area][index];

        const used = (S.products || []).some(
          p =>
            p.area === area &&
            p.category === category
        );

        if (used) {
          alert(
            'Essa classificação está sendo usada por um produto. Edite o produto antes de excluir a classificação.'
          );
          return;
        }

        if (
          !confirm(
            `Excluir a classificação "${category}"?`
          )
        ) {
          return;
        }

        S.categoriesByArea[area].splice(index, 1);

        await saveSite();

        render();
      };
    });
  }

  function getCategories(area) {
    ensureCategories();

    return S.categoriesByArea[area] || [];
  }

  function categoryOptions(area, selected) {
    const cats = getCategories(area);

    return cats.map(cat => `
      <option
        value="${esc(cat)}"
        ${cat === selected ? 'selected' : ''}
      >
        ${esc(cat)}
      </option>
    `).join('');
  }

  function editProduct(
    p = {
      name: '',
      description: '',
      price: '',
      area: 'cardapio',
      category: '',
      image: '',
      available: true,
      featured: false,
      sort: 0,

      /* NOVOS CAMPOS */
      portion_size: '',
      serves_up_to: '',
      weight_grams: '',
      discount_percent: 0,
      requires_scheduling: false
    }
  ) {
    ensureCategories();

    const initialArea =
      p.area && AREAS[p.area]
        ? p.area
        : 'cardapio';

    const initialCategory =
      p.category &&
      getCategories(initialArea).includes(p.category)
        ? p.category
        : getCategories(initialArea)[0] || '';

    const currentDiscount =
      Number(p.discount_percent || 0);

    const currentPrice =
      Number(p.price || 0);

    const currentFinalPrice =
      currentDiscount > 0
        ? currentPrice -
          (currentPrice * currentDiscount / 100)
        : currentPrice;

    $('#view').innerHTML = `
      <div class="card">
        <h2>
          ${p.id ? 'Editar' : 'Novo'} produto
        </h2>

        <form id="pf" class="formgrid">

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
              id="productPrice"
              type="number"
              step="0.01"
              min="0"
              required
              value="${p.price}"
            >
          </label>

          <label class="field">
            Área

            <select name="area" id="productArea">
              ${Object.entries(AREAS).map(([value, label]) => `
                <option
                  value="${value}"
                  ${value === initialArea ? 'selected' : ''}
                >
                  ${label}
                </option>
              `).join('')}
            </select>
          </label>

          <label class="field">
            Classificação

            <select name="category" id="productCategory">
              ${categoryOptions(
                initialArea,
                initialCategory
              )}
            </select>

            <button
              type="button"
              class="btn alt"
              id="newCategoryFromProduct"
              style="margin-top:8px"
            >
              + Criar classificação
            </button>
          </label>

          <label class="field">
            Ordem

            <input
              name="sort"
              type="number"
              value="${p.sort || 0}"
            >
          </label>

          <!-- TAMANHO DA PORÇÃO -->
          <label class="field">
            Tamanho da porção

            <input
              name="portion_size"
              maxlength="100"
              value="${esc(p.portion_size || '')}"
              placeholder="Ex.: 1 fatia grande"
            >
          </label>

          <!-- SERVE ATÉ -->
          <label class="field">
            Serve até

            <input
              name="serves_up_to"
              type="number"
              min="1"
              step="1"
              value="${p.serves_up_to || ''}"
              placeholder="Ex.: 10"
            >

            <small>
              pessoas
            </small>
          </label>

          <!-- GRAMATURA -->
          <label class="field">
            Gramatura

            <input
              name="weight_grams"
              type="number"
              min="0"
              step="1"
              value="${p.weight_grams || ''}"
              placeholder="Ex.: 1200"
            >

            <small>
              gramas
            </small>
          </label>

          <!-- DESCONTO -->
          <label class="field">
            Desconto

            <input
              name="discount_percent"
              id="discountPercent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value="${currentDiscount}"
              placeholder="Ex.: 10"
            >

            <small>
              %
            </small>
          </label>

          <!-- PREÇO FINAL -->
          <div
            class="field"
            id="finalPriceBox"
            style="
              padding:12px;
              border-radius:10px;
              background:#f8f8f8;
            "
          >
            <b>
              Preço final
            </b>

            <div
              id="finalPrice"
              style="
                font-size:1.2rem;
                font-weight:800;
                margin-top:6px;
              "
            >
              R$ ${currentFinalPrice
                .toFixed(2)
                .replace('.', ',')}
            </div>
          </div>

          <label class="field full">
            Descrição

            <textarea
              name="description"
              maxlength="500"
            >${esc(p.description || '')}</textarea>
          </label>

          <label class="field full">
            URL da foto

            <input
              name="image"
              value="${esc(p.image || '')}"
              placeholder="Pode usar uma URL pública ou enviar pela aba Mídia"
            >
          </label>

          <!-- AGENDAMENTO -->
          <label
            class="field"
            style="
              display:flex;
              align-items:center;
              gap:10px;
              cursor:pointer;
            "
          >
            <input
              name="requires_scheduling"
              type="checkbox"
              ${p.requires_scheduling ? 'checked' : ''}
            >

            <span>
              Agendamento obrigatório
            </span>
          </label>

          <!-- DISPONIBILIDADE -->
          <label
            style="
              display:flex;
              align-items:center;
              gap:10px;
              cursor:pointer;
            "
          >
            <input
              name="available"
              type="checkbox"
              ${p.available !== false ? 'checked' : ''}
            >

            Disponível para venda
          </label>

          <!-- DESTAQUE -->
          <label
            style="
              display:flex;
              align-items:center;
              gap:10px;
              cursor:pointer;
            "
          >
            <input
              name="featured"
              type="checkbox"
              ${p.featured ? 'checked' : ''}
            >

            Destaque
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

        </form>
      </div>
    `;

    const areaSelect = $('#productArea');
    const categorySelect = $('#productCategory');
    const newCategoryButton =
      $('#newCategoryFromProduct');

    const priceInput =
      $('#productPrice');

    const discountInput =
      $('#discountPercent');

    const finalPrice =
      $('#finalPrice');

    function updateFinalPrice() {
      const price =
        Number(priceInput.value || 0);

      let discount =
        Number(discountInput.value || 0);

      if (discount < 0) {
        discount = 0;
      }

      if (discount > 100) {
        discount = 100;
      }

      const final =
        price -
        (price * discount / 100);

      finalPrice.textContent =
        `R$ ${final
          .toFixed(2)
          .replace('.', ',')}`;
    }

    priceInput.oninput =
      updateFinalPrice;

    discountInput.oninput =
      updateFinalPrice;

    function refreshCategories(area, selected = '') {
      const cats = getCategories(area);

      categorySelect.innerHTML =
        cats.map(cat => `
          <option
            value="${esc(cat)}"
            ${cat === selected ? 'selected' : ''}
          >
            ${esc(cat)}
          </option>
        `).join('');

      if (!selected && cats.length) {
        categorySelect.value = cats[0];
      }
    }

    areaSelect.onchange = () => {
      refreshCategories(areaSelect.value);
    };

    newCategoryButton.onclick = async () => {
      const area = areaSelect.value;

      const name = prompt(
        `Digite o nome da nova classificação para ${AREAS[area]}:`
      );

      if (!name) return;

      const clean = name.trim();

      if (!clean) return;

      if (
        getCategories(area)
          .some(
            x =>
              x.toLowerCase() ===
              clean.toLowerCase()
          )
      ) {
        alert(
          'Essa classificação já existe nessa área.'
        );
        return;
      }

      S.categoriesByArea[area].push(clean);

      await saveSite();

      refreshCategories(area, clean);
    };

    $('#back').onclick = products;

    $('#pf').onsubmit = async e => {
      e.preventDefault();

      const f = new FormData(e.target);

      let discount =
        Number(
          f.get('discount_percent') || 0
        );

      if (discount < 0) {
        discount = 0;
      }

      if (discount > 100) {
        discount = 100;
      }

      const serves =
        f.get('serves_up_to');

      const grams =
        f.get('weight_grams');

      const obj = {
        name: f.get('name'),
        description: f.get('description'),
        price: Number(f.get('price')),
        area: f.get('area'),
        category: f.get('category'),
        image: f.get('image'),

        available:
          f.has('available'),

        featured:
          f.has('featured'),

        sort:
          Number(f.get('sort') || 0),

        /* NOVOS CAMPOS */
        portion_size:
          f.get('portion_size') || null,

        serves_up_to:
          serves
            ? Number(serves)
            : null,

        weight_grams:
          grams
            ? Number(grams)
            : null,

        discount_percent:
          discount,

        requires_scheduling:
          f.has('requires_scheduling')
      };

      /*
       * Produtos da área "pronta entrega"
       * também ficam marcados como destaque
       * para manter compatibilidade.
       */
      if (obj.area === 'pronta_entrega') {
        obj.featured = true;
      }

      if (p.id) {
        await client
          .from('products')
          .update(obj)
          .eq('id', p.id);
      } else {
        await client
          .from('products')
          .insert(obj);
      }

      await load();
    };

    updateFinalPrice();
  }

  function printComanda(
    title,
    data,
    total = ''
  ) {
    const escPrint = v =>
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

    const rows = Object.entries(data || {})
      .map(
        ([k, v]) =>
          `<div class="pr"><b>${escPrint(k)}</b><span>${escPrint(v).replace(/\n/g, '<br>')}</span></div>`
      )
      .join('');

    const w = window.open(
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
        <title>${escPrint(title)}</title>

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
          <h1>MARTINS CONFEITARIA ARTESANAL</h1>
          <p>${escPrint(title)}</p>
          <p>${new Date().toLocaleString('pt-BR')}</p>
        </div>

        ${rows}

        ${
          total
            ? `<div class="total">TOTAL: ${escPrint(total)}</div>`
            : ''
        }

        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          }
        <\/script>
      </body>
      </html>
    `);

    w.document.close();
  }

  async function orders() {
    const { data } = await client
      .from('orders')
      .select('*')
      .order('created_at', {
        ascending: false
      });

    $('#view').innerHTML = `
      <div class="card">
        <h2>Pedidos</h2>

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
              ${
                (data || []).map(o => `
                  <tr>
                    <td>
                      ${new Date(
                        o.created_at
                      ).toLocaleString('pt-BR')}
                    </td>

                    <td>
                      <b>${esc(o.customer)}</b>
                      <br>
                      📱 ${esc(o.phone)}
                      <br>
                      📦 ${esc(o.receiving || '')}

                      ${
                        o.address
                          ? `<br>📍 ${esc(o.address)}`
                          : ''
                      }

                      ${
                        o.payment
                          ? `<br>💳 ${esc(o.payment)}`
                          : ''
                      }

                      ${
                        o.notes
                          ? `<br>📝 ${esc(o.notes)}`
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
                      R$ ${Number(o.total)
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
                                `<option ${
                                  o.status === s
                                    ? 'selected'
                                    : ''
                                }>${s}</option>`
                            )
                            .join('')
                        }
                      </select>
                    </td>

                    <td>
                      <button
                        class="btn alt print-order"
                        data-id="${o.id}"
                      >
                        🖨️ Imprimir
                      </button>
                    </td>
                  </tr>
                `)
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document
      .querySelectorAll('.order-status')
      .forEach(s => {
        s.onchange = () =>
          client
            .from('orders')
            .update({
              status: s.value
            })
            .eq('id', s.dataset.id);
      });

    document
      .querySelectorAll('.print-order')
      .forEach(b => {
        b.onclick = () => {
          const o = (data || []).find(
            x =>
              String(x.id) ===
              String(b.dataset.id)
          );

          if (!o) return;

          const items =
            (o.items || [])
              .map(
                i =>
                  `${i.qty}x ${i.name} — R$ ${Number(
                    i.price * i.qty || 0
                  )
                    .toFixed(2)
                    .replace('.', ',')}`
              )
              .join('\n') || 'Nenhum';

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

              Itens: items,

              Observações:
                o.notes ||
                'Nenhuma'
            },
            `R$ ${Number(o.total || 0)
              .toFixed(2)
              .replace('.', ',')}`
          );
        };
      });
  }

  async function cakes() {
    const { data } = await client
      .from('custom_cakes')
      .select('*')
      .order('created_at', {
        ascending: false
      });

    $('#view').innerHTML = `
      <div class="card">
        <h2>
          Solicitações de bolo personalizado
        </h2>

        ${
          (data || [])
            .map(o => `
              <article class="card">
                <b>
                  ${new Date(
                    o.created_at
                  ).toLocaleString('pt-BR')}
                </b>

                <p>
                  ${Object.entries(o.data || {})
                    .map(
                      ([k, v]) =>
                        `<b>${esc(k)}:</b> ${esc(v)}`
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
                            `<option ${
                              o.status === s
                                ? 'selected'
                                : ''
                            }>${s}</option>`
                        )
                        .join('')
                    }
                  </select>

                  <button
                    class="btn alt print-cake"
                    data-id="${o.id}"
                  >
                    🖨️ Imprimir comanda
                  </button>
                </div>
              </article>
            `)
            .join('') ||
          '<div class="empty">Nenhuma solicitação ainda.</div>'
        }
      </div>
    `;

    document
      .querySelectorAll('.cake-status')
      .forEach(s => {
        s.onchange = () =>
          client
            .from('custom_cakes')
            .update({
              status: s.value
            })
            .eq('id', s.dataset.id);
      });

    document
      .querySelectorAll('.print-cake')
      .forEach(b => {
        b.onclick = () => {
          const o = (data || []).find(
            x =>
              String(x.id) ===
              String(b.dataset.id)
          );

          if (!o) return;

          const d = o.data || {};

          printComanda(
            'COMANDA DE BOLO PERSONALIZADO',
            d,
            d['Total estimado'] || ''
          );
        };
      });
  }

  function content() {
    const a = S.about || {};

    $('#view').innerHTML = `
      <div class="card">
        <h2>Conteúdo do site</h2>

        <form id="cf" class="formgrid">

          <label class="field">
            Nome da pessoa responsável

            <input
              name="about.name"
              value="${esc(
                a.name ||
                'Chef Denilson Martins'
              )}"
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

            <textarea name="about.text">${esc(
              a.text
            )}</textarea>
          </label>

          <label class="field">
            Instagram

            <input
              name="instagram"
              value="${esc(S.instagram)}"
            >
          </label>

          <label class="field">
            WhatsApp

            <input
              name="whatsapp"
              value="${esc(S.whatsapp)}"
            >
          </label>

          <label class="field">
            Google Maps (URL)

            <input
              name="maps"
              value="${esc(S.maps)}"
            >
          </label>

          <label class="field">
            Google Avaliações (URL)

            <input
              name="review"
              value="${esc(S.review)}"
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

    $('#cf').onsubmit = saveSettings;
  }

  function hours() {
    const d = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado'
    ];

    $('#view').innerHTML = `
      <div class="card">
        <h2>Horários</h2>

        <form id="hf">

          ${S.hours.map((h, i) => `
            <div class="formgrid">

              <label class="field">
                ${d[i]}

                <select name="s${i}">
                  <option
                    value="open"
                    ${h.s === 'open' ? 'selected' : ''}
                  >
                    Aberto
                  </option>

                  <option
                    value="closed"
                    ${h.s === 'closed' ? 'selected' : ''}
                  >
                    Fechado
                  </option>

                  <option
                    value="tbd"
                    ${h.s === 'tbd' ? 'selected' : ''}
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
                  value="${h.o}"
                >
              </label>

              <label class="field">
                Fechamento

                <input
                  name="c${i}"
                  type="time"
                  value="${h.c}"
                >
              </label>

            </div>
          `).join('')}

          <hr>

          <label class="field">
            Opções de recebimento (uma por linha)

            <textarea name="delivery">${(
              S.delivery || []
            ).join('\n')}</textarea>
          </label>

          <label class="field">
            Informação de entrega

            <textarea name="deliveryInfo">${esc(
              S.deliveryInfo || ''
            )}</textarea>
          </label>

          <label class="field">
            Formas de pagamento (uma por linha)

            <textarea name="payments">${(
              S.payments || []
            ).join('\n')}</textarea>
          </label>

          <label class="field">
            Categorias antigas do cardápio

            <textarea name="categories">${(
              S.categories || []
            ).join('\n')}</textarea>
          </label>

          <button class="btn">
            Salvar
          </button>

        </form>
      </div>
    `;

    $('#hf').onsubmit = saveHours;
  }

  async function saveHours(e) {
    e.preventDefault();

    const f = new FormData(e.target);

    S.hours = S.hours.map((_, i) => ({
      s: f.get('s' + i),
      o: f.get('o' + i),
      c: f.get('c' + i)
    }));

    S.delivery = f
      .get('delivery')
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean);

    S.deliveryInfo = f.get('deliveryInfo');

    S.payments = f
      .get('payments')
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean);

    S.categories = f
      .get('categories')
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean);

    S.categoriesByArea.cardapio = S.categories;

    await saveSite();

    alert('Salvo!');
  }

  async function saveSettings(e) {
    e.preventDefault();

    const f = new FormData(e.target);

    S.instagram = f.get('instagram');
    S.whatsapp = f.get('whatsapp');
    S.maps = f.get('maps');
    S.review = f.get('review');

    S.about = {
      ...S.about,
      name:
        f.get('about.name') ||
        'Chef Denilson Martins',
      photo: f.get('about.photo'),
      title: f.get('about.title'),
      quote: f.get('about.quote'),
      text: f.get('about.text')
    };

    await saveSite();

    alert('Salvo!');
  }

  async function saveSite() {
    ensureCategories();

    await client
      .from('settings')
      .upsert({
        key: 'site',
        value: S
      });
  }

  async function media() {
    const { data } = await client.storage
      .from('media')
      .list('', {
        limit: 100
      });

    $('#view').innerHTML = `
      <div class="card">
        <h2>Enviar mídia</h2>

        <p>
          Envie fotos e vídeos para usar no site.
          Depois copie a URL pública no cadastro
          do conteúdo/produto.
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
                <b>${esc(x.name)}</b>
              </div>
            `
          )
          .join('')}
      </div>
    `;

    $('#up').onclick = async () => {
      const file = $('#file').files[0];

      if (!file) {
        alert('Selecione um arquivo.');
        return;
      }

      const path =
        `${Date.now()}-${file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          '-'
        )}`;

      const { error } = await client.storage
        .from('media')
        .upload(
          path,
          file,
          {
            upsert: false
          }
        );

      if (error) {
        alert(error.message);
        return;
      }

      const { data: u } =
        client.storage
          .from('media')
          .getPublicUrl(path);

      await navigator.clipboard?.writeText(
        u.publicUrl
      );

      alert(
        'Enviado. URL copiada quando o navegador permitiu.'
      );
    };
  }

  init();
})();
