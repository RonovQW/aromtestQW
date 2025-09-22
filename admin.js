// === admin.js (Финальная версия) ===
// Авторизация защищается на сервере (middleware). Клиентский редирект не требуется.

// Используем var вместо let, чтобы избежать конфликта с main.js, если он загружен
// Также проверяем, существует ли переменная, чтобы не переопределять её, если main.js уже загрузил товары
var perfumes = window.perfumes || [];
let currentPerfumeToDelete = null;

// Инициализация админки
document.addEventListener('DOMContentLoaded', function() {
    console.log("Админка: DOM загружен");
    loadPerfumesFromStorage();
    initAdminEventListeners();
    renderAdminPerfumeList();
    initThemeToggle();
});

// Загрузка товаров из localStorage
function loadPerfumesFromStorage() {
    try {
        const savedPerfumes = localStorage.getItem('aromtest_perfumes');
        if (savedPerfumes) {
            perfumes = JSON.parse(savedPerfumes);
            console.log("Админка загрузила данные:", perfumes);
        } else {
            console.log("Админка: Нет данных в aromtest_perfumes");
            // Если данных в localStorage нет, но переменная window.perfumes существует (из main.js),
            // используем её как начальные данные
            if (window.perfumes && Array.isArray(window.perfumes) && window.perfumes.length > 0) {
                 perfumes = [...window.perfumes]; // Копируем, чтобы не мутировать исходный массив
                 console.log("Админка: Используем данные из window.perfumes как шаблон");
                 // Сохраняем скопированные данные в localStorage
                 savePerfumesToStorage();
            } else {
                 perfumes = [];
            }
        }
        // Обновляем глобальную переменную
        window.perfumes = perfumes;
    } catch (e) {
        console.error("Ошибка загрузки из localStorage:", e);
        showAdminNotification("Ошибка загрузки данных.", 'error');
        perfumes = [];
    }
}

// Сохранение товаров в localStorage
function savePerfumesToStorage() {
    try {
        localStorage.setItem('aromtest_perfumes', JSON.stringify(perfumes));
        console.log("Админка: Данные сохранены");
        // !!! ВАЖНО: Обновляем переменную в window, чтобы main.js тоже увидел изменения
        if (typeof window !== 'undefined') {
            window.perfumes = perfumes;
        }
        return true;
    } catch (e) {
        console.error("Ошибка сохранения в localStorage:", e);
        showAdminNotification("Ошибка сохранения данных.", 'error');
        return false;
    }
}

// Инициализация обработчиков событий
function initAdminEventListeners() {
    // Форма добавления товара
    const addForm = document.getElementById('add-perfume-form');
    if (addForm) {
        addForm.addEventListener('submit', handleAddPerfume);
    }

    // Модальное окно удаления
    const closeDeleteModal = document.getElementById('close-delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    if (closeDeleteModal) closeDeleteModal.addEventListener('click', closeDeleteModalWindow);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModalWindow);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDeletePerfume);

    // Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Завершаем сессию на сервере
            window.location.href = '/admin-logout';
        });
    }

    // Автоматическое заполнение числовой цены при вводе цены с символом ₽
    const priceInput = document.getElementById('price');
    const numericPriceInput = document.getElementById('numericPrice');
    
    if (priceInput && numericPriceInput) {
        priceInput.addEventListener('input', function() {
            // Извлекаем только цифры из введенной цены
            const numericValue = this.value.replace(/[^\d]/g, '');
            if (numericValue) {
                numericPriceInput.value = parseInt(numericValue);
            } else {
                numericPriceInput.value = '';
            }
        });
    }
}

// Обработчик добавления товара
function handleAddPerfume(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newPerfume = {
        // Генерируем уникальный ID для нового товара
        id: Date.now(), // Простой способ генерации ID
        name: formData.get('name').trim(),
        brand: formData.get('brand').trim(),
        price: formData.get('price').trim(),
        numericPrice: parseInt(formData.get('numericPrice')) || 0,
        stock: parseInt(formData.get('stock')) || 0,
        notes: formData.get('notes').trim(),
        description: formData.get('description').trim(),
        image: formData.get('image').trim(),
        volume: formData.get('volume').trim(),
        category: formData.get('category')
    };

    // Валидация
    if (!validatePerfumeData(newPerfume)) {
        return;
    }

    // Добавление товара
    perfumes.push(newPerfume);
    
    if (savePerfumesToStorage()) {
        showAdminNotification("Товар успешно добавлен!", 'success');
        e.target.reset();
        // Очищаем числовое поле цены, так как оно заполняется автоматически
        document.getElementById('numericPrice').value = '';
        renderAdminPerfumeList();
    }
}

