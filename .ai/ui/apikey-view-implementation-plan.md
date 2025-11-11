# Plan implementacji widoku Ustawienia / Klucz API

## 1. Przegląd

Celem tego widoku jest umożliwienie zalogowanemu użytkownikowi zarządzania jego własnym kluczem API OpenRouter (model BYOK - Bring Your Own Key). Widok ten będzie renderowany jako modal w ramach głównej aplikacji. Zapewni on funkcjonalność dodawania (zapisywania), usuwania oraz sprawdzania statusu (czy klucz istnieje) klucza API. Ze względów bezpieczeństwa, klucz API **nigdy** nie będzie pobierany ani wyświetlany w interfejsie użytkownika po jego zapisaniu.

## 2. Routing widoku

Widok będzie dostępny jako komponent modalny, prawdopodobnie wyzwalany z linku "Ustawienia" w nawigacji aplikacji. Ścieżka URL `/app/settings` może być użyta do głębokiego linkowania, które automatycznie otwiera modal. Komponent modalny będzie renderowany na tle aktualnie aktywnego widoku (np. widoku czatu).

## 3. Struktura komponentów

Komponenty będą oparte na bibliotece **Shadcn/ui** i **React**.

```text

/app/settings (strona Astro)
└── SettingsModal (React, client:visible)
├── Dialog (Shadcn)
│   ├── DialogTrigger (przycisk "Ustawienia" w UI)
│   ├── DialogContent
│   │   ├── DialogHeader
│   │   │   ├── DialogTitle ("Zarządzanie kluczem API")
│   │   │   └── DialogDescription ("Wprowadź swój klucz OpenRouter...")
│   │   ├── ApiKeyStatusBadge (komponent Badge pokazujący status)
│   │   ├── ApiKeyForm (formularz z logiką)
│   │   │   ├── Input (type="password" na klucz API)
│   │   │   ├── p (dla błędów walidacji klienta)
│   │   │   ├── Button (type="submit", "Zapisz")
│   │   │   └── Button (variant="destructive", "Usuń klucz")
│   │   ├── SecurityInfo (wyjaśnienie dot. bezpieczeństwa)
│   │   ├── Alert (Shadcn, do wyświetlania błędów API)
│   │   └── DialogFooter
│   │       └── Button (variant="outline", "Zamknij")
│   ├── [Opcjonalnie] AlertDialog (Shadcn, do potwierdzenia usunięcia)

```

## 4. Szczegóły komponentów

### SettingsModal

