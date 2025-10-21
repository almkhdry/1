/* ==========================================================
   ملف script.js - الوظائف الرئيسية للمتجر والسلة
   ========================================================== */

// 1. المتغيرات الأساسية وتحميل السلة
let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
const PRODUCTS_JSON_URL = 'products.json'; // تأكد من أن هذا المسار صحيح

// 2. دالة لحفظ السلة في التخزين المحلي
const saveCart = () => {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
};

// 3. دالة لتنسيق العملة (افتراض: ريال سعودي)
const formatCurrency = (amount) => {
    // يمكنك تعديل العملة هنا:
    return parseFloat(amount).toFixed(2) + ' ر.س'; 
};

// 4. دالة تحديث عداد السلة (تستخدم في كل الصفحات)
const updateCartCount = () => {
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
};

// 5. دالة حساب المجموع الكلي للسلة
const calculateCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// 6. دالة إضافة منتج إلى السلة
const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    updateCartCount();
    alert(`تم إضافة ${product.name} إلى السلة بنجاح!`);
};

// 7. وظيفة جلب المنتجات وربط زر الإضافة (تستخدم في صفحات المنتجات)
const fetchProductsAndSetupButtons = async () => {
    try {
        const response = await fetch(PRODUCTS_JSON_URL);
        if (!response.ok) throw new Error('فشل في جلب المنتجات');
        const products = await response.json();

        // ربط أزرار الإضافة في الصفحة
        const buyButtons = document.querySelectorAll('.add-to-cart-btn');
        buyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.closest('.product-card, .detail-card').dataset.productId;
                const product = products.find(p => p.id === productId);
                if (product) {
                    addToCart(product);
                }
            });
        });

    } catch (error) {
        console.error("خطأ في جلب المنتجات:", error);
    }
};

/* =======================================
   وظائف صفحة السلة (cart.html)
   ======================================= */

