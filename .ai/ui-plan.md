# Architektura UI dla switch-ai

## 1. Przegląd struktury UI

switch-ai to aplikacja czatowa dla power-userów LLM, zaprojektowana wokół stałego, dwukolumnowego układu: **Sidebar (lista konwersacji + akcje)** i **Panel główny (aktywny czat + pole wejściowe + selektor modelu)**. Stan globalny zarządza się poprzez Zustand (activeConversationId, conversationsList, modelsList, lastUsedModel). Interfejs wspiera per-message model switching, branching (full / summary), prostą paginację (pierwsze 50 konwersacji i pierwsze 50 najstarszych wiadomości dla aktywnego czatu), BYOK API key onboarding oraz nieblokujące komunikaty błędów API. UI wyraźnie oddziela logikę "Nowego czatu" (activeConversationId === null) od widoku istniejącej konwersacji.

***

## 2. Lista widoków

### Widok: Ekran logowania / rejestracji

* **Ścieżka**: `/auth` (lub Supabase-managed)
* **Główny cel**: umożliwić rejestrację (email + hasło) i logowanie; po sukcesie przejście do aplikacji.
* **Kluczowe informacje**: pola email, password, walidacja formatu, feedback błędów (np. email zajęty, złe hasło).
* **Kluczowe komponenty**: formy logowania/rejestracji, CTA „Zaloguj” / „Zarejestruj”, link „Zapomniałem hasła”.
* **UX / dostępność / bezpieczeństwo**: aria-labels dla pól, debounce walidacji email, silne hasło (opcjonalnie), HTTPS, nie przechowywać hasła w localStorage.

***

### Widok: Layout główny (dwukolumnowy) — global

* **Ścieżka**: `/app` (layout)
* **Główny cel**: ramka na sidebar + panel czatu; centralny punkt nawigacji.
* **Kluczowe informacje**: status API key (zablokowany/odblokowany), model list preload, activeConversationId, przycisk hamburger (mobile).
* **Kluczowe komponenty**: Header (hamburger, ustawienia), Sidebar, ChatPanel.
* **UX / dostępność / bezpieczeństwo**: focus management przy przełączaniu konwersacji, role landmark (nav, main), tokeny i klucz API nigdy w stanie frontendu poza chwilowym inputem.

***

### Widok: Sidebar — lista konwersacji

* **Ścieżka**: część layoutu (`/app#sidebar`)
* **Główny cel**: przegląd i zarządzanie konwersacjami (nowa, wybór, usuń).
* **Kluczowe informacje**: lista (pierwsze 50) konwersacji sortowanych newest→oldest, tytuły, czas utworzenia, ikonka kosza (dwuetapowe potwierdzenie), przycisk „Nowa Konwersacja” (zgaszony gdy activeConversationId === null).
* **Kluczowe komponenty**: list item z accessible buttonami (select, delete/confirm), search/filter (opcjonalne w MVP), sticky CTA „Nowy Czat”.
* **UX / dostępność / bezpieczeństwo**: keyboard navigation (arrow keys), aria-selected dla aktywnej konwersacji, potwierdzenie usunięcia dwuetapowe (ikonka zmienia się) zamiast modala (zgodnie z decyzją).

***

### Widok: Chat Panel — historia + interakcja

* **Ścieżka**: `/app/conversations/:id` lub aktywny „Nowy czat” gdy `activeConversationId === null`
* **Główny cel**: prowadzenie rozmowy, wysyłanie wiadomości z per-message model selection, przegląd historii, branching z każdego message item.
* **Kluczowe informacje**: lista wiadomości (GET .../messages — pierwsze 50 najstarszych), pod każdą odpowiedzią model\_name, token counter (prompt+completion z ostatniej assistant message), wskaźnik ładowania (skeleton) gdy czekamy na response, nieblokujący alert z treścią błędu API (US-013).
* **Kluczowe komponenty**: MessageList (role=log), MessageItem (user/assistant/error), Branch action (ikonka + menu), ModelBadge (pod odpowiedzią), Composer (input, model selector, send button, token counter).
* **UX / dostępność / bezpieczeństwo**: aria-live region dla nowych wiadomości, disabled input + button podczas oczekiwania (ale UI nie blokuje innych akcji), odróżniające kolory/role dla error messages, czytelne kontrasty, nie trzymać API key w JS runtime.

