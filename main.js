// Добавим в начало файла переменные для touch-жестов
let touchStartX = 0;
let touchEndX = 0;

// --- ЗАГРУЗКА ТОВАРОВ ИЗ localStorage ---
// Используем var, чтобы избежать конфликта с admin.js, если он загружен на той же странице
var perfumes = [];

// Попробуем загрузить товары из localStorage
try {
    const savedPerfumes = localStorage.getItem('aromtest_perfumes');
    if (savedPerfumes) {
        perfumes = JSON.parse(savedPerfumes);
        // Проверим, что данные корректны
        if (!Array.isArray(perfumes)) {
            throw new Error('Некорректный формат данных');
        }
        console.log("main.js: Товары загружены из localStorage");
    } else {
        console.log("main.js: Данные в localStorage не найдены, каталог будет пуст");
        perfumes = []; // Используем пустой массив
    }
} catch (e) {
    console.error("main.js: Ошибка загрузки из localStorage:", e);
    perfumes = []; // В случае ошибки используем пустой массив
}
// Делаем массив доступным глобально
window.perfumes = perfumes;


// --- Фильтрация и категории ---
let currentFilters = {
    category: 'all',
    brand: 'all',
    minPrice: 0,
    maxPrice: Infinity,
    inStock: false
};

// Инициализация фильтров
function initFilters() {
    populateBrandFilter();
    setupEventListeners();
    applyFilters(); // Показать все товары при загрузке
}

// Заполнение выпадающего списка брендов
function populateBrandFilter() {
    const brandSelect = document.getElementById('filter-brand');
    if (!brandSelect) return;
    // Получаем уникальные бренды из текущего массива perfumes
    const brands = [...new Set(perfumes.map(p => p.brand))].filter(b => b); // filter(b => b) убирает пустые/undefined
    // Очищаем существующие опции, кроме первой
    brandSelect.innerHTML = '<option value="all">Все бренды</option>';
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandSelect.appendChild(option);
    });
}

// Установка обработчиков событий
function setupEventListeners() {
    // Кнопки категорий
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilters.category = this.dataset.category;
            applyFilters();
        });
    });

    // Кнопка "Применить" в панели фильтров
    document.getElementById('apply-filters')?.addEventListener('click', function() {
        collectFilterValues();
        applyFilters();
    });

    // Кнопка "Сбросить"
    document.getElementById('reset-filters')?.addEventListener('click', function() {
        resetFilters();
    });

    // Применять фильтры по Enter в полях ввода цены
    document.getElementById('filter-price-min')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            collectFilterValues();
            applyFilters();
        }
    });
    document.getElementById('filter-price-max')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            collectFilterValues();
            applyFilters();
        }
    });
}

// Сбор значений из элементов управления фильтрами
function collectFilterValues() {
    const categorySelect = document.getElementById('filter-category');
    const brandSelect = document.getElementById('filter-brand');
    const minPriceInput = document.getElementById('filter-price-min');
    const maxPriceInput = document.getElementById('filter-price-max');
    const inStockCheckbox = document.getElementById('filter-in-stock');

    if (categorySelect) currentFilters.category = categorySelect.value;
    if (brandSelect) currentFilters.brand = brandSelect.value;
    if (minPriceInput) currentFilters.minPrice = minPriceInput.value ? Number(minPriceInput.value) : 0;
    if (maxPriceInput) currentFilters.maxPrice = maxPriceInput.value ? Number(maxPriceInput.value) : Infinity;
    if (inStockCheckbox) currentFilters.inStock = inStockCheckbox.checked;
}

// Сброс фильтров
function resetFilters() {
    currentFilters = {
        category: 'all',
        brand: 'all',
        minPrice: 0,
        maxPrice: Infinity,
        inStock: false
    };

    // Сброс элементов управления
    const categorySelect = document.getElementById('filter-category');
    const brandSelect = document.getElementById('filter-brand');
    const minPriceInput = document.getElementById('filter-price-min');
    const maxPriceInput = document.getElementById('filter-price-max');
    const inStockCheckbox = document.getElementById('filter-in-stock');

    if (categorySelect) categorySelect.value = 'all';
    if (brandSelect) brandSelect.value = 'all';
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    if (inStockCheckbox) inStockCheckbox.checked = false;

    // Сброс кнопок категорий
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === 'all') btn.classList.add('active');
    });

    applyFilters();
}

// Применение фильтров и отображение товаров
function applyFilters() {
    const perfumeList = document.querySelector('.perfume-list');
    if (!perfumeList) {
        console.warn("main.js: Элемент .perfume-list не найден на этой странице.");
        return;
    }

    // Сбор текущих значений, если пользователь изменил их вручную
    collectFilterValues();

    // Фильтрация
    const filteredPerfumes = perfumes.filter(perfume => {
        // Проверка существования объекта
        if (!perfume) return false;
        
        // Фильтр по категории
        if (currentFilters.category !== 'all' && perfume.category !== currentFilters.category) {
            return false;
        }
        // Фильтр по бренду
        if (currentFilters.brand !== 'all' && perfume.brand !== currentFilters.brand) {
            return false;
        }
        // Фильтр по цене
        const price = Number(perfume.numericPrice);
        if (isNaN(price) || price < currentFilters.minPrice || price > currentFilters.maxPrice) {
            return false;
        }
        // Фильтр по наличию
        if (currentFilters.inStock && (isNaN(perfume.stock) || perfume.stock <= 0)) {
            return false;
        }
        return true;
    });

    // Отображение результатов
    renderPerfumes(filteredPerfumes);
}

