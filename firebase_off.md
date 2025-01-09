# Instrukcja usunięcia Firebase i przejścia na lokalną bazę danych

## 0. Lista plików do modyfikacji

### Pliki do usunięcia:
- `src/firebaseConfig.example.ts`
- `src/firebaseConfig.ts`

### Pliki do modyfikacji:
#### Kontekst i konfiguracja:
- `src/App.tsx` - usunięcie inicjalizacji Firebase
- `src/contexts/DataContext.tsx` - zmiana logiki dostępu do danych

#### Komponenty:
- `src/components/ProductList.tsx` - aktualizacja operacji CRUD ✓
- `src/components/OrderForm.tsx` - aktualizacja zapisywania zamówień ✓
- `src/components/EmailImport.tsx` - dostosowanie importu
- `src/components/KanbanBoard.tsx` - aktualizacja operacji na tablicy
- `src/components/ProductImport.tsx` - dostosowanie importu
- `src/components/EmailSettings.tsx` - aktualizacja ustawień
- `src/components/OrderList.tsx` - aktualizacja listy zamówień
- `src/components/EditOrderForm.tsx` - aktualizacja edycji zamówień

#### Strony:
- `src/pages/Orders.tsx` - aktualizacja logiki strony zamówień

#### Narzędzia:
- `src/utils/orderNumber.ts` - dostosowanie generowania numerów

- `src/services/authService.ts` - zmiana logiki autoryzacji
- `src/services/databaseService.ts` - zmiana na lokalną bazę danych
- `src/components/**/*.tsx` - aktualizacja importów i wywołań bazy danych
- `package.json` - usunięcie zależności Firebase
- `tests/**/*` - aktualizacja testów

## 1. Usuń konfigurację Firebase [WYKONANE ✓]
1. Usunięto pliki konfiguracyjne Firebase:
   - `src/firebaseConfig.example.ts` ✓
   - `src/firebaseConfig.ts` ✓
2. Usunięto zależności Firebase z `package.json`: ✓
   ```bash
   npm uninstall firebase
   ```
3. Wykonano czyszczenie importów Firebase w:
   - `src/App.tsx` ✓
   - `src/contexts/DataContext.tsx` ✓

## 2. Zainstaluj lokalną bazę danych [W TRAKCIE]
1. Zainstalowano SQLite: ✓
   ```bash
   npm install sqlite3
   npm install @types/sqlite3 --save-dev
   ```
2. Utworzono plik konfiguracyjny `/src/config/database.ts` ✓
3. Utworzono schemat bazy danych: ✓
   - Tabela products ✓
   - Tabela orders ✓
   - Tabela order_products ✓
4. Skonfigurowano połączenie z bazą ✓
5. Utworzono klasę serwisową `/src/services/databaseService.ts` ✓
   - Implementacja CRUD dla produktów ✓
   - Implementacja CRUD dla zamówień ✓

[Następne kroki]
- Rozpocząć migrację danych z Firebase

## 3. Migracja danych [W TRAKCIE]
1. Wyeksportuj dane z Firebase: ✓
   - Przejdź do konsoli Firebase
   - Wybierz projekt
   - Eksportuj dane do JSON
2. Utworzono skrypt migracji `/src/scripts/migrateData.ts` ✓
3. Instrukcja migracji:
   ```bash
   # Instalacja wymaganych zależności
   npm install ts-node --save-dev

   # Uruchomienie skryptu migracji
   node -r ts-node/register src/scripts/migrateData.ts ./firebase-export.json
   ```

[Następne kroki]
- Wykonać migrację danych testowych
- Zweryfikować poprawność migracji
- Rozpocząć aktualizację komponentów

## 4. Aktualizacja kodu [W TRAKCIE]
1. Zaktualizowano główne komponenty:
   - `src/contexts/DataContext.tsx` ✓ - zmieniono na używanie lokalnej bazy danych
   - `src/components/ProductList.tsx` ✓ - zaktualizowano operacje CRUD
   - `src/components/OrderList.tsx` ✓ - zaktualizowano operacje na zamówieniach
   - `src/components/OrderForm.tsx` ✓ - zaktualizowano tworzenie zamówień
   - `src/components/KanbanBoard.tsx` ✓ - zaktualizowano tablicę Kanban
   - `src/components/EmailImport.tsx` ✓ - zaktualizowano import emaili
   - `src/components/EmailSettings.tsx` ✓ - zaktualizowano ustawienia emaili
   - `src/utils/orderNumber.ts` ✓ - zaktualizowano generowanie numerów zamówień
   - `src/components/EditOrderForm.tsx` ✓ - zaktualizowano edycję zamówień
   - `src/components/ProductImport.tsx` ✓ - zaktualizowano import produktów
   - `src/pages/Orders.tsx` ✓ - zaktualizowano stronę zamówień
   
[Następne kroki]
- Utworzyć testy integracyjne dla nowej bazy danych
- Przetestować migrację danych
- Zaktualizować dokumentację API

## 5. Testowanie [ROZPOCZĘTE]
1. Utworzyć testy dla:
   - Połączenia z bazą danych
   - Operacji CRUD
   - Migracji danych
   - Wydajności systemu

## Status projektu:
✓ - wykonane
🔄 - w trakcie
⏳ - oczekuje

Ostatnia aktualizacja: Zakończono aktualizację komponentów, rozpoczęto fazę testowania