***

### Widok: Composer / wysyłka wiadomości (część Chat Panel)

* **Ścieżka**: komponent w `/app`
* **Główny cel**: wpisanie tekstu, wybór modelu dla tej jednej wiadomości, wysłanie.
* **Kluczowe informacje**: textarea z autosize, Combobox z wyszukiwaniem modeli (modelsList z /api/models), przycisk „Wyślij”, licznik tokenów, ostatnio użyty model (localStorage ↔ Zustand).
* **Kluczowe komponenty**: Combobox (searchable), Send button, Token counter, model history tooltip (ostatnio używane).
* **UX / dostępność / bezpieczeństwo**: keyboard shortcuts (Enter send, Shift+Enter newline), aria-controls dla Combobox, zapamiętywanie lastUsedModel w localStorage (bez API key).

***

### Widok: Ustawienia / Onboarding API Key

* **Ścieżka**: `/app/settings` (modal lub strona)
* **Główny cel**: zarządzanie BYOK — wprowadzanie, usuwanie, sprawdzenie istnienia (GET /user/api-key; PUT /user/api-key; DELETE /user/api-key).
* **Kluczowe informacje**: input API key, status validation (existence check), instrukcja BYOK, przycisk zapisz, info o szyfrowaniu po stronie serwera.
* **Kluczowe komponenty**: secure input (mask), status badge, explainers (dlaczego nie widzimy klucza).
* **UX / dostępność / bezpieczeństwo**: klucz nigdy pokazywany, po wysłaniu input czyści się; wskazówki dotyczące zabezpieczenia konta; validation errors wyświetlane jako alerty.

***

### Widok: Branching flow modal / popover

* **Ścieżka**: overlay w Chat Panel (nie nowa strona)
* **Główny cel**: wybór typu branch (full / summary), potwierdzenie, wywołanie `POST /conversations/{id}/messages/{id}/branch`.
* **Kluczowe informacje**: krótki opis różnicy między full a summary, przyciski „Utwórz branch (pełna historia)” oraz „Utwórz branch (podsumowanie)”.
* **Kluczowe komponenty**: accessible dialog, loading state, success navigation (przełącz activeConversationId na nowy).
* **UX / dostępność / bezpieczeństwo**: focus trap w dialogu, aria-describedby z opisem skutków, handler błędów endpointu (500 → nieblokujący alert).

***

### Widok: Błędy i stany nieaktywne (global)

* **Ścieżka**: globalny overlay/inline alerts (component)
* **Główny cel**: wyświetlanie informacji o błędach API, braku klucza API, błędach połączenia, walidacji.
* **Kluczowe informacje**: treść błędu, rekomendowana akcja (np. sprawdź ustawienia), przycisk retry gdzie ma sens.
* **Kluczowe komponenty**: non-blocking Alert (Shadcn/ui), inline error message w MessageList.
* **UX / dostępność / bezpieczeństwo**: role=alert dla dostępności, logowanie zdarzeń po stronie klienta tylko metadanych (bez klucza).

***

## 3. Mapa podróży użytkownika

### Główny przypadek użycia — „Utwórz nową rozmowę i użyj innego modelu dla wiadomości”

1. Użytkownik loguje się (`/auth`) → po sukcesie przechodzi do `/app`.
2. App load: fetch `/api/models` raz, fetch `/conversations` (first 50). Sprawdź `/user/api-key`.

   * Jeśli API key `exists: false` → zablokuj panel czatu i pokaż modal/onboarding z linkiem do ustawień.
