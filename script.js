/**
 * ATELIER — Main JavaScript
 * Interatividade e funcionalidades da landing page
 */

// ============================================
// CONFIGURAÇÕES - EDITE AQUI!
// ============================================
const CONFIG = {
    // Número do WhatsApp do vendedor (com código do país, sem +)
    // Exemplo: 5511999999999 (55 = Brasil, 11 = DDD, resto = número)
    whatsappNumber: '5511999999999',
    
    // Username do bot do Telegram (sem @)
    // Crie um bot no @BotFather do Telegram
    telegramBotUsername: 'atelier_store_bot',
    
    // Token do bot do Telegram (para enviar mensagens)
    // Obtenha no @BotFather ao criar o bot
    telegramBotToken: '7898087319:AAHP0XDRUN8vyaxUYANv8bZMGrD3hRLZj6o',
    
    // Chat ID do Telegram para receber pedidos (seu ID ou do grupo)
    // Use @userinfobot para descobrir seu ID
    telegramChatId: '7625866003',
    
    // Nome da loja
    storeName: 'ATELIER',
    
    // ============================================
    // CONFIGURAÇÃO DE EMAIL (EmailJS - Gratuito)
    // ============================================
    // Siga os passos:
    // 1. Crie conta em https://www.emailjs.com (grátis)
    // 2. Adicione um serviço de email (Gmail, Outlook, etc)
    // 3. Crie um template de email
    // 4. Copie os IDs abaixo
    
    emailjs: {
        enabled: true, // Mude para true após configurar
        publicKey: 'N__CTpvGXyWaO9Wve', // Dashboard > Account > Public Key
        serviceId: 'service_d2clahx', // Dashboard > Email Services > Service ID
        templateId: 'template_qytoi22' // Dashboard > Email Templates > Template ID
    },
    
    // Email do vendedor para receber cópia dos pedidos
    vendorEmail: 'contato@atelierstore.com.br'
};

// ============================================
// DOM ELEMENTS
// ============================================
const navbar = document.querySelector('.navbar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const cartBtn = document.getElementById('cartBtn');
const cartOverlay = document.getElementById('cartOverlay');
const cartSidebar = document.getElementById('cartSidebar');
const closeCart = document.getElementById('closeCart');
const cartCount = document.getElementById('cartCount');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartFooter = document.getElementById('cartFooter');
const modalOverlay = document.getElementById('modalOverlay');
const quickViewModal = document.getElementById('quickViewModal');
const closeModal = document.getElementById('closeModal');
const modalContent = document.getElementById('modalContent');
const productsGrid = document.getElementById('productsGrid');
const filterTabs = document.querySelectorAll('.filter-tab');
const newsletterForm = document.getElementById('newsletterForm');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Checkout elements
const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutOverlay = document.getElementById('checkoutOverlay');
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckout = document.getElementById('closeCheckout');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutWhatsApp = document.getElementById('checkoutWhatsApp');
const checkoutTelegram = document.getElementById('checkoutTelegram');
const summaryItems = document.getElementById('summaryItems');
const summaryTotal = document.getElementById('summaryTotal');

// Tracking elements
const trackingOverlay = document.getElementById('trackingOverlay');
const trackingModal = document.getElementById('trackingModal');
const closeTracking = document.getElementById('closeTracking');
const closeTrackingBtn = document.getElementById('closeTrackingBtn');
const orderNumber = document.getElementById('orderNumber');
const telegramBotLink = document.getElementById('telegramBotLink');

// ============================================
// STATE
// ============================================
let cart = JSON.parse(localStorage.getItem('atelierCart')) || [];
let currentFilter = 'all';
let selectedSize = null;
let currentOrderNumber = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format currency to BRL
function formatPrice(price) {
    return price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Show toast notification
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('atelierCart', JSON.stringify(cart));
}

// ============================================
// NAVBAR FUNCTIONALITY
// ============================================

// Scroll effect for navbar
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
});

