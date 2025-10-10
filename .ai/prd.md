# Dokument wymagań produktu (PRD) - switch-ai (MVP)

## 1. Przegląd produktu

switch-ai to aplikacja czatu zaprojektowana dla zaawansowanych użytkowników modeli językowych (LLM), którzy wymagają większej elastyczności i kontroli nad swoimi konwersacjami. W wersji MVP (Minimum Viable Product) aplikacja skupia się na rozwiązaniu dwóch kluczowych problemów: braku możliwości płynnego przełączania się między różnymi modelami AI w ramach jednej rozmowy oraz trudności w eksplorowaniu alternatywnych wątków bez utraty kontekstu.

Produkt oferuje pojedynczy, płynny interfejs umożliwiający wybór modelu AI dla każdej wysyłanej wiadomości oraz tworzenie nowych, niezależnych wątków konwersacji (branching) na podstawie pełnej historii lub automatycznie generowanego podsumowania. Aplikacja jest skierowana do "power userów", działa w modelu BYOK (Bring Your Own Key) z integracją z OpenRouter i priorytetyzuje funkcjonalność oraz wydajność przepływu pracy.

## 2. Problem użytkownika

Użytkownicy standardowych interfejsów czatowych z LLM napotykają dwa fundamentalne ograniczenia, które hamują ich produktywność i kreatywność:

1. Brak elastyczności w doborze modeli: Różne modele AI specjalizują się w różnych zadaniach (np. kreatywne pisanie, analiza kodu, rozumowanie logiczne). Użytkownicy, aby skorzystać z tych specjalizacji, są zmuszeni do pracy w wielu oknach przeglądarki, ręcznego kopiowania i wklejania kontekstu konwersacji, co jest czasochłonne, niewygodne i prowadzi do fragmentacji pracy.
2. Liniowość konwersacji: Obecne interfejsy narzucają liniowy przebieg rozmowy. Eksplorowanie alternatywnych pomysłów, zadawanie pytań pobocznych lub testowanie różnych scenariuszy w ramach tego samego kontekstu jest trudne. Użytkownik musi albo "zaśmiecać" główny wątek, co prowadzi do chaosu, albo rozpoczynać nową konwersację od zera, tracąc całą dotychczasową historię.

switch-ai adresuje te problemy, tworząc zintegrowane środowisko do dynamicznego i kontekstowego zarządzania interakcjami z wieloma modelami AI.

## 3. Wymagania funkcjonalne

* FR-01: Autentykacja użytkownika: System umożliwi użytkownikom tworzenie konta i logowanie się w celu przechowywania i dostępu do historii konwersacji.
* FR-02: Zarządzanie kluczem API (BYOK): Użytkownicy muszą mieć możliwość bezpiecznego wprowadzenia i zapisania własnego klucza API OpenRouter. Klucz musi być przechowywany w sposób szyfrowany po stronie serwera i nigdy nie być eksponowany po stronie klienta.
* FR-03: Interfejs czatu: Aplikacja zapewni prosty i czytelny interfejs do prowadzenia konwersacji tekstowych z modelami AI.
* FR-04: Przełączanie modeli per-wiadomość: Przy każdym polu do wprowadzania wiadomości użytkownik będzie miał możliwość wyboru modelu AI z listy. Lista będzie zawierać najpopularniejsze modele z OpenRouter oraz funkcję wyszukiwania.
* FR-05: Zarządzanie konwersacjami: Użytkownicy będą mieli dostęp do listy swoich historycznych konwersacji. Aplikacja umożliwi tworzenie nowej konwersacji, przełączanie się między istniejącymi oraz ich trwałe usuwanie.
* FR-06: Rozgałęzianie konwersacji (Branching): Każda wiadomość (zarówno użytkownika, jak i asystenta) w konwersacji będzie posiadała opcję stworzenia nowej, niezależnej konwersacji w dwóch trybach:
  * FR-06a: Pełna historia: Nowa konwersacja jest tworzona jako dokładna kopia całej dotychczasowej historii.
  * FR-06b: Wątek sumaryczny: Aplikacja automatycznie generuje podsumowanie dotychczasowej konwersacji, które staje się pierwszą wiadomością systemową w nowym wątku.
