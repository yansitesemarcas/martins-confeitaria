# Martins Confeitaria — atualização de encomendas

Versão atualizada com:
- Cardápio de Encomendas separado do Delivery/Pronta Entrega.
- Naked Cake e Chantininho por quantidade de pessoas e valor.
- Personalização com 1 massa, exatamente 2 recheios, adicionais e personalizações.
- Brigadeiros Clássicos e Premium, com limite de sabores: 2 para 50 unidades e 4 para 100 unidades.
- Kits Festa com Petit Brownie e com Pirulitos, com os valores reajustados em R$ 10 conforme solicitado.
- Mantidas as demais funcionalidades e arquivos do projeto.


Atualização V22: adicionada ao final do Cardápio de Encomendas a seção “Outros itens” com Petit Brownie (50/100 unidades), Mini Brownie Recheado, Bem Casado (papel crepom/celofane) e Cupcakes com/sem plaquinha. Os subtotais e faixas de preço são calculados automaticamente e enviados no resumo do WhatsApp.


V23: adicionados botão de impressão da comanda após confirmação da encomenda e mídia (foto + vídeo) na área de personalização/orçamento.


V-Supabase: configuração conectada ao projeto Supabase da Martins. O site usa a tabela settings, products, orders e custom_cakes; a taxa de entrega permanece 'A consultar pelo WhatsApp'. Execute supabase/migration_site_compat.sql no projeto Supabase antes de usar o painel.
