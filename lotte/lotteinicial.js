// ==========================
// MENU MOBILE
// ==========================
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector("nav ul");

hamburger.addEventListener("click", () => {
  navMenu.classList.toggle("active");
});

// ==========================
// FAVORITOS (LOCALSTORAGE)
// ==========================
async function toggleFavorite(productId) {
  const auth = await fetch("https://lotte-ecomerce.onrender.com/checkAuth", {
    credentials: "include"
  }).then(r => r.json());

  if (!auth.autenticado) {
    alert("Você precisa estar logado para favoritar.");
    window.location.href = "/bancos/public/login.html";
    return;
  }

  const botao = document.getElementById(`fav-${productId}`);
  const isFavorited = botao.classList.contains("favoritado");

  if (isFavorited) {
    await fetch(`https://lotte-ecomerce.onrender.com/favoritos/${productId}`, {
      method: "DELETE",
      credentials: "include"
    });
  } else {
    await fetch(`https://lotte-ecomerce.onrender.com/favoritos/${productId}`, {
      method: "POST",
      credentials: "include"
    });
  }

  botao.classList.toggle("favoritado");
}
function renderProducts(products, favoritosUsuario = []) {
  const container = document.getElementById("homeProductList");
  if (!container) return;

  container.innerHTML = ""; // limpa antes de renderizar

  products
    .filter(p => p.isPublished)
    .forEach(produto => {
      const card = document.createElement("div");
      card.classList.add("product-card");

      card.innerHTML = `
        <button 
          id="fav-${produto._id}"
          class="btn-favorito ${favoritosUsuario.includes(produto._id) ? "favoritado" : ""}"
          onclick="toggleFavorite('${produto._id}')"
        >
          ❤
        </button>

        <img src="${produto.image}" alt="${produto.name}">
        <h3>${produto.name}</h3>
        <p>R$ ${produto.price.toFixed(2)}</p>

        <button class="btn-add-cart" data-id="${produto._id}">Adicionar ao Carrinho</button>
      `;

      container.appendChild(card);
    });

  document.querySelectorAll(".btn-add-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      addToCart(id);
        mostrarPopupCarrinho();

    });
  });
}
async function carregarProdutos() {
  try {
    const resposta = await fetch("https://lotte-ecomerce.onrender.com/api/products");
    const produtos = await resposta.json();

    const auth = await fetch("https://lotte-ecomerce.onrender.com/checkAuth", { credentials: "include" })
      .then(r => r.json());

    let favoritosUsuario = [];
    if (auth.autenticado) {
      const favs = await fetch("https://lotte-ecomerce.onrender.com/favoritos", { credentials: "include" })
        .then(r => r.json());
      favoritosUsuario = favs.map(f => f._id);
    }

    renderProducts(produtos, favoritosUsuario);

  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
  }
}

document.addEventListener("DOMContentLoaded", carregarProdutos);
async function addToCart(productId) {
  try {
    // Pega os produtos do backend
    const resposta = await fetch(`https://lotte-ecomerce.onrender.com/api/products/${productId}`);
    if (!resposta.ok) throw new Error("Produto não encontrado");
    const produto = await resposta.json();

    // Pega o carrinho local
    const cart = JSON.parse(localStorage.getItem('cart')) || { items: [] };

    // Verifica se produto já existe no carrinho
    const idx = cart.items.findIndex(i => i._id === produto._id);
    if (idx !== -1) {
      cart.items[idx].quantity += 1; // aumenta quantidade
    } else {
      cart.items.push({
        _id: produto._id,
        title: produto.name,
        price: produto.price,
        imageUrl: produto.image,
        quantity: 1
      });
    }

    // Salva no localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Atualiza carrinho (se estiver na página do carrinho)
    if (typeof renderCart === 'function') renderCart();

    function mostrarPopupCarrinho() {
  const popup = document.getElementById('popup-carrinho');
  popup.classList.add('show');

  setTimeout(() => {
    popup.classList.remove('show');
  }, 2000);
}

  } catch (erro) {
    console.error("Erro ao adicionar ao carrinho:", erro);
    alert("Erro ao adicionar produto ao carrinho.");
  }
}

// ================= POPUP DO CARRINHO =================
function mostrarPopupCarrinho() {
  const popup = document.getElementById('popup-carrinho');
  popup.classList.add('show'); 

  setTimeout(() => {
    popup.classList.remove('show');
  }, 2000);
}

