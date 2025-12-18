// Global State
let products = [];
let productState = {}; // { [id]: { selectedOptionIndex: 0, isSelected: false } }
let cart = [];

// --- EmailJS Initialization ---
(function() {
    try {
        const env = import.meta.env || {};
        const publicKey = env.VITE_EMAILJS_PUBLIC_KEY;
        
        if (typeof emailjs !== 'undefined' && publicKey && publicKey !== 'YOUR_PUBLIC_KEY_HERE') {
            emailjs.init(publicKey);
        } else {
             console.log("EmailJS skipped: Missing or placeholder Public Key");
        }
    } catch (e) {
        console.warn("EmailJS initialization failed:", e);
    }
})();

// DOM Elements
const productListEl = document.getElementById("productList");
const totalEl = document.getElementById("total");
const summaryEl = document.getElementById("summary");

// --- Index Page Logic ---

async function fetchProducts() {
    try {
        const response = await fetch('./products.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        products = await response.json();
        
        // Initialize state
        products.forEach(p => {
            productState[p.id] = {
                selectedOptionIndex: 0,
                isSelected: false 
            };
        });

        renderProducts();
    } catch (error) {
        console.error("Fetch error:", error);
        if (productListEl) {
            productListEl.innerHTML = `<div class="p-8 text-center text-red-500">
                Failed to load products.<br>
                <span class="text-xs text-gray-500">${error.message}</span>
            </div>`;
        }
    }
}

function renderProducts() {
    if (!productListEl) return;

    productListEl.innerHTML = products.map((product) => {
        const state = productState[product.id];
        const currentOption = product.options[state.selectedOptionIndex];
        const isChecked = state.isSelected ? "checked" : "";
        
        // Generate Tabs
        const tabsHtml = product.options.map((opt, idx) => {
            const activeClass = idx === state.selectedOptionIndex ? "active" : "";
            return `
                <div onclick="setProductOption(${product.id}, ${idx})" 
                     class="qty-tab px-3 py-1 text-xs sm:text-sm rounded-md shadow-sm border ${activeClass}">
                    ${opt.label}
                </div>
            `;
        }).join("");

        return `
        <div class="p-4 hover:bg-gray-50 transition-colors flex flex-wrap md:grid md:grid-cols-12 gap-y-3 md:gap-4 items-center group">
            
            <!-- Checkbox -->
            <div class="w-auto mr-3 md:w-full md:mr-0 md:col-span-1 flex justify-center">
                <label class="cursor-pointer relative flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <input type="checkbox" 
                           class="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 transition-all cursor-pointer"
                           ${isChecked}
                           onchange="toggleProduct(${product.id}, this.checked)">
                </label>
            </div>

            <!-- Product Details -->
            <div class="flex-1 flex items-center gap-3 md:col-span-5">
                <div class="relative">
                    <img src="${product.image}" alt="${product.name}" class="w-12 h-12 md:w-14 md:h-14 rounded-lg shadow-sm object-cover bg-white border border-gray-100 group-hover:scale-105 transition-transform duration-300">
                </div>
                <div class="flex flex-col">
                    <span class="font-bold text-gray-800 text-sm sm:text-base leading-tight">${product.name}</span>
                    <span class="md:hidden text-xs text-green-600 font-medium mt-0.5">Top Quality</span>
                </div>
            </div>

            <!-- Price (Mobile: Right side, Desktop: Col 2 Right) -->
            <div class="md:col-span-2 md:order-last text-right ml-auto md:ml-0">
                <div class="font-bold text-green-700 text-base md:text-lg">৳${currentOption.price}</div>
            </div>

            <!-- Quantity Tabs (Mobile: Bottom Full Width, Desktop: Col 4) -->
            <div class="w-full mt-2 md:mt-0 md:w-auto md:col-span-4 flex flex-wrap justify-center gap-2 order-last md:order-none">
                ${tabsHtml}
            </div>

        </div>
        `;
    }).join("");

    calculateTotal();
}

/**
 * Updates the selected quantity option for a product
 */
function setProductOption(productId, optionIndex) {
    if (productState[productId]) {
        productState[productId].selectedOptionIndex = optionIndex;
        
        // If user changes option, we might want to auto-select the product or leave it as is.
        // For now, let's just re-render to update price and active tab.
        renderProducts();
    }
}

function toggleProduct(id, isChecked) {
    if (productState[id]) {
        productState[id].isSelected = isChecked;
        calculateTotal();
    }
}

function selectAll() {
    const allIds = products.map(p => p.id);
    const allSelected = allIds.every(id => productState[id].isSelected);
    
    allIds.forEach(id => {
        productState[id].isSelected = !allSelected;
    });
    
    renderProducts();
}

function calculateTotal() {
    let total = 0;
    let selectedCount = 0;

    products.forEach(product => {
        const state = productState[product.id];
        if (state && state.isSelected) {
            const price = product.options[state.selectedOptionIndex].price;
            total += price;
            selectedCount++;
        }
    });
    
    if (totalEl) {
        totalEl.innerText = total.toLocaleString();
    }
    return total;
}

function showToast(message, type = "error") {
    // Check if Toastify is available
    if (typeof Toastify === "undefined") {
        alert(message);
        return;
    }

    const bgColors = {
        error: "linear-gradient(to right, #ff5f6d, #ffc371)",
        success: "linear-gradient(to right, #00b09b, #96c93d)"
    };

    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "center",
        style: {
            background: bgColors[type],
            color: "#fff",
            fontWeight: "bold"
        },
        stopOnFocus: true
    }).showToast();
}

