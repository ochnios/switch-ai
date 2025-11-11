# Plan implementacji widoku Sidebar — Conversation List

## 1. Przegląd

Widok `Sidebar - Conversation List` (Panel Boczny - Lista Konwersacji) jest kluczowym komponentem nawigacyjnym w aplikacji `switch-ai`. Jego głównym celem jest umożliwienie użytkownikowi przeglądania, przełączania, tworzenia nowych oraz usuwania istniejących konwersacji. Jest to stały element głównego layoutu aplikacji, który współdzieli stan z panelem czatu.

## 2. Routing widoku

Ten komponent nie jest samodzielną stroną, lecz częścią głównego layoutu (`/app`). Będzie renderowany jako komponent React wewnątrz pliku layoutu Astro, np. `src/layouts/AppLayout.astro`.

## 3. Struktura komponentów

Komponenty będą zbudowane w React (`.tsx`) i wykorzystywać komponenty `shadcn/ui` oraz `tailwind` do stylizacji.

```tsx
<ConversationSidebar>
    <NewConversationButton />
    <ConversationList>
        <ConversationListItem />
        <ConversationListItem />
    </ConversationList>
</ConversationSidebar>
```

***

## 4. Szczegóły komponentów

### `ConversationSidebar` (Komponent kontenerowy)

* **Opis komponentu:** Główny kontener panelu bocznego. Odpowiada za pobieranie danych, zarządzanie stanem ładowania/błędu oraz interakcję z globalnym stanem (`activeConversationId`).
* **Główne elementy:**
  * `<aside>` lub `<nav>` (dla semantyki i landmark roles).
  * Komponent `NewConversationButton`.
  * Komponent `ConversationList`.
* **Obsługiwane interakcje:** Brak bezpośrednich. Komponent zarządza logiką pobierania danych i przekazuje handlery do komponentów podrzędnych.
* **Obsługiwana walidacja:** Brak.
* **Typy:** `PaginatedConversationsDto`, `ConversationDto`.
* **Propsy:** Brak.

### `NewConversationButton`

* **Opis komponentu:** Lepki (sticky) przycisk "Nowa konwersacja" na górze panelu bocznego.
* **Główne elementy:**
  * Komponent `<Button>` z `shadcn/ui`.
* **Obsługiwane interakcje:**
  * `onClick`: Ustawia globalny `activeConversationId` na `null`.
* **Obsługiwana walidacja:** Przycisk jest wyłączony (`disabled`), jeśli `activeConversationId` jest już `null`.
* **Typy:** Brak.
* **Propsy:**
  * `activeConversationId: string | null`
  * `onNew: () => void`

### `ConversationList`

* **Opis komponentu:** Renderuje listę konwersacji lub stany ładowania/pusty.
* **Główne elementy:**
  * `<ul>` lub `<div>` z rolą `list`.
  * Komponenty `<Skeleton>` z `shadcn/ui` (podczas ładowania).
  * Komunikat o błędzie lub pustym stanie.
  * Lista komponentów `ConversationListItem` (mapowanie danych).
* **Obsługiwane interakcje:** Brak. Przekazuje handlery `onSelect` i `onDelete` w dół.
* **Obsługiwana walidacja:** Brak.
* **Typy:** `ConversationDto`.
* **Propsy:**
  * `conversations: ConversationDto[]`
  * `activeConversationId: string | null`
  * `onSelect: (id: string) => void`
  * `onDelete: (id: string) => void`
  * `isLoading: boolean`
  * `isError: boolean`

### `ConversationListItem`

* **Opis komponentu:** Pojedynczy element na liście konwersacji. Zarządza własnym, dwuetapowym stanem potwierdzenia usunięcia.
* **Główne elementy:**
  * `<Button variant="ghost">` (jako główny klikalny element do wyboru).
  * `<div>` zawierający tytuł (`conversation.title`) i sformatowaną datę (`conversation.created_at`).
  * `<Button variant="ghost" size="icon">` (przycisk usuwania/potwierdzania).