3. Użytkownik w Sidebar klika „Nowa Konwersacja” lub już jest w widoku nowego czatu (activeConversationId === null).
4. W Composer użytkownik wybiera model z Combobox (opcjonalnie używa wyszukiwania). Wybrany model zapisuje się w localStorage jako `lastUsedModel`.
5. Użytkownik wpisuje treść → naciśnie „Wyślij” → UI wysyła `POST /conversations` (nowy conversation flow) z payload {content, model}.
6. Backend: tworzy conversation, zapisuje user message, wywołuje OpenRouter, zapisuje assistant message, generuje title (2-4 słowa) → zwraca conversation + messages.
7. UI: ustawia `activeConversationId` na nowo utworzony id, odświeża conversations list (GET /conversations), renderuje messages; pod odpowiedzią wyświetla `model_name` i aktualizuje token counter.
8. Użytkownik może kliknąć przy dowolnej wiadomości ikonę Branch → wybrać `full` lub `summary` → UI wywołuje `POST /conversations/{id}/messages/{id}/branch` → na sukces ustawia activeConversationId na nowy branch i pobiera jego messages.

***

## 4. Układ i struktura nawigacji

* **Globalny header**: hamburger (mobile), profil/ustawienia (otwiera settings modal/stronę), status API key (ikona).
* **Sidebar (persist)**: lista konwersacji (select), przycisk „Nowy Konwersacja” (sticky), opcje filtrowania/szukania (opcjonalne). Kliknięcie elementu → ustaw `activeConversationId` i fetch messages.
* **Główny panel**: dynamiczny; jeśli `activeConversationId === null` → „Nowy czat”, inaczej render historii. Branching uruchamiany inline przy message item.
* **Nawigacja mobilna**: hamburger toggluje Sidebar jako Sheet (Shadcn/ui). Wszystkie akcje dostępne via keyboard i screen reader.
* **Potoki API**: operacje mutujące (POST/PUT/DELETE) powodują lokalne aktualizacje stanu w Zustand i ewentualne ponowne fetchy (conversations list, messages) zgodnie z decyzjami w planie.

***

## 5. Kluczowe komponenty

1. **SidebarList** — lista konwersacji z dwuetapowym usuwaniem; keyboard navigation; lazy highlight active.
2. **ChatPanel / MessageList** — renderowanie wiadomości ze znaczeniem roli; aria-live dla nowych wiadomości; obsługa message error card.
3. **MessageItem** — zawiera akcje: branch (menu), copy, show model badge; accessibility for action buttons.
4. **Composer** — textarea, Combobox model selector (searchable), Send button, Token counter, keyboard shortcuts.
5. **ModelCombobox** — preloaded modelsList z /api/models; searchable; updates lastUsedModel in localStorage on send.
6. **BranchDialog** — accessible dialog z wyborem `full`/`summary`, loading state, error handling.
7. **APIKeyOnboarding** — modal/section z secure input i explanatory text; calls PUT/GET/DELETE /user/api-key.
8. **NonBlockingAlert** — inline alert komponent dla API errors (maps error payload to friendly message).
9. **GlobalState (Zustand store)** — activeConversationId, conversationsList, messagesCache (per conversation), modelsList, lastUsedModel, uiFlags (loading states).

***

## 6. Mapowanie głównych endpointów API → cele UI

