Perfeito. **Agora sim temos a estrutura exata do `admin.html` que está no GitHub.** [GitHub](https://raw.githubusercontent.com/yansitesemarcas/martins-confeitaria/main/admin/index.html)

E tem uma informação importante: esse `admin.html` **já está preparado para o que você pediu**. Ele já possui:

- `Produtos`
- `Pedidos`
- `Bolos personalizados`
- `Conteúdos`
- `Horários`
- `Regras`
- `Mídia`
- classificação de produto para **Delivery / Pronta entrega / Encomendas**
- formulário de produto com todos os IDs necessários
- carregamento do `./admin.js?v=20261005` [GitHub](https://raw.githubusercontent.com/yansitesemarcas/martins-confeitaria/main/admin/index.html)

Então **não precisamos mexer no `admin.html`**.

O próximo passo correto é eu pegar **esse HTML como referência dos IDs** e reconstruir o `admin.js` em cima dele, preservando a estrutura.

Vou fazer exatamente nas 7 partes que você pediu:

1. recuperar a lógica original;
2. manter os IDs atuais;
3. separar **Produtos → Pronta Entrega / Encomendas**;
4. separar **Pedidos → Pronta Entrega / Encomendas**;
5. manter **Imprimir**;
6. corrigir **Salvar alterações** das encomendas;
7. corrigir **criação/edição de produtos no Supabase**.

E não vou reconstruir o painel inteiro nem alterar o `admin.html`.

**Pode deixar esse `admin.html` como está.**
