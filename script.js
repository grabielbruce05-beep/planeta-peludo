/* Planeta Peludo - interacciones de la página
   IMPORTANTE: reemplaza el número de ejemplo de WHATSAPP_NUMBER por el número real
   en formato internacional, solo con dígitos (Perú: 51 + número), sin +, espacios ni guiones.
*/
"use strict";

// EJEMPLO: reemplaza 51999999999 por el número real autorizado para el proyecto.
const WHATSAPP_NUMBER = "51907134154";
const WHATSAPP_PLACEHOLDER = "51999999999";

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const productSearch = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");
const productCards = Array.from(document.querySelectorAll(".product-card"));
const productGrid = document.getElementById("productGrid");
const noResults = document.getElementById("noResults");
const resultsSummary = document.getElementById("resultsSummary");
const cartItemsContainer = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartItemLabel = document.getElementById("cartItemLabel");
const cartTotal = document.getElementById("cartTotal");
const cartWhatsApp = document.getElementById("cartWhatsApp");
const contactWhatsApp = document.getElementById("contactWhatsApp");
const toast = document.getElementById("toast");
const clearFiltersButton = document.getElementById("clearFilters");

const products = productCards.reduce((catalog, card) => {
  catalog[card.dataset.id] = {
    id: card.dataset.id,
    name: card.dataset.name,
    category: card.dataset.category,
    price: Number(card.dataset.price)
  };
  return catalog;
}, {});

const cart = new Map();
let toastTimer;

function formatPrice(value) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2
  }).format(value);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function openWhatsApp(message) {
  // Evita abrir el número de ejemplo por accidente.
  if (!WHATSAPP_NUMBER || WHATSAPP_NUMBER === WHATSAPP_PLACEHOLDER) {
    showToast("Configura primero el número de WhatsApp en script.js.");
    return;
  }

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function closeMobileMenu() {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menú");
}

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
});

mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", closeMobileMenu);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMobileMenu();
});

function filterProducts() {
  const searchTerm = productSearch.value.trim().toLocaleLowerCase("es");
  const category = categoryFilter.value;
  let visibleCount = 0;

  productCards.forEach(card => {
    const name = card.dataset.name.toLocaleLowerCase("es");
    const cardCategory = card.dataset.category;
    const matchesSearch = name.includes(searchTerm);
    const matchesCategory = category === "todos" || cardCategory === category;
    const visible = matchesSearch && matchesCategory;
    card.hidden = !visible;
    if (visible) visibleCount++;
  });

  noResults.hidden = visibleCount !== 0;
  productGrid.hidden = visibleCount === 0;
  resultsSummary.textContent = visibleCount === 1
    ? "Mostrando 1 accesorio"
    : `Mostrando ${visibleCount} accesorios`;
}

productSearch.addEventListener("input", filterProducts);
categoryFilter.addEventListener("change", filterProducts);

clearFiltersButton.addEventListener("click", () => {
  productSearch.value = "";
  categoryFilter.value = "todos";
  filterProducts();
  productSearch.focus();
});

document.querySelectorAll("[data-add]").forEach(button => {
  button.addEventListener("click", () => {
    const id = button.dataset.add;
    const currentQuantity = cart.get(id) || 0;
    cart.set(id, currentQuantity + 1);
    renderCart();
    showToast(`${products[id].name} agregado al carrito demostrativo.`);
  });
});

function changeQuantity(id, amount) {
  const nextQuantity = (cart.get(id) || 0) + amount;
  if (nextQuantity <= 0) cart.delete(id);
  else cart.set(id, nextQuantity);
  renderCart();
}

function removeItem(id) {
  cart.delete(id);
  renderCart();
  showToast("Producto retirado del carrito.");
}

function renderCart() {
  const entries = Array.from(cart.entries());
  const totalQuantity = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
  const totalPrice = entries.reduce((sum, [id, quantity]) => sum + products[id].price * quantity, 0);

  cartCount.textContent = String(totalQuantity);
  cartItemLabel.textContent = totalQuantity === 1 ? "1 artículo" : `${totalQuantity} artículos`;
  cartTotal.textContent = formatPrice(totalPrice);

  if (entries.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty">
        <span aria-hidden="true">🧺</span>
        <p>Tu carrito está vacío.</p>
        <small>Agrega un accesorio para comenzar.</small>
      </div>`;
    return;
  }

  cartItemsContainer.innerHTML = entries.map(([id, quantity]) => {
    const product = products[id];
    return `
      <div class="cart-item">
        <div>
          <div class="cart-item-name">${escapeHTML(product.name)}</div>
          <div class="cart-item-price">${formatPrice(product.price)} c/u · Subtotal: ${formatPrice(product.price * quantity)}</div>
        </div>
        <div class="cart-item-controls" aria-label="Cantidad de ${escapeHTML(product.name)}">
          <button class="quantity-button" type="button" data-decrease="${id}" aria-label="Quitar una unidad de ${escapeHTML(product.name)}">−</button>
          <span>${quantity}</span>
          <button class="quantity-button" type="button" data-increase="${id}" aria-label="Agregar una unidad de ${escapeHTML(product.name)}">+</button>
          <button class="remove-button" type="button" data-remove="${id}" aria-label="Eliminar ${escapeHTML(product.name)}">×</button>
        </div>
      </div>`;
  }).join("");

  cartItemsContainer.querySelectorAll("[data-decrease]").forEach(button => {
    button.addEventListener("click", () => changeQuantity(button.dataset.decrease, -1));
  });
  cartItemsContainer.querySelectorAll("[data-increase]").forEach(button => {
    button.addEventListener("click", () => changeQuantity(button.dataset.increase, 1));
  });
  cartItemsContainer.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => removeItem(button.dataset.remove));
  });
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

cartWhatsApp.addEventListener("click", () => {
  if (cart.size === 0) {
    showToast("Tu carrito está vacío. Agrega un accesorio primero.");
    return;
  }

  const lines = Array.from(cart.entries()).map(([id, quantity]) => {
    const product = products[id];
    return `• ${product.name} x${quantity} — ${formatPrice(product.price * quantity)}`;
  });
  const total = Array.from(cart.entries()).reduce((sum, [id, quantity]) => sum + products[id].price * quantity, 0);
  const message = [
    "¡Hola, Planeta Peludo! Quisiera consultar esta selección del catálogo demostrativo:",
    "",
    ...lines,
    "",
    `Total referencial: ${formatPrice(total)}`,
    "",
    "Entiendo que este mensaje es una consulta; no es una compra confirmada. ¿Podrían verificar disponibilidad, precio final y opciones de recojo o envío de accesorios?"
  ].join("\n");
  openWhatsApp(message);
});

contactWhatsApp.addEventListener("click", event => {
  event.preventDefault();
  openWhatsApp("¡Hola, Planeta Peludo! Quisiera consultar sobre sus servicios presenciales de estética canina o sus accesorios.");
});

document.querySelectorAll("[data-service]").forEach(link => {
  link.addEventListener("click", () => {
    // El enlace lleva a contacto; el botón de WhatsApp permite iniciar la consulta.
    sessionStorage.setItem("planetaPeludoService", link.dataset.service);
  });
});

document.getElementById("currentYear").textContent = String(new Date().getFullYear());
filterProducts();
renderCart();