// Отображение списка товаров
function renderPerfumes(perfumesToRender) {
    const perfumeList = document.querySelector('.perfume-list');
    if (!perfumeList) {
        console.warn("main.js: Элемент .perfume-list не найден на этой странице.");
        return;
    }

    if (!perfumesToRender || perfumesToRender.length === 0) {
        perfumeList.innerHTML = '<p class="empty-cart">Товары не найдены</p>';
        return;
    }

    let html = '';
    perfumesToRender.forEach((perfume, index) => {
        // Проверка существования объекта
        if (!perfume) return;
        
        const isOutOfStock = isNaN(perfume.stock) || perfume.stock <= 0;
        const safeIndex = perfumes.findIndex(p => p && p.name === perfume.name);
        html += `
        <div class="perfume-card ${isOutOfStock ? 'out-of-stock' : ''}" data-id="${safeIndex}">
            <div class="card-img">
                <img src="${perfume.image || 'https://placehold.co/300x400/333333/FFFFFF?text=No+Image'}" alt="${perfume.name || 'Без названия'}" loading="lazy" onerror="this.onerror=null; this.src='https://placehold.co/300x400/333333/FFFFFF?text=Image+Error';">
            </div>
            <div class="card-content">
                <h3>${perfume.name || 'Без названия'}</h3>
                <p class="brand">${perfume.brand || 'Без бренда'}</p>
                <p class="notes">${perfume.notes || ''}</p>
                <p class="desc">${perfume.description || ''}</p>
                <div class="card-bottom">
                    <span class="price">${perfume.price || 'Цена не указана'}</span>
                    <span class="volume">${perfume.volume || ''}</span>
                    <span class="stock">${isOutOfStock ? 'Нет в наличии' : `В наличии: ${perfume.stock} шт`}</span>
                    <button class="details-btn" ${isOutOfStock ? 'disabled' : ''}>${isOutOfStock ? 'Нет в наличии' : 'Подробнее'}</button>
                    ${!isOutOfStock ? `<button class="buy-btn">КУПИТЬ</button>` : ''}
                </div>
            </div>
        </div>
        `;
    });
    perfumeList.innerHTML = html;

    // Переинициализируем обработчики событий для новых карточек
    reinitCardEventListeners();
}

// Переинициализация обработчиков событий для карточек (после рендеринга)
function reinitCardEventListeners() {
    // Обработчики для кнопок "Подробнее"
    document.querySelectorAll('.perfume-card .details-btn').forEach(btn => {
        btn.onclick = function(e) {
            e.stopPropagation();
            const card = this.closest('.perfume-card');
            const perfumeId = parseInt(card.dataset.id);
            if (!isNaN(perfumeId) && perfumes[perfumeId]) {
                showModal(perfumes[perfumeId]);
            }
        };
    });

    // Обработчики для кнопок "Купить"
    document.querySelectorAll('.perfume-card .buy-btn').forEach(btn => {
        btn.onclick = function(e) {
            e.stopPropagation();
            const card = this.closest('.perfume-card');
            const perfumeId = parseInt(card.dataset.id);
            if (!isNaN(perfumeId) && perfumes[perfumeId]) {
                addToCart(perfumeId, e);
            }
        };
    });

    // Обработчики кликов по карточкам для товаров "Нет в наличии"
    document.querySelectorAll('.perfume-card.out-of-stock').forEach(card => {
        card.onclick = function(e) {
            // Игнорируем клики по кнопкам внутри карточки
            if (e.target.classList.contains('details-btn') || e.target.classList.contains('buy-btn')) return;
            const perfumeId = parseInt(this.dataset.id);
            if (!isNaN(perfumeId) && perfumes[perfumeId]) {
                showModal(perfumes[perfumeId]);
            }
        };
    });
}

// Функция для инициализации touch-жестов
function initTouchGestures() {
    const cards = document.querySelectorAll('.perfume-card');
    cards.forEach(card => {
        // Touch события для свайпа
        card.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        card.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe(card);
        }, { passive: true });

        // Двойной тап для быстрого просмотра
        let lastTap = 0;
        card.addEventListener('touchend', e => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                // Двойной тап - открываем модальное окно
                const perfumeId = parseInt(card.dataset.id);
                if (!isNaN(perfumeId) && perfumes[perfumeId]) {
                    showModal(perfumes[perfumeId]);
                }
            }
            lastTap = currentTime;
        });
    });
}

// Обработка свайпа
function handleSwipe(card) {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Свайп влево - следующая карточка
            showNextCard(card);
        } else {
            // Свайп вправо - предыдущая карточка
            showPrevCard(card);
        }
    }
}

// Показ следующей карточки (заглушка для будущей реализации)
function showNextCard(currentCard) {
    // Можно добавить логику для перелистывания карточек
    console.log('Swipe left on card:', currentCard.dataset.id);
}

