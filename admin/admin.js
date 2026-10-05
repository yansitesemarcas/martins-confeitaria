(() => {
  const C = window.MARTINS_CONFIG || {};
  const D = window.MARTINS_DEFAULTS;

  const client =
    C.SUPABASE_URL && C.SUPABASE_ANON_KEY
      ? supabase.createClient(
          C.SUPABASE_URL,
          C.SUPABASE_ANON_KEY
        )
      : null;

  const $ = (s) => document.querySelector(s);

  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[m])
    );

  let S = structuredClone(D);
  let tab = "products";

  /*
   ============================================================
   CATEGORIAS OFICIAIS
   ============================================================
  */

  const DEFAULT_CATEGORIES = [
    "Bolos no Pote",
    "Sobremesas",
    "Copos da Felicidade",
    "Bolos 8 fatias",
    "Bolos 10 a 12 fatias",
    "Afogadinhos Baby",
    "Brownies",
    "Kits"
  ];

  /*
   ============================================================
   INICIALIZAÇÃO
   ============================================================
  */

  async function init() {
    if (!client) {
      $("#loginMsg").textContent =
        "Configure SUPABASE_URL e SUPABASE_ANON_KEY em config.js.";

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

  /*
   ============================================================
   MOSTRAR / ESCONDER PAINEL
   ============================================================
  */

  function show() {
    $("#login").classList.add("hidden");
    $("#app").classList.remove("hidden");

    load();

    if (!window.__martinsRealtime) {
      window.__martinsRealtime = true;

      client
        .channel("admin-live")

        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders"
          },
          () => {
            if (tab === "orders") {
              orders();
            }

            try {
              new Audio(
                "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
              ).play();
            } catch (e) {}

            alert(
              "Novo pedido recebido!"
            );
          }
        )

        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "custom_cakes"
          },
          () => {
            if (tab === "cakes") {
              cakes();
            }

            alert(
              "Novo pedido de bolo personalizado!"
            );
          }
        )

        .subscribe();
    }
  }

  function hide() {
    $("#app").classList.add("hidden");
    $("#login").classList.remove("hidden");
  }

  /*
   ============================================================
   LOGIN
   ============================================================
  */

  $("#loginForm").onsubmit =
    async (e) => {
      e.preventDefault();

      const f = new FormData(
        e.target
      );

      const { error } =
        await client.auth.signInWithPassword(
          {
            email: f.get("email"),
            password: f.get("password")
          }
        );

      if (error) {
        $("#loginMsg").textContent =
          error.message;
      }
    };

  $("#logout").onclick = () =>
    client.auth.signOut();

  /*
   ============================================================
   ABAS
   ============================================================
  */

  document
    .querySelectorAll("[data-tab]")
    .forEach((b) => {
      b.onclick = () => {
        tab = b.dataset.tab;

        document
          .querySelectorAll(
            "[data-tab]"
          )
          .forEach((x) =>
            x.classList.toggle(
              "active",
              x === b
            )
          );

        render();
      };
    });

  /*
   ============================================================
   CARREGAR DADOS
   ============================================================
  */

  async function load() {
    const st =
      await client
        .from("settings")
        .select("value")
        .eq("key", "site")
        .maybeSingle();

    const pr =
      await client
        .from("products")
        .select("*")
        .order("sort");

    if (st.error) {
      console.error(st.error);

      return showDbError(
        "carregar as configurações",
        st.error
      );
    }

    if (pr.error) {
      console.error(pr.error);

      return showDbError(
        "carregar os produtos",
        pr.error
      );
    }

    if (st.data?.value) {
      S = {
        ...S,
        ...st.data.value
      };
    }

    S.products =
      pr.data || [];

    render();
  }

  /*
   ============================================================
   ERROS DO BANCO
   ============================================================
  */

  function showDbError(
    action,
    error
  ) {
    const details = [
      error?.hint,
      error?.message,
      error?.details,
      error?.code
        ? "Código: " +
          error.code
        : ""
    ]
      .filter(Boolean)
      .join("\n");

    alert(
      "Não foi possível " +
        action +
        ".\n\n" +
        details
    );
  }

  /*
   ============================================================
   RENDER GERAL
   ============================================================
  */

  function render() {
    const names = {
      products: "Produtos",
      orders: "Pedidos",
      cakes:
        "Bolos personalizados",
      content: "Conteúdo",
      hours:
        "Horários e regras",
      media: "Mídia"
    };

    $("#title").textContent =
      names[tab];

    ({
      products,
      orders,
      cakes,
      content,
      hours,
      media
    })[tab]();
  }

  /*
   ============================================================
   PRODUTOS
   ============================================================
  */

  function products() {
    const list =
      Array.isArray(S.products)
        ? S.products
        : [];

    $("#view").innerHTML = `
      <div class="card">

        <div class="toolbar">

          <div>
            <h2>Cardápio</h2>

            <p>
              Cadastre preços, fotos,
              categorias, classificação
              e local de exibição.
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

      <div class="card table-wrap">

        <table class="table">

          <thead>
            <tr>
              <th>Foto</th>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Área</th>
              <th>Preço</th>
              <th>Disponível</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>

            ${
              list
                .map(
                  (p) => `
                    <tr>

                      <td>
                        ${
                          p.image
                            ? `
                              <img
                                src="${esc(
                                  p.image
                                )}"
                              >
                            `
                            : ""
                        }
                      </td>

                      <td>
                        <b>
                          ${esc(
                            p.name
                          )}
                        </b>

                        <br>

                        <small>
                          ${esc(
                            p.description ||
                              ""
                          )}
                        </small>
                      </td>

                      <td>
                        ${esc(
                          p.category ||
                            ""
                        )}
                      </td>

                      <td>
                        ${
                          normalizeArea(
                            p.area
                          ) ===
                          "pronta-entrega"
                            ? "Pronta Entrega"
                            : "Cardápio"
                        }
                      </td>

                      <td>
                        R$
                        ${Number(
                          p.price
                        )
                          .toFixed(2)
                          .replace(
                            ".",
                            ","
                          )}
                      </td>

                      <td>
                        ${
                          p.available
                            ? "Sim"
                            : "Não"
                        }
                      </td>

                      <td>

                        <button
                          class="btn alt edit"
                          data-id="${esc(
                            p.id
                          )}"
                        >
                          Editar
                        </button>

                        <button
                          class="btn alt del"
                          data-id="${esc(
                            p.id
                          )}"
                        >
                          Excluir
                        </button>

                      </td>

                    </tr>
                  `
                )
                .join("")
            }

          </tbody>

        </table>

      </div>
    `;

    $("#new").onclick =
      () => editProduct();

    document
      .querySelectorAll(".edit")
      .forEach((b) => {
        b.onclick = () =>
          editProduct(
            S.products.find(
              (p) =>
                String(p.id) ===
                String(
                  b.dataset.id
                )
            )
          );
      });

    document
      .querySelectorAll(".del")
      .forEach((b) => {
        b.onclick =
          async () => {
            if (
              !confirm(
                "Excluir este produto?"
              )
            ) {
              return;
            }

            const { error } =
              await client
                .from("products")
                .delete()
                .eq(
                  "id",
                  b.dataset.id
                );

            if (error) {
              console.error(
                error
              );

              return showDbError(
                "excluir o produto",
                error
              );
            }

            await load();
          };
      });
  }

  /*
   ============================================================
   NORMALIZAR ÁREA
   ============================================================
  */

  function normalizeArea(
    area
  ) {
    return String(
      area || ""
    )
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/\s+/g, "-");
  }

  /*
   ============================================================
   CATEGORIAS
   ============================================================
  */

  function getProductCategories() {
    const configured =
      Array.isArray(
        S.categories
      )
        ? S.categories
        : [];

    const defaults =
      Array.isArray(
        D?.categories
      )
        ? D.categories
        : [];

    const source =
      configured.length
        ? configured
        : defaults.length
        ? defaults
        : DEFAULT_CATEGORIES;

    return [
      ...new Set(
        source.filter(Boolean)
      )
    ];
  }

  /*
   ============================================================
   EDITAR / CRIAR PRODUTO
   ============================================================
  */

  function editProduct(
    p = null
  ) {
    const categories =
      getProductCategories();

    const product = {
      id: p?.id || "",
      name: p?.name || "",
      description:
        p?.description || "",
      price:
        p?.price ?? "",
      category:
        p?.category ||
        categories[0] ||
        "",
      area:
        normalizeArea(
          p?.area
        ) ===
        "pronta-entrega"
          ? "pronta-entrega"
          : "cardapio",
      image:
        p?.image || "",
      available:
        p?.available !== false,
      featured:
        p?.featured || false,
      sort:
        p?.sort || 0
    };

    $("#view").innerHTML = `
      <div class="card">

        <h2>
          ${
            product.id
              ? "Editar"
              : "Novo"
          }
          produto
        </h2>

        <form
          id="pf"
          class="formgrid"
        >

          <!-- NOME -->

          <label class="field">

            Nome

            <input
              name="name"
              required
              maxlength="120"
              value="${esc(
                product.name
              )}"
            >

          </label>

          <!-- PREÇO -->

          <label class="field">

            Preço

            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              value="${esc(
                product.price
              )}"
            >

          </label>

          <!-- CATEGORIA -->

          <label class="field">

            Classificação do produto

            <select
              name="category"
              required
            >

              ${categories
                .map(
                  (category) => `
                    <option
                      value="${esc(
                        category
                      )}"
                      ${
                        product.category ===
                        category
                          ? "selected"
                          : ""
                      }
                    >
                      ${esc(
                        category
                      )}
                    </option>
                  `
                )
                .join("")}

            </select>

          </label>

          <!-- ÁREA -->

          <label class="field">

            Onde o produto aparece

            <select
              name="area"
              required
            >

              <option
                value="cardapio"
                ${
                  product.area ===
                  "cardapio"
                    ? "selected"
                    : ""
                }
              >
                Cardápio
              </option>

              <option
                value="pronta-entrega"
                ${
                  product.area ===
                  "pronta-entrega"
                    ? "selected"
                    : ""
                }
              >
                Pronta Entrega
              </option>

            </select>

          </label>

          <!-- ORDEM -->

          <label class="field">

            Ordem

            <input
              name="sort"
              type="number"
              value="${esc(
                product.sort
              )}"
            >

          </label>

          <!-- DESCRIÇÃO -->

          <label class="field full">

            Descrição

            <textarea
              name="description"
              maxlength="500"
            >${esc(
              product.description
            )}</textarea>

          </label>

          <!-- FOTO -->

          <label class="field full">

            URL da foto

            <input
              name="image"
              value="${esc(
                product.image
              )}"
              placeholder="Pode usar uma URL pública ou enviar pela aba Mídia"
            >

          </label>

          <!-- DISPONÍVEL -->

          <label>

            <input
              name="available"
              type="checkbox"
              ${
                product.available
                  ? "checked"
                  : ""
              }
            >

            Disponível

          </label>

          <!-- DESTAQUE -->

          <label>

            <input
              name="featured"
              type="checkbox"
              ${
                product.featured
                  ? "checked"
                  : ""
              }
            >

            Destaque

          </label>

          <div class="row">

            <button
              class="btn"
            >
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

    $("#back").onclick =
      products;

    $("#pf").onsubmit =
      async (e) => {
        e.preventDefault();

        const f =
          new FormData(
            e.target
          );

        const obj = {
          name:
            f.get("name"),

          description:
            f.get(
              "description"
            ),

          price:
            Number(
              f.get("price")
            ),

          category:
            f.get("category"),

          area:
            f.get("area") ||
            "cardapio",

          image:
            f.get("image"),

          available:
            f.has(
              "available"
            ),

          featured:
            f.has(
              "featured"
            ),

          sort:
            Number(
              f.get("sort") ||
                0
            )
        };

        /*
         ======================================================
         SALVAR PRODUTO
         ======================================================
        */

        let result;

        if (product.id) {
          result =
            await client
              .from("products")
              .update(obj)
              .eq(
                "id",
                product.id
              );
        } else {
          result =
            await client
              .from("products")
              .insert(obj);
        }

        if (result.error) {
          console.error(
            result.error
          );

          return showDbError(
            "salvar o produto",
            result.error
          );
        }

        await load();

        alert(
          product.id
            ? "Produto atualizado com sucesso!"
            : "Produto cadastrado com sucesso!"
        );
      };
  }

  /*
   ============================================================
   COMANDA
   ============================================================
  */

  function printComanda(
    title,
    data,
    total = ""
  ) {
    const escPrint =
      (v) =>
        String(
          v ?? ""
        ).replace(
          /[&<>"']/g,
          (m) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#039;"
            }[m])
        );

    const rows =
      Object.entries(
        data || {}
      )
        .map(
          ([k, v]) =>
            `
              <div class="pr">

                <b>
                  ${escPrint(k)}
                </b>

                <span>
                  ${escPrint(
                    v
                  ).replace(
                    /\n/g,
                    "<br>"
                  )}
                </span>

              </div>
            `
        )
        .join("");

    const w =
      window.open(
        "",
        "_blank",
        "width=850,height=900"
      );

    if (!w) {
      alert(
        "Permita pop-ups no navegador para imprimir a comanda."
      );

      return;
    }

    w.document.write(`
      <!doctype html>

      <html lang="pt-BR">

        <head>

          <meta charset="utf-8">

          <title>
            ${escPrint(
              title
            )}
          </title>

          <style>

            body {
              font-family:
                Arial,
                sans-serif;

              color: #222;

              margin: 28px;

              max-width: 760px;
            }

            .head {
              text-align:
                center;

              border-bottom:
                2px solid #222;

              padding-bottom:
                12px;

              margin-bottom:
                14px;
            }

            .head h1 {
              font-size:
                20px;

              margin:
                0 0 4px;
            }

            .head p {
              margin:
                3px 0;

              font-size:
                12px;
            }

            .pr {
              display:
                grid;

              grid-template-columns:
                180px 1fr;

              gap:
                12px;

              padding:
                8px 0;

              border-bottom:
                1px solid #ddd;

              white-space:
                pre-wrap;
            }

            .total {
              margin-top:
                16px;

              border-top:
                3px solid #222;

              padding-top:
                12px;

              text-align:
                right;

              font-size:
                18px;

              font-weight:
                bold;
            }

            @media print {

              body {
                margin:
                  12mm;
              }

              button {
                display:
                  none;
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
              ${escPrint(
                title
              )}
            </p>

            <p>
              ${new Date().toLocaleString(
                "pt-BR"
              )}
            </p>

          </div>

          ${rows}

          ${
            total
              ? `
                <div class="total">
                  TOTAL:
                  ${escPrint(
                    total
                  )}
                </div>
              `
              : ""
          }

          <script>
            window.onload = () => {
              window.print();

              window.onafterprint =
                () => window.close();
            };
          <\/script>

        </body>

      </html>
    `);

    w.document.close();
  }

  /*
   ============================================================
   PEDIDOS
   ============================================================
  */

  async function orders() {
    const { data, error } =
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
      console.error(error);

      return showDbError(
        "carregar os pedidos",
        error
      );
    }

    $("#view").innerHTML = `
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
                  (o) => `
                    <tr>

                      <td>
                        ${new Date(
                          o.created_at
                        ).toLocaleString(
                          "pt-BR"
                        )}
                      </td>

                      <td>

                        <b>
                          ${esc(
                            o.customer
                          )}
                        </b>

                        <br>

                        📱
                        ${esc(
                          o.phone
                        )}

                        <br>

                        📦
                        ${esc(
                          o.receiving ||
                            ""
                        )}

                        <br>

                        ${
                          o.address
                            ? "📍 " +
                              esc(
                                o.address
                              ) +
                              "<br>"
                            : ""
                        }

                        ${
                          o.payment
                            ? "💳 " +
                              esc(
                                o.payment
                              ) +
                              "<br>"
                            : ""
                        }

                        ${
                          o.notes
                            ? "📝 " +
                              esc(
                                o.notes
                              )
                            : ""
                        }

                      </td>

                      <td>

                        ${(o.items || [])
                          .map(
                            (i) =>
                              `${i.qty}x ${esc(
                                i.name
                              )}`
                          )
                          .join(
                            "<br>"
                          )}

                      </td>

                      <td>
                        R$
                        ${Number(
                          o.total
                        )
                          .toFixed(2)
                          .replace(
                            ".",
                            ","
                          )}
                      </td>

                      <td>

                        <select
                          class="order-status"
                          data-id="${esc(
                            o.id
                          )}"
                        >

                          ${[
                            "novo",
                            "em preparo",
                            "pronto",
                            "concluído",
                            "cancelado"
                          ]
                            .map(
                              (s) => `
                                <option
                                  ${
                                    o.status ===
                                    s
                                      ? "selected"
                                      : ""
                                  }
                                >
                                  ${s}
                                </option>
                              `
                            )
                            .join(
                              ""
                            )}

                        </select>

                      </td>

                      <td>

                        <button
                          class="btn alt print-order"
                          data-id="${esc(
                            o.id
                          )}"
                        >
                          🖨️ Imprimir
                        </button>

                      </td>

                    </tr>
                  `
                )
                .join("")}

            </tbody>

          </table>

        </div>

      </div>
    `;

    document
      .querySelectorAll(
        ".order-status"
      )
      .forEach((s) => {
        s.onchange =
          async () => {
            const {
              error
            } =
              await client
                .from("orders")
                .update({
                  status:
                    s.value
                })
                .eq(
                  "id",
                  s.dataset.id
                );

            if (error) {
              console.error(
                error
              );

              showDbError(
                "atualizar o status do pedido",
                error
              );
            }
          };
      });

    document
      .querySelectorAll(
        ".print-order"
      )
      .forEach((b) => {
        b.onclick = () => {
          const o =
            (data || []).find(
              (x) =>
                String(x.id) ===
                String(
                  b.dataset.id
                )
            );

          if (!o) return;

          const items =
            (o.items || [])
              .map(
                (i) =>
                  `${i.qty}x ${i.name} — R$ ${Number(
                    i.price *
                      i.qty ||
                      0
                  )
                    .toFixed(2)
                    .replace(
                      ".",
                      ","
                    )}`
              )
              .join("\n") ||
            "Nenhum";

          printComanda(
            "COMANDA DE PEDIDO",
            {
              Cliente:
                o.customer ||
                "Não informado",

              WhatsApp:
                o.phone ||
                "Não informado",

              Recebimento:
                o.receiving ||
                "Não informado",

              Endereço:
                o.address ||
                "Não informado",

              Pagamento:
                o.payment ||
                "Não informado",

              Itens: items,

              Observações:
                o.notes ||
                "Nenhuma"
            },
            `R$ ${Number(
              o.total || 0
            )
              .toFixed(2)
              .replace(
                ".",
                ","
              )}`
          );
        };
      });
  }

  /*
   ============================================================
   BOLOS PERSONALIZADOS
   ============================================================
  */

  async function cakes() {
    const { data, error } =
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
      console.error(error);

      return showDbError(
        "carregar os bolos personalizados",
        error
      );
    }

    $("#view").innerHTML = `
      <div class="card">

        <h2>
          Solicitações de bolo personalizado
        </h2>

        ${
          (data || [])
            .map(
              (o) => `
                <article class="card">

                  <b>
                    ${new Date(
                      o.created_at
                    ).toLocaleString(
                      "pt-BR"
                    )}
                  </b>

                  <p>

                    ${Object.entries(
                      o.data || {}
                    )
                      .map(
                        ([k, v]) =>
                          `
                            <b>
                              ${esc(k)}:
                            </b>

                            ${esc(v)}
                          `
                      )
                      .join(
                        "<br>"
                      )}

                  </p>

                  <div class="row">

                    <select
                      class="cake-status"
                      data-id="${esc(
                        o.id
                      )}"
                    >

                      ${[
                        "novo",
                        "em contato",
                        "orçamento enviado",
                        "concluído",
                        "cancelado"
                      ]
                        .map(
                          (s) => `
                            <option
                              ${
                                o.status ===
                                s
                                  ? "selected"
                                  : ""
                              }
                            >
                              ${s}
                            </option>
                          `
                        )
                        .join(
                          ""
                        )}

                    </select>

                    <button
                      class="btn alt print-cake"
                      data-id="${esc(
                        o.id
                      )}"
                    >
                      🖨️ Imprimir comanda
                    </button>

                  </div>

                </article>
              `
            )
            .join("") ||
          '<div class="empty">Nenhuma solicitação ainda.</div>'
        }

      </div>
    `;

    document
      .querySelectorAll(
        ".cake-status"
      )
      .forEach((s) => {
        s.onchange =
          async () => {
            const {
              error
            } =
              await client
                .from(
                  "custom_cakes"
                )
                .update({
                  status:
                    s.value
                })
                .eq(
                  "id",
                  s.dataset.id
                );

            if (error) {
              console.error(
                error
              );

              showDbError(
                "atualizar o status do bolo",
                error
              );
            }
          };
      });

    document
      .querySelectorAll(
        ".print-cake"
      )
      .forEach((b) => {
        b.onclick = () => {
          const o =
            (data || []).find(
              (x) =>
                String(x.id) ===
                String(
                  b.dataset.id
                )
            );

          if (!o) return;

          const d =
            o.data || {};

          printComanda(
            "COMANDA DE BOLO PERSONALIZADO",
            d,
            d["Total estimado"] ||
              ""
          );
        };
      });
  }

  /*
   ============================================================
   CONTEÚDO
   ============================================================
  */

  function content() {
    const a =
      S.about || {};

    $("#view").innerHTML = `
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
              value="${esc(
                a.name
              )}"
            >

          </label>

          <label class="field">

            Foto (URL)

            <input
              name="about.photo"
              value="${esc(
                a.photo
              )}"
            >

          </label>

          <label class="field full">

            Título

            <input
              name="about.title"
              value="${esc(
                a.title
              )}"
            >

          </label>

          <label class="field full">

            Frase

            <input
              name="about.quote"
              value="${esc(
                a.quote
              )}"
            >

          </label>

          <label class="field full">

            História

            <textarea
              name="about.text"
            >${esc(
              a.text
            )}</textarea>

          </label>

          <label class="field">

            Instagram

            <input
              name="instagram"
              value="${esc(
                S.instagram
              )}"
            >

          </label>

          <label class="field">

            WhatsApp

            <input
              name="whatsapp"
              value="${esc(
                S.whatsapp
              )}"
            >

          </label>

          <label class="field">

            Google Maps (URL)

            <input
              name="maps"
              value="${esc(
                S.maps
              )}"
            >

          </label>

          <label class="field">

            Google Avaliações (URL)

            <input
              name="review"
              value="${esc(
                S.review
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

    $("#cf").onsubmit =
      saveSettings;
  }

  /*
   ============================================================
   HORÁRIOS
   ============================================================
  */

  function hours() {
    const d = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado"
    ];

    $("#view").innerHTML = `
      <div class="card">

        <h2>
          Horários
        </h2>

        <form id="hf">

          ${S.hours
            .map(
              (h, i) => `
                <div class="formgrid">

                  <label class="field">

                    ${d[i]}

                    <select
                      name="s${i}"
                    >

                      <option
                        value="open"
                        ${
                          h.s ===
                          "open"
                            ? "selected"
                            : ""
                        }
                      >
                        Aberto
                      </option>

                      <option
                        value="closed"
                        ${
                          h.s ===
                          "closed"
                            ? "selected"
                            : ""
                        }
                      >
                        Fechado
                      </option>

                      <option
                        value="tbd"
                        ${
                          h.s ===
                          "tbd"
                            ? "selected"
                            : ""
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
                      value="${esc(
                        h.o
                      )}"
                    >

                  </label>

                  <label class="field">

                    Fechamento

                    <input
                      name="c${i}"
                      type="time"
                      value="${esc(
                        h.c
                      )}"
                    >

                  </label>

                </div>
              `
            )
            .join("")}

          <hr>

          <label class="field">

            Opções de recebimento
            (uma por linha)

            <textarea
              name="delivery"
            >${(
              S.delivery ||
              []
            ).join(
              "\n"
            )}</textarea>

          </label>

          <label class="field">

            Informação de entrega

            <textarea
              name="deliveryInfo"
            >${esc(
              S.deliveryInfo ||
                ""
            )}</textarea>

          </label>

          <label class="field">

            Formas de pagamento
            (uma por linha)

            <textarea
              name="payments"
            >${(
              S.payments ||
              []
            ).join(
              "\n"
            )}</textarea>

          </label>

          <label class="field">

            Categorias
            (uma por linha)

            <textarea
              name="categories"
            >${(
              S.categories ||
              []
            ).join(
              "\n"
            )}</textarea>

          </label>

          <button class="btn">
            Salvar
          </button>

        </form>

      </div>
    `;

    $("#hf").onsubmit =
      saveHours;
  }

  /*
   ============================================================
   SALVAR HORÁRIOS
   ============================================================
  */

  async function saveHours(
    e
  ) {
    e.preventDefault();

    const f =
      new FormData(
        e.target
      );

    S.hours =
      S.hours.map(
        (_, i) => ({
          s:
            f.get(
              "s" + i
            ),

          o:
            f.get(
              "o" + i
            ),

          c:
            f.get(
              "c" + i
            )
        })
      );

    S.delivery =
      f
        .get("delivery")
        .split("\n")
        .map(
          (x) =>
            x.trim()
        )
        .filter(Boolean);

    S.deliveryInfo =
      f.get(
        "deliveryInfo"
      );

    S.payments =
      f
        .get("payments")
        .split("\n")
        .map(
          (x) =>
            x.trim()
        )
        .filter(Boolean);

    S.categories =
      f
        .get("categories")
        .split("\n")
        .map(
          (x) =>
            x.trim()
        )
        .filter(Boolean);

    if (
      await saveSite()
    ) {
      alert(
        "Salvo!"
      );
    }
  }

  /*
   ============================================================
   SALVAR CONTEÚDO
   ============================================================
  */

  async function saveSettings(
    e
  ) {
    e.preventDefault();

    const f =
      new FormData(
        e.target
      );

    S.instagram =
      f.get(
        "instagram"
      );

    S.whatsapp =
      f.get(
        "whatsapp"
      );

    S.maps =
      f.get("maps");

    S.review =
      f.get(
        "review"
      );

    S.about = {
      ...S.about,

      name:
        f.get(
          "about.name"
        ),

      photo:
        f.get(
          "about.photo"
        ),

      title:
        f.get(
          "about.title"
        ),

      quote:
        f.get(
          "about.quote"
        ),

      text:
        f.get(
          "about.text"
        )
    };

    if (
      await saveSite()
    ) {
      alert(
        "Salvo!"
      );
    }
  }

  /*
   ============================================================
   SALVAR SITE
   ============================================================
  */

  async function saveSite() {
    /*
      Produtos possuem sua própria tabela.
      Portanto não gravamos S.products
      dentro de settings.
    */

    const payload = {
      ...S
    };

    delete payload.products;

    const {
      error
    } =
      await client
        .from("settings")
        .upsert({
          key: "site",
          value: payload
        });

    if (error) {
      console.error(
        error
      );

      showDbError(
        "salvar as configurações",
        error
      );

      return false;
    }

    return true;
  }

  /*
   ============================================================
   MÍDIA
   ============================================================
  */

  async function media() {
    const {
      data,
      error
    } =
      await client.storage
        .from("media")
        .list("", {
          limit: 100
        });

    if (error) {
      console.error(
        error
      );

      return showDbError(
        "carregar a mídia",
        error
      );
    }

    $("#view").innerHTML = `
      <div class="card">

        <h2>
          Enviar mídia
        </h2>

        <p>
          Envie fotos e vídeos para usar
          no site. Depois copie a URL
          pública no cadastro do
          conteúdo/produto.
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
            (x) => `
              <div class="card">

                <b>
                  ${esc(
                    x.name
                  )}
                </b>

              </div>
            `
          )
          .join("")}

      </div>
    `;

    $("#up").onclick =
      async () => {
        const file =
          $("#file")
            .files[0];

        if (!file) {
          return alert(
            "Selecione um arquivo."
          );
        }

        const path =
          `${Date.now()}-${file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
          )}`;

        const {
          error
        } =
          await client.storage
            .from("media")
            .upload(
              path,
              file,
              {
                upsert:
                  false
              }
            );

        if (error) {
          console.error(
            error
          );

          return alert(
            error.message
          );
        }

        const {
          data: u
        } =
          client.storage
            .from("media")
            .getPublicUrl(
              path
            );

        await navigator.clipboard?.writeText(
          u.publicUrl
        );

        alert(
          "Enviado. URL copiada quando o navegador permitiu."
        );
      };
  }

  /*
   ============================================================
   INICIAR
   ============================================================
  */

  init();
})();