* `GET /api/models` → **ModelCombobox** prefetch, zapis w Zustand; używany w Composer.
* `GET /user/api-key` → **Onboarding flow**: blokada/odblokada chat panel.
* `PUT /user/api-key` → zapis klucza (UI wyświetla success + odblokowuje chat).
* `DELETE /user/api-key` → usuwa klucz → UI blokada + instrukcja.
* `GET /conversations?page=1&pageSize=50` → **SidebarList** (pierwsze 50).
* `POST /conversations` → utworzenie nowej konwersacji z pierwszą wiadomością (Nowy czat flow). UI: ustawia activeConversationId i odświeża listę.
* `GET /conversations/{id}` → (opcjonalne) metadane konwersacji.
* `DELETE /conversations/{id}` → usuwanie; UI: dwuetapowe potwierdzenie, następnie usunięcie z Zustand.
* `GET /conversations/{id}/messages?page=1&pageSize=50` → **MessageList** (pobieranie po zmianie activeConversationId).
* `POST /conversations/{id}/messages` → wysłanie kolejnej wiadomości; UI: dodaje user message, pokazuje loading, po wynikach dodaje assistant message i aktualizuje token counter. Błędy (402, 502) mapowane na inline error message.
* `POST /conversations/{id}/messages/{id}/branch` → branching; UI: dialog → POST → na success przełącz activeConversationId na nowy branch.

***

## 7. Mapowanie user stories (PRD) na elementy UI

* **US-001 / US-002 (Rejestracja / Logowanie)** → Widok Auth (`/auth`) + redirect do `/app` po sukcesie.
* **US-003 (API Key Management)** → Ustawienia `/app/settings` + Onboarding overlay; `GET/PUT/DELETE /user/api-key` integracja.
* **US-004 (Send/Receive)** → Composer + `POST /conversations` i `POST /conversations/{id}/messages` + MessageList rendering.
* **US-005 (Per-message model selection)** → ModelCombobox w Composer; model przesyłany w payload każdego POST; wpisanie model\_name pod assistant response.
* **US-006 (Remember last model)** → localStorage sync ↔ Zustand; preselect Combobox na `lastUsedModel`.
* **US-007 (New Conversation)** → „Nowy Konwersacja” CTA w Sidebar; activeConversationId === null; POST /conversations po pierwszym wysłaniu.
* **US-008 (Browsing / Switching)** → SidebarList select → set activeConversationId → GET messages.
* **US-009 (Deleting)** → dwuetapowe delete action w Sidebar (ikonka → confirm) → DELETE /conversations/{id}.
* **US-010 / US-011 (Branch Full / Summary)** → BranchDialog przy MessageItem → POST /.../branch (type full/summary) → switch to new conversation on success.
* **US-012 (Token Counter)** → Token counter obliczany z ostatniej assistant message (prompt\_tokens + completion\_tokens) i wyświetlany obok Composer.
* **US-013 (API Error Handling)** → NonBlockingAlert + inline MessageItem error with API error content; UI pozostaje interaktywne.

***

## 8. Wskazanie UX, dostępności i bezpieczeństwa (skondensowane)

* **UX**: minimalne kliknięcia dla power-usera: ostatni model preselected; keyboard shortcuts (Enter send); szybkie branch/confirm; niewielka liczba spinnerów; dwuetapowe usuwanie zamiast modala.
* **Dostępność**: semantic HTML landmarks (nav, main), role=log/aria-live dla nowych wiadomości, accessible Combobox (aria-expanded, aria-activedescendant), focus management w dialogach, kontrast kolorów, wsparcie keyboard navigation (tabindex, arrow keys w listach).
* **Bezpieczeństwo**: BYOK — klucz wysyłany tylko do backendu (PUT /user/api-key), nie przechowywany w frontend state ani localStorage; wszystkie HTTP requests przez HTTPS; auth via JWT (Bearer) w każdym żądaniu; UI nie loguje ani nie wyświetla klucza; ograniczenie długości wiadomości (1-50k chars) i walidacja przed wysłaniem; nie ujawnia szczegółów błędów serwera użytkownikowi — pokazuje treść błędu API w bezpiecznej formie, a szczegóły loguje backend.

***

## 9. Potencjalne stany błędowe i przypadki brzegowe (oraz obsługa)

