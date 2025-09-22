// server.js
const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Пароль для админки
// !!! ВАЖНО: В продакшене используй переменные окружения (process.env.ADMIN_PASSWORD)
const ADMIN_PASSWORD = 'qwertyronin'; // <-- ИЗМЕНИ НА СВОЙ НАДЕЖНЫЙ ПАРОЛЬ

// Middleware
// Перенаправление устаревшего пути /admin-login.html на /admin-login (до static, чтобы не ловить 404)
app.get('/admin-login.html', (req, res) => {
    return res.redirect('/admin-login');
});
app.use(express.static(path.join(__dirname))); // Отдаём статические файлы из корневой папки проекта
app.use(express.urlencoded({ extended: true })); // Для парсинга данных формы
app.use(express.json()); // Для парсинга JSON
app.use(session({
    secret: 'aromtest_secret_key_change_this_for_production_2025', // <-- Измени для продакшена
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true если используешь HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));

// --- Маршруты ---

// Главная страница (каталог)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Страница входа в админку
app.get('/admin-login', (req, res) => {
    // Проверяем, не авторизован ли уже пользователь
    if (req.session && req.session.authenticated) {
         return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, 'src', 'admin-login.html'));
});

// Обработка формы входа в админку
app.post('/admin-login', (req, res) => {
    const { password } = req.body;

    if (password === ADMIN_PASSWORD) {
        req.session.authenticated = true; // Устанавливаем сессию
        console.log(`Успешный вход в админку с IP: ${req.ip}`);
        return res.redirect('/admin');
    } else {
        console.log(`Неудачная попытка входа в админку с IP: ${req.ip}`);
        // Отправляем HTML с ошибкой
        return res.status(401).send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ошибка входа</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background: #000; color: #fff; }
                    .error { padding: 20px; margin: 20px; border: 1px solid #ff4444; }
                    a { color: #667eea; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <div class="error">
                    <h2>❌ Неверный пароль!</h2>
                    <p><a href="/admin-login">Попробовать снова</a></p>
                </div>
            </body>
            </html>
        `);
    }
});

// Middleware для проверки авторизации в админке
const requireAuth = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        return next(); // Пользователь авторизован, продолжаем
    } else {
        // Не авторизован, перенаправляем на логин
        return res.redirect('/admin-login');
    }
};

// Защищённая админка
app.get('/admin', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Выход из админки
app.get('/admin-logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Ошибка при выходе:', err);
        }
        // Важно: очищаем сессионную cookie на стороне клиента
        res.clearCookie('connect.sid'); // Имя cookie по умолчанию для express-session
        res.redirect('/admin-login');
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`🏠 Главная страница: http://localhost:${PORT}/`);
    console.log(`🔐 Админка (локально): http://localhost:${PORT}/admin`);
    console.log(`🚪 Вход в админку (локально): http://localhost:${PORT}/admin-login`);
    console.log(`🔑 Текущий пароль админки: ${ADMIN_PASSWORD}`);
    console.log(`ℹ️  На Vercel админка доступна через серверлес /admin и /api/admin-*`);
});