// Показ предыдущей карточки (заглушка для будущей реализации)
function showPrevCard(currentCard) {
    // Можно добавить логику для перелистывания карточек
    console.log('Swipe right on card:', currentCard.dataset.id);
}

// Мобильное меню
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenu = document.querySelector('.mobile-menu-close');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav a'); // Объявляем здесь

    // Если обязательные элементы мобильного меню не найдены, выходим
    if (!mobileMenu) {
        console.log("main.js: Элементы мобильного меню не найдены на этой странице.");
        return;
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden'; // Предотвращаем скролл
        });
    }

    if (closeMenu) {
        closeMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = ''; // Восстанавливаем скролл
        });
    }

    // Закрытие меню при клике вне его
    mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Закрытие меню при выборе пункта
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// Оптимизация изображений
function optimizeImages() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    // Можно добавить логику для загрузки разных размеров изображений
                    // в зависимости от размера экрана
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });
        images.forEach(img => imageObserver.observe(img));
    }
}

// Модальное окно
function showModal(perfume) {
    // Проверка существования элементов модального окна
    const modal = document.getElementById('modal');
    if (!modal) {
        console.warn("main.js: Модальное окно (#modal) не найдено на этой странице.");
        return;
    }

    document.getElementById('modal-title').textContent = perfume.name || 'Без названия';
    document.getElementById('modal-brand').textContent = perfume.brand || 'Без бренда';
    document.getElementById('modal-notes').textContent = "Ноты: " + (perfume.notes || 'Не указаны');
    document.getElementById('modal-description').textContent = perfume.description || 'Описание отсутствует';
    document.getElementById('modal-price').textContent = "Цена: " + (perfume.price || 'Не указана') + " / " + (perfume.volume || '');
    document.getElementById('modal-stock').textContent = (isNaN(perfume.stock) || perfume.stock <= 0) ? "Нет в наличии" : "В наличии: " + perfume.stock + " шт";
    
    modal.style.display = 'block';
    // Предотвращаем скролл при открытом модальном окне
    document.body.style.overflow = 'hidden';
}

// Система корзины
let cart = [];

// Анимация при добавлении в корзину
function createCartAnimation(event) {
    if (!event) return;
    const button = event.target;
    const rect = button.getBoundingClientRect();
    // Создаем летящий элемент
    const flyingItem = document.createElement('div');
    flyingItem.className = 'cart-animation-item';
    flyingItem.textContent = '+1';
    flyingItem.style.left = rect.left + 'px';
    flyingItem.style.top = rect.top + 'px';
    // Добавляем базовые стили для анимации
    flyingItem.style.position = 'fixed';
    flyingItem.style.zIndex = '9999';
    flyingItem.style.backgroundColor = '#4CAF50';
    flyingItem.style.color = 'white';
    flyingItem.style.padding = '2px 6px';
    flyingItem.style.borderRadius = '50%';
    flyingItem.style.fontSize = '12px';
    flyingItem.style.pointerEvents = 'none'; // Игнорировать события мыши
    flyingItem.style.transition = 'all 0.5s ease-out';
    
    document.body.appendChild(flyingItem);

    // Анимация полета (простая версия)
    setTimeout(() => {
        const cartIcon = document.querySelector('.cart-icon') || document.querySelector('nav a[data-section="cart"]') || document.body; // fallback на body
        const cartRect = cartIcon.getBoundingClientRect();
        flyingItem.style.left = cartRect.left + 'px';
        flyingItem.style.top = cartRect.top + 'px';
        flyingItem.style.opacity = '0';
        flyingItem.style.transform = 'scale(0.1)';
    }, 10);

    // Удаляем элемент после анимации
    setTimeout(() => {
        if (flyingItem.parentNode) {
            flyingItem.parentNode.removeChild(flyingItem);
        }
    }, 600);
}

// Добавить в корзину
function addToCart(perfumeId, event) {
    // Проверка существования массива и элемента
    if (!perfumes || !perfumes[perfumeId]) {
        console.error("main.js: Товар с ID", perfumeId, "не найден.");
        return;
    }
    
    const perfume = perfumes[perfumeId];
    if (isNaN(perfume.stock) || perfume.stock <= 0) {
        showNotification('Товар отсутствует на складе!', 'error');
        return;
    }

    // Создаем анимацию
    createCartAnimation(event);

    const existingItem = cart.find(item => item.id === perfumeId);
    if (existingItem) {
        if (existingItem.quantity < perfume.stock) {
            existingItem.quantity++;
            showNotification('Количество товара увеличено!');
        } else {
            showNotification('Недостаточно товара в наличии!', 'error');
            return;
        }
    } else {
        // Извлекаем цену как число
        let priceNumber = 0;
        if (typeof perfume.price === 'string') {
            priceNumber = parseInt(perfume.price.replace(/\s/g, '').replace('₽', '')) || 0;
        } else if (typeof perfume.price === 'number') {
            priceNumber = perfume.price;
        }
        
        cart.push({
            id: perfumeId,
            name: perfume.name || 'Без названия',
            price: priceNumber,
            quantity: 1
        });
        showNotification('Товар добавлен в корзину!');
    }

    updateCartDisplay();
    updateCartCounter();
    saveCartToStorage(); // Сохраняем изменения
}

