# Grocery Solution - Project Documentation

This project is a complete Thai Grocery Package system with 5 key features:
1.  **Package-specific quantities & prices**
2.  **Persistent cart using `localStorage`**
3.  **Order summary page**
4.  **PromptPay QR checkout**
5.  **Real payment gateway integration hooks**

## 📂 Project Structure

```
GrocerySolution/
├── index.html          # Main shop page (Product & Package Selection)
├── summary.html        # Order confirmation & summary
├── payment.html        # Payment page with QR code generator
├── js/
│   └── script.js       # Core logic (Cart, Packages, Rendering)
└── css/
    └── style.css       # Custom styling (complements Tailwind)
```

## 🚀 How to Use

### 1. Requirements
-   A modern web browser.
-   Internet connection (to load Tailwind CSS and Google Fonts via CDN).

### 2. Running the Project
Simply double-click **`index.html`** to open it in your browser. No server is required for the basic functionality.

## 🛠 Features Detail

### Data & Logic (`js/script.js`)
-   **Package Handling**: Supports `Small`, `Medium`, and `Large` packages. Toggling the package updates prices/quantities for all products instantly.
-   **Cart System**: Uses `localStorage` to save your selection. This allows the cart content to persist even if you refresh the page or move between `index.html` and `summary.html`.
-   **PromptPay QR**: The `generatePromptPayQR` function creates a valid Thai EMVCo standard QR string and renders it using a QR visualization API.

### Design
-   **Tailwind CSS**: Used for layout, typography, and responsiveness.
-   **Style**: Designed with a "Fresh" and "Premium" aesthetic using Green/Gold colors and Glassmorphism effects.
-   **Fonts**: "Prompt" font from Google Fonts for authentic Thai typography support.

## 🧪 Verification Steps

1.  **Select Package**: On the home page, click "Medium". Notice the prices update.
2.  **Add to Cart**: Select "Chili Powder" and "Mustard Oil". Click "Checkout".
3.  **Review Order**: You will be taken to `summary.html`. Verify the items are correct.
4.  **Pay**: Click "Proceed to Payment".
5.  **QR Code**: On `payment.html`, a QR code will be generated for the total amount.

## 📝 Configuration

To change products or prices, open `js/script.js` and edit the `products` array:

```javascript
const products = [
    {
        id: 1,
        name: "Product Name",
        packages: {
            small: { qty: "...", price: 100 },
            ...
        }
    },
    ...
];
```
