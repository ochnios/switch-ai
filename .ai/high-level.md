# Aplikacja - switch-ai (MVP)

## Główny problem

Użytkownicy zaawansowanych modeli językowych (LLM) napotykają dwa kluczowe problemy w standardowych interfejsach typu czat:

1. **Brak elastyczności w wyborze modeli:** Różne modele AI mają różne specjalizacje. Przełączanie się między nimi wymaga otwierania wielu kart i ręcznego kopiowania kontekstu rozmowy, co jest niewygodne i przerywa płynność pracy.
2. **Liniowość konwersacji:** Eksploracja alternatywnych pomysłów lub zadawanie pytań pobocznych w ramach jednej rozmowy jest utrudniona. Obecne rozwiązania zmuszają do "zaśmiecania" głównego wątku lub rozpoczynania nowej rozmowy od zera, co prowadzi do utraty kontekstu. Tylko nieliczne z nich umożliwiają tworzenie rozgałęzień wątków.

`switch-ai` ma na celu rozwiązanie tych problemów poprzez stworzenie jednego, płynnego interfejsu, który umożliwia zarówno dynamiczne przełączanie modeli AI, jak i łatwe tworzenie nowych, inteligentnie zarządzanych wątków konwersacji.

## Najmniejszy zestaw funkcjonalności

W skład MVP wchodzą następujące funkcje:

1. **Interfejs czatu:** Prosty, czytelny interfejs do prowadzenia rozmów z AI.
2. **Przełączanie modeli per wiadomość:** Możliwość wyboru modelu językowego dla każdej wysyłanej wiadomości.
3. **Lista konwersacji:** Wyświetlanie listy historycznych konwersacji zalogowanego użytkownika, z możliwością przełączania się między nimi oraz tworzenia nowej.
4. **Rozpoczynanie nowego wątku ("branching"):** Przy każdej wiadomości w konwersacji znajduje się opcja stworzenia nowego, oddzielnego wątku, która oferuje dwa tryby:
   * **Pełna historia:** Nowy wątek jest tworzony jako kopia całej dotychczasowej rozmowy.
   * **Wątek z podsumowaniem:** Aplikacja automatycznie generuje podsumowanie bieżącej rozmowy i używa go jako kontekstu startowego dla nowego wątku.
5. **Uwierzytelnianie użytkowników:** Prosta rejestracja i logowanie aby przechowywać historię rozmów przypisaną do użytkownika.

## Co NIE wchodzi w zakres MVP

Następujące funkcje są świadomie pomijane w pierwszej wersji, aby skupić się na kluczowej wartości:

* Skomplikowana wizualizacja rozmów w formie drzewa
* Możliwość załączania plików (obrazów, dokumentów, dźwięku)
* Streaming odpowiedzi asystenta
* Integracja z wyszukiwarką internetową
* Udostępnianie i eksportowanie konwersacji
* Obsługa wielu rozmów jednocześnie w jednym widoku (np. w kartach)

## Kryteria sukcesu

MVP zostanie uznane za sukces, gdy zostaną spełnione następujące kryteria funkcjonalne:

1. **Aplikacja jest w pełni funkcjonalna:** Użytkownik może założyć konto, zalogować się i korzystać z aplikacji
2. **Kluczowe funkcje działają bezbłędnie:**
   * Użytkownik może płynnie przełączać modele AI w trakcie jednej konwersacji.
   * Funkcja tworzenia nowych wątków (zarówno przez kopiowanie historii, jak i przez jej podsumowanie) działa niezawodnie.
   * Zarządzanie konwersacjami (rozpoczynanie nowej, przeglądanie listy, przełączanie, usuwanie) jest działa niezawodnie.