* **Obsługiwane interakcje:**
  * `onClick` (na głównym elemencie): Wywołuje `onSelect(conversation.id)` i resetuje stan potwierdzenia usunięcia.
  * `onClick` (na przycisku usuwania):
    * Jeśli `!isConfirmingDelete`: Zatrzymuje propagację zdarzenia, ustawia stan `isConfirmingDelete(true)`.
    * Jeśli `isConfirmingDelete`: Zatrzymuje propagację zdarzenia, wywołuje `onDelete(conversation.id)`.
  * `onBlur` (na przycisku usuwania): Ustawia `isConfirmingDelete(false)`, aby anulować akcję.
* **Obsługiwana walidacja:** Brak.
* **Typy:** `ConversationDto`.
* **Propsy:**
  * `conversation: ConversationDto`
  * `isActive: boolean`
  * `onSelect: (id: string) => void`
  * `onDelete: (id: string) => void`

***

## 5. Typy

Będziemy korzystać głównie z DTO zdefiniowanych w `type_definitions` oraz wprowadzimy jeden typ dla globalnego stanu.

* **`ConversationDto`** (z `type_definitions`)
  ```typescript
  type ConversationDto = {
    id: string;
    title: string;
    parent_conversation_id: string | null;
    created_at: string; // ISO string
  };
  ```
* **`PaginatedConversationsDto`** (z `type_definitions`)
  ```typescript
  interface PaginatedConversationsDto {
    data: ConversationDto[];
    pagination: PaginationDto;
  }
  ```
* **`ConversationStoreState`** (ViewModel dla globalnego stanu Zustand)
  ```typescript
  interface ConversationStoreState {
    activeConversationId: string | null;
    setActiveConversation: (id: string | null) => void;
  }
  ```

***

## 6. Zarządzanie stanem

Stan będzie zarządzany przy użyciu kombinacji **Zustand** (dla globalnego stanu UI) i **Tanstack Query** (React Query) (dla stanu serwera).

### Globalny stan (Zustand)

Stworzymy `src/stores/useConversationStore.ts`:

* **Stan:** `activeConversationId: string | null`
  * Przechowuje ID aktualnie wybranej konwersacji.
  * `null` oznacza, że aktywny jest tryb "Nowej konwersacji".
* **Akcja:** `setActiveConversation: (id: string | null) => void`
  * Ustawia aktywne ID. Komponent `ConversationSidebar` będzie wywoływał tę akcję.
  * Komponent `ChatPanel` (poza zakresem tego planu) będzie nasłuchiwał zmian tego stanu, aby pobrać odpowiednie wiadomości.

### Stan serwera (Tanstack Query)

Stworzymy customowe hooki do zarządzania cyklem życia danych API.

* **`useGetConversations`**:

  * Hook oparty na `useQuery`.
  * `queryKey: ['conversations', { page: 1, pageSize: 50 }]`
  * `queryFn`: Wywołuje `GET /api/conversations?page=1&pageSize=50`.
  * Zapewnia `data`, `isLoading`, `isError`, `error`, `refetch`.
  * Używany w `ConversationSidebar` do pobrania listy.

* **`useDeleteConversation`**:

  * Hook oparty na `useMutation`.
  * `mutationFn: (id: string) => fetch('/api/conversations/' + id, { method: 'DELETE' })`
  * `onSuccess`:
    1. Unieważnia zapytanie `['conversations']` (używając `queryClient.invalidateQueries`), aby automatycznie odświeżyć listę.
    2. Sprawdza, czy usunięte ID było aktywne (`deletedId === store.activeConversationId`). Jeśli tak, wywołuje `store.setActiveConversation(null)`, aby wyczyścić panel czatu.
  * `onError`: Wyświetla powiadomienie toast (np. "Nie udało się usunąć konwersacji").
  * Używany w `ConversationSidebar` i przekazywany jako `onDelete` do `ConversationListItem`.

***

## 7. Integracja API

Ten widok będzie integrował się z dwoma endpointami:

1. **Pobieranie listy konwersacji**

   * **Endpoint:** `GET /api/conversations`
   * **Użycie:** Wywoływany przy montowaniu komponentu `ConversationSidebar` przez hook `useGetConversations`.
   * **Parametry zapytania:** `page=1`, `pageSize=50` (zgodnie z `view_description`).
   * **Typ odpowiedzi (Sukces):** `PaginatedConversationsDto`
   * **Typ odpowiedzi (Błąd):** `ErrorResponseDto`

