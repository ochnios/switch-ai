# Plan implementacji widoku panelu czatu (Chat Panel)

## 1. Przegląd

Panel czatu jest głównym interfejsem aplikacji, w którym użytkownicy prowadzą konwersacje. Widok ten renderuje historię wiadomości dla wybranej konwersacji (na podstawie `:id` w URL) oraz dostarcza komponent `Composer` do wysyłania nowych wiadomości. Umożliwia również kluczowe funkcje: wybór modelu AI dla każdej wiadomości (FR-04) oraz tworzenie odgałęzień (branching) z dowolnej wiadomości w historii (FR-06).

Gdy `id` konwersacji nie jest obecne (np. w nowym czacie), widok ten obsługuje tworzenie nowej konwersacji przy wysłaniu pierwszej wiadomości.

## 2. Routing widoku

Widok będzie renderowany przez komponent-stronę Astro, który dynamicznie wczytuje komponent React.

* **Ścieżka:** `/app/conversations/[id]` (dla istniejących konwersacji)
* **Ścieżka:** `/app/new` (lub podobna, dla nowych konwersacji, gdzie `:id` jest nieobecne)

Komponent React wewnątrz strony Astro będzie pobierał parametr `id` z adresu URL.

## 3. Struktura komponentów

Komponenty będą budowane z użyciem React i biblioteki Shadcn/ui, zgodnie ze stosem technologicznym.

```text
ChatPanelView (Komponent strony/React)
│
├── MessageList (useMessages)
│   ├── Skeleton (ładowanie począkowe)
│   ├── MessageItem (mapowanie po messages)
│   │   ├── Avatar (dla 'user' / 'assistant')
│   │   ├── MarkdownContent (dla 'content')
│   │   ├── ModelBadge (jeśli rola='assistant' i jest model\_name)
│   │   └── BranchAction (useBranching)
│   │       └── DropdownMenu (z Shadcn/ui)
│   │           ├── DropdownMenuItem ("Utwórz branch z pełną historią")
│   │           └── DropdownMenuItem ("Utwórz branch z podsumowaniem")
│   │
│   ├── MessageItem (dla typu 'error', US-013)
│   └── MessageItem (dla typu 'loading', wskaźnik odpowiedzi AI)
│
└── Composer (useMessages, useModels, useAppStore)
├── ModelSelector (Combobox z Shadcn/ui)
├── Textarea (autosize)
├── SendButton
└── TokenCounter (useTokenCounter)
```

## 4. Szczegóły komponentów

### ChatPanelView

* **Opis komponentu:** Główny kontener widoku. Odpowiada za pobranie `id` konwersacji z URL i przekazanie go do hooka `useMessages`. Zarządza stanem ładowania całej konwersacji.
* **Główne elementy:** `MessageList`, `Composer`.
* **Obsługiwane interakcje:** Brak, orkiestruje komponenty podrzędne.
* **Obsługiwana walidacja:** Sprawdza, czy `id` z URL jest prawidłowe (jeśli istnieje).
* **Typy:** `PaginatedMessagesDto`, `MessageDto`.
* **Propsy:** `conversationId: string | null`.

### MessageList

* **Opis komponentu:** Renderuje przewijaną listę wiadomości. Wykorzystuje region `aria-live` do ogłaszania nowych wiadomości. Wyświetla wiadomości, błędy API (US-013) oraz wskaźnik ładowania odpowiedzi AI.
* **Główne elementy:** Pętla renderująca `MessageItem`, komponent `Skeleton` z Shadcn/ui.
* **Obsługiwane interakcje:** Przewijanie.
* **Obsługiwana walidacja:** Brak.
* **Typy:** `DisplayMessage[]` (patrz sekcja 5. Typy).
* **Propsy:** `messages: DisplayMessage[]`, `isLoadingInitial: boolean`.

### MessageItem

* **Opis komponentu:** Renderuje pojedynczą wiadomość (użytkownika, asystenta, błędu lub ładowania). Zawiera treść, awatar, a dla wiadomości asystenta `ModelBadge` oraz `BranchAction`.
* **Główne elementy:** `Avatar`, `div` na treść (renderujący Markdown), `ModelBadge`, `BranchAction`.
* **Obsługiwane interakakcje:** Kliknięcie na ikonę brancha (propagowane z `BranchAction`).
* **Obsługiwana walidacja:** Brak.
* **Typy:** `DisplayMessage`.
* **Propsy:** `message: DisplayMessage`.