* FR-07: Automatyczne nazywanie konwersacji: Nowo utworzone konwersacje będą automatycznie otrzymywać tytuł (2-4 słowa) na podstawie treści pierwszej wiadomości. Konwersacje utworzone przez rozgałęzienie będą nazywane według schematu `[Tytuł konwersacji-matki] - gałąź X`.
* FR-08: Licznik tokenów: W interfejsie użytkownika będzie widoczny szacunkowy licznik tokenów dla bieżącej konwersacji, aktualizowany po każdej nowej wiadomości.
* FR-09: Zapamiętywanie ostatniego modelu: Aplikacja zapamięta w przeglądarce ostatnio używany model AI i ustawi go jako domyślny dla kolejnej wiadomości lub nowej konwersacji.
* FR-10: Obsługa błędów API: Błędy zwrócone przez API OpenRouter będą wyświetlane jako wiadomość w oknie czatu, nie blokując interfejsu i pozwalając użytkownikowi na kontynuację pracy.

## 4. Granice produktu

### Co wchodzi w zakres MVP:

* Prosta autentykacja użytkownika (email/hasło).
* Interfejs czatu z wyborem modelu per wiadomość i listą konwersacji.
* Integracja wyłącznie z modelami dostępnymi przez OpenRouter.
* Funkcja rozgałęziania konwersacji (pełna historia i podsumowanie).
* Automatyczne nazywanie konwersacji.
* Wyświetlanie licznika tokenów.
* Trwałe usuwanie konwersacji.

### Co jest poza zakresem MVP:

* Złożona wizualizacja konwersacji w formie drzewa.
* Możliwość dołączania plików (obrazów, dokumentów, audio).
* Strumieniowanie odpowiedzi asystenta (response streaming).
* Integracja z wyszukiwaniem w internecie.
* Udostępnianie i eksportowanie konwersacji.
* Obsługa wielu konwersacji jednocześnie w jednym widoku (np. w kartach).
* Automatyczne skracanie kontekstu konwersacji.

## 5. Historyjki użytkowników

### Autentykacja i Konfiguracja

#### ID: US-001

Tytuł: Rejestracja nowego użytkownika
Opis: Jako nowy użytkownik, chcę móc utworzyć konto za pomocą adresu e-mail i hasła, aby móc zapisywać historię moich konwersacji.
Kryteria akceptacji:

1. Formularz rejestracji zawiera pola na adres e-mail i hasło.
2. System waliduje poprawność formatu adresu e-mail.
3. Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany do głównego widoku aplikacji.
4. W przypadku nieudanej rejestracji (np. zajęty e-mail) wyświetlany jest czytelny komunikat o błędzie.

#### ID: US-002

Tytuł: Logowanie do aplikacji
Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na swoje konto, aby uzyskać dostęp do moich zapisanych konwersacji.
Kryteria akceptacji:

1. Formularz logowania zawiera pola na adres e-mail i hasło.
2. Po pomyślnym zalogowaniu jestem przekierowany do widoku ostatniej aktywnej konwersacji lub nowej, pustej konwersacji.
3. W przypadku podania błędnych danych logowania wyświetlany jest odpowiedni komunikat.

#### ID: US-003

Tytuł: Zarządzanie kluczem API
Opis: Jako zalogowany użytkownik, chcę móc wprowadzić i zapisać mój klucz API do OpenRouter, aby aplikacja mogła wykonywać zapytania do modeli AI w moim imieniu.
Kryteria akceptacji:

1. W ustawieniach konta znajduje się pole do wprowadzenia klucza API.
2. Po zapisaniu klucz API jest przechowywany na serwerze w formie zaszyfrowanej.
3. Klucz API nie jest nigdy widoczny w kodzie front-endowym.
4. Jeśli klucz API jest nieprawidłowy, przy pierwszej próbie użycia go w czacie pojawia się komunikat o błędzie (zgodnie z US-015).

### Podstawowa Interakcja z Czatrem

#### ID: US-004

Tytuł: Wysyłanie wiadomości i otrzymywanie odpowiedzi
Opis: Jako użytkownik, chcę móc wpisać wiadomość w polu tekstowym i wysłać ją, aby otrzymać odpowiedź od domyślnie wybranego modelu AI.
Kryteria akceptacji:

1. W interfejsie czatu widoczne jest pole do wprowadzania tekstu i przycisk "Wyślij".
2. Po wysłaniu wiadomości, pojawia się ona w oknie konwersacji.
3. Odpowiedź od modelu AI pojawia się pod wiadomością użytkownika.
4. Pierwsza wiadomość w nowej konwersacji definiuje jej automatycznie wygenerowany tytuł.