2. **Usuwanie konwersacji**

   * **Endpoint:** `DELETE /api/conversations/{id}`
   * **Użycie:** Wywoływany przez hook `useDeleteConversation` po drugim kliknięciu przycisku usuwania w `ConversationListItem`.
   * **Parametry zapytania:** `id` (z `ConversationDto.id`) jako parametr ścieżki.
   * **Typ odpowiedzi (Sukces):** `204 No Content`
   * **Typ odpowiedzi (Błąd):** `ErrorResponseDto`

**Uwaga:** `POST /api/conversations` nie jest wywoływany przez ten widok. Kliknięcie "Nowa konwersacja" jedynie zmienia stan globalny. Panel czatu (`ChatPanel`) będzie odpowiedzialny za wykrycie `activeConversationId === null` i wykonanie `POST` przy wysyłaniu pierwszej wiadomości.

***

## 8. Interakcje użytkownika

* **Ładowanie widoku:** Użytkownik widzi szkielety (`Skeleton`) w miejscu listy podczas pobierania danych.
* **Przeglądanie listy:** Użytkownik widzi listę konwersacji posortowaną od najnowszej. Aktualnie wybrana (aktywna) konwersacja jest podświetlona (`aria-selected="true"`).
* **Rozpoczęcie nowej konwersacji (US-007):**
  1. Użytkownik klika przycisk "Nowa konwersacja".
  2. Wywoływana jest akcja `setActiveConversation(null)`.
  3. Przycisk "Nowa konwersacja" staje się nieaktywny (`disabled`).
  4. Aktywne podświetlenie znika ze wszystkich elementów listy.
  5. Panel czatu (nasłuchujący stanu) czyści swój widok, gotowy na nową wiadomość.
* **Przełączanie konwersacji (US-008):**
  1. Użytkownik klika na element `ConversationListItem`.
  2. Wywoływana jest akcja `onSelect(id)`, która ustawia `setActiveConversation(id)`.
  3. Kliknięty element zostaje podświetlony jako aktywny.
  4. Panel czatu (nasłuchujący stanu) pobiera i wyświetla wiadomości dla `id`.
* **Usuwanie konwersacji (US-009, zmodyfikowane):**
  1. Użytkownik klika ikonę `Trash2` na elemencie listy.
  2. Zdarzenie `onClick` jest zatrzymywane (`stopPropagation`). Wewnętrzny stan `isConfirmingDelete` w `ConversationListItem` ustawia się na `true`.
  3. Ikona zmienia się na `Check` (potwierdzenie), a przycisk zmienia kolor na czerwony.
  4. **Scenariusz A (Potwierdzenie):** Użytkownik klika ikonę `Check`.
     * Wywoływana jest mutacja `useDeleteConversation.mutate(id)`.
     * Po pomyślnym usunięciu, `onSuccess` odświeża listę (element znika) i ewentualnie czyści panel czatu.
  5. **Scenariusz B (Anulowanie przez kliknięcie obok):** Użytkownik usuwa fokus z przycisku (np. `onBlur`).
     * Stan `isConfirmingDelete` wraca na `false`. Ikona wraca do `Trash2`.
  6. **Scenariusz C (Anulowanie przez wybranie):** Użytkownik klika na główny obszar tego samego `ConversationListItem`.
     * Wywoływane jest `onSelect(id)`. Handler ten *również* resetuje stan `isConfirmingDelete` do `false`.

***

## 9. Warunki i walidacja

* **Warunek:** Użytkownik musi być uwierzytelniony, aby zobaczyć ten widok.
  * **Obsługa:** Zarządzane przez routing na poziomie layoutu (`/app`). Jeśli `useGetConversations` zwróci `401 Unauthorized`, hook `useQuery` przejdzie w stan `isError`, a obsługa błędów (patrz niżej) wyświetli odpowiedni komunikat.
* **Warunek:** Przycisk "Nowa konwersacja" jest nieaktywny, gdy nowa konwersacja jest już "aktywna".
  * **Obsługa:** Komponent `NewConversationButton` otrzymuje prop `activeConversationId` i ustawia `disabled={activeConversationId === null}`.