### BranchAction

* **Opis komponentu:** Komponent (przycisk z ikoną `git-branch`) powiązany z `MessageItem`. Po kliknięciu wyświetla `DropdownMenu` (Shadcn/ui) z dwiema opcjami (FR-06). Inicjuje wywołanie API do tworzenia brancha.
* **Główne elementy:** `Button` (jako ikona), `DropdownMenu`, `DropdownMenuItem`.
* **Obsługiwane interakcje:**
  * `onClick` (na ikonie): Otwiera dropdown.
  * `onSelect` (na opcji "Pełna historia"): Wywołuje `createBranch(message.id, 'full')`.
  * `onSelect` (na opcji "Podsumowanie"): Wywołuje `createBranch(message.id, 'summary')`.
* **Obsługiwana walidacja:** Opcje w menu mogą być wyłączone, jeśli `isBranching` jest `true`.
* **Typy:** `CreateBranchCommand`, `ConversationDto`.
* **Propsy:** `messageId: string`, `conversationId: string`.

### Composer

* **Opis komponentu:** Dolny panel do wprowadzania danych. Zawiera selektor modeli, pole tekstowe i przycisk wysyłania. Zarządza stanem wprowadzania tekstu i wybranego modelu.
* **Główne elementy:** `ModelSelector`, `Textarea` (z Shadcn/ui), `Button` (z Shadcn/ui), `TokenCounter`.
* **Obsługiwane interakcje:**
  * `onInput`: Aktualizuje stan tekstu.
  * `onModelChange`: Aktualizuje stan wybranego modelu.
  * `onSubmit` (kliknięcie przycisku lub `Enter`): Wywołuje `sendMessage(text, model)`.
* **Obsługiwana walidacja:** Przycisk "Wyślij" jest wyłączony (`disabled`), gdy:
  * `isSendingMessage` jest `true`.
  * `inputText.trim().length === 0`.
  * `isLoadingModels` jest `true` lub `modelsList` jest pusty.
* **Typy:** `SendMessageCommand`, `Model`.
* **Propsy:** `isSending: boolean`, `sendMessage: (cmd: SendMessageCommand) => void`, `activeConversationId: string | null`.

### ModelSelector

* **Opis komponentu:** Implementacja `Combobox` (z Shadcn/ui) do wyszukiwania i wybierania modelu AI (US-005). Pobiera domyślną wartość z `useAppStore` (dla US-006).
* **Główne elementy:** `Combobox` (złożony z `Popover`, `Command` z Shadcn/ui).
* **Obsługiwane interakakcje:** Wyszukiwanie, wybór.
* **Obsługiwana walidacja:** Wyświetla stan ładowania lub błędu podczas pobierania listy modeli.
* **Typy:** `Model[]`.
* **Propsy:** `value: string`, `onChange: (modelId: string) => void`, `models: Model[]`, `isLoading: boolean`.

### TokenCounter

* **Opis komponentu:** Wyświetla oszacowaną liczbę tokenów dla bieżącej konwersacji (FR-08).
* **Główne elementy:** `span` lub `div`.
* **Obsługiwana walidacja:** Brak.
* **Typy:** `number`.
* **Propsy:** `totalTokens: number`.

## 5. Typy

Oprócz typów DTO z API (`MessageDto`, `ConversationDto`, `ErrorResponseDto`, `SendMessageCommand`, `CreateBranchCommand`), będziemy potrzebować typów ViewModel:

```typescript
/**
 * Typ Modelu AI pobrany z /api/models (zakładany kształt)
 */
interface Model {
  id: string; // np. 'google/gemini-flash-1.5'
  name: string; // np. 'Gemini Flash 1.5'
  // ... inne właściwości, jeśli API je dostarcza
}

/**
 * Typ unii reprezentujący wszystko, co może znaleźć się na liście wiadomości.
 * Umożliwia renderowanie wiadomości, błędów i wskaźników ładowania w jednej liście.
 */
type DisplayMessage =
  | {
      type: "message";
      data: MessageDto;
    }
  | {
      type: "error";
      id: string; // unikalne ID, np. z timestamp
      content: string; // treść błędu z ErrorResponseDto.message
    }
  | {
      type: "loading";
      id: string; // stałe ID, np. 'loading-skeleton'
    };
```

## 6. Zarządzanie stanem

Użyjemy kombinacji lokalnego stanu React (useState) oraz globalnego stanu (Zustand) dla funkcjonalności międzykomponentowych.

* **Stan globalny (Zustand - `useAppStore`):**

  * `lastUsedModel: string | null`: Przechowuje ID ostatnio używanego modelu.
  * `models: Model[]`: Buforowana lista modeli AI.
  * `isLoadingModels: boolean`: Stan ładowania dla listy modeli.
  * **Akcje:** `setLastUsedModel`, `fetchModels`.
  * **Middleware:** Użycie `persist` (z Zustand) do zapisywania `lastUsedModel` w `localStorage` (wymóg US-006).

* **Hooki niestandardowe:**

  * **`useMessages(conversationId: string | null)`:**

    * Zarządza logiką pobierania i wysyłania wiadomości.
    * **Stan:** `messages: DisplayMessage[]`, `isLoadingInitial: boolean`, `isSendingMessage: boolean`.
    * **Funkcja `fetchMessages`:** Wywołuje `GET /api/conversations/[id]/messages` przy montowaniu (jeśli `conversationId` istnieje).
    * **Funkcja `sendMessage(cmd: SendMessageCommand)`:**
      1. Ustawia `isSendingMessage(true)`.
      2. **Logika optymistyczna:** Dodaje do `messages` wiadomość użytkownika (`type: 'message'`) z tymczasowym ID oraz wskaźnik (`type: 'loading'`).
      3. **Sprawdzenie `conversationId`:**
         * Jeśli `conversationId` istnieje: Wywołuje `POST /api/conversations/[id]/messages` (dla US-004).
         * Jeśli `conversationId` jest `null`: Wywołuje `POST /api/conversations` (tworzenie nowej konwersacji).
      4. **OnSuccess (POST .../messages):** Otrzymuje `[userMsg, assistantMsg]`. Zastępuje tymczasową wiadomość użytkownika przez `userMsg`, usuwa `loading` i dodaje `assistantMsg`.
      5. **OnSuccess (POST /api/conversations):** Otrzymuje `ConversationWithMessagesDto`. Używa `router.push()` do nawigacji do `/app/conversations/[new_id]`.
      6. **OnError:** Usuwa `loading`, dodaje wiadomość `type: 'error'` z treścią błędu (US-013).
      7. **W `finally`:** Ustawia `isSendingMessage(false)` i aktualizuje `lastUsedModel` w `useAppStore`.
    * **Zwraca:** `{ messages, isLoadingInitial, isSendingMessage, sendMessage }`.

  * **`useBranching()`:**

    * **Stan:** `isBranching: boolean`.
    * **Funkcja `createBranch(messageId: string, type: 'full' | 'summary')`:**
      1. Ustawia `isBranching(true)`.
      2. Wywołuje `POST /api/conversations/[convoId]/messages/[msgId]/branch` z `CreateBranchCommand`.
      3. **OnSuccess:** Otrzymuje `ConversationDto`. Używa `router.push()` do nawigacji do `/app/conversations/[new_id]`.
      4. **OnError:** Wyświetla globalny błąd (np. toast/sonner).
      5. **W `finally`:** Ustawia `isBranching(false)`.
    * **Zwraca:** `{ isBranching, createBranch }`.

  * **`useTokenCounter(messages: DisplayMessage[])`:**

    * Używa `useMemo` do zsumowania `prompt_tokens` i `completion_tokens` ze wszystkich wiadomości typu `message`.
    * **Zwraca:** `totalTokens: number`.

## 7. Integracja API