#### ID: US-005

Tytuł: Wybór modelu AI dla konkretnej wiadomości
Opis: Jako użytkownik, chcę móc wybrać konkretny model AI z listy rozwijanej przed wysłaniem wiadomości, aby wykorzystać jego specjalistyczne zdolności.
Kryteria akceptacji:

1. Obok pola do wprowadzania tekstu znajduje się element UI (np. lista rozwijana) z listą dostępnych modeli.
2. Lista zawiera popularne modele i pole wyszukiwania do filtrowania listy.
3. Wybrany model jest używany do przetworzenia tylko tej jednej, nadchodzącej wiadomości.
4. Wybór modelu dla jednej wiadomości nie zmienia domyślnego modelu dla kolejnych zapytań, chyba że był to pierwszy wybór (zgodnie z US-006).

#### ID: US-006

Tytuł: Zapamiętywanie ostatnio używanego modelu
Opis: Jako użytkownik, chcę, aby aplikacja pamiętała ostatni model, którego użyłem, i ustawiała go jako domyślny dla kolejnych wiadomości, aby zminimalizować liczbę kliknięć.
Kryteria akceptacji:

1. Po wybraniu modelu z listy i wysłaniu wiadomości, ten model staje się domyślnie wybrany na liście dla następnego zapytania w tej samej i w każdej nowej konwersacji.
2. Informacja o ostatnio używanym modelu jest zapisywana w `localStorage` przeglądarki.
3. Po ponownym otwarciu aplikacji, ostatnio używany model jest poprawnie ustawiony jako domyślny.

### Zarządzanie Konwersacjami

#### ID: US-007

Tytuł: Rozpoczynanie nowej konwersacji
Opis: Jako użytkownik, chcę móc w łatwy sposób rozpocząć nową, pustą konwersację, aby zająć się nowym zadaniem.
Kryteria akceptacji:

1. W interfejsie znajduje się wyraźnie oznaczony przycisk "Nowa konwersacja".
2. Kliknięcie przycisku czyści bieżący widok czatu i tworzy nowy wpis na liście konwersacji (z tymczasowym tytułem do czasu wysłania pierwszej wiadomości).
3. Nowa konwersacja staje się aktywną konwersacją.

#### ID: US-008

Tytuł: Przeglądanie i przełączanie konwersacji
Opis: Jako użytkownik, chcę widzieć listę moich poprzednich konwersacji i móc się między nimi przełączać, aby kontynuować pracę.
Kryteria akceptacji:

1. W panelu bocznym widoczna jest lista wszystkich moich konwersacji, posortowana od najnowszej do najstarszej.
2. Każda pozycja na liście wyświetla automatycznie wygenerowany tytuł konwersacji.
3. Kliknięcie na tytuł konwersacji na liście ładuje jej pełną historię do głównego okna czatu.

#### ID: US-009

Tytuł: Usuwanie konwersacji
Opis: Jako użytkownik, chcę móc trwale usunąć konwersację, której już nie potrzebuję, aby utrzymać porządek na liście.
Kryteria akceptacji:

1. Każda konwersacja na liście ma opcję "Usuń".
2. Kliknięcie "Usuń" powoduje wyświetlenie modala z prośbą o potwierdzenie operacji ("Czy na pewno chcesz trwale usunąć tę konwersację?").
3. Po potwierdzeniu, konwersacja jest trwale usuwana z bazy danych i znika z listy.
4. Anulowanie operacji zamyka modal bez usuwania konwersacji.

### Rozgałęzianie (Branching)

#### ID: US-010

Tytuł: Tworzenie gałęzi z pełną historią
Opis: Jako użytkownik, chcę móc utworzyć odgałęzienie z wybranej wiadomości, które kopiuje całą dotychczasową historię, aby móc eksplorować alternatywny scenariusz bez modyfikowania oryginalnego wątku.
Kryteria akceptacji:

1. Przy każdej wiadomości w konwersacji widoczna jest ikona "Rozgałęzienie".
2. Po kliknięciu ikony pojawia się opcja "Utwórz gałąź z pełną historią".
3. Wybranie tej opcji tworzy nową, niezależną konwersację w bazie danych, zawierającą kopię wszystkich wiadomości aż do punktu rozgałęzienia.
4. Nowa konwersacja otrzymuje nazwę w formacie `[Tytuł konwersacji-matki] - gałąź X`.
5. Użytkownik jest automatycznie przełączany do widoku nowo utworzonej konwersacji.

