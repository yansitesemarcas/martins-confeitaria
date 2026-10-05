<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Martins Confeitaria | Administração</title>

  <style>
    :root {
      --brown-950: #24140d;
      --brown-900: #321b11;
      --brown-800: #452719;
      --brown-700: #603823;
      --brown-600: #765039;
      --cream-50: #fffdf9;
      --cream-100: #faf5ed;
      --cream-200: #f2e8da;
      --cream-300: #e7d8c6;
      --text: #2b211b;
      --muted: #7e7065;
      --white: #ffffff;
      --green: #2f7d4a;
      --red: #b44343;
      --yellow: #a8791e;
      --shadow: 0 18px 50px rgba(50, 27, 17, .10);
      --radius: 18px;
      --sidebar: 270px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html,
    body {
      min-height: 100%;
    }

    body {
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      background: var(--cream-100);
      color: var(--text);
      line-height: 1.5;
    }

    button,
    input,
    select,
    textarea {
      font: inherit;
    }

    button {
      cursor: pointer;
    }

    img {
      max-width: 100%;
      display: block;
    }

    .hidden {
      display: none !important;
    }

    #loginScreen {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;

      background:
        radial-gradient(circle at 20% 20%, rgba(118, 80, 57, .18), transparent 32%),
        radial-gradient(circle at 80% 80%, rgba(96, 56, 35, .14), transparent 35%),
        var(--brown-950);
    }

    .login-card {
      width: min(440px, 100%);
      background: var(--white);
      border-radius: 26px;
      padding: 42px;
      box-shadow: 0 30px 80px rgba(0, 0, 0, .30);
    }

    .login-brand {
      text-align: center;
      margin-bottom: 30px;
    }

    .login-logo {
      width: 86px;
      height: 86px;
      margin: 0 auto 18px;
      border-radius: 50%;
      object-fit: cover;
      background: var(--cream-200);
      border: 4px solid var(--cream-100);
    }

    .login-logo-fallback {
      width: 86px;
      height: 86px;
      margin: 0 auto 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--brown-900);
      color: var(--white);
      font-size: 30px;
      font-weight: 800;
    }

    .login-brand h1 {
      font-family: Georgia, serif;
      font-size: 28px;
      color: var(--brown-900);
      margin-bottom: 5px;
    }

    .login-brand p {
      color: var(--muted);
      font-size: 14px;
    }

    .field {
      margin-bottom: 17px;
    }

    .field label {
      display: block;
      margin-bottom: 7px;
      color: var(--brown-900);
      font-size: 13px;
      font-weight: 700;
    }

    .field input,
    .field select,
    .field textarea {
      width: 100%;
      border: 1px solid var(--cream-300);
      background: var(--white);
      color: var(--text);
      border-radius: 11px;
      padding: 12px 13px;
      outline: none;
      transition: .18s ease;
    }

    .field textarea {
      min-height: 110px;
      resize: vertical;
    }

    .field input:focus,
    .field select:focus,
    .field textarea:focus {
      border-color: var(--brown-600);
      box-shadow: 0 0 0 3px rgba(118, 80, 57, .12);
    }

    .field small {
      display: block;
      margin-top: 6px;
      color: var(--muted);
      font-size: 11px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .btn {
      border: 0;
      border-radius: 11px;
      padding: 11px 16px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: .18s ease;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    .btn-primary {
      background: var(--brown-900);
      color: var(--white);
    }

    .btn-primary:hover {
      background: var(--brown-800);
    }

    .btn-secondary {
      background: var(--cream-200);
      color: var(--brown-900);
    }

    .btn-danger {
      background: #f9e6e6;
      color: var(--red);
    }

    .btn-success {
      background: #e5f3e9;
      color: var(--green);
    }

    .btn-small {
      padding: 8px 11px;
      font-size: 12px;
    }

    .btn-full {
      width: 100%;
    }

    #app {
      min-height: 100vh;
    }

    .app-shell {
      min-height: 100vh;
      display: flex;
    }

    .sidebar {
      position: fixed;
      z-index: 30;
      left: 0;
      top: 0;
      bottom: 0;
      width: var(--sidebar);
      background: var(--brown-950);
      color: var(--white);
      padding: 24px 16px;
      overflow-y: auto;
    }

    .sidebar-brand {
      padding: 8px 10px 24px;
      border-bottom: 1px solid rgba(255,255,255,.10);
      margin-bottom: 20px;
    }

    .sidebar-brand-inner {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sidebar-logo {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      background: rgba(255,255,255,.08);
      border: 2px solid rgba(255,255,255,.12);
    }

    .sidebar-logo-fallback {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--brown-700);
      font-weight: 800;
    }

    .sidebar-brand strong {
      display: block;
      font-family: Georgia, serif;
      font-size: 17px;
    }

    .sidebar-brand span {
      display: block;
      color: rgba(255,255,255,.55);
      font-size: 11px;
      margin-top: 2px;
    }

    .nav-title {
      color: rgba(255,255,255,.35);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: .14em;
      padding: 0 12px;
      margin-bottom: 8px;
    }

    .nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav button {
      width: 100%;
      border: 0;
      background: transparent;
      color: rgba(255,255,255,.68);
      border-radius: 11px;
      padding: 12px;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 11px;
      font-weight: 600;
      transition: .18s ease;
    }

    .nav button:hover {
      background: rgba(255,255,255,.07);
      color: var(--white);
    }

    .nav button.active {
      background: var(--white);
      color: var(--brown-900);
    }

    .nav-icon {
      width: 24px;
      text-align: center;
      font-size: 17px;
    }

    .sidebar-bottom {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,.10);
    }

    .main {
      width: calc(100% - var(--sidebar));
      margin-left: var(--sidebar);
      min-height: 100vh;
    }

    .topbar {
      height: 76px;
      padding: 0 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      background: rgba(255,255,255,.92);
      border-bottom: 1px solid var(--cream-300);
      position: sticky;
      top: 0;
      z-index: 20;
      backdrop-filter: blur(12px);
    }

    .topbar-title h2 {
      font-family: Georgia, serif;
      color: var(--brown-900);
      font-size: 23px;
    }

    .topbar-title p {
      color: var(--muted);
      font-size: 12px;
    }

    .topbar-actions {
      display: flex;
      gap: 9px;
      align-items: center;
    }

    .content {
      padding: 32px;
      max-width: 1500px;
      margin: 0 auto;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 25px;
    }

    .stat-card {
      background: var(--white);
      border: 1px solid var(--cream-300);
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: 0 5px 20px rgba(50,27,17,.04);
    }

    .stat-card .stat-label {
      font-size: 12px;
      color: var(--muted);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .04em;
    }

    .stat-card .stat-value {
      font-size: 29px;
      color: var(--brown-900);
      font-weight: 800;
      margin-top: 6px;
    }

    .section {
      background: var(--white);
      border: 1px solid var(--cream-300);
      border-radius: var(--radius);
      box-shadow: 0 5px 20px rgba(50,27,17,.04);
      overflow: hidden;
      margin-bottom: 22px;
    }

    .section-header {
      padding: 20px 22px;
      border-bottom: 1px solid var(--cream-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
    }

    .section-header h3 {
      color: var(--brown-900);
      font-family: Georgia, serif;
      font-size: 19px;
    }

    .section-header p {
      color: var(--muted);
      font-size: 12px;
      margin-top: 3px;
    }

    .section-body {
      padding: 22px;
    }

    .area-group {
      margin-bottom: 28px;
    }

    .area-group:last-child {
      margin-bottom: 0;
    }

    .area-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }

    .area-heading h4 {
      color: var(--brown-900);
      font-size: 16px;
    }

    .product-list {
      display: grid;
      gap: 10px;
    }

    .product-row {
      display: grid;
      grid-template-columns: 70px minmax(0, 1fr) auto auto auto;
      align-items: center;
      gap: 14px;
      padding: 12px;
      border: 1px solid var(--cream-200);
      border-radius: 14px;
      background: var(--cream-50);
    }

    .product-image {
      width: 70px;
      height: 70px;
      border-radius: 12px;
      overflow: hidden;
      background: var(--cream-200);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--brown-600);
      font-size: 24px;
      flex-shrink: 0;
    }

    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .product-info {
      min-width: 0;
    }

    .product-name {
      font-weight: 800;
      color: var(--brown-900);
      margin-bottom: 3px;
    }

    .product-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 99px;
      font-size: 10px;
      font-weight: 700;
      background: var(--cream-200);
      color: var(--brown-700);
    }

    .tag.green {
      background: #e5f3e9;
      color: var(--green);
    }

    .tag.red {
      background: #f9e6e6;
      color: var(--red);
    }

    .tag.yellow {
      background: #f7efd9;
      color: var(--yellow);
    }

    .product-price {
      text-align: right;
      white-space: nowrap;
    }

    .product-price strong {
      color: var(--brown-900);
      display: block;
    }

    .old-price {
      color: var(--muted);
      text-decoration: line-through;
      font-size: 11px;
    }

    .product-actions {
      display: flex;
      gap: 6px;
    }

    .table-wrap {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 760px;
    }

    .data-table th {
      background: var(--cream-100);
      color: var(--brown-700);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .05em;
      text-align: left;
      padding: 12px 14px;
      border-bottom: 1px solid var(--cream-300);
    }

    .data-table td {
      padding: 14px;
      border-bottom: 1px solid var(--cream-200);
      font-size: 13px;
      vertical-align: middle;
    }

    .data-table tr:last-child td {
      border-bottom: 0;
    }

    .status {
      display: inline-flex;
      padding: 5px 9px;
      border-radius: 99px;
      font-size: 10px;
      font-weight: 800;
      background: var(--cream-200);
      color: var(--brown-700);
    }

    .status.green {
      background: #e5f3e9;
      color: var(--green);
    }

    .status.red {
      background: #f9e6e6;
      color: var(--red);
    }

    .modal-backdrop {
      position: fixed;
      z-index: 100;
      inset: 0;
      background: rgba(20, 11, 7, .60);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow-y: auto;
    }

    .modal-backdrop.open {
      display: flex;
    }

    .modal {
      width: min(850px, 100%);
      max-height: calc(100vh - 40px);
      overflow-y: auto;
      background: var(--white);
      border-radius: 22px;
      box-shadow: 0 30px 100px rgba(0,0,0,.35);
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--cream-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      position: sticky;
      top: 0;
      background: rgba(255,255,255,.96);
      backdrop-filter: blur(10px);
      z-index: 2;
    }

    .modal-header h3 {
      font-family: Georgia, serif;
      color: var(--brown-900);
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border: 0;
      border-radius: 50%;
      background: var(--cream-100);
      color: var(--brown-900);
      font-size: 20px;
    }

    .modal-body {
      padding: 24px;
    }

    .modal-footer {
      padding: 18px 24px;
      border-top: 1px solid var(--cream-200);
      display: flex;
      justify-content: flex-end;
      gap: 9px;
      position: sticky;
      bottom: 0;
      background: rgba(255,255,255,.96);
      backdrop-filter: blur(10px);
    }

    .photo-picker {
      border: 2px dashed var(--cream-300);
      border-radius: 16px;
      padding: 20px;
      background: var(--cream-50);
      text-align: center;
    }

    .photo-preview {
      width: 150px;
      height: 150px;
      margin: 0 auto 14px;
      border-radius: 15px;
      overflow: hidden;
      background: var(--cream-200);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--brown-600);
      font-size: 35px;
    }

    .photo-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .file-input {
      display: none;
    }

    .check-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .check {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 12px;
      border: 1px solid var(--cream-300);
      border-radius: 11px;
      background: var(--cream-50);
      font-size: 12px;
      font-weight: 700;
      color: var(--brown-800);
    }

    .check input {
      width: 17px;
      height: 17px;
      accent-color: var(--brown-900);
    }

    .empty {
      padding: 40px 20px;
      text-align: center;
      color: var(--muted);
    }

    .empty-icon {
      font-size: 36px;
      margin-bottom: 8px;
    }

    #toast {
      position: fixed;
      z-index: 200;
      right: 22px;
      bottom: 22px;
      max-width: 380px;
      padding: 14px 17px;
      border-radius: 12px;
      background: var(--brown-950);
      color: var(--white);
      box-shadow: 0 15px 40px rgba(0,0,0,.25);
      opacity: 0;
      transform: translateY(15px);
      pointer-events: none;
      transition: .25s ease;
      font-size: 13px;
    }

    #toast.show {
      opacity: 1;
      transform: translateY(0);
    }

    #toast.error {
      background: var(--red);
    }

    #toast.success {
      background: var(--green);
    }

    .setting-card {
      border: 1px solid var(--cream-300);
      border-radius: 15px;
      padding: 18px;
      background: var(--cream-50);
      margin-bottom: 14px;
    }

    .setting-card h4 {
      color: var(--brown-900);
      margin-bottom: 15px;
    }

    @media (max-width: 1100px) {
      .stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .product-row {
        grid-template-columns: 60px minmax(0, 1fr) auto;
      }

      .product-price {
        grid-column: 2;
        text-align: left;
      }

      .product-actions {
        grid-column: 3;
        grid-row: 1 / span 2;
      }
    }

    @media (max-width: 850px) {
      :root {
        --sidebar: 0px;
      }

      .sidebar {
        position: fixed;
        width: 250px;
        transform: translateX(-100%);
        transition: transform .25s ease;
      }

      .sidebar.open {
        transform: translateX(0);
      }

      .main {
        width: 100%;
        margin-left: 0;
      }

      .topbar {
        padding: 0 18px;
      }

      .content {
        padding: 18px;
      }

      .grid-2,
      .grid-3 {
        grid-template-columns: 1fr;
      }

      .check-grid {
        grid-template-columns: 1fr;
      }

      .mobile-menu {
        display: inline-flex !important;
      }
    }

    .mobile-menu {
      display: none;
      border: 0;
      background: var(--cream-100);
      color: var(--brown-900);
      border-radius: 10px;
      width: 40px;
      height: 40px;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    @media (max-width: 600px) {
      .login-card {
        padding: 28px 20px;
      }

      .stats {
        grid-template-columns: 1fr 1fr;
        gap: 9px;
      }

      .stat-card {
        padding: 15px;
      }

      .stat-card .stat-value {
        font-size: 22px;
      }

      .topbar-title h2 {
        font-size: 18px;
      }

      .topbar-title p {
        display: none;
      }

      .product-row {
        grid-template-columns: 58px minmax(0, 1fr);
      }

      .product-price,
      .product-actions {
        grid-column: 2;
        grid-row: auto;
      }

      .product-actions {
        display: flex;
      }

      .modal-body {
        padding: 18px;
      }
    }
  </style>
</head>

<body>

  <section id="loginScreen">
    <div class="login-card">

      <div class="login-brand">
        <div id="loginLogoWrap">
          <div class="login-logo-fallback">M</div>
        </div>

        <h1>Martins Confeitaria</h1>
        <p>Painel administrativo</p>
      </div>

      <form id="loginForm">

        <div class="field">
          <label for="loginEmail">E-mail</label>
          <input
            id="loginEmail"
            name="email"
            type="email"
            autocomplete="username"
            required
          >
        </div>

        <div class="field">
          <label for="loginPassword">Senha</label>
          <input
            id="loginPassword"
            name="password"
            type="password"
            autocomplete="current-password"
            required
          >
        </div>

        <button class="btn btn-primary btn-full" type="submit">
          Entrar
        </button>

        <p
          id="loginMsg"
          style="margin-top:12px;text-align:center;color:#b44343;font-size:12px;"
        ></p>

      </form>
    </div>
  </section>


  <section id="app" class="hidden">

    <div class="app-shell">

      <aside class="sidebar" id="sidebar">

        <div class="sidebar-brand">
          <div class="sidebar-brand-inner">

            <div id="sidebarLogoWrap">
              <div class="sidebar-logo-fallback">M</div>
            </div>

            <div>
              <strong>Martins</strong>
              <span>Confeitaria Artesanal</span>
            </div>

          </div>
        </div>

        <div class="nav-title">Painel</div>

        <nav class="nav">

          <button data-tab="products" class="active">
            <span class="nav-icon">🍰</span>
            Produtos
          </button>

          <button data-tab="orders">
            <span class="nav-icon">🛍️</span>
            Pedidos
          </button>

          <button data-tab="cakes">
            <span class="nav-icon">🎂</span>
            Bolos personalizados
          </button>

          <button data-tab="content">
            <span class="nav-icon">✏️</span>
            Conteúdos
          </button>

          <button data-tab="hours">
            <span class="nav-icon">🕒</span>
            Horários
          </button>

          <button data-tab="rules">
            <span class="nav-icon">📋</span>
            Regras
          </button>

          <button data-tab="media">
            <span class="nav-icon">🖼️</span>
            Mídia
          </button>

        </nav>

        <div class="sidebar-bottom">

          <button
            id="logout"
            class="btn btn-secondary btn-full"
          >
            Sair
          </button>

        </div>

      </aside>


      <main class="main">

        <header class="topbar">

          <div style="display:flex;align-items:center;gap:12px;">

            <button
              class="mobile-menu"
              id="mobileMenu"
              type="button"
            >
              ☰
            </button>

            <div class="topbar-title">
              <h2 id="pageTitle">Produtos</h2>
              <p id="pageSubtitle">
                Gerencie o catálogo da confeitaria.
              </p>
            </div>

          </div>

          <div class="topbar-actions">
            <button
              id="refreshBtn"
              class="btn btn-secondary btn-small"
              type="button"
            >
              ↻ Atualizar
            </button>
          </div>

        </header>


        <div class="content">

          <div class="stats">

            <div class="stat-card">
              <div class="stat-label">Produtos</div>
              <div class="stat-value" id="statProducts">0</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Disponíveis</div>
              <div class="stat-value" id="statAvailable">0</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Pedidos</div>
              <div class="stat-value" id="statOrders">0</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Bolos personalizados</div>
              <div class="stat-value" id="statCakes">0</div>
            </div>

          </div>

          <div id="tabContent"></div>

        </div>

      </main>

    </div>

  </section>


  <div class="modal-backdrop" id="productModal">

    <div class="modal">

      <div class="modal-header">

        <div>
          <h3 id="productModalTitle">Novo produto</h3>
        </div>

        <button
          class="close-btn"
          type="button"
          data-close-modal="productModal"
        >
          ×
        </button>

      </div>

      <form id="productForm">

        <div class="modal-body">

          <div class="field">

            <label>Foto do produto</label>

            <div class="photo-picker">

              <div class="photo-preview" id="photoPreview">
                📷
              </div>

              <label
                for="productPhoto"
                class="btn btn-secondary"
              >
                Escolher foto
              </label>

              <input
                class="file-input"
                id="productPhoto"
                type="file"
                accept="image/*"
              >

              <small>
                Você pode escolher uma foto diretamente do celular,
                computador ou galeria.
              </small>

            </div>

          </div>


          <div class="field">

            <label for="productName">
              Nome do produto *
            </label>

            <input
              id="productName"
              name="name"
              type="text"
              placeholder="Ex.: Bolo de chocolate"
              required
            >

          </div>


          <div class="field">

            <label for="productArea">
              Classificação / área *
            </label>

            <select
              id="productArea"
              name="area"
              required
            >
              <option value="cardapio">Delivery</option>
              <option value="pronta-entrega">
                Pronta entrega
              </option>
              <option value="encomendas">
                Encomendas
              </option>
            </select>

          </div>


          <div class="grid-3">

            <div class="field">

              <label for="productPrice">
                Preço *
              </label>

              <input
                id="productPrice"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                required
              >

            </div>


            <div class="field">

              <label for="productDiscount">
                Desconto (%)
              </label>

              <input
                id="productDiscount"
                name="discount_percent"
                type="number"
                min="0"
                max="100"
                step="1"
                value="0"
              >

            </div>


            <div class="field">

              <label for="productSort">
                Ordem
              </label>

              <input
                id="productSort"
                name="sort"
                type="number"
                step="1"
                value="0"
              >

            </div>

          </div>


          <div class="grid-2">

            <div class="field">

              <label for="productGramatura">
                Gramatura
              </label>

              <input
                id="productGramatura"
                name="gramatura"
                type="text"
                placeholder="Ex.: 1 kg"
              >

            </div>


            <div class="field">

              <label for="productServeAte">
                Serve até quantas pessoas
              </label>

              <input
                id="productServeAte"
                name="serve_ate"
                type="text"
                placeholder="Ex.: 10 pessoas"
              >

            </div>

          </div>


          <div class="field">

            <label for="productDescription">
              Descrição
            </label>

            <textarea
              id="productDescription"
              name="description"
              placeholder="Descreva o produto..."
            ></textarea>

          </div>


          <div class="field">

            <label>
              Configurações
            </label>

            <div class="check-grid">

              <label class="check">
                <input
                  id="productAvailable"
                  type="checkbox"
                  checked
                >
                Produto disponível
              </label>

              <label class="check">
                <input
                  id="productFeatured"
                  type="checkbox"
                >
                Produto em destaque
              </label>

              <label class="check">
                <input
                  id="productAppointment"
                  type="checkbox"
                >
                Agendamento obrigatório
              </label>

            </div>

          </div>

        </div>


        <div class="modal-footer">

          <button
            class="btn btn-secondary"
            type="button"
            data-close-modal="productModal"
          >
            Cancelar
          </button>

          <button
            class="btn btn-primary"
            type="submit"
          >
            Salvar produto
          </button>

        </div>

      </form>

    </div>

  </div>


  <div id="toast"></div>


  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="../config.js"></script>
  <script src="./admin.js?v=20261005"></script>

</body>
</html>