***

## 10. Obsługa błędów

* **Błąd pobierania listy (`GET /api/conversations`):**
  * Hook `useGetConversations` ustawi `isError: true` i przekaże obiekt `error`.
  * Komponent `ConversationList` wykryje `isError` i zamiast listy lub szkieletów wyświetli komunikat o błędzie, np. "Nie można załadować konwersacji." oraz przycisk "Spróbuj ponownie" (wywołujący `refetch` z `useQuery`).
* **Błąd usuwania (`DELETE /api/conversations/{id}`):**
  * Hook `useDeleteConversation` wywoła callback `onError`.
  * Wyświetlimy globalne powiadomienie (toast, np. z `shadcn/ui/use-toast`) z komunikatem "Wystąpił błąd podczas usuwania konwersacji."
  * Stan `isConfirmingDelete` w `ConversationListItem` zostanie zresetowany do `false`.
* **Pusta lista:**
  * Jeśli `!isLoading && !isError && conversations.length === 0`, komponent `ConversationList` wyświetli komunikat, np. "Nie masz jeszcze żadnych konwersacji. Zacznij nową!".

***

## 11. Kroki implementacji

1. **Konfiguracja stanu:** Stwórz store Zustand `src/stores/useConversationStore.ts` z `activeConversationId` i `setActiveConversation`.
2. **Konfiguracja API:** Stwórz hooki `useGetConversations` i `useDeleteConversation` (np. w `src/hooks/api/useConversations.ts`) używając `tanstack/query`. Skonfiguruj `queryClient` w głównym pliku aplikacji.
3. **Komponenty szkieletowe:** Stwórz komponenty `ConversationSidebar`, `NewConversationButton`, `ConversationList` i `ConversationListItem` z podstawową strukturą HTML (używając `shadcn/ui` `Button`, `Skeleton` itp.) i statycznymi danymi.
4. **Pobieranie danych:** Zintegruj `useGetConversations` w `ConversationSidebar`. Przekaż `data`, `isLoading`, `isError` do `ConversationList`. Zaimplementuj logikę renderowania dla stanów ładowania, błędu i pustej listy.
5. **Logika "Nowa konwersacja":**
   * Pobierz `activeConversationId` i `setActiveConversation` ze store'u Zustand w `ConversationSidebar`.
   * Przekaż je jako propsy do `NewConversationButton`.
   * Zaimplementuj logikę `onClick` i `disabled` w `NewConversationButton`.
6. **Logika wyboru konwersacji:**
   * Przekaż `activeConversationId` i `setActiveConversation` (jako `onSelect`) w dół do `ConversationList` -> `ConversationListItem`.
   * W `ConversationListItem` zaimplementuj `onClick` na głównym elemencie, aby wywołać `onSelect`.
   * Dodaj dynamiczne style (np. `data-[active=true]:...`) i `aria-selected` na podstawie propa `isActive`.
7. **Logika usuwania (dwa etapy):**
   * Zintegruj `useDeleteConversation` w `ConversationSidebar` i przekaż `mutate` jako prop `onDelete`.
   * W `ConversationListItem` dodaj lokalny stan `useState<boolean>(false)` dla `isConfirmingDelete`.
   * Zaimplementuj logikę przycisku usuwania (ikona `Trash2`), który przy `onClick` zatrzymuje propagację i ustawia `isConfirmingDelete(true)`.
   * Dodaj logikę `onBlur` na przycisku, aby resetować stan.
   * Zmień renderowanie przycisku, aby po `isConfirmingDelete(true)` pokazywał ikonę `Check` i miał czerwoną wariację. Kliknięcie go powinno wywołać `onDelete(id)`.
   * Upewnij się, że `onSuccess` mutacji w `useDeleteConversation` unieważnia zapytanie listy i resetuje `activeConversationId`, jeśli to konieczne.
8. **Stylowanie i A11y:** Dopracuj stylowanie za pomocą Tailwind, upewnij się, że nawigacja klawiaturą (klawisze strzałek) działa poprawnie na liście (może wymagać `react-aria` lub ręcznej obsługi `onKeyDown`) oraz że wszystkie atrybuty `aria` są poprawnie ustawione.