// Close mobile menu on link click
document.querySelectorAll('.mobile-nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// ============================================
// PRODUCTS FUNCTIONALITY
// ============================================

// Render products grid
function renderProducts(filter = 'all') {
    const filteredProducts = filter === 'all' 
        ? productsData 
        : productsData.filter(p => p.category === filter);
    
    productsGrid.innerHTML = filteredProducts.map((product, index) => `
        <article class="product-card" data-id="${product.id}" style="animation-delay: ${index * 0.1}s">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${product.badge ? `<span class="product-badge ${product.badge}">${getBadgeText(product.badge)}</span>` : ''}
                <div class="product-actions">
                    <button class="btn quick-view-btn" data-id="${product.id}">Ver Detalhes</button>
                    <button class="btn btn-wishlist" aria-label="Favoritar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${product.categoryLabel}</span>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    <span class="current">${formatPrice(product.price)}</span>
                    ${product.originalPrice ? `<span class="original">${formatPrice(product.originalPrice)}</span>` : ''}
                </div>
                <div class="product-colors">
                    ${product.colors.map(color => `
                        <span class="color-dot" style="background-color: ${color}" title="Cor disponível"></span>
                    `).join('')}
                </div>
            </div>
        </article>
    `).join('');
    
    // Add event listeners to quick view buttons
    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = parseInt(btn.dataset.id);
            openQuickView(productId);
        });
    });
}

// Get badge text
function getBadgeText(badge) {
    const badges = {
        'new': 'Novo',
        'sale': 'Oferta',
        'limited': 'Limitado'
    };
    return badges[badge] || badge;
}

// Filter tabs functionality
filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        renderProducts(currentFilter);
    });
});

// ============================================
// QUICK VIEW MODAL
// ============================================

function openQuickView(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    selectedSize = null;
    
    modalContent.innerHTML = `
        <div class="modal-image">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="modal-info">
            <span class="product-category">${product.categoryLabel}</span>
            <h2 class="product-name">${product.name}</h2>
            <div class="product-price">
                <span class="current">${formatPrice(product.price)}</span>
                ${product.originalPrice ? `<span class="original">${formatPrice(product.originalPrice)}</span>` : ''}
            </div>
            <p class="product-desc">${product.description}</p>
            
            <div class="modal-sizes">
                <h4>Tamanho</h4>
                <div class="size-options">
                    ${product.sizes.map(size => `
                        <button class="size-btn" data-size="${size}">${size}</button>
                    `).join('')}
                </div>
            </div>
            
            <div class="product-colors" style="margin-bottom: 1.5rem;">
                <h4 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem;">Cores Disponíveis</h4>
                <div style="display: flex; gap: 0.5rem;">
                    ${product.colors.map(color => `
                        <span class="color-dot" style="background-color: ${color}; width: 24px; height: 24px;"></span>
                    `).join('')}
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-primary add-to-cart-modal" data-id="${product.id}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    Adicionar ao Carrinho
                </button>
                <button class="btn btn-secondary btn-wishlist-modal">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    // Size selection
    modalContent.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modalContent.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSize = btn.dataset.size;
        });
    });
    
    // Add to cart from modal
    modalContent.querySelector('.add-to-cart-modal').addEventListener('click', () => {
        if (!selectedSize) {
            showToast('Por favor, selecione um tamanho');
            return;
        }
        addToCart(product.id, selectedSize);
        closeQuickView();
    });
    
    // Show modal
    modalOverlay.classList.add('active');
    quickViewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeQuickView() {
    modalOverlay.classList.remove('active');
    quickViewModal.classList.remove('active');
    document.body.style.overflow = '';
}

closeModal.addEventListener('click', closeQuickView);
modalOverlay.addEventListener('click', closeQuickView);

// ============================================
// CART FUNCTIONALITY
// ============================================

function updateCartUI() {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update cart count
    cartCount.textContent = itemCount;
    cartCount.classList.toggle('visible', itemCount > 0);
    
    // Update cart total
    cartTotal.textContent = formatPrice(total);
    
    // Update cart footer visibility
    cartFooter.style.display = cart.length > 0 ? 'block' : 'none';
    
    // Render cart items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <p>Seu carrinho está vazio</p>
                <p style="font-size: 0.875rem;">Explore nossa coleção e adicione itens</p>
            </div>
        `;
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}" data-size="${item.size}">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-info">
                <h4 class="cart-item-name">${item.name}</h4>
                <p class="cart-item-details">Tamanho: ${item.size}</p>
                <p class="cart-item-price">${formatPrice(item.price)}</p>
                <div class="cart-item-quantity">
                    <button class="qty-btn qty-minus" data-id="${item.id}" data-size="${item.size}">−</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn qty-plus" data-id="${item.id}" data-size="${item.size}">+</button>
                </div>
            </div>
            <button class="cart-item-remove" data-id="${item.id}" data-size="${item.size}">Remover</button>
        </div>
    `).join('');
    
    // Add event listeners for quantity buttons
    cartItems.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', () => {
            updateQuantity(parseInt(btn.dataset.id), btn.dataset.size, -1);
        });
    });
    
    cartItems.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', () => {
            updateQuantity(parseInt(btn.dataset.id), btn.dataset.size, 1);
        });
    });
    
    cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            removeFromCart(parseInt(btn.dataset.id), btn.dataset.size);
        });
    });
}

function addToCart(productId, size) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId && item.size === size);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size: size,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showToast(`${product.name} adicionado ao carrinho`);
    
    // Open cart sidebar
    openCart();
}

function updateQuantity(productId, size, change) {
    const item = cart.find(item => item.id === productId && item.size === size);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId, size);
        return;
    }
    
    saveCart();
    updateCartUI();
}

function removeFromCart(productId, size) {
    cart = cart.filter(item => !(item.id === productId && item.size === size));
    saveCart();
    updateCartUI();
    showToast('Item removido do carrinho');
}

function openCart() {
    cartOverlay.classList.add('active');
    cartSidebar.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartSidebar() {
    cartOverlay.classList.remove('active');
    cartSidebar.classList.remove('active');
    document.body.style.overflow = '';
}

cartBtn.addEventListener('click', openCart);
closeCart.addEventListener('click', closeCartSidebar);
cartOverlay.addEventListener('click', closeCartSidebar);

// ============================================
// NEWSLETTER FORM
// ============================================

newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = newsletterForm.querySelector('input').value;
    
    // Simulate form submission
    showToast('Inscrição realizada com sucesso! 🎉');
    newsletterForm.reset();
});

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// KEYBOARD NAVIGATION
// ============================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeQuickView();
        closeCartSidebar();
        closeCheckoutModal();
        closeTrackingModal();
        closeOrderTrackingModal();
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ============================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.section-header, .about-content, .about-image, .feature, .newsletter-content').forEach(el => {
    observer.observe(el);
});

// ============================================
// CHECKOUT FUNCTIONALITY
// ============================================

// Generate order number
function generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${timestamp}${random}`;
}

