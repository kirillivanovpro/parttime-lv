import { Lang } from '@/types';

export const translations = {
  lv: {
    // Nav
    home: 'Sākums',
    login: 'Ieiet',
    logout: 'Iziet',
    profile: 'Profils',
    chat: 'Ziņas',
    create_listing: 'Pievienot',

    // Home
    tagline: 'Atrodi palīgu vai piedāvā savas prasmes',
    i_can_do: 'Es varu palīdzēt',
    i_need_help: 'Man vajag palīdzību',
    i_can_do_desc: 'Piedāvā savus pakalpojumus citiem',
    i_need_help_desc: 'Atrodi cilvēku, kurš var palīdzēt',
    browse_offers: 'Skatīt piedāvājumus',
    browse_requests: 'Skatīt pieprasījumus',
    all_categories: 'Visas kategorijas',
    latest_listings: 'Jaunākie sludinājumi',
    no_listings: 'Nav sludinājumu',

    // Categories
    cleaning: 'Tīrīšana',
    dog_walking: 'Suņa pastaiga',
    tutoring: 'Mācīšana',
    photo_video: 'Foto/video',
    delivery: 'Piegāde',
    repairs: 'Remonts',

    // Auth
    sign_in: 'Pieslēgties',
    sign_up: 'Reģistrēties',
    email: 'E-pasts',
    phone: 'Tālrunis',
    password: 'Parole',
    full_name: 'Vārds Uzvārds',
    or_use_phone: 'vai izmanto tālruni',
    or_use_email: 'vai izmanto e-pastu',
    send_otp: 'Sūtīt kodu',
    verify_otp: 'Ievadi kodu',
    otp_sent: 'Kods nosūtīts uz',
    already_have_account: 'Jau ir konts?',
    no_account: 'Nav konta?',
    auth_error: 'Autentifikācijas kļūda',

    // Listing
    create_new_listing: 'Jauns sludinājums',
    listing_type: 'Tips',
    can_do: 'Piedāvājums',
    need_help: 'Pieprasījums',
    category: 'Kategorija',
    title: 'Virsraksts',
    description: 'Apraksts',
    price: 'Cena',
    price_unit: 'Cenas vienība',
    per_hour: 'stundā',
    per_job: 'par darbu',
    location: 'Vieta',
    publish: 'Publicēt',
    save: 'Saglabāt',
    cancel: 'Atcelt',
    delete: 'Dzēst',
    edit: 'Rediģēt',
    contact: 'Sazināties',
    by: 'Autors',
    posted: 'Publicēts',
    eur_per: '€/',

    // Chat
    messages: 'Ziņas',
    type_message: 'Raksti ziņu...',
    send: 'Sūtīt',
    no_chats: 'Nav ziņu',
    start_chat: 'Sākt sarunu',

    // Profile
    my_profile: 'Mans profils',
    my_listings: 'Mani sludinājumi',
    my_reviews: 'Manas atsauksmes',
    wallet: 'Maciņš',
    balance: 'Atlikums',
    transactions: 'Darījumi',
    top_up: 'Papildināt',
    withdraw: 'Izņemt',
    no_transactions: 'Nav darījumu',
    rating: 'Vērtējums',
    reviews: 'Atsauksmes',
    no_reviews: 'Nav atsauksmju',

    // Review
    leave_review: 'Atstāt atsauksmi',
    your_rating: 'Tavs vērtējums',
    your_comment: 'Komentārs (neobligāts)',
    submit_review: 'Iesniegt',
    review_submitted: 'Atsauksme iesniegta',

    // General
    loading: 'Ielādē...',
    error: 'Kļūda',
    success: 'Veiksmīgi',
    back: 'Atpakaļ',
    see_all: 'Skatīt visu',
    active: 'Aktīvs',
    inactive: 'Neaktīvs',
    ago: 'atpakaļ',
    hours: 'st.',
    days: 'd.',
    minutes: 'min.',
  },
  ru: {
    // Nav
    home: 'Главная',
    login: 'Войти',
    logout: 'Выйти',
    profile: 'Профиль',
    chat: 'Сообщения',
    create_listing: 'Добавить',

    // Home
    tagline: 'Найди помощника или предложи свои навыки',
    i_can_do: 'Я могу помочь',
    i_need_help: 'Мне нужна помощь',
    i_can_do_desc: 'Предложи свои услуги другим',
    i_need_help_desc: 'Найди человека, который поможет',
    browse_offers: 'Смотреть предложения',
    browse_requests: 'Смотреть запросы',
    all_categories: 'Все категории',
    latest_listings: 'Последние объявления',
    no_listings: 'Нет объявлений',

    // Categories
    cleaning: 'Уборка',
    dog_walking: 'Выгул собак',
    tutoring: 'Репетиторство',
    photo_video: 'Фото/видео',
    delivery: 'Доставка',
    repairs: 'Ремонт',

    // Auth
    sign_in: 'Войти',
    sign_up: 'Зарегистрироваться',
    email: 'E-mail',
    phone: 'Телефон',
    password: 'Пароль',
    full_name: 'Имя Фамилия',
    or_use_phone: 'или используй телефон',
    or_use_email: 'или используй e-mail',
    send_otp: 'Отправить код',
    verify_otp: 'Введи код',
    otp_sent: 'Код отправлен на',
    already_have_account: 'Уже есть аккаунт?',
    no_account: 'Нет аккаунта?',
    auth_error: 'Ошибка авторизации',

    // Listing
    create_new_listing: 'Новое объявление',
    listing_type: 'Тип',
    can_do: 'Предложение',
    need_help: 'Запрос',
    category: 'Категория',
    title: 'Заголовок',
    description: 'Описание',
    price: 'Цена',
    price_unit: 'Единица цены',
    per_hour: 'в час',
    per_job: 'за работу',
    location: 'Место',
    publish: 'Опубликовать',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    contact: 'Связаться',
    by: 'Автор',
    posted: 'Опубликовано',
    eur_per: '€/',

    // Chat
    messages: 'Сообщения',
    type_message: 'Написать сообщение...',
    send: 'Отправить',
    no_chats: 'Нет сообщений',
    start_chat: 'Начать чат',

    // Profile
    my_profile: 'Мой профиль',
    my_listings: 'Мои объявления',
    my_reviews: 'Мои отзывы',
    wallet: 'Кошелёк',
    balance: 'Баланс',
    transactions: 'Транзакции',
    top_up: 'Пополнить',
    withdraw: 'Вывести',
    no_transactions: 'Нет транзакций',
    rating: 'Рейтинг',
    reviews: 'Отзывы',
    no_reviews: 'Нет отзывов',

    // Review
    leave_review: 'Оставить отзыв',
    your_rating: 'Ваша оценка',
    your_comment: 'Комментарий (необязательно)',
    submit_review: 'Отправить',
    review_submitted: 'Отзыв отправлен',

    // General
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    back: 'Назад',
    see_all: 'Смотреть все',
    active: 'Активно',
    inactive: 'Неактивно',
    ago: 'назад',
    hours: 'ч.',
    days: 'д.',
    minutes: 'мин.',
  },
} as const;

export type TranslationKey = keyof typeof translations.lv;

export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang][key] ?? translations.lv[key] ?? key;
}
