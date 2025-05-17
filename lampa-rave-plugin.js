(function() {
    'use strict';

    // Проверка наличия глобального объекта Lampa
    if (typeof Lampa === 'undefined') {
        console.error('Rave Plugin: Объект Lampa не найден. Плагин не будет загружен.');
        return;
    }

    // Название плагина
    const pluginName = 'rave';
    // Версия плагина
    const version = '1.0.1';

    // Иконка для меню
    const icon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
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
        if (!data) {
            console.error('Rave Plugin: Данные о фильме/сериале не предоставлены');
            return null;
        }

        try {
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
                const title = data.title || data.name || 'Неизвестный фильм';
                const year = data.year || '';
                const type = data.season ? 'сериал' : 'фильм';
                const searchQuery = encodeURIComponent(`${title} ${year} ${type}`);
                videoUrl = 'search:' + searchQuery;
            }
            
            // Кодируем URL для вставки в ссылку Rave
            const encodedUrl = encodeURIComponent(videoUrl);
            
            // Возвращаем полную ссылку для Rave
            return raveBaseUrl + encodedUrl;
        } catch (error) {
            console.error('Rave Plugin: Ошибка при создании ссылки', error);
            return null;
        }
    }

    // Функция для копирования текста в буфер обмена
    async function copyToClipboard(text) {
        if (!text) {
            showNotification('Ошибка: Нет текста для копирования');
            return false;
        }

        try {
            // Сначала пробуем новый Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
            
            // Запасной вариант - устаревший метод
            const input = document.createElement('input');
            input.value = text;
            document.body.appendChild(input);
            input.select();
            const success = document.execCommand('copy');
            document.body.removeChild(input);
            
            return success;
        } catch (error) {
            console.error('Rave Plugin: Ошибка при копировании', error);
            return false;
        }
    }

    // Функция для показа уведомления
    function showNotification(text, duration = 2000) {
        if (typeof Lampa.Noty !== 'undefined' && Lampa.Noty.show) {
            Lampa.Noty.show(text);
        } else {
            // Запасной вариант, если Noty недоступен
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                z-index: 9999;
            `;
            notification.textContent = text;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, duration);
        }
    }

    // Функция для добавления кнопки Rave на страницу фильма/сериала
    function addRaveButton() {
        try {
            // Проверяем, находимся ли мы на странице с фильмом или сериалом
            const activeComponent = Lampa.Activity.active();
            if (!activeComponent || activeComponent.component !== 'full') return;
            
            // Выводим в консоль информацию о текущем компоненте для отладки
            console.log('Rave Plugin: Текущий компонент', activeComponent.component, activeComponent);
            
            // Пробуем несколько селекторов для поиска места добавления кнопки
            const selectors = [
                '.view--torrent .view--torrent__buttons',
                '.full-start__buttons',
                '.button--filter', // Родительский контейнер кнопок
                '.full-start__details' // Контейнер с деталями
            ];
            
            let actionsElement = null;
            
            // Проходим по всем возможным селекторам
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    console.log('Rave Plugin: Найден элемент для добавления кнопки', selector);
                    actionsElement = element;
                    break;
                }
            }
            
            // Если не нашли подходящий элемент, пробуем создать свой контейнер
            if (!actionsElement) {
                console.log('Rave Plugin: Не найдены стандартные элементы, создаем контейнер');
                const fullStartElement = document.querySelector('.full-start');
                
                if (fullStartElement) {
                    // Создаем новый контейнер для кнопок, если его нет
                    const existingButtonsContainer = fullStartElement.querySelector('.rave-plugin-buttons');
                    
                    if (existingButtonsContainer) {
                        actionsElement = existingButtonsContainer;
                    } else {
                        const buttonsContainer = document.createElement('div');
                        buttonsContainer.className = 'full-start__buttons rave-plugin-buttons';
                        buttonsContainer.style.marginTop = '15px';
                        fullStartElement.appendChild(buttonsContainer);
                        actionsElement = buttonsContainer;
                    }
                }
            }
            
            if (!actionsElement) {
                console.error('Rave Plugin: Не удалось найти или создать контейнер для кнопки');
                return;
            }
            
            // Проверяем, возможно кнопка уже добавлена
            if (document.querySelector('.rave-button')) {
                console.log('Rave Plugin: Кнопка уже добавлена на страницу');
                return;
            }
            
            // Создаем кнопку
            const raveButton = document.createElement('div');
            raveButton.className = 'view--torrent__button selector rave-button';
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
            
            // Добавляем стили для автономной кнопки, если мы используем собственный контейнер
            if (actionsElement.classList.contains('rave-plugin-buttons')) {
                raveButton.style.cssText = `
                    display: inline-block;
                    margin-right: 10px;
                    padding: 10px 15px;
                    background-color: rgba(0, 0, 0, 0.3);
                    border-radius: 5px;
                    cursor: pointer;
                `;
            }
            
            // Добавляем обработчик клика
            raveButton.addEventListener('click', async function() {
                // Получаем текущие данные о фильме/сериале
                const currentData = activeComponent.card;
                if (!currentData) {
                    showNotification('Ошибка: Не удалось получить данные о контенте');
                    return;
                }
                
                // Выводим в консоль информацию о данных карточки для отладки
                console.log('Rave Plugin: Данные карточки', currentData);
                
                // Создаем ссылку для Rave
                const raveLink = createRaveLink(currentData);
                if (!raveLink) {
                    showNotification('Ошибка: Не удалось создать ссылку Rave');
                    return;
                }
                
                // Копируем ссылку в буфер обмена
                const success = await copyToClipboard(raveLink);
                
                // Показываем уведомление
                if (success) {
                    showNotification('Ссылка Rave скопирована в буфер обмена');
                } else {
                    showNotification('Ошибка при копировании ссылки');
                }
            });
            
            // Добавляем кнопку на страницу
            actionsElement.appendChild(raveButton);
            console.log('Rave Plugin: Кнопка успешно добавлена');
        } catch (error) {
            console.error('Rave Plugin: Ошибка при добавлении кнопки', error);
        }
    }

    // Функция для добавления пункта меню в настройки
    function addSettingsMenuItem() {
        try {
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
                                        <div class="about__text" style="margin-top: 1em;">
                                            <b>Примечание:</b> Для корректной работы совместного просмотра 
                                            убедитесь, что у всех участников установлено приложение Rave.
                                        </div>
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
        } catch (error) {
            console.error('Rave Plugin: Ошибка при добавлении пункта меню', error);
        }
    }

    // Функция добавления плагина в главное меню
    function addPluginToMenu() {
        try {
            // Проверяем наличие метода для добавления в меню
            if (Lampa.Menu && Lampa.Menu.render) {
                console.log('Rave Plugin: Добавляем в меню');
                
                // Проверяем есть ли уже наш пункт в меню
                const existingSection = Lampa.Menu.getSource().find(m => m.id === 'rave-plugin');
                
                if (!existingSection) {
                    // Добавляем новый пункт в меню приложения
                    const menuSection = {
                        id: 'rave-plugin',
                        title: 'Rave',
                        icon: icon,
                        order: 100, // Позиция в меню
                        onClick: () => {
                            // При клике показываем информацию о плагине
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
                                        <div class="about__text" style="margin-top: 1em;">
                                            <b>Примечание:</b> Для корректной работы совместного просмотра 
                                            убедитесь, что у всех участников установлено приложение Rave.
                                        </div>
                                    </div>
                                `,
                                size: 'medium',
                                onBack: () => {
                                    Lampa.Modal.close();
                                }
                            });
                        }
                    };
                    
                    // Добавляем раздел в главное меню
                    Lampa.Menu.add(menuSection);
                    console.log('Rave Plugin: Добавлен в главное меню');
                }
            } else {
                console.log('Rave Plugin: API меню недоступно');
            }
            
            // Также добавляем в раздел плагинов в настройках
            if (Lampa.Settings && Lampa.Settings.main) {
                let plugins_data = {
                    component: 'plugins',
                    icon: icon,
                    name: 'Rave'
                };
                
                // Если нет раздела плагинов, создаем его
                if (Lampa.Settings.main().render().find('[data-component="plugins"]').length === 0) {
                    let plugins_item = $('<li class="settings-folder selector" data-component="plugins"><div class="settings-folder__icon">' + icon + '</div><div class="settings-folder__name">Плагины</div></li>');
                    Lampa.Settings.main().render().find('[data-component="more"]').after(plugins_item);
                }
                
                // Если уже есть наш плагин в разделе, не добавляем повторно
                if (Lampa.Settings.main().render().find('[data-component="rave-settings"]').length === 0) {
                    let rave_item = $('<li class="settings-folder selector" data-component="rave-settings"><div class="settings-folder__icon">' + icon + '</div><div class="settings-folder__name">Rave</div></li>');
                    Lampa.Settings.main().render().find('[data-component="plugins"]').after(rave_item);
                    
                    Lampa.Settings.main().render().find('[data-component="rave-settings"]').on('hover:enter', function() {
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
                                    <div class="about__text" style="margin-top: 1em;">
                                        <b>Примечание:</b> Для корректной работы совместного просмотра 
                                        убедитесь, что у всех участников установлено приложение Rave.
                                    </div>
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
        } catch (error) {
            console.error('Rave Plugin: Ошибка при добавлении в меню', error);
        }
    }

    // Функция инициализации плагина
    function startPlugin() {
        try {
            console.log('Rave Plugin: Инициализация плагина...');
            
            // Добавляем пункт в настройки
            addSettingsMenuItem();
            
            // Добавляем плагин в главное меню
            addPluginToMenu();
            
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
                
                .rave-button:hover .custom-button {
                    color: #ff5722;
                }
                
                .rave-plugin-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 15px;
                }
            `;
            document.head.appendChild(style);
            
            // Функция для проверки и добавления кнопки (будет вызываться периодически)
            const tryAddButton = () => {
                if (Lampa.Activity.active() && Lampa.Activity.active().component === 'full') {
                    addRaveButton();
                }
            };
            
            // Отслеживаем события активности для добавления кнопки
            Lampa.Listener.follow('full', function(e) {
                console.log('Rave Plugin: Событие активности', e.type);
                
                if (e.type === 'complite' || e.type === 'ready') {
                    // Пробуем добавить кнопку несколько раз с интервалом, чтобы точно успеть
                    setTimeout(tryAddButton, 100);
                    setTimeout(tryAddButton, 500);
                    setTimeout(tryAddButton, 1000);
                    setTimeout(tryAddButton, 2000);
                }
            });
            
            // Также отслеживаем события роутера для перехватывания перехода на страницу фильма
            Lampa.Listener.follow('activity', function(e) {
                if (e.component === 'full') {
                    console.log('Rave Plugin: Активность full', e);
                    setTimeout(tryAddButton, 500);
                }
            });
            
            // Добавляем обработчик изменения DOM, чтобы перехватить момент, когда элементы управления появятся
            if (typeof MutationObserver !== 'undefined') {
                const observer = new MutationObserver(function(mutations) {
                    const shouldAddButton = mutations.some(mutation => {
                        // Проверяем, появился ли контейнер для кнопок или нужные элементы
                        if (mutation.addedNodes.length) {
                            for (let node of mutation.addedNodes) {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    if (node.classList && 
                                        (node.classList.contains('full-start__buttons') || 
                                         node.classList.contains('view--torrent__buttons'))) {
                                        return true;
                                    }
                                }
                            }
                        }
                        return false;
                    });
                    
                    if (shouldAddButton) {
                        console.log('Rave Plugin: Обнаружены изменения DOM, пробуем добавить кнопку');
                        tryAddButton();
                    }
                });
                
                // Начинаем наблюдать за изменениями в DOM
                observer.observe(document.body, { childList: true, subtree: true });
                console.log('Rave Plugin: Настроен наблюдатель за DOM');
            }
            
            // Пробуем добавить кнопку сразу, если мы уже на странице фильма
            setTimeout(tryAddButton, 100);
            
            console.info(`Rave Plugin v${version} инициализирован`);
        } catch (error) {
            console.error('Rave Plugin: Ошибка при инициализации', error);
        }
    }

    // Регистрация плагина
    Lampa.Plugin.register(pluginName, {
        type: 'video',
        version: version,
        name: 'Rave Integration',
        subtitle: 'Интеграция с Rave',
        icon: icon,
        init: startPlugin,
        onSettings: function(e) {
            // Настройки при нажатии в меню плагинов
            e.onCreate = function() {
                let content = e.content || '';
                
                // Добавляем на страницу настроек информацию о плагине
                content.html(`
                    <div class="settings-rave-plugin">
                        <div class="settings-folder selector" data-component="rave-about">
                            <div class="settings-folder__icon">${icon}</div>
                            <div class="settings-folder__name">О плагине</div>
                        </div>
                    </div>
                `);
                
                // Обработчик клика по пункту меню "О плагине"
                content.find('[data-component="rave-about"]').on('hover:enter', function() {
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
                                <div class="about__text" style="margin-top: 1em;">
                                    <b>Примечание:</b> Для корректной работы совместного просмотра 
                                    убедитесь, что у всех участников установлено приложение Rave.
                                </div>
                            </div>
                        `,
                        size: 'medium',
                        onBack: () => {
                            Lampa.Modal.close();
                            Lampa.Controller.toggle('settings_component');
                        }
                    });
                });
            };
        }
    });

    // Добавляем информацию о плагине в список установленных плагинов
    if (Lampa.Storage.get('plugins_installed', '').indexOf(pluginName) === -1) {
        const plugins_installed = Lampa.Storage.get('plugins_installed', '');
        Lampa.Storage.set('plugins_installed', plugins_installed + (plugins_installed ? ', ' : '') + pluginName);
    }
})(); 
