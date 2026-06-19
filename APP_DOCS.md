Ты Senior Frontend/Fullstack разработчик. Нужно вайбкодингом сделать MVP веб-приложения для ведения семейных финансов через Google Sheets.

Контекст:
Мы сейчас ведём бюджет в Google таблице руками. Таблица широкая: месяцы/даты по строкам, категории расходов/накоплений по колонкам. Это неудобно с телефона и плохо масштабируется. Нужно сделать простую веб-морду, которая будет использовать Google Sheets как backend/database, а интерфейс будет удобным для ПК и мобилки.

Главная цель:
Сделать приложение не “как таблицу”, а нормальный финансовый трекер:

* подключение Google аккаунта;
* создание новой Google таблицы;
* подключение существующей Google таблицы;
* приглашение второго пользователя по email через права доступа Google Drive;
* настройка категорий через UI;
* добавление доходов, расходов, накоплений;
* расчёт плана/факта/остатков;
* удобный мобильный интерфейс.

Технологии:

* Next.js последней стабильной версии;
* TypeScript;
* React;
* App Router;
* SCSS modules;
* FSD архитектура;
* React Hook Form;
* Zod;
* Google OAuth;
* Google Sheets API;
* Google Drive API;
* без отдельной базы данных на MVP;
* данные хранить в Google Spreadsheet;
* авторизацию и Google API сделать так, чтобы потом можно было заменить/расширить без переписывания UI.

Архитектурные требования:
Использовать Feature-Sliced Design.

Пример структуры:

src/app
src/pages
src/widgets
src/features
src/entities
src/shared

Компоненты разбивать мелко:

FeatureName/
ui/
FeatureName.tsx
FeatureName.module.scss
model/
types.ts
schema.ts
constants.ts
hooks.ts
api/
featureApi.ts
lib/
helpers.ts

Общие UI-компоненты:

src/shared/ui/Button/ui/Button.tsx
src/shared/ui/Button/ui/Button.module.scss
src/shared/ui/Input/ui/Input.tsx
src/shared/ui/Select/ui/Select.tsx
src/shared/ui/Modal/ui/Modal.tsx
src/shared/ui/Card/ui/Card.tsx
src/shared/ui/PageLayout/ui/PageLayout.tsx
src/shared/ui/MoneyInput/ui/MoneyInput.tsx
src/shared/ui/DateInput/ui/DateInput.tsx

Стиль кода:

* использовать полные названия переменных;
* не использовать any;
* если нужен тип — вывести нормальный type/interface;
* enum использовать вместо строковых перечислений там, где это уместно;
* не использовать readonly;
* не использовать emoji в коде;
* комментарии только в формате //Комментарий;
* не писать ninja-code;
* код должен быть понятный, поддерживаемый, без переусложнения;
* все формы валидировать через Zod;
* все формы собирать через React Hook Form;
* все деньги хранить в копейках/центах как integer, но отображать в рублях;
* все даты хранить в ISO формате YYYY-MM-DD;
* расчёты должны быть вынесены в чистые функции.

Основная идея хранения данных:
Google Sheets используется как база данных. Не повторять текущую широкую таблицу. Сделать нормализованную структуру листов.

При создании новой таблицы приложение должно создать spreadsheet с такими листами:

1. Settings
2. Users
3. Categories
4. Plans
5. Operations
6. Transfers
7. Summary

Лист Settings:
columns:

* key
* value

Примеры:

* appVersion
* currency
* createdAt
* ownerEmail

Лист Users:
columns:

* id
* name
* email
* role
* createdAt

role enum:

* owner
* partner

Лист Categories:
columns:

* id
* name
* type
* owner
* color
* icon
* isActive
* createdAt
* updatedAt

category type enum:

* income
* expense
* saving

owner enum:

* danya
* katya
* common

Примеры категорий:

* Даня МИС
* Даня брокер
* Катя ИИС
* Отдых
* Брекеты
* Здоровье
* Автомобиль
* Хобби
* Спорт
* Ремонт
* Красота
* Квартира
* Личные траты Даня
* Личные траты Катя

Лист Plans:
columns:

* id
* month
* categoryId
* plannedAmount
* owner
* paymentDay
* createdAt
* updatedAt

month format:
YYYY-MM

paymentDay:
5, 20 или empty/null

Лист Operations:
columns:

* id
* date
* month
* type
* categoryId
* owner
* amount
* comment
* createdByEmail
* createdAt
* updatedAt

operation type enum:

* income
* expense
* saving

Лист Transfers:
columns:

* id
* date
* fromOwner
* toOwner
* amount
* comment
* createdByEmail
* createdAt

Лист Summary:
Можно не хранить постоянно, а пересчитывать на фронте из Plans + Operations.
Если проще для MVP, Summary можно вообще не создавать.

Главные сценарии приложения:

1. Первый запуск
   Пользователь открывает приложение.
   Если не авторизован:

* показать экран авторизации через Google.

После авторизации:

* если нет подключённой таблицы:

  * показать onboarding;
  * кнопка “Создать новую таблицу”;
  * кнопка “Подключить существующую таблицу”;
  * поле для spreadsheetId или ссылки на Google Sheets.

2. Создание новой таблицы
   После нажатия:

* создать Google Spreadsheet;
* создать нужные листы;
* записать заголовки;
* добавить дефолтные категории;
* сохранить spreadsheetId локально;
* открыть dashboard.

3. Подключение существующей таблицы
   Пользователь вставляет ссылку или spreadsheetId.
   Приложение:

* парсит spreadsheetId;
* проверяет доступ через Sheets API;
* проверяет наличие нужных листов;
* если листов нет, предлагает инициализировать структуру;
* сохраняет spreadsheetId локально.

4. Приглашение девушки
   В настройках:

* поле email;
* кнопка “Пригласить”.
  Приложение через Google Drive API выдаёт writer permission на spreadsheet.
  После этого девушка может открыть приложение, авторизоваться через Google и подключить эту же таблицу.

5. Dashboard
   Главный экран должен показывать:

* текущий месяц;
* общий доход;
* общие расходы;
* накопления;
* свободный остаток;
* сколько осталось до конца месяца;
* план/факт по категориям;
* последние операции;
* быстрые кнопки:

  * Добавить доход;
  * Добавить расход;
  * Добавить накопление;
  * Добавить перевод.

6. Категории
   Экран категорий:

* список категорий;
* фильтр по типу;
* фильтр по владельцу;
* создание категории;
* редактирование категории;
* выключение категории через isActive=false, не удалять физически.

Форма категории:

* название;
* тип;
* владелец;
* цвет;
* иконка.

7. План месяца
   Экран планирования:

* выбор месяца;
* список категорий;
* plannedAmount;
* paymentDay;
* owner;
* возможность скопировать план с прошлого месяца.

Важно:
План на месяц — это не операция. Это ожидаемые суммы.
Операции — это фактические доходы/траты/накопления.

8. Добавление операции
   Форма:

* тип операции;
* дата;
* категория;
* владелец;
* сумма;
* комментарий.

После сохранения:

* добавить строку в Operations;
* обновить данные на dashboard;
* показать успешный статус.

9. Мобильный UX
   Сделать интерфейс mobile-first:

* нижняя навигация на мобилке;
* крупные кнопки;
* быстрый ввод суммы;
* модалки или bottom-sheet для добавления операции;
* не делать огромные таблицы как основной UI.

Основные страницы:

* /login
* /onboarding
* /dashboard
* /operations
* /categories
* /plan
* /settings

Навигация:
Desktop:

* sidebar слева.

Mobile:

* bottom navigation:

  * Главная
  * Операции
  * План
  * Категории
  * Настройки

UI стиль:

