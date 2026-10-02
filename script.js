(() => {
  const D = window.MARTINS_DEFAULTS,
    C = window.MARTINS_CONFIG || {};

  let S = structuredClone(D),
    cart = JSON.parse(
      localStorage.getItem('martins_cart') || '[]'
    );

  const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)],
    money = v =>
      Number(v || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }),
    wa = t =>
      `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(t)}`;

  const esc = s =>
    String(s ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));

  const sb = () =>
    window.supabase &&
    C.SUPABASE_URL &&
    C.SUPABASE_ANON_KEY
      ? window.supabase.createClient(
          C.SUPABASE_URL,
          C.SUPABASE_ANON_KEY
        )
      : null;

  async function load() {
    const client = sb();

    if (client) {
      try {
        const [st, pr] = await Promise.all([
          client
            .from('settings')
            .select('value')
            .eq('key', 'site')
            .maybeSingle(),

          client
            .from('products')
            .select('*')
            .order('sort')
        ]);

        if (st.data?.value) {
          S = {
            ...S,
            ...st.data.value
          };
        }

        if (pr.data) {
          // Supabase é a fonte oficial dos produtos.
          S.products = pr.data.map(p => ({
            ...p
          }));
        }
      } catch (e) {
        console.warn(e);
      }
    }

    render();
  }

  function render() {
    $('#contactWa').href = wa(
      'Olá! Vim pelo site da Martins Confeitaria e gostaria de fazer um pedido.'
    );

    $('#instagram').href = S.instagram;

    $('#year').textContent =
      new Date().getFullYear();

    $('#address').innerHTML =
      S.address.map(esc).join('<br>');

    if ($('#delivery')) {
      $('#delivery').textContent = [
        ...(S.delivery || []),
        S.deliveryInfo
      ]
        .filter(Boolean)
        .join(' • ');
    }

    /*
     * HISTÓRIA / QUEM PRODUZ
     * O nome do Chef aparece como assinatura
     * no final da história.
     */
    $('#aboutTitle').textContent =
      S.about.title;

    $('#aboutQuote').textContent =
      `“${S.about.quote}”`;

    const aboutText =
      String(S.about.text || '')
        .split(/\n\n+/)
        .map(
          x =>
            `<p>${esc(x).replace(
              /\n/g,
              '<br>'
            )}</p>`
        )
        .join('');

    $('#aboutText').innerHTML =
      aboutText +
      `
        <p class="about-signature">
          <strong>Chef Denilson Martins</strong>
        </p>
      `;

    if (S.maps) {
      $('#maps').href = S.maps;

      const q = encodeURIComponent(
        (S.address || []).join(', ')
      );

      $('#mapFrame').src =
        'https://www.google.com/maps?q=' +
        q +
        '&output=embed';
    }

    if (S.review) {
      $('#review').href = S.review;
    }

    renderHours();
    renderMenu();
    renderReady();
    renderCake();
    renderCart();
    currentStatus();
  }

  const dayNames = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];

  function renderHours() {
    $('#hours').innerHTML =
      S.hours
        .map(
          (h, i) =>
            `<div class="hour">
              <span>${dayNames[i]}</span>
              <b>${
                h.s === 'closed'
                  ? 'Fechado'
                  : h.s === 'tbd'
                  ? 'A confirmar'
                  : `${h.o} – ${h.c}`
              }</b>
            </div>`
        )
        .join('');
  }

  function currentStatus() {
    const now = new Date(
      new Date().toLocaleString(
        'en-US',
        {
          timeZone: 'America/Fortaleza'
        }
      )
    );

    const h = S.hours[now.getDay()];
    let open = false;

    if (h?.s === 'open') {
      const n =
        now.getHours() * 60 +
        now.getMinutes();

      const [oh, om] =
        h.o.split(':').map(Number);

      const [ch, cm] =
        h.c.split(':').map(Number);

      open =
        n >= oh * 60 + om &&
        n < ch * 60 + cm;
    }

    const el = $('#openState');

    if (el) {
      el.textContent =
        h?.s === 'tbd'
          ? 'Horário de terça-feira: a confirmar'
          : open
          ? '● Aberta agora'
          : '● Fechada agora';

      el.className =
        'open-state ' +
        (open ? 'is-open' : '');
    }
  }

  let cat = '';

  function renderMenu() {
    const categoriesByArea =
      S.categoriesByArea || {};

    const cats =
      categoriesByArea.cardapio?.length
        ? categoriesByArea.cardapio
        : S.categories?.length
        ? S.categories
        : [
            ...new Set(
              S.products
                .filter(
                  p =>
                    !p.area ||
                    p.area === 'cardapio'
                )
                .map(p => p.category)
            )
          ];

    if (!cat || !cats.includes(cat)) {
      cat = cats[0] || '';
    }

    $('#categories').innerHTML =
      cats
        .map(
          c =>
            `<button class="tab ${
              c === cat ? 'active' : ''
            }" data-cat="${esc(c)}">
              ${esc(c)}
            </button>`
        )
        .join('');

    $$('#categories .tab').forEach(
      b =>
        (b.onclick = () => {
          cat = b.dataset.cat;
          renderMenu();
        })
    );

    /*
     * Produto pausado continua aparecendo.
     * Apenas fica sem botão de adicionar.
     */
    const list = S.products
      .filter(
        p =>
          (!p.area ||
            p.area === 'cardapio') &&
          p.category === cat
      )
      .sort(
        (a, b) =>
          (a.sort || 0) -
          (b.sort || 0)
      );

    $('#products').innerHTML =
      list
        .map(
          p =>
            `<article class="product">

              <div class="product-img">
                ${
                  p.image
                    ? `<img
                        src="${esc(p.image)}"
                        alt="${esc(p.name)}"
                        loading="lazy"
                      >`
                    : '<span>Martins</span>'
                }
              </div>

              <div class="product-body">

                <span class="tag">
                  ${esc(p.category)}
                </span>

                <h3>
                  ${esc(p.name)}
                </h3>

                <p>
                  ${esc(p.description || '')}
                </p>

                <div class="product-row">

                  <strong>
                    ${money(p.price)}
                  </strong>

                  ${
                    p.available === false
                      ? `
                        <span
                          class="unavailable"
                          style="
                            color:#a33;
                            font-weight:600;
                          "
                        >
                          Temporariamente indisponível
                        </span>
                      `
                      : `
                        <button
                          class="add"
                          data-id="${esc(p.id)}"
                        >
                          Adicionar
                        </button>
                      `
                  }

                </div>

              </div>

            </article>`
        )
        .join('');

    $('#emptyMenu').classList.toggle(
      'hidden',
      list.length > 0
    );

    $$('.add').forEach(
      b =>
        (b.onclick = () =>
          add(b.dataset.id))
    );
  }

  function add(id) {
    const p = S.products.find(
      x =>
        String(x.id) ===
        String(id)
    );

    if (!p) return;

    if (p.available === false) {
      alert(
        'Este produto está temporariamente indisponível.'
      );
      return;
    }

    if (p.category === 'Kits') {
      window.location.href =
        'encomendas.html?kit=' +
        encodeURIComponent(p.id);

      return;
    }

    const x = cart.find(
      i =>
        String(i.id) ===
        String(id)
    );

    if (x) {
      x.qty++;
    } else {
      cart.push({
        id: p.id,
        qty: 1
      });
    }

    saveCart();
    openDrawer();
  }

  function saveCart() {
    localStorage.setItem(
      'martins_cart',
      JSON.stringify(cart)
    );

    renderCart();
  }

  function renderCart() {
    const items = cart
      .map(i => ({
        ...S.products.find(
          p =>
            String(p.id) ===
            String(i.id)
        ),
        qty: i.qty
      }))
      .filter(i => i.name);

    const total = items.reduce(
      (a, i) =>
        a + i.price * i.qty,
      0
    );

    $('#cartCount').textContent =
      items.reduce(
        (a, i) =>
          a + i.qty,
        0
      );

    $('#cartTotal').textContent =
      money(total);

    $('#cartItems').innerHTML =
      items.length
        ? items
            .map(
              i =>
                `<div class="cart-item">
                  <div>
                    <b>${esc(i.name)}</b>
                    <small>
                      ${money(i.price)} cada
                    </small>
                  </div>

                  <div class="qty">
                    <button
                      data-dec="${esc(i.id)}"
                    >
                      −
                    </button>

                    <b>${i.qty}</b>

                    <button
                      data-inc="${esc(i.id)}"
                    >
                      +
                    </button>
                  </div>
                </div>`
            )
            .join('')
        : `
          <div class="empty">
            Seu carrinho está vazio.
          </div>
        `;

    $$('[data-inc]').forEach(
      b =>
        (b.onclick = () =>
          change(
            b.dataset.inc,
            1
          ))
    );

    $$('[data-dec]').forEach(
      b =>
        (b.onclick = () =>
          change(
            b.dataset.dec,
            -1
          ))
    );

    $('#checkoutBtn').disabled =
      !items.length;
  }

  function change(id, d) {
    const x = cart.find(
      i =>
        String(i.id) ===
        String(id)
    );

    if (!x) return;

    x.qty += d;

    if (x.qty < 1) {
      cart = cart.filter(
        i =>
          String(i.id) !==
          String(id)
      );
    }

    saveCart();
  }

  function openDrawer() {
    $('#drawer').classList.add('show');
    $('#shade').classList.add('show');

    $('#drawer').setAttribute(
      'aria-hidden',
      'false'
    );
  }

  function closeDrawer() {
    $('#drawer').classList.remove('show');
    $('#shade').classList.remove('show');

    $('#drawer').setAttribute(
      'aria-hidden',
      'true'
    );
  }

  function renderReady() {
    const list = S.products.filter(
      p =>
        p.area ===
        'pronta_entrega'
    );

    $('#readyProducts').innerHTML =
      list
        .map(
          p =>
            `<article class="product">

              <div class="product-img">
                ${
                  p.image
                    ? `<img
                        src="${esc(p.image)}"
                        alt="${esc(p.name)}"
                      >`
                    : '<span>Pronta entrega</span>'
                }
              </div>

              <div class="product-body">

                <span class="tag">
                  ${
                    p.available === false
                      ? 'TEMPORARIAMENTE INDISPONÍVEL'
                      : 'DISPONÍVEL AGORA'
                  }
                </span>

                <h3>
                  ${esc(p.name)}
                </h3>

                <p>
                  ${esc(p.description || '')}
                </p>

                <div class="product-row">

                  <strong>
                    ${money(p.price)}
                  </strong>

                  ${
                    p.available === false
                      ? `
                        <span
                          style="
                            color:#a33;
                            font-weight:600;
                          "
                        >
                          Temporariamente indisponível
                        </span>
                      `
                      : `
                        <button
                          class="add-ready"
                          data-id="${esc(p.id)}"
                        >
                          Adicionar
                        </button>
                      `
                  }

                </div>

              </div>

            </article>`
        )
        .join('');

    $$('.add-ready').forEach(
      b =>
        (b.onclick = () =>
          add(b.dataset.id))
    );
  }

  function renderCake() {
    if (!$('#cakeForm')) return;

    const c =
      S.cake || D.cake;

    $('#cakeType').innerHTML =
      '<option value="">Escolha o tipo e tamanho</option>' +
      c.types
        .map(
          ([n, v]) =>
            `<option
              value="${esc(n)}"
              data-price="${v}"
            >
              ${esc(n)} — ${money(v)}
            </option>`
        )
        .join('');

    $('#cakeMass').innerHTML =
      '<option value="">Escolha 1 massa</option>' +
      c.masses
        .map(
          x =>
            `<option>
              ${esc(x)}
            </option>`
        )
        .join('');

    $('#cakeFilling').innerHTML =
      '<option value="">Escolha 1 recheio</option>' +
      c.fillings
        .map(
          x =>
            `<option>
              ${esc(x)}
            </option>`
        )
        .join('');

    $('#cakeExtras').innerHTML =
      c.extras
        .map(
          ([n, v]) =>
            `<label class="extra-option">
              <input
                type="checkbox"
                name="Adicional"
                value="${esc(n)}"
                data-price="${v}"
              >
              ${esc(n)}
              (+${money(v)})
            </label>`
        )
        .join('');

    const calc = () => {
      const opt =
        $('#cakeType')
          .selectedOptions[0];

      let total =
        Number(
          opt?.dataset.price || 0
        );

      $$('#cakeExtras input:checked')
        .forEach(
          x =>
            (total += Number(
              x.dataset.price || 0
            ))
        );

      $('#cakeTotal').textContent =
        money(total);
    };

    $('#cakeType').onchange =
      calc;

    $$('#cakeExtras input').forEach(
      x =>
        (x.onchange = calc)
    );

    $('#openCake').onclick = () => {
      $('#cakeForm').classList.toggle(
        'hidden'
      );

      if (
        !$('#cakeForm').classList.contains(
          'hidden'
        )
      ) {
        $('#cakeForm').scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    };

    calc();
  }

  function checkout() {
    if (!cart.length) return;

    $('#checkout').showModal();
  }

  $('#openCart').onclick =
    openDrawer;

  $('#closeCart').onclick =
    closeDrawer;

  $('#shade').onclick =
    closeDrawer;

  $('#clearCart').onclick = () => {
    cart = [];
    saveCart();
  };

  $('#checkoutBtn').onclick =
    checkout;

  $('#checkoutForm').addEventListener(
    'change',
    e => {
      if (
        e.target.name ===
        'receiving'
      ) {
        $('#addressWrap').classList.toggle(
          'hidden',
          e.target.value !==
            'Entrega'
        );
      }
    }
  );

  $('#checkoutForm').onsubmit =
    async e => {
      e.preventDefault();

      const f =
        new FormData(e.target);

      const items = cart
        .map(i => ({
          ...S.products.find(
            p =>
              String(p.id) ===
              String(i.id)
          ),
          qty: i.qty
        }))
        .filter(i => i.name);

      const total =
        items.reduce(
          (a, i) =>
            a + i.price * i.qty,
          0
        );

      const lines =
        items
          .map(
            i =>
              `• ${i.qty}x ${i.name} — ${money(
                i.price * i.qty
              )}`
          )
          .join('\n');

      const text =
        `Olá! Quero fazer um pedido na Martins Confeitaria.\n\n` +
        `*Cliente:* ${f.get(
          'customer'
        )}\n` +
        `*WhatsApp:* ${f.get(
          'phone'
        )}\n` +
        `*Recebimento:* ${f.get(
          'receiving'
        )}` +
        (f.get('address')
          ? `\n*Endereço:* ${f.get(
              'address'
            )}`
          : '') +
        `\n*Pagamento:* ${f.get(
          'payment'
        )}\n\n` +
        `*Itens:*\n${lines}\n\n` +
        `*Total:* ${money(
          total
        )}\n` +
        `*Observações:* ${
          f.get('notes') ||
          'Nenhuma'
        }`;

      const client = sb();

      if (client) {
        try {
          await client
            .from('orders')
            .insert({
              customer:
                f.get('customer'),
              phone:
                f.get('phone'),
              receiving:
                f.get('receiving'),
              address:
                f.get('address'),
              payment:
                f.get('payment'),
              notes:
                f.get('notes'),
              items,
              total,
              status: 'novo'
            });
        } catch (err) {
          console.warn(err);
        }
      }

      window.open(
        wa(text),
        '_blank',
        'noopener'
      );

      $('#checkout').close();

      cart = [];

      saveCart();
      closeDrawer();
    };

  if ($('#cakeForm')) {
    $('#cakeForm').onsubmit =
      async e => {
        e.preventDefault();

        const f =
          new FormData(e.target);

        const extras =
          f.getAll('Adicional');

        const opt =
          $('#cakeType')
            .selectedOptions[0];

        let total =
          Number(
            opt?.dataset.price || 0
          );

        $$('#cakeExtras input:checked')
          .forEach(
            x =>
              (total += Number(
                x.dataset.price || 0
              ))
          );

        const data = {
          'Tipo e tamanho':
            f.get(
              'Tipo e tamanho'
            ),
          Massa:
            f.get('Massa'),
          Recheio:
            f.get('Recheio'),
          Adicionais:
            extras.join(', ') ||
            'Nenhum',
          Nome:
            f.get('Nome'),
          WhatsApp:
            f.get('WhatsApp'),
          'Data desejada':
            f.get(
              'Data desejada'
            ),
          Observações:
            f.get('Observações'),
          'Total estimado':
            money(total)
        };

        const text =
          `Olá! Quero encomendar um bolo personalizado.\n\n` +
          Object.entries(data)
            .map(
              ([k, v]) =>
                `*${k}:* ${
                  v || 'Não informado'
                }`
            )
            .join('\n');

        const client = sb();

        if (client) {
          try {
            await client
              .from('custom_cakes')
              .insert({
                data,
                status: 'novo'
              });
          } catch (err) {
            console.warn(err);
          }
        }

        window.open(
          wa(text),
          '_blank',
          'noopener'
        );
      };
  }

  const observer =
    new IntersectionObserver(
      es =>
        es.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add(
              'visible'
            );
          }
        }),
      {
        threshold: 0.12
      }
    );

  $$('.reveal').forEach(
    el =>
      observer.observe(el)
  );

  load();
})();