1. **Pobieranie wiadomości (ładowanie widoku):**

   * **Endpoint:** `GET /api/conversations/[id]/messages`
   * **Parametry:** `page=1`, `pageSize=50` (zgodnie z opisem widoku)
   * **Typ odpowiedzi:** `PaginatedMessagesDto`
   * **Obsługa:** Przez `useMessages`.

2. **Pobieranie listy modeli:**

   * **Endpoint:** `GET /api/models` (zakładany)
   * **Typ odpowiedzi:** `Model[]` (zakładany)
   * **Obsługa:** Przez `useAppStore` (lub `useModels`).

3. **Wysyłanie wiadomości (istniejąca konwersacja):**

   * **Endpoint:** `POST /api/conversations/[id]/messages`
   * **Typ żądania:** `SendMessageCommand { content: string, model: string }`
   * **Typ odpowiedzi:** `MessageDto[]` (zawiera `userMsg` i `assistantMsg`)
   * **Obsługa:** Przez `useMessages`.

4. **Wysyłanie wiadomości (nowa konwersacja):**

   * **Endpoint:** `POST /api/conversations`
   * **Typ żądania:** `CreateConversationFromMessageCommand { content: string, model: string }`
   * **Typ odpowiedzi:** `ConversationWithMessagesDto`
   * **Obsługa:** Przez `useMessages`.

5. **Tworzenie brancha:**

   * **Endpoint:** `POST /api/conversations/[id]/messages/[id]/branch`
   * **Typ żądania:** `CreateBranchCommand { type: 'full' | 'summary' }`
   * **Typ odpowiedzi:** `ConversationDto`
   * **Obsługa:** Przez `useBranching`.

## 8. Interakcje użytkownika

* **Użytkownik ładuje stronę `/app/conversations/[id]`:**
  * Wywoływane jest `GET .../messages`. `MessageList` pokazuje `Skeleton`. Po załadowaniu lista się wypełnia.
* **Użytkownik ładuje stronę `/app/new`:**
  * Lista wiadomości jest pusta. `Composer` jest aktywny.
* **Użytkownik wybiera model w `ModelSelector`:**
  * Stan `selectedModel` w `Composer` jest aktualizowany.
* **Użytkownik pisze w `Textarea` i klika "Wyślij" (lub `Enter`):**
  * Wywoływana jest funkcja `sendMessage` z `useMessages`.
  * `Composer` jest wyłączany (`disabled`).
  * Wiadomość użytkownika pojawia się natychmiast na liście (`type: 'message'`).
  * Pojawia się wskaźnik ładowania (`type: 'loading'`).
  * Jeśli był to nowy czat, wywoływane jest `POST /api/conversations`. Po sukcesie, następuje przekierowanie.
  * Jeśli był to istniejący czat, wywoływane jest `POST .../messages`. Po sukcesie, wskaźnik ładowania znika, a wiadomość asystenta pojawia się na liście.
  * `useAppStore` aktualizuje `lastUsedModel` (US-006).
  * `Composer` jest ponownie włączany.
* **Użytkownik klika ikonę "Branch" na wiadomości:**
  * Otwiera się `DropdownMenu`.
* **Użytkownik wybiera "Utwórz branch z pełną historią":**
  * Wywoływana jest funkcja `createBranch(msg.id, 'full')`.
  * Wyświetlany jest wskaźnik ładowania (np. toast).
  * Po sukcesie, następuje przekierowanie na nowy URL `/app/conversations/[new_id]`.
* **Występuje błąd API podczas wysyłania wiadomości:**
  * `Composer` jest ponownie włączany.
  * Wskaźnik ładowania znika.
  * Na liście wiadomości pojawia się `MessageItem` z `type: 'error'` i treścią błędu (zgodnie z US-013). Interfejs *nie* jest blokowany.

## 9. Warunki i walidacja

* **`Composer`:** Przycisk "Wyślij" jest nieaktywny, jeśli:
  1. Treść wiadomości jest pusta (`content.trim().length === 0`).
  2. Trwa wysyłanie wiadomości (`isSendingMessage === true`).
  3. Lista modeli nie została jeszcze załadowana lub wystąpił błąd.
* **`Composer`:** Cały komponent (textarea, selektor) jest w stanie `disabled` podczas `isSendingMessage`.
* **`BranchAction`:** Opcje w menu `DropdownMenu` są w stanie `disabled` podczas `isBranching`.