// Валидация данных товара
function validatePerfumeData(perfume) {
    if (!perfume.name) {
        showAdminNotification('Введите название товара', 'error');
        return false;
    }
    
    if (!perfume.brand) {
        showAdminNotification('Введите бренд товара', 'error');
        return false;
    }
    
    if (!perfume.price || isNaN(perfume.numericPrice) || perfume.numericPrice <= 0) {
        showAdminNotification('Введите корректную цену', 'error');
        return false;
    }
    
    if (isNaN(perfume.stock) || perfume.stock < 0) {
        showAdminNotification('Введите корректное количество на складе', 'error');
        return false;
    }
    
    if (!perfume.image) {
        showAdminNotification('Введите URL изображения', 'error');
        return false;
    }
    
    if (!perfume.volume) {
        showAdminNotification('Введите объем товара', 'error');
        return false;
    }
    
    if (!perfume.category) {
        showAdminNotification('Выберите категорию товара', 'error');
        return false;
    }
    
    return true;
}

// Отображение списка товаров
function renderAdminPerfumeList() {
    const container = document.getElementById('perfume-list-container');
    if (!container) {
        console.error("Контейнер #perfume-list-container не найден!");
        showAdminNotification("Ошибка отображения: контейнер не найден.", 'error');
        return;
    }

    if (!perfumes || perfumes.length === 0) {
        container.innerHTML = '<p class="empty-cart">Товары не найдены</p>';
        return;
    }

    let html = '';
    perfumes.forEach((perfume, index) => {
        // Проверка существования объекта
        if (!perfume) return;
        
        html += `
            <div class="admin-perfume-item">
                <div style="flex: 1; min-width: 200px;">
                    <h4>${perfume.name || 'Без названия'}</h4>
                    <p>${perfume.brand || 'Без бренда'} • ${perfume.price || 'Цена не указана'} • ${perfume.volume || ''}</p>
                    <p>Категория: ${perfume.category || 'Не указана'} • В наличии: ${(perfume.stock !== undefined ? perfume.stock : 'Не указано')} шт.</p>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="number" 
                           id="stock-${index}" 
                           value="${perfume.stock !== undefined ? perfume.stock : 0}" 
                           class="stock-input" 
                           min="0">
                    <button onclick="updateStock(${index})" class="update-stock-btn">Обновить</button>
                    <button onclick="showDeleteModal(${index})" class="delete-btn">Удалить</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Обновление количества товара
function updateStock(index) {
    const input = document.getElementById(`stock-${index}`);
    if (!input) return;
    
    const newStock = parseInt(input.value);
    if (isNaN(newStock) || newStock < 0) {
        showAdminNotification('Введите корректное количество', 'error');
        return;
    }

    if (perfumes[index]) {
        perfumes[index].stock = newStock;
        if (savePerfumesToStorage()) {
            showAdminNotification(`Количество товара "${perfumes[index].name}" обновлено до ${newStock}`, 'success');
            renderAdminPerfumeList();
        }
    }
}

// Показать модальное окно удаления
function showDeleteModal(index) {
    currentPerfumeToDelete = index;
    const modal = document.getElementById('delete-modal');
    const modalText = document.getElementById('delete-modal-text');
    
    if (modal && modalText && perfumes[index]) {
        modalText.textContent = `Вы уверены, что хотите удалить товар "${perfumes[index].name}"?`;
        modal.style.display = 'block';
    }
}

// Закрыть модальное окно удаления
function closeDeleteModalWindow() {
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentPerfumeToDelete = null;
}

// Подтверждение удаления товара
function confirmDeletePerfume() {
    if (currentPerfumeToDelete === null || !perfumes[currentPerfumeToDelete]) {
        showAdminNotification('Ошибка удаления: товар не найден.', 'error');
        closeDeleteModalWindow();
        return;
    }

    const deletedName = perfumes[currentPerfumeToDelete].name;
    perfumes.splice(currentPerfumeToDelete, 1);
    
    if (savePerfumesToStorage()) {
        showAdminNotification(`Товар "${deletedName}" удален`, 'success');
        renderAdminPerfumeList();
    } else {
        showAdminNotification('Ошибка при удалении товара.', 'error');
    }
    
    closeDeleteModalWindow();
}

// Уведомления
function showAdminNotification(message, type = 'info') {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.admin-notification, .notification'); // Ищем по обоим классам
    oldNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });

    // Создаем новое уведомление
    const notification = document.createElement('div');
    // Используем класс из CSS админки
    notification.className = `notification ${type}`; 
    notification.textContent = message;
    
    // Стилизация
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: type === 'error' ? '#ff4444' : type === 'success' ? '#4CAF50' : '#2196F3',
        color: '#fff',
        padding: '15px 20px',
        zIndex: '10000',
        borderRadius: '4px',
        fontSize: '0.9rem',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    });

    document.body.appendChild(notification);

    // Автоматическое скрытие через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Инициализация переключения темы
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// Переключение темы
function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('dark')) {
        body.classList.remove('dark');
        body.classList.add('light');
        localStorage.setItem('aromtest_theme', 'light');
    } else {
        body.classList.remove('light');
        body.classList.add('dark');
        localStorage.setItem('aromtest_theme', 'dark');
    }
}

// Сделаем функции глобальными для использования в HTML
window.updateStock = updateStock;
window.showDeleteModal = showDeleteModal;