// Format order message
function formatOrderMessage(customerData) {
    const orderNum = generateOrderNumber();
    currentOrderNumber = orderNum;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let message = `🛍️ *NOVO PEDIDO - ${CONFIG.storeName}*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📋 *Pedido #${orderNum}*\n`;
    message += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    
    message += `👤 *DADOS DO CLIENTE*\n`;
    message += `Nome: ${customerData.name}\n`;
    message += `Telefone: ${customerData.phone}\n`;
    if (customerData.email) message += `E-mail: ${customerData.email}\n`;
    message += `\n📍 *ENDEREÇO DE ENTREGA*\n`;
    message += `${customerData.address}\n`;
    message += `${customerData.city} - CEP: ${customerData.cep}\n\n`;
    
    message += `🛒 *ITENS DO PEDIDO*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    
    cart.forEach(item => {
        message += `▸ ${item.name}\n`;
        message += `   Tam: ${item.size} | Qtd: ${item.quantity} | ${formatPrice(item.price * item.quantity)}\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `💰 *TOTAL: ${formatPrice(total)}*\n\n`;
    
    if (customerData.notes) {
        message += `📝 *Observações:*\n${customerData.notes}\n\n`;
    }
    
    message += `✨ Obrigado por comprar na ${CONFIG.storeName}!`;
    
    return { message, orderNum };
}

// Get form data
function getFormData() {
    return {
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        email: document.getElementById('customerEmail').value,
        address: document.getElementById('customerAddress').value,
        city: document.getElementById('customerCity').value,
        cep: document.getElementById('customerCep').value,
        notes: document.getElementById('customerNotes').value
    };
}