#### ID: US-011

Tytuł: Tworzenie gałęzi z podsumowaniem
Opis: Jako użytkownik, chcę móc utworzyć odgałęzienie, które rozpoczyna się od automatycznego podsumowania dotychczasowej rozmowy, aby szybko rozpocząć nowy, powiązany temat z przekazaniem kluczowego kontekstu.
Kryteria akceptacji:

1. Przy każdej wiadomości w konwersacji widoczna jest ikona "Rozgałęzienie".
2. Po kliknięciu ikony pojawia się opcja "Utwórz gałąź z podsumowaniem".
3. Wybranie tej opcji powoduje wywołanie modelu AI w celu wygenerowania podsumowania konwersacji do punktu rozgałęzienia.
4. Tworzona jest nowa, niezależna konwersacja, której pierwszą wiadomością jest wygenerowane podsumowanie.
5. Nowa konwersacja otrzymuje nazwę w formacie `[Tytuł konwersacji-matki] - gałąź X`.
6. Użytkownik jest automatycznie przełączany do widoku nowo utworzonej konwersacji.

### Dodatkowe Funkcjonalności (UX/Error Handling)

#### ID: US-012

Tytuł: Wyświetlanie licznika tokenów
Opis: Jako użytkownik prowadzący długą konwersację, chcę widzieć szacunkową liczbę tokenów, aby być świadomym wielkości kontekstu wysyłanego do API i unikać przekroczenia limitu.
Kryteria akceptacji:

1. W interfejsie czatu, w widocznym miejscu, wyświetlana jest liczba reprezentująca szacunkową ilość tokenów w bieżącej konwersacji.
2. Licznik aktualizuje się po dodaniu każdej nowej wiadomości (zarówno użytkownika, jak i asystenta).
3. Projekt UI dla licznika jest czytelny i nieinwazyjny.

#### ID: US-013

Tytuł: Obsługa błędów API
Opis: Jako użytkownik, w przypadku problemu z komunikacją z API (np. nieprawidłowy klucz, błąd serwera modelu), chcę otrzymać informację zwrotną w formie wiadomości w czacie, aby móc kontynuować pracę bez blokady całego interfejsu.
Kryteria akceptacji:

1. Gdy zapytanie do API OpenRouter zwróci błąd, w oknie czatu pojawia się specjalna wiadomość o błędzie (np. "Wystąpił błąd: \[treść błędu API]").
2. Interfejs aplikacji pozostaje w pełni funkcjonalny, pozwalając na wysłanie kolejnej wiadomości lub zmianę modelu.
3. Wiadomość o błędzie jest wyraźnie odróżnialna wizualnie od standardowych odpowiedzi AI.

## 6. Metryki sukcesu

Sukces wersji MVP będzie mierzony za pomocą kombinacji kryteriów funkcjonalnych i wskaźników adopcji kluczowych funkcji.

### Kryteria funkcjonalne:

1. Stabilność aplikacji: Aplikacja jest w 100% sprawna. Użytkownicy mogą bez przeszkód tworzyć konta, logować się i korzystać ze wszystkich podstawowych funkcji.
2. Niezawodność kluczowych funkcji:
   * Przełączanie modeli AI dla poszczególnych wiadomości działa bezbłędnie.
   * Tworzenie nowych wątków (zarówno przez kopiowanie historii, jak i przez jej podsumowanie) działa niezawodnie.
   * Zarządzanie konwersacjami (tworzenie, przeglądanie, przełączanie, usuwanie) działa zgodnie z oczekiwaniami.

### Mierzalne wskaźniki sukcesu (KPIs):

1. Wskaźnik adopcji funkcji rozgałęziania (Branching): Co najmniej 15% aktywnych użytkowników skorzystało z funkcji rozgałęziania (dowolnego typu) przynajmniej raz w ciągu pierwszego tygodnia od rozpoczęcia pomiarów.
2. Wskaźnik adopcji funkcji przełączania modeli: Co najmniej 20% aktywnych użytkowników użyło co najmniej 3 różnych modeli AI w ciągu pierwszego tygodnia od rozpoczęcia pomiarów.