1. **Brak API key (GET /user/api-key → exists: false)**

   * UI: zablokowany chat, wyświetlony onboarding modal z linkiem do settings, nie pokazujemy przycisku send.
2. **Nieprawidłowy / wyczerpany klucz (402)**

   * UI: inline error message jako MessageItem po wysłaniu, sugestia „Sprawdź swój klucz w ustawieniach”, możliwość retry.
3. **Błąd serwera OpenRouter (502/5xx)**

   * UI: nieblokujący alert, allow retry, zachowaj user message w lokalnym stanie jako pending/error.
4. **Długi / bardzo długi kontekst (przekroczenie limitów tokenów)**

   * UI: ostrzeżenie token counter, oznaczenie możliwego overflow; zachęta do branch lub skrócenia; backend może zwrócić 400 → wygeneruj przyjazny komunikat.
5. **Długie konwersacje — paginacja (główne unresolved issue)**

   * UI: informacja, że widoczne są tylko pierwsze 50 (stary kompromis MVP), opcja „Załaduj więcej” oznaczona; wyraźne poinformowanie użytkownika.
6. **Wyścigi (race conditions)**: szybkie kolejne wysyłki → Composer disabled w czasie oczekiwania na odpowiedź (zgodnie z decyzją). Alternatywa: allow concurrent messages but queue them — poza MVP.
7. **Branch summary generation fail (500)**

   * UI: error alert w dialogu, pozostawienie użytkownika w oryginalnej konwersacji, log błędu.

***

## 10. Zgodność z planem API (krótkie potwierdzenie)

Architektura UI bezpośrednio odwzorowuje plan API: każda mutacja i fetch ma odpowiadający endpoint; branching, tworzenie konwersacji z pierwszej wiadomości i per-message model selection wymagane po stronie backendu są odzwierciedlone w Composerze i BranchDialogu; autentykacja JWT i BYOK przyjmowane są przez Settings/Onboarding. Stan lokalny i fetch polityki (once on load for models; fetch conversations once + refresh on create/delete; fetch messages on activeConversationId change) zostały uwzględnione.

***

## 11. Punkty bólu użytkownika i jak UI je łagodzi

1. **Przełączanie modeli jest żmudne** → Combobox model selector z wyszukiwaniem + zapamiętywanie lastUsedModel.
2. **Gubienie kontekstu przy eksploracji alternatyw** → branching (full/summary) pozwala na niezależne wątki bez tracenia historii.
3. **Niejasne błędy API** → inline, nieblokujące alerty z sugestią działania (settings / retry).
4. **Zbyt dużo okien** → jeden, spójny widok z możliwością skopiowania/otwarcia branch w tym samym UI.
5. **Mobilność** → sidebar jako Sheet, dyskretne CTA, keyboard friendly.

***

## 12. Krótkie zalecenia wdrożeniowe (UX tech hints, bez kodu)

* Prefetch `/api/models` i `/conversations` po zalogowaniu; blokuj composer tylko przy braku API key lub w trakcie oczekiwania na odpowiedź od modelu.
* Traktuj `activeConversationId === null` jako ważny stan — powoduje inny flow (POST /conversations przy wysłaniu pierwszej wiadomości).
* Przechowuj `lastUsedModel` w localStorage oraz synchronizuj przy inicjalizacji Zustand, aktualizuj po każdym send.
* Wszystkie błędy API mapuj do czytelnych komunikatów w MessageList (z kodem błędu i krótką instrukcją).

***

## 13. Podsumowanie

Projekt UI dla switch-ai koncentruje się na maksymalnej ergonomii power-usera: szybkie przełączanie modeli, łatwe tworzenie gałęzi konwersacji, jasna obsługa błędów i bezpieczne BYOK. Dwukolumnowy layout z Sidebar i Chat Panelem, stan globalny w Zustand oraz komponenty dostępne (Shadcn/ui) zapewniają spójność, dostępność i prostotę implementacji MVP.
