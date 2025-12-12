const API_BASE = window.location.origin;

const cartListEl = document.getElementById('cart-list');
const subtotalEl = document.getElementById('subtotal');
const shippingEl = document.getElementById('shipping');
const totalEl = document.getElementById('total');
const btnCheckout = document.getElementById('btn-checkout');
const cartSummaryEl = document.getElementById('cart-summary');

// Funções de manipulação do carrinho local
function getLocalCart() {
  return JSON.parse(localStorage.getItem('cart')) || { items: [] };
}

function saveLocalCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function formatBRL(n) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calculateTotals(cart) {
  const subtotal = cart.items.reduce((s, it) => s + it.price * it.quantity, 0);
  const shipping = subtotal === 0 ? 0 : subtotal >= 200 ? 0 : 20;
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
}

// Renderiza o carrinho na tela
function renderCart(cart = getLocalCart()) {
  if (!cartListEl || !subtotalEl || !shippingEl || !totalEl) return;

  cartListEl.innerHTML = '';
  if (cart.items.length === 0) {
    cartListEl.innerHTML = '<p>Seu carrinho está vazio.</p>';
    if (cartSummaryEl) cartSummaryEl.style.display = 'none';
    return;
  } else {
    if (cartSummaryEl) cartSummaryEl.style.display = 'block';
  }

  cart.items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.imageUrl || '/img/no-img.png'}" alt="${item.title}">
      <div class="meta">
        <h4>${item.title}</h4>
        <p>${formatBRL(item.price)}</p>
        <div>
          <button class="qty-dec" data-id="${item._id}">-</button>
          <input class="qty-input" data-id="${item._id}" value="${item.quantity}" style="width:40px;text-align:center">
          <button class="qty-inc" data-id="${item._id}">+</button>
          <button class="remove-item" data-id="${item._id}">Remover</button>
        </div>
      </div>
    `;
    cartListEl.appendChild(div);
  });

  const totals = calculateTotals(cart);
  subtotalEl.textContent = formatBRL(totals.subtotal);
  shippingEl.textContent = formatBRL(totals.shipping);
  totalEl.textContent = formatBRL(totals.total);

  attachCartEventListeners();
}

// Eventos dos botões do carrinho
function attachCartEventListeners() {
  document.querySelectorAll('.qty-inc').forEach(btn => btn.onclick = () => changeQuantity(btn.dataset.id, +1));
  document.querySelectorAll('.qty-dec').forEach(btn => btn.onclick = () => changeQuantity(btn.dataset.id, -1));
  document.querySelectorAll('.qty-input').forEach(inp => inp.onchange = () => setQuantity(inp.dataset.id, Number(inp.value) || 1));
  document.querySelectorAll('.remove-item').forEach(btn => btn.onclick = () => removeItem(btn.dataset.id));
}

// Alterar quantidade de um item
function changeQuantity(productId, delta) {
  const cart = getLocalCart();
  const idx = cart.items.findIndex(i => i._id === productId);
  if (idx === -1) return;
  cart.items[idx].quantity = Math.max(1, cart.items[idx].quantity + delta);
  saveLocalCart(cart);
  renderCart(cart);
  syncCartToServerIfLogged();
}

// Definir quantidade de um item
function setQuantity(productId, quantity) {
  const cart = getLocalCart();
  const idx = cart.items.findIndex(i => i._id === productId);
  if (idx === -1) return;
  cart.items[idx].quantity = Math.max(1, quantity);
  saveLocalCart(cart);
  renderCart(cart);
  syncCartToServerIfLogged();
}

// Remover item do carrinho
function removeItem(productId) {
  const cart = getLocalCart();
  cart.items = cart.items.filter(i => i._id !== productId);
  saveLocalCart(cart);
  renderCart(cart);
  syncCartToServerIfLogged();
}

// Sincroniza o carrinho com o backend se estiver logado
async function syncCartToServerIfLogged() {
  const token = localStorage.getItem('authToken');
  if (!token) return;
  try {
    await fetch(`${API_BASE}/api/cart/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(getLocalCart())
    });
  } catch (err) {
    console.warn('Sync cart falhou', err);
  }
}

// Checkout do carrinho
if (btnCheckout) {
  btnCheckout.onclick = () => {
    const cart = getLocalCart();
    if (!cart.items.length) return alert('Carrinho vazio.');

    // Mensagem fofa
    const mensagemFofa = "Obrigado por comprar com a gente! 💖";

    // Mostrar modal
    const modal = document.getElementById("qrcode-modal");
    modal.style.display = "flex";

    // Criar QR Code
    const qrDiv = document.getElementById("qrcode");
    qrDiv.innerHTML = ""; // limpa QR antigo
    new QRCode(qrDiv, {
      text: mensagemFofa,
      width: 200,
      height: 200
    });

    // Limpar carrinho local
    localStorage.removeItem('cart');
    renderCart({ items: [] });
  };
}

// Botão fechar modal
const closeModalBtn = document.getElementById("close-qrcode-modal");
if (closeModalBtn) {
  closeModalBtn.onclick = () => {
    document.getElementById("qrcode-modal").style.display = "none";
  };
}

// Fechar modal ao clicar fora da caixa
const modal = document.getElementById("qrcode-modal");
if (modal) {
  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };
}


// Renderiza o carrinho ao carregar a página
document.addEventListener('DOMContentLoaded', () => renderCart());
// carrinho.js