## 10. Obsługa błędów

* **Błąd pobierania `GET .../messages`:** `ChatPanelView` wyświetla komunikat błędu na całą stronę (np. "Nie udało się załadować konwersacji").
* **Błąd pobierania `GET /api/models`:** `ModelSelector` wyświetla błąd wewnątrz listy rozwijanej. `Composer` jest wyłączony z informacją (np. przez `Tooltip`), że nie można wysyłać wiadomości.
* **Błąd `POST .../messages` (np. błąd OpenRouter):** Zgodnie z US-013, hook `useMessages` usuwa wskaźnik ładowania i dodaje do listy `DisplayMessage` typu `error` z treścią błędu. UI pozostaje w pełni funkcjonalne.
* **Błąd `POST .../branch`:** Hook `useBranching` wyświetla globalny, nieblokujący komunikat błędu (np. `Toast` / `Sonner` z Shadcn/ui) informujący o niepowodzeniu operacji. Użytkownik pozostaje w tym samym widoku.

## 11. Kroki implementacji

1. **Konfiguracja globalnego stanu:** Stworzenie `useAppStore` (Zustand) z `lastUsedModel` (z `persist` middleware) oraz `models`, `isLoadingModels` i akcją `fetchModels` (która wywołuje `GET /api/models`).
2. **Stworzenie typów:** Zdefiniowanie typów `Model` i `DisplayMessage` w pliku `types.ts`.
3. **Implementacja komponentów `Composer`:**
   * Stworzenie komponentu `ModelSelector` (jako `Combobox` Shadcn/ui), który pobiera dane z `useAppStore`.
   * Stworzenie komponentu `TokenCounter`.
   * Stworzenie komponentu `Composer` łączącego `ModelSelector`, `Textarea` (autosize), `SendButton` i `TokenCounter`. Implementacja logiki walidacji (`disabled` states).
4. **Implementacja hooka `useTokenCounter`:** Stworzenie hooka, który przyjmuje `DisplayMessage[]` i zwraca sumę tokenów.
5. **Implementacja hooka `useMessages`:**
   * Implementacja stanu `messages`, `isLoadingInitial`, `isSendingMessage`.
   * Implementacja `fetchMessages` (dla `GET`).
   * Implementacja `sendMessage` z kluczową logiką rozróżniania `conversationId` (null vs. string) do wywoływania `POST /api/conversations` lub `POST .../messages`.
   * Implementacja logiki optymistycznej (dodanie temp usera i loading) oraz obsługi sukcesu (zastąpienie/dodanie) i błędu (dodanie `type: 'error'`).
6. **Implementacja hooka `useBranching`:**
   * Implementacja stanu `isBranching`.
   * Implementacja funkcji `createBranch` wywołującej `POST .../branch` i obsługującej nawigację (przez `router.push()`) lub błąd (przez toast).
7. **Implementacja komponentów `MessageList`:**
   * Stworzenie komponentu `BranchAction` (z `DropdownMenu` i hookiem `useBranching`).
   * Stworzenie komponentu `ModelBadge`.
   * Stworzenie komponentu `MessageItem`, który renderuje różne warianty `DisplayMessage` (message, error, loading) i używa `BranchAction` oraz `ModelBadge`.
   * Stworzenie `MessageList`, który mapuje stan `messages` z `useMessages` do `MessageItem` i obsługuje `isLoadingInitial`.
8. **Złożenie widoku `ChatPanelView`:**
   * Stworzenie komponentu, który pobiera `id` z URL.
   * Przekazanie `id` do `useMessages`.
   * Renderowanie `MessageList` i `Composer`, przekazując im stany i funkcje z hooków.
9. **Dostępność i UX:** Dodanie `aria-live` do `MessageList`, obsługa skrótów klawiaturowych w `Composer` (`Enter` / `Shift+Enter`).
10. **Testowanie:** Przetestowanie wszystkich ścieżek: ładowanie, wysyłanie (nowy czat), wysyłanie (istniejący czat), błąd wysyłania (US-013), branching (full), branching (summary).