// 8. دالة عرض محتوى السلة في صفحة cart.html
const renderCartItems = () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    
    if (!cartItemsContainer || !cartTotalElement) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-message">سلة المشتريات فارغة. <a href="index.html">ابدأ بالتسوق الآن!</a></p>';
        cartTotalElement.textContent = formatCurrency(0);
        return;
    }

    let itemsHTML = '';
    cart.forEach(item => {
        itemsHTML += `
            <div class="cart-item" data-product-id="${item.id}">
                <img src="${item.imageUrl || 'default-image.jpg'}" alt="${item.name}" class="item-image">
                <div class="item-details">
                    <h4 class="item-name">${item.name}</h4>
                    <p class="item-price">${formatCurrency(item.price)}</p>
                </div>
                <div class="item-quantity-control">
                    <button class="quantity-btn decrease-qty" data-id="${item.id}">-</button>
                    <span class="item-qty">${item.quantity}</span>
                    <button class="quantity-btn increase-qty" data-id="${item.id}">+</button>
                </div>
                <p class="item-subtotal">${formatCurrency(item.price * item.quantity)}</p>
                <button class="remove-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i> إزالة
                </button>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = itemsHTML;
    cartTotalElement.textContent = formatCurrency(calculateCartTotal());
    
    // ربط مستمعي الأحداث لأزرار الكمية والإزالة
    document.querySelectorAll('.quantity-btn').forEach(btn => btn.addEventListener('click', handleQuantityChange));
    document.querySelectorAll('.remove-btn').forEach(btn => btn.addEventListener('click', removeItem));
};

// دالة لمعالجة تغيير الكمية
const handleQuantityChange = (e) => {
    const itemId = e.target.dataset.id;
    const isIncrease = e.target.classList.contains('increase-qty');
    
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        if (isIncrease) {
            cart[itemIndex].quantity += 1;
        } else if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
        }
        saveCart();
        updateCartCount();
        renderCartItems(); // إعادة رسم السلة لتحديث المبالغ الفرعية والنهائية
    }
};

// دالة لإزالة المنتج بالكامل
const removeItem = (e) => {
    const itemId = e.target.dataset.id;
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartCount();
    renderCartItems();
};


/* =======================================
   وظائف صفحة إتمام الشراء (checkout.html)
   ======================================= */

// 10. وظيفة تحديث ملخص الطلب في صفحة checkout.html
const updateCheckoutSummary = () => {
    const summaryElement = document.getElementById('checkout-summary');
    const totalElement = document.getElementById('checkout-total');
    const checkoutForm = document.getElementById('checkout-form');
    
    if (!summaryElement || !totalElement) return;
    
    if (cart.length === 0) {
        summaryElement.innerHTML = '<p style="color: red; font-weight: 700;">سلة المشتريات فارغة! يرجى العودة لصفحة <a href="cart.html">السلة</a>.</p>';
        totalElement.textContent = formatCurrency(0);
        if(checkoutForm) checkoutForm.querySelector('.confirm-order-btn').disabled = true;
        return;
    }
    
    if(checkoutForm) checkoutForm.querySelector('.confirm-order-btn').disabled = false;

    let summaryHTML = '<ul style="list-style: none; padding-right: 0;">';
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        summaryHTML += `
            <li style="margin-bottom: 5px; list-style: disc; margin-right: 20px; font-size: 15px;">
                ${item.name} (${item.quantity} × ${formatCurrency(item.price)}) = <span style="font-weight: 700; color: var(--color-brand-primary);">${formatCurrency(itemTotal)}</span>
            </li>
        `;
    });
    summaryHTML += '</ul>';

    summaryElement.innerHTML = summaryHTML;
    totalElement.textContent = formatCurrency(calculateCartTotal());
};

// 11. معالج إرسال نموذج إتمام الشراء (في checkout.html) - الآن يرسل عبر Web3Forms
const checkoutForm = document.getElementById('checkout-form');
if (checkoutForm) {
    
    const hiddenOrderDetails = document.getElementById('order-details-hidden');
    
    checkoutForm.addEventListener('submit', (e) => {
        
        // 1. تحقق من السلة أولاً
        if (cart.length === 0) {
             e.preventDefault(); 
             alert('سلة المشتريات فارغة، لا يمكن إتمام الطلب.');
             return;
        }
        
        // 2. تجميع تفاصيل الطلب بشكل نصي موحد (وهذا ما سيظهر لك في الإيميل)
        const orderItemsText = cart.map(item => 
            `\n - ${item.name} (الكمية: ${item.quantity} | السعر: ${formatCurrency(item.price)}) | الإجمالي: ${formatCurrency(item.price * item.quantity)}`
        ).join('');
        
        const finalMessage = `
*--- تفاصيل الطلبات ---*
${orderItemsText}
-------------------------
*المجموع الكلي:* ${formatCurrency(calculateCartTotal())}
`;
        
        // 3. وضع الرسالة المجمعة في الحقل المخفي قبل الإرسال الفعلي
        if (hiddenOrderDetails) {
            hiddenOrderDetails.value = finalMessage.trim();
        }

        // 4. مسح السلة بعد نجاح الإرسال
        // نستخدم setTimeout لضمان أن المتصفح قد بدأ بإرسال البيانات قبل مسح السلة
        setTimeout(() => {
             // عرض رسالة نجاح للعميل
            alert('🎉 تم تسجيل طلبك بنجاح! سيتم التواصل معك قريباً لتأكيد تفاصيل الشحن. شكراً لك.');
            
            // 5. مسح السلة بعد التأكيد
            cart = [];
            saveCart();
            
            // تحديث عداد السلة بعد المسح
            updateCartCount();

        }, 500); // 0.5 ثانية تأخير للسماح بالإرسال
        
        // لا نستخدم e.preventDefault() للسماح لـ Web3Forms بإرسال النموذج تلقائياً
    });
    
    // تحديث الملخص عند تحميل الصفحة
    updateCheckoutSummary();
}


/* =======================================
   وظائف عامة وإطلاق البرنامج
   ======================================= */

// 12. دالة العودة للأعلى (Top Function)
function topFunction() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

// 13. إظهار زر العودة للأعلى عند التمرير
window.onscroll = function() {scrollFunction()};
const scrollFunction = () => {
    const backToTop = document.getElementById("backToTop");
    if (backToTop) {
        if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
            backToTop.style.display = "block";
        } else {
            backToTop.style.display = "none";
        }
    }
};

// 14. إطلاق الوظائف عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // تحديث العداد في جميع الصفحات
    updateCartCount(); 
    
    // إطلاق جلب المنتجات وربط الأزرار (في صفحات المنتجات)
    fetchProductsAndSetupButtons(); 

    // عرض محتويات السلة (إذا كنا في cart.html)
    if (document.getElementById('cart-items')) {
        renderCartItems();
    }
    
    // تحديث السنة في الفوتر (إذا كانت موجودة)
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
});