// Validate form
function validateForm() {
    const required = ['customerName', 'customerPhone', 'customerAddress', 'customerCity', 'customerCep'];
    let valid = true;
    
    required.forEach(id => {
        const input = document.getElementById(id);
        if (!input.value.trim()) {
            input.style.borderColor = 'var(--color-terracotta)';
            valid = false;
        } else {
            input.style.borderColor = 'var(--color-border)';
        }
    });
    
    if (!valid) {
        showToast('Por favor, preencha todos os campos obrigatórios');
    }
    
    return valid;
}

// Open checkout modal
function openCheckout() {
    if (cart.length === 0) {
        showToast('Seu carrinho está vazio');
        return;
    }
    
    closeCartSidebar();
    updateCheckoutSummary();
    
    checkoutOverlay.classList.add('active');
    checkoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close checkout modal
function closeCheckoutModal() {
    checkoutOverlay.classList.remove('active');
    checkoutModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Update checkout summary
function updateCheckoutSummary() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    summaryItems.innerHTML = cart.map(item => `
        <div class="summary-item">
            <span class="summary-item-name">${item.name}</span>
            <span class="summary-item-qty">x${item.quantity}</span>
            <span class="summary-item-price">${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');
    
    summaryTotal.textContent = formatPrice(total);
}

// Send via WhatsApp
function sendWhatsApp() {
    if (!validateForm()) return;
    
    const customerData = getFormData();
    const { message, orderNum } = formatOrderMessage(customerData);
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`;
    
    // Save order to localStorage
    saveOrder(orderNum, customerData);
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Clear cart
    clearCartAfterOrder();
    closeCheckoutModal();
    
    showToast('Pedido enviado! Abrindo WhatsApp...');
}

// Send via Telegram
async function sendTelegram() {
    if (!validateForm()) return;
    
    const customerData = getFormData();
    const { message, orderNum } = formatOrderMessage(customerData);
    
    // Save order locally first
    saveOrder(orderNum, customerData);
    
    // Primeiro mostra o modal de sucesso
    showTrackingModal(orderNum);
    clearCartAfterOrder();
    closeCheckoutModal();
    
    // Tenta enviar via API (pode falhar por CORS em arquivos locais)
    try {
        const response = await fetch(`https://api.telegram.org/bot${CONFIG.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: CONFIG.telegramChatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            showToast('Pedido enviado com sucesso! ✅');
        } else {
            // Copia mensagem para envio manual
            copyOrderToClipboard(message);
        }
    } catch (error) {
        // CORS error em arquivo local - copia para clipboard
        copyOrderToClipboard(message);
    }
}

// Copia pedido para clipboard quando CORS bloqueia
function copyOrderToClipboard(message) {
    const cleanMessage = message.replace(/\*/g, '');
    navigator.clipboard.writeText(cleanMessage).then(() => {
        showToast('Pedido copiado! Cole no Telegram do vendedor.');
    }).catch(() => {
        showToast('Abra o bot do Telegram para enviar o pedido.');
    });
}


// Show tracking modal
function showTrackingModal(orderNum) {
    if (orderNumber) {
        orderNumber.textContent = orderNum;
    }
    
    // Update link to open order tracking page instead of Telegram
    if (telegramBotLink) {
        telegramBotLink.setAttribute('href', '#');
        telegramBotLink.onclick = (e) => {
            e.preventDefault();
            closeTrackingModal();
            setTimeout(() => openOrderTracking(orderNum), 300);
        };
        // Update button text
        telegramBotLink.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            Acompanhar Pedido
        `;
    }
    
    if (trackingOverlay) trackingOverlay.classList.add('active');
    if (trackingModal) trackingModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close tracking modal
function closeTrackingModal() {
    if (trackingOverlay) trackingOverlay.classList.remove('active');
    if (trackingModal) trackingModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Save order to localStorage
function saveOrder(orderNum, customerData) {
    const orders = JSON.parse(localStorage.getItem('atelierOrders')) || [];
    
    const orderData = {
        orderNumber: orderNum,
        customer: customerData,
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        date: new Date().toISOString(),
        status: 'received'
    };
    
    orders.push(orderData);
    localStorage.setItem('atelierOrders', JSON.stringify(orders));
    
    // Envia email de confirmação se configurado
    if (CONFIG.emailjs.enabled && customerData.email) {
        sendConfirmationEmail(orderData, customerData);
    }
}

// Envia email de confirmação para o cliente
async function sendConfirmationEmail(orderData, customerData) {
    // Verifica se EmailJS está disponível
    if (typeof emailjs === 'undefined') {
        console.warn('EmailJS não carregado');
        return;
    }
    
    try {
        // Inicializa EmailJS
        emailjs.init(CONFIG.emailjs.publicKey);
        
        // Formata lista de itens para o email
        const itemsList = orderData.items.map(item => 
            `• ${item.name} (Tam: ${item.size}) x${item.quantity} - ${formatPrice(item.price * item.quantity)}`
        ).join('\n');
        
        // Parâmetros do template
        const templateParams = {
            // Para o cliente
            to_email: customerData.email,
            to_name: customerData.name,
            
            // Dados do pedido
            order_number: orderData.orderNumber,
            order_date: new Date().toLocaleDateString('pt-BR'),
            order_items: itemsList,
            order_total: formatPrice(orderData.total),
            
            // Endereço
            delivery_address: `${customerData.address}, ${customerData.city} - CEP: ${customerData.cep}`,
            
            // Loja
            store_name: CONFIG.storeName,
            
            // Link para acompanhar (página da loja)
            tracking_link: `${window.location.origin}${window.location.pathname}?pedido=${orderData.orderNumber}`,
            
            // Email do vendedor (para cópia)
            vendor_email: CONFIG.vendorEmail
        };
        
        // Envia o email
        const response = await emailjs.send(
            CONFIG.emailjs.serviceId,
            CONFIG.emailjs.templateId,
            templateParams
        );
        
        if (response.status === 200) {
            console.log('Email de confirmação enviado!');
            showToast('Email de confirmação enviado! 📧');
        }
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        // Não mostra erro para o usuário, pois o pedido já foi feito
    }
}

// Clear cart after order
function clearCartAfterOrder() {
    cart = [];
    saveCart();
    updateCartUI();
    checkoutForm.reset();
}

// Checkout event listeners
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', openCheckout);
}

if (closeCheckout) {
    closeCheckout.addEventListener('click', closeCheckoutModal);
}

if (checkoutOverlay) {
    checkoutOverlay.addEventListener('click', closeCheckoutModal);
}

if (checkoutWhatsApp) {
    checkoutWhatsApp.addEventListener('click', sendWhatsApp);
}

if (checkoutTelegram) {
    checkoutTelegram.addEventListener('click', sendTelegram);
}

if (closeTracking) {
    closeTracking.addEventListener('click', closeTrackingModal);
}

if (closeTrackingBtn) {
    closeTrackingBtn.addEventListener('click', closeTrackingModal);
}

if (trackingOverlay) {
    trackingOverlay.addEventListener('click', closeTrackingModal);
}

// ============================================
// ORDER TRACKING FUNCTIONALITY
// ============================================

const orderTrackingOverlay = document.getElementById('orderTrackingOverlay');
const orderTrackingModal = document.getElementById('orderTrackingModal');
const closeOrderTracking = document.getElementById('closeOrderTracking');
const trackingSearchForm = document.getElementById('trackingSearchForm');
const trackingCodeInput = document.getElementById('trackingCodeInput');
const trackingSearchView = document.getElementById('trackingSearchView');
const trackingResultView = document.getElementById('trackingResultView');
const trackingNotFoundView = document.getElementById('trackingNotFoundView');
const backToSearch = document.getElementById('backToSearch');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const trackOrderNav = document.getElementById('trackOrderNav');
const trackOrderMobile = document.getElementById('trackOrderMobile');

// Open order tracking modal
function openOrderTracking(orderCode = null) {
    // Reset views
    trackingSearchView.style.display = 'block';
    trackingResultView.style.display = 'none';
    trackingNotFoundView.style.display = 'none';
    trackingCodeInput.value = orderCode || '';
    
    // If order code provided, search immediately
    if (orderCode) {
        searchOrder(orderCode);
    }
    
    orderTrackingOverlay.classList.add('active');
    orderTrackingModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close order tracking modal
function closeOrderTrackingModal() {
    orderTrackingOverlay.classList.remove('active');
    orderTrackingModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Search for order
function searchOrder(code) {
    const orders = JSON.parse(localStorage.getItem('atelierOrders')) || [];
    const order = orders.find(o => o.orderNumber.toUpperCase() === code.toUpperCase());
    
    if (order) {
        displayOrderDetails(order);
    } else {
        showNotFound();
    }
}

// Display order details
function displayOrderDetails(order) {
    trackingSearchView.style.display = 'none';
    trackingNotFoundView.style.display = 'none';
    trackingResultView.style.display = 'block';
    
    // Update header
    document.getElementById('displayOrderNumber').textContent = order.orderNumber;
    document.getElementById('displayOrderDate').textContent = new Date(order.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Update status badge
    const statusBadge = document.getElementById('orderStatusBadge');
    const statusTexts = {
        'received': 'Pedido Recebido',
        'preparing': 'Em Preparação',
        'shipped': 'Enviado',
        'delivered': 'Entregue'
    };
    statusBadge.textContent = statusTexts[order.status] || 'Pedido Recebido';
    statusBadge.className = 'order-status-badge ' + (order.status || 'received');
    
    // Update timeline
    updateTimeline(order.status || 'received');
    
    // Update items list
    const itemsList = document.getElementById('orderItemsList');
    itemsList.innerHTML = order.items.map(item => `
        <div class="order-item-row">
            <div class="order-item-info">
                <span class="order-item-name">${item.name}</span>
                <span class="order-item-size">Tamanho: ${item.size} | Qtd: ${item.quantity}</span>
            </div>
            <span class="order-item-price">${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');
    
    // Update total
    document.getElementById('displayOrderTotal').textContent = formatPrice(order.total);
    
    // Update delivery address
    const address = order.customer;
    document.getElementById('displayDeliveryAddress').textContent = 
        `${address.address}, ${address.city} - CEP: ${address.cep}`;
    
    // Update WhatsApp contact link
    const whatsappLink = document.getElementById('contactWhatsAppOrder');
    const message = encodeURIComponent(`Olá! Tenho uma dúvida sobre o pedido #${order.orderNumber}`);
    whatsappLink.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${message}`;
}

// Update timeline based on status
function updateTimeline(status) {
    const steps = ['received', 'preparing', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(status);
    
    document.querySelectorAll('.timeline-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        
        if (index < currentIndex) {
            step.classList.add('completed');
        } else if (index === currentIndex) {
            step.classList.add('active');
        }
    });
}

// Show not found view
function showNotFound() {
    trackingSearchView.style.display = 'none';
    trackingResultView.style.display = 'none';
    trackingNotFoundView.style.display = 'block';
}

// Show search view
function showSearchView() {
    trackingSearchView.style.display = 'block';
    trackingResultView.style.display = 'none';
    trackingNotFoundView.style.display = 'none';
    trackingCodeInput.value = '';
    trackingCodeInput.focus();
}

// Event listeners for order tracking
if (trackingSearchForm) {
    trackingSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = trackingCodeInput.value.trim();
        if (code) {
            searchOrder(code);
        }
    });
}

if (closeOrderTracking) {
    closeOrderTracking.addEventListener('click', closeOrderTrackingModal);
}

if (orderTrackingOverlay) {
    orderTrackingOverlay.addEventListener('click', closeOrderTrackingModal);
}

if (backToSearch) {
    backToSearch.addEventListener('click', showSearchView);
}

if (tryAgainBtn) {
    tryAgainBtn.addEventListener('click', showSearchView);
}

if (trackOrderNav) {
    trackOrderNav.addEventListener('click', (e) => {
        e.preventDefault();
        openOrderTracking();
    });
}

if (trackOrderMobile) {
    trackOrderMobile.addEventListener('click', (e) => {
        e.preventDefault();
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        openOrderTracking();
    });
}

// Check URL for order tracking code
function checkUrlForOrderCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderCode = urlParams.get('pedido') || urlParams.get('order');
    if (orderCode) {
        openOrderTracking(orderCode);
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartUI();
    checkUrlForOrderCode();
});