* **Opis komponentu**: Główny komponent-kontener. Będzie używał `Dialog` z Shadcn/ui. Będzie odpowiedzialny za zarządzanie ogólnym stanem (otwarcie/zamknięcie) oraz za inicjowanie pobrania statusu klucza API przy otwarciu.
* **Główne elementy**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`.
* **Obsługiwane interakcje**: Otwieranie i zamykanie modala.
* **Obsługiwana walidacja**: Brak.
* **Typy**: `ApiKeyStatusViewModel`.
* **Propsy**: Brak (będzie prawdopodobnie renderowany przez `Layout` lub stronę Astro).

### ApiKeyStatusBadge

* **Opis komponentu**: Mały komponent `Badge` (Shadcn/ui), który wizualnie informuje użytkownika o aktualnym stanie jego klucza API.
* **Główne elementy**: `Badge`.
* **Obsługiwane interakcje**: Brak (tylko wyświetlanie).
* **Obsługiwana walidacja**: Brak.
* **Typy**: `ApiKeyStatusViewModel`.
* **Propsy**:
  * `status: ApiKeyStatusViewModel` - aktualny stan do wyświetlenia.

### ApiKeyForm

* **Opis komponentu**: Sercem modala jest formularz (np. zarządzany przez `react-hook-form` i `zod`) do wprowadzania i zapisywania klucza. Zawiera również przycisk do usunięcia klucza.
* **Główne elementy**: `<form>`, `Input`, `Button`.
* **Obsługiwane interakcje**:
  * `onChange` na `Input`: aktualizacja stanu formularza.
  * `onSubmit` na `<form>`: wyzwolenie walidacji i wysłanie żądania `PUT`.
  * `onClick` na przycisku "Usuń klucz": wyzwolenie żądania `DELETE`.
* **Obsługiwana walidacja**: Walidacja po stronie klienta (zgodna z backendem):
  * Klucz jest wymagany (nie może być pusty).
  * Klucz musi zaczynać się od prefiksu `sk-or-`.
* **Typy**: `UpsertApiKeyCommand`, `ErrorResponseDto`.
* **Propsy**:
  * `currentStatus: ApiKeyStatusViewModel` - do decydowania o logice (np. czy pokazać przycisk "Usuń").
  * `onSave: (data: UpsertApiKeyCommand) => Promise<void>` - funkcja do zapisu.
  * `onDelete: () => Promise<void>` - funkcja do usunięcia.
  * `isSaving: boolean` - do pokazywania stanu ładowania na przycisku "Zapisz".
  * `isDeleting: boolean` - do pokazywania stanu ładowania na przycisku "Usuń".

### SecurityInfo

* **Opis komponentu**: Statyczny komponent tekstowy (np. `<p>`) z ikoną `Info`. Wyjaśnia użytkownikowi, dlaczego jego klucz nie jest widoczny i że jest bezpiecznie szyfrowany na serwerze.
* **Główne elementy**: `<p>`, ikona (np. z `lucide-react`).
* **Obsługiwane interakcje**: Brak.
* **Obsługiwana walidacja**: Brak.
* **Typy**: Brak.
* **Propsy**: Brak.

## 5. Typy

Będziemy korzystać z istniejących typów DTO, ale dodamy typy ViewModel do zarządzania stanem UI.

* **DTO (z `src/types`)**:
  * `ApiKeyExistsDto`: `{ exists: boolean }`
  * `UpsertApiKeyCommand`: `{ apiKey: string }`
  * `SuccessResponseDto`: `{ success: boolean, message: string }`
  * `ErrorResponseDto`: `{ statusCode: number, message: string, errors?: ErrorFieldDto[] }`

* **Nowe typy ViewModel (lokalne dla komponentu)**:
  * `type ApiKeyStatusViewModel = 'loading' | 'exists' | 'not_exists' | 'error';`
    * `loading`: Stan początkowy podczas sprawdzania `GET /api/api-key`.
    * `exists`: `GET` zwrócił `{ exists: true }`.
    * `not_exists`: `GET` zwrócił `{ exists: false }`.
    * `error`: Wystąpił błąd podczas sprawdzania `GET`.
  * `type FormStatus = 'idle' | 'saving' | 'deleting';`
    * `idle`: Oczekiwanie na akcję użytkownika.
    * `saving`: Trwa żądanie `PUT`.
    * `deleting`: Trwa żądanie `DELETE`.

## 6. Zarządzanie stanem

Zalecane jest stworzenie niestandardowego hooka `useApiKeyManager`, który zamknie całą logikę.

### `useApiKeyManager`

* **Cel**: Enkapsulacja logiki pobierania statusu, zapisywania klucza, usuwania klucza, obsługi stanu ładowania i błędów.
* **Zarządzany stan**:
  * `keyStatus (ApiKeyStatusViewModel)`: Stan istnienia klucza (domyślnie `'loading'`).
  * `formStatus (FormStatus)`: Stan operacji formularza (domyślnie `'idle'`).
  * `apiError (ErrorResponseDto | null)`: Przechowuje ostatni błąd z API (domyślnie `null`).
* **Funkcje**:
  * `checkKeyStatus()`: Wywoływana przy montowaniu komponentu (lub otwarciu modala). Wykonuje `GET /api/api-key` i ustawia `keyStatus` na `'exists'` lub `'not_exists'`, lub `'error'` w przypadku niepowodzenia.
  * `saveKey(data: UpsertApiKeyCommand)`: Ustawia `formStatus` na `'saving'`. Wykonuje `PUT /api/api-key`. W przypadku sukcesu ustawia `keyStatus` na `'exists'`, `formStatus` na `'idle'` i czyści `apiError`. W przypadku błędu ustawia `formStatus` na `'idle'` i wypełnia `apiError`.
  * `deleteKey()`: Ustawia `formStatus` na `'deleting'`. Wykonuje `DELETE /api/api-key`. W przypadku sukcesu ustawia `keyStatus` na `'not_exists'`, `formStatus` na `'idle'` i czyści `apiError`. W przypadku błędu ustawia `formStatus` na `'idle'` i wypełnia `apiError`.
  * `clearApiError()`: Ustawia `apiError` na `null`.

## 7. Integracja API

Komponent będzie komunikował się z trzema endpointami `/api/api-key` za pomocą `fetch` lub klienta (np. `ky`).

1. **Sprawdzanie statusu (On Mount / On Open)**
   * **Metoda**: `GET`
   * **Endpoint**: `/api/api-key`
   * **Żądanie**: Brak ciała.
   * **Odpowiedź (Sukces 200)**: `ApiKeyExistsDto` (`{ exists: boolean }`)
   * **Akcja**: Aktualizuje stan `keyStatus` w hooku.

2. **Zapisywanie klucza (On Form Submit)**
   * **Metoda**: `PUT`
   * **Endpoint**: `/api/api-key`
   * **Żądanie**: `UpsertApiKeyCommand` (`{ apiKey: "sk-or-..." }`)
   * **Odpowiedź (Sukces 200)**: `SuccessResponseDto` (`{ success: true, ... }`)
   * **Akcja**: Aktualizuje `keyStatus` na `'exists'`, resetuje formularz (czyści pole inputa), pokazuje powiadomienie o sukcesie.

3. **Usuwanie klucza (On Delete Click)**
   * **Metoda**: `DELETE`
   * **Endpoint**: `/api/api-key`
   * **Żądanie**: Brak ciała.
   * **Odpowiedź (Sukces 204)**: Brak ciała.
   * **Akcja**: Aktualizuje `keyStatus` na `'not_exists'`, pokazuje powiadomienie o sukcesie.

## 8. Interakcje użytkownika

* **Użytkownik otwiera modal**:
  1. Modal się pojawia.
  2. Wywoływane jest żądanie `GET /api/api-key`.
  3. Wyświetlany jest stan ładowania (np. `Spinner`).
  4. Po odpowiedzi, `ApiKeyStatusBadge` pokazuje "Klucz zapisany" (zielony) lub "Brak klucza" (żółty/czerwony).
* **Użytkownik wprowadza klucz i klika "Zapisz"**:
  1. Uruchamiana jest walidacja klienta.
  2. Jeśli walidacja nie powiedzie się, wyświetlany jest błąd pod polem `Input`, a przycisk "Zapisz" jest nieaktywny.
  3. Jeśli walidacja przejdzie, przycisk "Zapisz" pokazuje stan ładowania (`Spinner`).
  4. Wywoływane jest żądanie `PUT`.
  5. Po sukcesie: pole `Input` jest czyszczone, `ApiKeyStatusBadge` aktualizuje się na "Klucz zapisany", wyświetlany jest komunikat o sukcesie (np. Toast).
  6. Po błędzie: `Alert` wyświetla komunikat błędu z `ErrorResponseDto`.
* **Użytkownik klika "Usuń klucz"**:
  1. (Zalecane) Wyświetlany jest `AlertDialog` z prośbą o potwierdzenie.
  2. Jeśli użytkownik potwierdzi, przycisk "Usuń klucz" pokazuje stan ładowania.
  3. Wywoływane jest żądanie `DELETE`.
  4. Po sukcesie: `ApiKeyStatusBadge` aktualizuje się na "Brak klucza", wyświetlany jest komunikat o sukcesie.
  5. Po błędzie: `Alert` wyświetla komunikat błędu.

## 9. Warunki i walidacja

* **Przycisk "Zapisz"**: Powinien być `disabled`, jeśli:
  1. Pole `Input` jest puste.
  2. Wartość w polu `Input` nie zaczyna się od `sk-or-`.
  3. Trwa jakakolwiek operacja API (`formStatus !== 'idle'` lub `keyStatus === 'loading'`).
* **Przycisk "Usuń klucz"**: Powinien być `disabled`, jeśli:
  1. `keyStatus` to `'not_exists'` lub `'loading'`.
  2. Trwa jakakolwiek operacja API (`formStatus !== 'idle'`).
* **Pole `Input`**:
  1. Musi mieć atrybut `type="password"`, aby zamaskować wpisywaną wartość (AC-03 z US-003).
  2. Walidacja `onChange` lub `onBlur` powinna pokazywać błędy (wymagane, format `sk-or-`) bezpośrednio pod polem.

## 10. Obsługa błędów

* **Błąd `GET` (500)**: Wyświetl `Alert` z komunikatem "Nie udało się pobrać statusu klucza API. Spróbuj odświeżyć." Ustaw `keyStatus` na `'error'`, co powinno zablokować formularz.
* **Błąd `PUT` (400 Bad Request)**: Wyświetl `Alert` z treścią błędu z `ErrorResponseDto` (np. "Nieprawidłowy format klucza API."). Błąd ten powinien być rzadki, jeśli walidacja klienta działa poprawnie.
* **Błąd `PUT` / `DELETE` (500 Internal Server Error)**: Wyświetl `Alert` z komunikatem "Wystąpił błąd serwera. Spróbuj ponownie później."
* **Błąd sieci (Offline)**: Błąd `fetch` powinien zostać przechwycony i wyświetlony w `Alert` jako "Brak połączenia z internetem."

## 11. Kroki implementacji

1. **Utworzenie komponentów (layout)**: Stwórz pliki dla `SettingsModal.tsx`, `ApiKeyForm.tsx` i `ApiKeyStatusBadge.tsx`. Zbuduj statyczną strukturę UI używając komponentów Shadcn/ui (`Dialog`, `Input`, `Button`, `Badge`, `Alert`).
2. **Implementacja `useApiKeyManager`**: Stwórz hook `useApiKeyManager.ts`. Zaimplementuj w nim logikę stanu (`keyStatus`, `formStatus`, `apiError`).
3. **Integracja `GET`**: W `useApiKeyManager`, zaimplementuj funkcję `checkKeyStatus` wywoływaną w `useEffect` (przy montowaniu). Podłącz stan `keyStatus` do `SettingsModal`, aby warunkowo renderować `ApiKeyStatusBadge` i `Spinner`.
4. **Implementacja formularza**: W `ApiKeyForm`, użyj `react-hook-form` wraz z `zod` do walidacji (`z.string().startsWith("sk-or-", "Klucz musi zaczynać się od 'sk-or-'")`).
5. **Integracja `PUT`**: Podłącz `onSubmit` formularza do funkcji `saveKey` z hooka `useApiKeyManager`. Upewnij się, że pole `Input` jest czyszczone po sukcesie (np. przez `reset` z `react-hook-form`).
6. **Integracja `DELETE`**: Podłącz przycisk "Usuń klucz" do funkcji `deleteKey` z hooka. Dodaj komponent `AlertDialog` (Shadcn/ui) jako potwierdzenie przed wywołaniem `deleteKey`.
7. **Obsługa stanów ładowania**: Użyj stanu `formStatus` do dezaktywowania przycisków i pokazywania na nich komponentu `Loader2` (z `lucide-react`) podczas operacji API.
8. **Obsługa błędów**: Przekaż stan `apiError` z hooka do `SettingsModal` i renderuj komponent `Alert` (Shadcn/ui), jeśli `apiError` nie jest `null`. Dodaj przycisk "X" do alertu, aby wywołać `clearApiError`.
9. **Dopracowanie UX**: Dodaj komponent `SecurityInfo` z wyjaśnieniem. Upewnij się, że wszystkie stany (ładowanie, sukces, błąd, bez klucza, z kluczem) są czytelne i klarowne dla użytkownika.
10. **Testowanie**: Przetestuj wszystkie scenariusze: ładowanie, dodawanie (sukces/błąd), usuwanie (sukces/błąd), walidacja klienta.