function addToCart() {
    const selectedIds = Object.keys(productState).filter(id => productState[id].isSelected);

    // Validation: Minimum 10 items
    if (selectedIds.length < 10) {
        showToast(`Please select at least 10 items to proceed. You have selected ${selectedIds.length}.`, "error");
        return;
    }

    const cartItems = [];
    selectedIds.forEach(idStr => {
        const id = parseInt(idStr);
        const product = products.find(p => p.id === id);
        const state = productState[id];
        
        if (product && state) {
            const option = product.options[state.selectedOptionIndex];
            cartItems.push({
                id: product.id,
                name: product.name,
                pkg: "Standard", // Kept for compatibility
                qty: option.label,
                price: option.price,
                image: product.image
            });
        }
    });

    localStorage.setItem("groceryCart", JSON.stringify(cartItems));
    
    showToast("Redirecting to checkout...", "success");
    setTimeout(() => {
        window.location.href = "summary.html";
    }, 1000);
}

// --- Summary Page Logic ---

function loadCart() {
    const savedCart = localStorage.getItem("groceryCart");
    return savedCart ? JSON.parse(savedCart) : [];
}

function initSummary() {
    if (!summaryEl) return;
    
    const cartItems = loadCart();
    let total = 0;

    if (cartItems.length === 0) {
        summaryEl.innerHTML = `<div class="text-center p-8 text-gray-500">Your cart is empty. <br><a href="index.html" class="text-green-600 hover:underline">Go back to shop</a></div>`;
        document.getElementById("summary-total").innerText = "0";
        return;
    }

    summaryEl.innerHTML = cartItems.map(item => {
        total += item.price;
        // Display qty instead of pkg if pkg is generic
        const details = item.pkg === "Standard" ? item.qty : `${item.qty} • ${item.pkg}`;
        
        return `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 gap-3 sm:gap-0">
            <div class="flex items-center gap-4 w-full sm:w-auto">
                <img src="${item.image}" alt="${item.name}" class="w-12 h-12 rounded-lg object-cover flex-shrink-0">
                <div>
                    <h3 class="font-medium text-gray-800 text-sm sm:text-base">${item.name}</h3>
                    <p class="text-xs text-gray-500 uppercase tracking-wider">📦 ${details}</p>
                </div>
            </div>
            <div class="font-bold text-gray-800 self-end sm:self-auto text-lg sm:text-base">৳${item.price.toLocaleString()}</div>
        </div>
        `;
    }).join("");

    document.getElementById("summary-total").innerText = total.toLocaleString();
}

function proceedToCheckout() {
    window.location.href = "checkout.html";
}

// --- Payment Page Logic ---

function initPayment() {
    const amountEl = document.getElementById("pay-amount");
    const qrEl = document.getElementById("qr-code");
    
    if (!amountEl || !qrEl) return;

    const cartItems = loadCart();
    const total = cartItems.reduce((sum, item) => sum + item.price, 0);

    amountEl.innerText = total.toLocaleString();
    qrEl.src = generatePromptPayQR("0812345678", total); // Demo Phone Number
}

// Standard EMVCo QR Generator for Thailand PromptPay
function generatePromptPayQR(phone, amount) {
    if (!amount || amount <= 0) return "";
    
    const payload =
        "00020101021129370016A00000067701011101130066" +
        phone +
        "5802TH5303764" +
        amount.toFixed(2).replace(".", "") +
        "6304";

    return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + payload;
}

// Mock Payment Gateways
function payWithStripe() {
    // Reusing the showToast logic if available, otherwise alert
    if (typeof Toastify !== "undefined") {
         Toastify({
            text: "Redirecting to Safe Stripe Checkout...",
            duration: 3000,
            style: { background: "#635bff" }
        }).showToast();
    } else {
        alert("Redirecting to Safe Stripe Checkout...\n(Integration Ready)");
    }
}