// Обновление счетчика корзины
function updateCartCounter() {
    const cartLink = document.querySelector('nav.main-nav a[data-section="cart"]');
    const mobileCartLink = document.querySelector('.mobile-nav a[data-section="cart"]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

    if (cartLink) {
        cartLink.setAttribute('data-count', totalItems);
    }
    if (mobileCartLink) {
        mobileCartLink.setAttribute('data-count', totalItems);
    }
    updateMobileCartCounter(); // Обновляем мобильный счетчик
}

// Удалить из корзины
function removeFromCart(perfumeId) {
    cart = cart.filter(item => item.id !== perfumeId);
    updateCartDisplay();
    updateCartCounter();
    saveCartToStorage(); // Сохраняем изменения
    showNotification('Товар удален из корзины');
}

// Обновить количество
function updateQuantity(perfumeId, change) {
    // Проверка существования массивов
    if (!perfumes || !perfumes[perfumeId]) {
        console.error("main.js: Товар с ID", perfumeId, "не найден.");
        return;
    }
    if (!cart) {
        console.error("main.js: Корзина не инициализирована.");
        return;
    }
    
    const item = cart.find(item => item.id === perfumeId);
    const perfume = perfumes[perfumeId];
    
    if (item && perfume) {
        const newQuantity = (item.quantity || 0) + change;
        if (newQuantity > 0 && newQuantity <= (perfume.stock || 0)) {
            item.quantity = newQuantity;
        } else if (newQuantity > (perfume.stock || 0)) {
            showNotification('Недостаточно товара в наличии!', 'error');
            return;
        } else if (newQuantity <= 0) {
            // Если количество стало 0 или меньше, удаляем товар
            removeFromCart(perfumeId);
            return;
        }
        updateCartDisplay();
        updateCartCounter();
        saveCartToStorage(); // Сохраняем изменения
    }
}

// Обновить отображение корзины
function updateCartDisplay() {
    const cartSection = document.getElementById('cart');
    // Если секция корзины не найдена, выходим
    if (!cartSection) {
        console.log("main.js: Секция корзины (#cart) не найдена на этой странице.");
        return;
    }
    
    const cartList = cartSection.querySelector('.cart-items');
    const cartTotal = cartSection.querySelector('.cart-total');

    if (!cartList || !cartTotal) {
        console.warn("main.js: Элементы .cart-items или .cart-total не найдены внутри #cart.");
        return;
    }

    if (cart.length === 0) {
        cartList.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
        cartTotal.innerHTML = '<h3>ИТОГО: 0 ₽</h3>';
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach(item => {
        // Проверка существования объектов
        if (!item) return;
        const perfume = perfumes[item.id];
        if (!perfume) return;
        
        const itemPrice = Number(item.price) || 0;
        const itemQuantity = Number(item.quantity) || 0;
        const itemTotal = itemPrice * itemQuantity;
        total += itemTotal;
        
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name || perfume.name || 'Без названия'}</h4>
                    <p>${perfume.brand || 'Без бренда'}</p>
                </div>
                <div class="cart-item-controls">
                    <button onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${itemQuantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <div class="cart-item-price">
                    <span>${itemTotal.toLocaleString()} ₽</span>
                    <button onclick="removeFromCart(${item.id})" class="remove-btn">×</button>
                </div>
            </div>
        `;
    });

    // Рассчитываем скидку
    const discount = calculateDiscount(total);
    const finalTotal = total - discount;
    
    cartList.innerHTML = html;
    
    // Формируем итоговую строку с учетом скидки
    let totalHTML = `<h3>ИТОГО: ${finalTotal.toLocaleString()} ₽`;
    if (discount > 0) {
        totalHTML += ` <span style="font-size: 1rem; color: #999; text-decoration: line-through;">${total.toLocaleString()} ₽</span>`;
        totalHTML += ` <span class="promo-discount">(-${discount.toLocaleString()} ₽)</span>`;
    }
    totalHTML += '</h3>';
    
    // Показываем примененный промокод
    if (appliedPromo) {
        totalHTML += `<p style="margin-top: 10px; font-size: 0.9rem;">Применен промокод: <strong>${appliedPromo.code}</strong> `;
        totalHTML += `<button onclick="removePromo()" style="background: none; border: none; color: #ff4444; cursor: pointer; font-size: 0.9rem;">[Удалить]</button></p>`;
    }
    cartTotal.innerHTML = totalHTML;
}

// Показать уведомление
function showNotification(message, type = 'info') {
    // Удаляем существующие уведомления
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(el => el.remove());

    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Стили для уведомления
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: type === 'error' ? '#ff4444' : '#000',
        color: '#fff',
        border: '1px solid #fff',
        padding: '15px 20px',
        zIndex: '1000',
        borderRadius: '0',
        fontSize: '0.9rem',
        letterSpacing: '1px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    });

    document.body.appendChild(notification);

    // Удаляем через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function showSection(sectionId) {
    // Проверка существования элементов
    const sections = document.querySelectorAll('main > section');
    if (sections.length === 0) {
         console.log("main.js: Секции не найдены на этой странице.");
         return;
    }
    
    sections.forEach(sec => {
        sec.style.display = 'none';
    });
    
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    } else {
         console.warn("main.js: Секция с ID", sectionId, "не найдена.");
    }

    // При показе корзины обновляем её содержимое
    if (sectionId === 'cart') {
        updateCartDisplay();
    }

    // Обновляем счетчик корзины
    updateCartCounter();

    // Обновляем активные ссылки в навигации
    document.querySelectorAll('nav.main-nav a, .mobile-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });

    // Закрываем мобильное меню если оно открыто
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu && mobileMenu.classList.contains('active')) {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Показать форму заказа
function showCheckoutForm() {
    const cartItems = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total');
    const checkoutForm = document.getElementById('checkout-form');
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    
    if (cartItems) cartItems.style.display = 'none';
    if (cartTotal) cartTotal.style.display = 'none';
    if (checkoutForm) checkoutForm.style.display = 'block';
    if (checkoutBtn) checkoutBtn.style.display = 'none'; // Скрыть кнопку
    
    loadCustomerData();
}

// Вернуться в корзину
function backToCart() {
    const cartItems = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total');
    const checkoutForm = document.getElementById('checkout-form');
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    
    if (cartItems) cartItems.style.display = 'block';
    if (cartTotal) cartTotal.style.display = 'block';
    if (checkoutForm) checkoutForm.style.display = 'none';
    if (checkoutBtn) checkoutBtn.style.display = 'block'; // Показать кнопку
}

// Сохранить данные клиента
function saveCustomerData(data) {
    try {
        localStorage.setItem('aromtest_customer_data', JSON.stringify(data));
    } catch (e) {
        console.error("main.js: Ошибка сохранения данных клиента в localStorage:", e);
    }
}

// Загрузить данные клиента
function loadCustomerData() {
    try {
        const savedData = localStorage.getItem('aromtest_customer_data');
        if (savedData) {
            const data = JSON.parse(savedData);
            const nameInput = document.getElementById('customer-name');
            const phoneInput = document.getElementById('customer-phone');
            const addressInput = document.getElementById('customer-address');
            const commentInput = document.getElementById('customer-comment');
            
            if (nameInput) nameInput.value = data.name || '';
            if (phoneInput) phoneInput.value = data.phone || '';
            if (addressInput) addressInput.value = data.address || '';
            if (commentInput) commentInput.value = data.comment || '';
        }
    } catch (e) {
        console.error("main.js: Ошибка загрузки данных клиента из localStorage:", e);
    }
}

// Форматировать заказ для отправки
function formatOrderMessage() {
    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const addressInput = document.getElementById('customer-address');
    const commentInput = document.getElementById('customer-comment');
    
    const name = nameInput ? nameInput.value : '';
    const phone = phoneInput ? phoneInput.value : '';
    const address = addressInput ? addressInput.value : '';
    const comment = commentInput ? commentInput.value : '';

    let message = `🛒 НОВЫЙ ЗАКАЗ
`;
    message += `👤 Имя: ${name}
`;
    message += `📱 Телефон: ${phone}
`;
    message += `📍 Адрес: ${address}
`;
    if (comment) {
        message += `💬 Комментарий: ${comment}
`;
    }
    message += `
🛍️ Товары:
`;

    let total = 0;
    cart.forEach(item => {
        // Проверка существования объектов
        if (!item) return;
        const perfume = perfumes[item.id];
        if (!perfume) return;
        
        const itemPrice = Number(item.price) || 0;
        const itemQuantity = Number(item.quantity) || 0;
        const itemTotal = itemPrice * itemQuantity;
        total += itemTotal;
        
        message += `• ${item.name || perfume.name || 'Без названия'} (${perfume.volume || ''}) x${itemQuantity} = ${itemTotal.toLocaleString()}₽
`;
    });

    // Добавляем информацию о скидке
    const discount = calculateDiscount(total);
    const finalTotal = total - discount;
    
    if (discount > 0) {
        message += `
💰 Сумма: ${total.toLocaleString()}₽`;
        message += `
🏷️ Скидка: -${discount.toLocaleString()}₽`;
        message += `
💳 ИТОГО: ${finalTotal.toLocaleString()}₽`;
        if (appliedPromo) {
            message += ` (по промокоду ${appliedPromo.code})`;
        }
    } else {
        message += `
💰 ИТОГО: ${total.toLocaleString()}₽`;
    }

    return encodeURIComponent(message);
}

// Валидация телефона (простая)
function validatePhone(phone) {
    if (!phone) return false;
    // Убираем все нецифровые символы
    const cleanPhone = phone.replace(/\D/g, '');
    // Проверяем длину (минимум 10 цифр для России)
    return cleanPhone.length >= 10 && cleanPhone.length <= 15; // Разумный диапазон
}

// Показать ошибку
function showError(element, message) {
    if (!element) return;
    const formGroup = element.closest('.form-group');
    if (formGroup) {
        formGroup.classList.add('error');
        // Создать или обновить сообщение об ошибке
        let errorElement = formGroup.querySelector('.form-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            formGroup.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }
}

// Скрыть ошибку
function hideError(element) {
    if (!element) return;
    const formGroup = element.closest('.form-group');
    if (formGroup) {
        formGroup.classList.remove('error');
        const errorElement = formGroup.querySelector('.form-error');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }
}

// Очистить все ошибки
function clearAllErrors() {
    document.querySelectorAll('.form-group.error').forEach(group => {
        group.classList.remove('error');
        const errorElement = group.querySelector('.form-error');
        if (errorElement) {
            errorElement.textContent = '';
        }
    });
}

// Валидация формы
function validateForm() {
    let isValid = true;
    
    // Валидация имени
    const name = document.getElementById('customer-name');
    if (name && !name.value.trim()) {
        showError(name, 'Пожалуйста, введите ваше имя');
        isValid = false;
    } else if (name) {
        hideError(name);
    }

    // Валидация телефона
    const phone = document.getElementById('customer-phone');
    if (phone && !validatePhone(phone.value)) {
        showError(phone, 'Пожалуйста, введите корректный номер телефона');
        isValid = false;
    } else if (phone) {
        hideError(phone);
    }

    // Валидация адреса
    const address = document.getElementById('customer-address');
    if (address && !address.value.trim()) {
        showError(address, 'Пожалуйста, введите адрес доставки');
        isValid = false;
    } else if (address) {
        hideError(address);
    }

    return isValid;
}

// Отправить заказ
function sendOrder() {
    // Очистить предыдущие ошибки
    clearAllErrors();

    // Показать индикатор загрузки
    const submitButton = document.querySelector('#order-form .checkout-btn');
    const originalText = submitButton ? submitButton.textContent : 'Отправить';
    if (submitButton) {
        // Создаем элемент для спиннера
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.style.border = '2px solid #f3f3f3';
        spinner.style.borderTop = '2px solid #333';
        spinner.style.borderRadius = '50%';
        spinner.style.width = '16px';
        spinner.style.height = '16px';
        spinner.style.animation = 'spin 1s linear infinite';
        // Добавляем CSS анимацию, если её ещё нет
        if (!document.querySelector('#spinner-style')) {
            const style = document.createElement('style');
            style.id = 'spinner-style';
            style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }
        
        submitButton.innerHTML = '';
        submitButton.appendChild(spinner);
        submitButton.disabled = true;
    }

    // Валидация
    if (!validateForm()) {
        if (submitButton) {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
        return false;
    }

    // Небольшая задержка для UX
    setTimeout(() => {
        // Сохранить данные
        const customerData = {
            name: document.getElementById('customer-name').value,
            phone: document.getElementById('customer-phone').value,
            address: document.getElementById('customer-address').value,
            comment: document.getElementById('customer-comment').value
        };
        saveCustomerData(customerData);

        // Подготовить сообщение
        const message = formatOrderMessage();
        const contactMethodRadio = document.querySelector('input[name="contact-method"]:checked');
        const contactMethod = contactMethodRadio ? contactMethodRadio.value : 'direct';

        // Отправить
        let url;
        if (contactMethod === 'direct') {
            // ЗАМЕНИ 'your_username' НА СВОЙ TELEGRAM USERNAME
            url = `https://t.me/JRoninQw?text=${message}`;
        } else {
            // ЗАМЕНИ 'your_bot_username' НА USERNAME ТВОЕГО БОТА
            url = `https://t.me/your_bot_username?start=order_${message}`;
        }
        
        // Открываем ссылку
        window.open(url, '_blank');

        showNotification('Заказ оформлен! Открывается чат для отправки...', 'success');

        // Восстановить кнопку
        if (submitButton) {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }

        // Очистить корзину после успешного заказа (опционально)
        // Можно раскомментировать, если хотите автоматически очищать корзину
        /*
        setTimeout(() => {
            if (confirm('Очистить корзину после оформления заказа?')) {
                cart = [];
                updateCartDisplay();
                updateCartCounter();
                saveCartToStorage(); // Сохраняем пустую корзину
                backToCart();
            }
        }, 2000);
        */
    }, 500);

    return true;
}

// Система тем
function initTheme() {
    // Проверить сохраненную тему
    let savedTheme;
    try {
        savedTheme = localStorage.getItem('aromtest_theme');
    } catch (e) {
        console.error("main.js: Ошибка чтения темы из localStorage:", e);
        savedTheme = null;
    }
    
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme = systemPrefersDark ? 'dark' : 'light';
    const currentTheme = savedTheme || systemTheme;

    // Применить тему
    setTheme(currentTheme);

    // Добавить обработчик переключателя
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    
    // Добавить обработчик изменений системной темы (опционально)
    /*
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!savedTheme) { // Только если тема не сохранена пользователем
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    */
}

function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.remove('light');
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
    }
    // Сохранить выбор
    try {
        localStorage.setItem('aromtest_theme', theme);
    } catch (e) {
        console.error("main.js: Ошибка сохранения темы в localStorage:", e);
    }
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// Сохранение корзины в localStorage
function saveCartToStorage() {
    try {
        localStorage.setItem('aromtest_cart', JSON.stringify(cart));
    } catch (e) {
        console.error("main.js: Ошибка сохранения корзины в localStorage:", e);
    }
}

