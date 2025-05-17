(function() {
    'use strict';

    // Проверка наличия глобального объекта Lampa
    if (typeof Lampa === 'undefined') return;

    // Название плагина
    const pluginName = 'rave';
    // Версия плагина
    const version = '1.0.0';

    // Иконка для меню
    const icon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>
    `;

    // Объект конфигурации плагина
    const config = {
        // Автор плагина
        author: 'Lampa User',
        // Название плагина
        name: 'Rave Integration',
        // Версия плагина
        version: version,
        // Описание плагина
        description: 'Интеграция с сервисом Rave для совместного просмотра',
        // URL для установки плагина
        path: 'lampa-rave-plugin.js'
    };

    // Функция для создания ссылки на Rave
    function createRaveLink(data) {
        // Базовый URL для Rave
        const raveBaseUrl = 'https://rave.io/watch?v=';
        
        // Формируем ссылку на основе данных о фильме
        let videoUrl = '';
        
        // Проверяем, есть ли у нас прямая ссылка на видео из Lampa
        if (data.url) {
            videoUrl = data.url;
        } else if (data.video_url) {
            videoUrl = data.video_url;
        } else {
            // Если нет прямой ссылки, создаем идентификатор для поиска
            // Формат: название + год + тип (фильм/сериал)
            const searchQuery = encodeURIComponent(`${data.title || data.name} ${data.year} ${data.season ? 'сериал' : 'фильм'}`);
            videoUrl = 'search:' + searchQuery;
        }
        
        // Кодируем URL для вставки в ссылку Rave
        const encodedUrl = encodeURIComponent(videoUrl);
        
        // Возвращаем полную ссылку для Rave
        return raveBaseUrl + encodedUrl;
    }

    // Функция для копирования текста в буфер обмена
    function copyToClipboard(text) {
        // Создаем временный элемент input
        const input = document.createElement('input');
        // Устанавливаем значение
        input.value = text;
        // Добавляем элемент в DOM
        document.body.appendChild(input);
        // Выделяем весь текст
        input.select();
        // Копируем текст в буфер обмена
        document.execCommand('copy');
        // Удаляем временный элемент
        document.body.removeChild(input);
    }

    // Функция для показа уведомления
    function showNotification(text) {
        Lampa.Noty.show(text);
    }

    // Функция для добавления кнопки Rave на страницу фильма/сериала
    function addRaveButton(data) {
        // Проверяем, находимся ли мы на странице с фильмом или сериалом
        if (!Lampa.Activity.active().component === 'full') return;
        
        // Находим элемент, куда добавить кнопку
        const actionsElement = document.querySelector('.view--torrent .view--torrent__buttons, .full-start__buttons');
        if (!actionsElement) return;
        
        // Создаем кнопку
        const raveButton = document.createElement('div');
        raveButton.className = 'view--torrent__button selector';
        raveButton.innerHTML = `
            <div class="view--torrent__button-inner">
                <div class="custom-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <span>Rave</span>
                </div>
            </div>
        `;
        
        // Добавляем обработчик клика
        raveButton.addEventListener('click', function() {
            // Получаем текущие данные о фильме/сериале
            const currentData = Lampa.Activity.active().card;
            // Создаем ссылку для Rave
            const raveLink = createRaveLink(currentData);
            // Копируем ссылку в буфер обмена
            copyToClipboard(raveLink);
            // Показываем уведомление
            showNotification('Ссылка Rave скопирована в буфер обмена');
        });
        
        // Добавляем кнопку на страницу
        actionsElement.appendChild(raveButton);
    }

    // Функция для добавления пункта меню в настройки
    function addSettingsMenuItem() {
        // Добавляем раздел в настройки плагинов
        Lampa.Settings.listener.follow('open', function(e) {
            if (e.name === 'plugins') {
                const field = e.body.find('[data-component="rave"]');
                
                if (field.length === 0) {
                    e.body.find('.settings-param__list').append(`
                        <div class="settings-param selector" data-component="rave">
                            <div class="settings-param__name">Rave Integration</div>
                            <div class="settings-param__value"></div>
                            <div class="settings-param__descr">Интеграция с сервисом Rave для совместного просмотра</div>
                        </div>
                    `);
                    
                    e.body.find('[data-component="rave"]').on('hover:enter', function() {
                        // Показываем информацию о плагине
                        Lampa.Modal.open({
                            title: 'Rave Integration',
                            html: `
                                <div class="about">
                                    <div class="about__title">Версия: ${version}</div>
                                    <div class="about__text">Плагин для интеграции LAMPA с сервисом Rave для совместного просмотра фильмов и сериалов.</div>
                                    <div class="about__text">Инструкция по использованию:</div>
                                    <div class="about__text">1. Откройте страницу фильма или сериала</div>
                                    <div class="about__text">2. Нажмите на кнопку "Rave"</div>
                                    <div class="about__text">3. Ссылка будет скопирована в буфер обмена</div>
                                    <div class="about__text">4. Отправьте ссылку друзьям или вставьте ее в приложение Rave</div>
                                </div>
                            `,
                            size: 'medium',
                            onBack: () => {
                                Lampa.Modal.close();
                                Lampa.Controller.toggle('settings_component');
                            }
                        });
                    });
                }
            }
        });
    }

    // Функция инициализации плагина
    function startPlugin() {
        // Отслеживаем события активности для добавления кнопки
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                setTimeout(() => {
                    addRaveButton();
                }, 100);
            }
        });
        
        // Добавляем пункт в настройки
        addSettingsMenuItem();
        
        // Добавляем стили для кнопки Rave
        const style = document.createElement('style');
        style.textContent = `
            .custom-button {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                padding: 0.3em;
            }
            
            .custom-button svg {
                width: 1.5em;
                height: 1.5em;
                margin-bottom: 0.2em;
            }
        `;
        document.head.appendChild(style);
    }

    // Регистрация плагина
    Lampa.Plugin.register(pluginName, {
        type: 'video',
        version: version,
        subtitle: 'Интеграция с Rave',
        icon: icon,
        init: startPlugin
    });

    // Добавляем информацию о плагине в список установленных плагинов
    if (Lampa.Storage.get('plugins_installed', '').indexOf(pluginName) === -1) {
        const plugins_installed = Lampa.Storage.get('plugins_installed', '');
        Lampa.Storage.set('plugins_installed', plugins_installed + (plugins_installed ? ', ' : '') + pluginName);
    }
})(); 