function payWithOmise() {
    if (typeof Toastify !== "undefined") {
         Toastify({
            text: "Opening Omise Secure Payment Popup...",
            duration: 3000,
            style: { background: "#1a56f0" }
        }).showToast();
    } else {
        alert("Opening Omise Secure Payment Popup...\n(Integration Ready)");
    }
}

// --- Checkout Page Logic ---

function initCheckout() {
    const totalEl = document.getElementById("checkout-total");
    if (!totalEl) return;

    const cartItems = loadCart();
    // Redirect if empty
    if (cartItems.length === 0) {
        window.location.href = "index.html";
        return;
    }

    const total = cartItems.reduce((sum, item) => sum + item.price, 0);
    totalEl.innerText = total.toLocaleString();
}

function submitOrder(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById("submit-btn");
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = "<span>⏳</span> Processing...";

    const cartItems = loadCart();
    const total = cartItems.reduce((sum, item) => sum + item.price, 0);
    
    // 1. Format Cart for Email Table
    // We create a simple HTML table string to inject into the email template
    const cartTable = cartItems.map(item => {
        // Handle generic or specific pkg
        const details = item.pkg === "Standard" ? item.qty : `${item.qty} (${item.pkg})`;
        return `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${details}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">৳${item.price.toLocaleString()}</td>
            </tr>
        `;
    }).join("");

    const emailParams = {
        customer_name: document.getElementById("customer_name").value,
        customer_email: document.getElementById("customer_email").value,
        customer_phone: document.getElementById("customer_phone").value,
        customer_address: document.getElementById("customer_address").value,
        order_items: `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 8px; text-align: left;">Item</th>
                        <th style="padding: 8px; text-align: left;">Qty</th>
                        <th style="padding: 8px; text-align: right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${cartTable}
                    <tr>
                        <td colspan="2" style="padding: 8px; font-weight: bold; text-align: right;">Total</td>
                        <td style="padding: 8px; font-weight: bold; text-align: right;">৳${total.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>
        `,
        total_price: total.toLocaleString()
    };

    // 2. Send via EmailJS
    const env = import.meta.env || {};
    const serviceID = env.VITE_EMAILJS_SERVICE_ID;
    const templateID = env.VITE_EMAILJS_TEMPLATE_ID;

    if (!serviceID || !templateID || serviceID === 'YOUR_SERVICE_ID_HERE') {
         showToast("Configuration Error: Please check VITE_EMAILJS Keys in your .env file", "error");
         console.error("Missing/Placeholder Keys:", { serviceID, templateID });
         submitBtn.disabled = false;
         submitBtn.innerHTML = originalText;
         return;
    }

    emailjs.send(serviceID, templateID, emailParams)
        .then(() => {
            // showToast("Order placed successfully! Check your email.", "success"); // Optional: keep or remove
            localStorage.removeItem("groceryCart");
            
            // Show Modal
            const modal = document.getElementById("success-modal");
            const modalName = document.getElementById("modal-customer-name");
            
            if (modalName) modalName.innerText = emailParams.customer_name;
            
            if (modal) {
                modal.classList.remove("hidden");
                // Small delay to allow display:block to apply before opacity transition
                setTimeout(() => {
                    modal.classList.remove("opacity-0");
                    modal.querySelector("div").classList.remove("scale-95");
                    modal.querySelector("div").classList.add("scale-100");
                }, 10);
            }
            
            submitBtn.innerHTML = "<span>✅</span> Sent!";
        })
        .catch((error) => {
            console.error("EmailJS Error:", error);
            if (error.text && error.text.includes("The user is invalid")) {
                 showToast("Configuration Error: Please update EmailJS Keys in code.", "error");
            } else {
                 showToast("Failed to send order. Please try again.", "error");
            }
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        });
}

// Initialization for different pages
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("productList")) {
        fetchProducts();
    }
    if (document.getElementById("summary")) {
        initSummary();
    }
    // Checkout page check
    if (document.getElementById("checkout-form")) {
        initCheckout();
    }
    // QR code check (Legacy/Removed but keeping safe check)
    if (document.getElementById("qr-code")) {
        initPayment();
    }
    
    // Dynamic Year
    const yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
});

// --- Expose for Inline HTML Handlers (Module Scope Fix) ---
window.toggleProduct = toggleProduct;
window.setProductOption = setProductOption;
window.selectAll = selectAll;
window.addToCart = addToCart;
window.proceedToCheckout = proceedToCheckout;
window.submitOrder = submitOrder;
window.payWithStripe = payWithStripe;
window.payWithOmise = payWithOmise;