// Загрузка корзины из localStorage
function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('aromtest_cart');
        if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            // Проверяем, что загруженные данные имеют правильный формат
            if (Array.isArray(parsedCart)) {
                cart = parsedCart;
                // Дополнительная проверка на валидность данных внутри корзины
                cart = cart.filter(item => 
                    typeof item === 'object' && 
                    item !== null && 
                    typeof item.id === 'number' && 
                    (typeof item.name === 'string' || typeof item.name === 'undefined') && // name может отсутствовать, если берется из perfumes
                    typeof item.price === 'number' && 
                    typeof item.quantity === 'number'
                );
            } else {
                console.warn("main.js: Некорректный формат корзины в localStorage.");
                cart = [];
            }
        }
    } catch (e) {
        console.error('main.js: Ошибка при загрузке корзины из localStorage:', e);
        cart = [];
    }
    updateCartDisplay();
    updateCartCounter();
}

// Очистка корзины из localStorage
function clearCartStorage() {
    try {
        localStorage.removeItem('aromtest_cart');
    } catch (e) {
        console.error("main.js: Ошибка очистки корзины из localStorage:", e);
    }
}

// Обновление счетчика мобильной корзины
function updateMobileCartCounter() {
    const mobileCartIcon = document.querySelector('.mobile-cart-icon a');
    const mobileCartCount = document.querySelector('.mobile-cart-count');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

    if (mobileCartCount) {
        mobileCartCount.textContent = totalItems;
        mobileCartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    // Добавим обработчик клика на мобильную иконку корзины
    if (mobileCartIcon) {
        // Удаляем предыдущие обработчики, чтобы не дублировать
        mobileCartIcon.onclick = function(e) {
            e.preventDefault();
            showSection('cart');
            // Закрываем мобильное меню если оно открыто
            const mobileMenu = document.querySelector('.mobile-menu');
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        };
    }
}

// Система промокодов
const promoCodes = {
    'AROMA2025': { type: 'percent', value: 10, maxDiscount: 1000 }, // 10% скидка, максимум 1000₽
    'NEWYEAR': { type: 'fixed', value: 500 }, // Фиксированная скидка 500₽
    'WELCOME': { type: 'percent', value: 5 } // 5% скидка
};
let appliedPromo = null;

// Применить промокод
function applyPromoCode() {
    const input = document.getElementById('promo-code-input');
    const message = document.getElementById('promo-message');
    
    if (!input || !message) {
        console.warn("main.js: Элементы промокода (#promo-code-input, #promo-message) не найдены.");
        return;
    }
    
    const code = input.value.trim().toUpperCase();
    if (!code) {
        showMessage('Пожалуйста, введите промокод', 'error');
        return;
    }

    if (promoCodes[code]) {
        appliedPromo = {
            code: code,
            ...promoCodes[code]
        };
        showMessage(`Промокод "${code}" применен!`, 'success');
        input.value = '';
        updateCartDisplay(); // Обновляем отображение корзины с учетом скидки
    } else {
        showMessage('Неверный промокод', 'error');
    }
}

// Рассчитать скидку
function calculateDiscount(total) {
    if (!appliedPromo) return 0;
    
    let discount = 0;
    if (appliedPromo.type === 'percent') {
        discount = (total * (appliedPromo.value || 0)) / 100;
        if (appliedPromo.maxDiscount) {
            discount = Math.min(discount, appliedPromo.maxDiscount);
        }
    } else if (appliedPromo.type === 'fixed') {
        discount = appliedPromo.value || 0;
    }
    return Math.min(discount, total); // Скидка не может быть больше итоговой суммы
}

// Показать сообщение о промокоде
function showMessage(text, type) {
    const message = document.getElementById('promo-message');
    if (!message) {
        console.warn("main.js: Элемент #promo-message не найден.");
        return;
    }
    
    message.textContent = text;
    message.className = 'promo-discount'; // Базовый класс
    message.style.color = type === 'error' ? '#ff4444' : '#4CAF50';
    message.style.display = 'block'; // Убедимся, что элемент виден
    
    setTimeout(() => {
        // Проверяем, что сообщение еще содержит тот же текст
        if (message.textContent === text) {
            message.textContent = '';
            message.className = '';
            message.style.display = 'none';
        }
    }, 3000);
}

// Удалить промокод
function removePromo() {
    appliedPromo = null;
    showMessage('Промокод удален', 'success');
    updateCartDisplay();
}

// Основной обработчик DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("main.js: DOM загружен");
    
    // Инициализация мобильного меню
    try {
        initMobileMenu();
    } catch (e) {
        console.error("main.js: Ошибка инициализации мобильного меню:", e);
    }

    // Инициализация touch-жестов
    try {
        initTouchGestures();
    } catch (e) {
        console.error("main.js: Ошибка инициализации touch-жестов:", e);
    }

    // Оптимизация изображений
    try {
        optimizeImages();
    } catch (e) {
        console.error("main.js: Ошибка оптимизации изображений:", e);
    }

    // Загружаем корзину из localStorage
    try {
        loadCartFromStorage();
    } catch (e) {
        console.error("main.js: Ошибка загрузки корзины:", e);
    }

    // Инициализация фильтров (новая функция)
    try {
        initFilters();
    } catch (e) {
        console.error("main.js: Ошибка инициализации фильтров:", e);
    }

    // Обработчики для навигации
    document.querySelectorAll('nav.main-nav a, .mobile-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            if (sectionId) {
                showSection(sectionId);
            }
        });
    });

    // Закрытие модального окна
    const closeModal = document.getElementById('close-modal');
    const modal = document.getElementById('modal');
    
    if (closeModal) {
        closeModal.onclick = function() {
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = ''; // Восстанавливаем скролл
            }
        };
    }

    if (modal) {
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
                document.body.style.overflow = ''; // Восстанавливаем скролл
            }
        };
    }

    // Поиск в шапке со стрелочкой
    const headerSearch = document.getElementById('header-search');
    const searchButton = document.getElementById('search-button');

    function performSearch() {
        if (!headerSearch) return;
        
        const searchTerm = headerSearch.value.toLowerCase();
        // Используем applyFilters для поиска, чтобы учитывать текущие фильтры
        collectFilterValues(); // Сначала соберем текущие фильтры

        // Фильтрация по поисковому запросу + текущим фильтрам
        const filteredPerfumes = perfumes.filter(perfume => {
            // Проверка существования объекта
            if (!perfume) return false;
            
            const searchText = (perfume.name + ' ' + (perfume.brand || '') + ' ' + (perfume.notes || '')).toLowerCase();
            const matchesSearch = searchText.includes(searchTerm);

            // Применяем текущие фильтры (кроме поиска)
            let matchesFilters = true;
            
            if (currentFilters.category !== 'all' && perfume.category !== currentFilters.category) {
                matchesFilters = false;
            }
            if (currentFilters.brand !== 'all' && perfume.brand !== currentFilters.brand) {
                matchesFilters = false;
            }
            
            const price = Number(perfume.numericPrice);
            if (isNaN(price) || price < currentFilters.minPrice || price > currentFilters.maxPrice) {
                matchesFilters = false;
            }
            
            if (currentFilters.inStock && (isNaN(perfume.stock) || perfume.stock <= 0)) {
                matchesFilters = false;
            }

            return matchesSearch && matchesFilters;
        });

        renderPerfumes(filteredPerfumes);
    }

    if (headerSearch) {
        headerSearch.addEventListener('input', performSearch);
    }
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }

    // Поиск по Enter
    if (headerSearch) {
        headerSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Добавить кнопку "Оформить заказ" в корзину
    const cartSection = document.getElementById('cart');
    if (cartSection) {
        let checkoutButton = document.getElementById('cart-checkout-btn');
        if (!checkoutButton) {
            checkoutButton = document.createElement('button');
            checkoutButton.textContent = 'ОФОРМИТЬ ЗАКАЗ';
            checkoutButton.className = 'checkout-btn';
            checkoutButton.id = 'cart-checkout-btn';
            checkoutButton.style.marginTop = '20px';
            checkoutButton.style.display = 'block';
            
            const cartTotal = cartSection.querySelector('.cart-total');
            if (cartTotal) {
                cartTotal.after(checkoutButton);
            } else {
                cartSection.appendChild(checkoutButton);
            }
        }
        
        // Назначаем обработчик
        checkoutButton.onclick = function() {
            if (cart.length === 0) {
                showNotification('Корзина пуста!', 'error');
                return;
            }
            showCheckoutForm();
            loadCustomerData(); // Загрузить сохраненные данные
        };
    }

    // Обработчик формы заказа
    const orderForm = document.getElementById('order-form');
    const submitOrderButton = document.getElementById('submit-order-btn');

    // Обработчик для кнопки "Отправить заказ"
    if (submitOrderButton) {
        submitOrderButton.addEventListener('click', function(e) {
            e.preventDefault();
            sendOrder();
        });
    }

    // Также оставим обработчик на submit формы на всякий случай
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendOrder();
        });
    }

    // Кнопка "Назад в корзину"
    const backButtons = document.querySelectorAll('.back-to-cart-btn');
    backButtons.forEach(button => {
        button.addEventListener('click', backToCart);
    });

    // Добавить обработчики очистки ошибок
    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const addressInput = document.getElementById('customer-address');
    
    if (nameInput) {
        nameInput.addEventListener('input', function() {
            if (this.value.trim()) hideError(this);
        });
    }
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            if (validatePhone(this.value)) hideError(this);
        });
    }
    if (addressInput) {
        addressInput.addEventListener('input', function() {
            if (this.value.trim()) hideError(this);
        });
    }

    // Инициализация темы
    try {
        initTheme();
    } catch (e) {
        console.error("main.js: Ошибка инициализации темы:", e);
    }

    // Обработчик промокодов
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    const promoCodeInput = document.getElementById('promo-code-input');
    
    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', applyPromoCode);
    }
    if (promoCodeInput) {
        promoCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyPromoCode();
            }
        });
    }

    // При загрузке показываем каталог
    showSection('catalog');
    
    console.log("main.js: Инициализация завершена");
});