* спокойный минималистичный интерфейс;
* светлая тема по умолчанию;
* адаптивная сетка;
* карточки;
* аккуратные progress bars;
* суммы форматировать как ₽;
* отрицательные остатки явно подсвечивать;
* не делать перегруженный Excel-like UI.

Расчёты:
Сделать чистые функции:

calculateMonthSummary(params)
getOperationsByMonth(params)
getPlansByMonth(params)
calculateCategoryProgress(params)
calculateFreeBalance(params)
calculateOwnerSummary(params)

Нужно считать:

* totalIncome;
* totalExpense;
* totalSaving;
* freeBalance = income - expense - saving;
* plannedExpense;
* actualExpense;
* plannedSaving;
* actualSaving;
* categoryRemainingAmount = plannedAmount - actualAmount;
* categoryProgressPercent.

Google API слой:
Сделать отдельные сервисы:

src/shared/api/google/googleAuthApi.ts
src/shared/api/google/googleSheetsApi.ts
src/shared/api/google/googleDriveApi.ts

Нужно реализовать:

* signInWithGoogle;
* signOutFromGoogle;
* getCurrentGoogleUser;
* createFinanceSpreadsheet;
* initializeFinanceSpreadsheet;
* readSheetRows;
* appendSheetRow;
* updateSheetRow;
* shareSpreadsheetWithEmail;
* validateSpreadsheetAccess;
* parseSpreadsheetIdFromUrl.

Важно:
Google API слой не должен протекать в UI напрямую.
UI работает через features/entities API.

Состояние:
Для MVP можно использовать React hooks + context.
Сделать FinanceWorkspaceProvider:

* currentUser;
* spreadsheetId;
* categories;
* plans;
* operations;
* isLoading;
* refreshWorkspaceData.

Можно использовать localStorage для сохранения spreadsheetId:
key: finance-tracker-spreadsheet-id

Ошибки:
Нужно обработать:

* пользователь не авторизован;
* нет доступа к таблице;
* неверная ссылка;
* нет нужных листов;
* ошибка Google API;
* пустые данные;
* конфликт заголовков.

Для MVP не надо:

* backend database;
* сложные роли;
* банковские интеграции;
* импорт чеков;
* мультивалютность;
* сложные графики;
* SSR для приватных данных;
* платёжки;
* полноценный дизайн-конструктор.

Первый этап реализации:

1. Создай проект Next.js + TypeScript + SCSS modules.
2. Подними базовую FSD структуру.
3. Сделай shared UI: Button, Input, Select, Modal, Card, PageLayout, MoneyInput, DateInput.
4. Сделай enums и types:

   * OperationTypeEnum;
   * CategoryTypeEnum;
   * CategoryOwnerEnum;
   * UserRoleEnum;
   * SheetNameEnum.
5. Сделай Google API сервисы.
6. Сделай onboarding создания/подключения таблицы.
7. Сделай инициализацию Google Spreadsheet.
8. Сделай dashboard с моковыми данными.
9. Потом подключи реальные данные из Google Sheets.
10. Сделай добавление операций.
11. Сделай категории.
12. Сделай план месяца.
13. Сделай настройки и приглашение пользователя.

Второй этап:
После MVP улучшить:

* красивую аналитику;
* графики;
* копирование плана прошлого месяца;
* шаблоны регулярных платежей;
* быстрые категории;
* PWA manifest;
* офлайн-очередь операций, если нет интернета.

Особые требования:
Не пытайся сделать всё идеально сразу. Нужен рабочий MVP.
Не усложняй архитектуру сверх необходимости.
Все места, где нужны Google OAuth credentials, оставь через env:

NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_API_KEY=fam

Если для работы Google API нужен другой подход, предложи его и реализуй максимально просто.

Начни с генерации файлов проекта и базовой архитектуры. После каждого крупного этапа коротко напиши:

* что создано;
* какие файлы изменены;
* что нужно проверить;
* какой следующий шаг.
