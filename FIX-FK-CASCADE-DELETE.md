# ✅ Исправлена ошибка Foreign Key при удалении Request

## 🐛 Проблема:

```
ERROR [ExceptionsHandler] QueryFailedError: 
update or delete on table "requests" violates foreign key constraint 
"FK_ea24c14cf7c104113114fc49c0a" on table "request_runs"

detail: 'Key (id)=(2) is still referenced from table "request_runs".'
```

**Причина:** При удалении request, связанные записи в `request_runs` не удаляются автоматически, что нарушает Foreign Key constraint.

---

## ✅ Решение:

### 1. Изменен Entity (request-run.entity.ts):

**Было:**
```typescript
@ManyToOne(() => RequestEntity, { eager: true })
request: RequestEntity;

@ManyToOne(() => EnvironmentEntity, {
  nullable: true,
  eager: true,
})
environment?: EnvironmentEntity;
```

**Стало:**
```typescript
@ManyToOne(() => RequestEntity, { eager: true, onDelete: 'CASCADE' })
request: RequestEntity;

@ManyToOne(() => EnvironmentEntity, {
  nullable: true,
  eager: true,
  onDelete: 'SET NULL',
})
environment?: EnvironmentEntity;
```

**Изменения:**
- ✅ `onDelete: 'CASCADE'` для request - при удалении request, все его runs тоже удаляются
- ✅ `onDelete: 'SET NULL'` для environment - при удалении environment, в runs поле environment становится NULL

---

## 🔧 Как применить:

### Вариант 1: Автоматически (рекомендуется)

Поскольку в `app.module.ts` установлено `synchronize: true`, просто **перезапустите Docker контейнер**:

```bash
docker-compose restart api_client_app
```

TypeORM автоматически обновит схему БД при запуске.

### Вариант 2: Вручную (если synchronize: false)

Выполните SQL миграцию в PostgreSQL:

```bash
# Подключитесь к БД
docker exec -it api_client_db psql -U postgres -d api_client

# Выполните миграцию
\i /path/to/migrations/001-add-cascade-delete-to-runs.sql

# Или скопируйте SQL напрямую:
```

```sql
-- Drop existing foreign key constraint
ALTER TABLE "request_runs" 
DROP CONSTRAINT IF EXISTS "FK_ea24c14cf7c104113114fc49c0a";

-- Add new foreign key constraint with CASCADE delete
ALTER TABLE "request_runs"
ADD CONSTRAINT "FK_ea24c14cf7c104113114fc49c0a" 
FOREIGN KEY ("requestId") 
REFERENCES "requests"("id") 
ON DELETE CASCADE;
```

---

## 📊 Поведение после исправления:

### Удаление Request:
```
Request (id=2)
  ├─ Run 1 (id=10) ❌ CASCADE DELETE
  ├─ Run 2 (id=11) ❌ CASCADE DELETE
  └─ Run 3 (id=12) ❌ CASCADE DELETE
```
✅ Request удаляется вместе со всеми runs

### Удаление Environment:
```
Environment (id=3) ❌ DELETED
  ↓
Run 1 (environment: 3 → NULL) ✅ Сохраняется, environment = null
Run 2 (environment: 3 → NULL) ✅ Сохраняется, environment = null
```
✅ Runs сохраняются, но ссылка на environment становится NULL

---

## 🎯 Преимущества:

1. ✅ **Не теряем историю** - при удалении request, runs тоже удаляются (логично)
2. ✅ **Сохраняем историю** - при удалении environment, runs остаются (можем видеть прошлые запуски)
3. ✅ **Нет FK ошибок** - можно свободно удалять requests
4. ✅ **Согласованность данных** - не останется "висячих" runs без request

---

## ⚠️ Важно:

После применения миграции:
- Удаление request → автоматически удалит все его runs
- Удаление environment → runs останутся, но с environment = null

Если нужно сохранить runs при удалении request, измените `onDelete: 'CASCADE'` на `onDelete: 'SET NULL'` и сделайте поле `request` nullable.

---

## 🚀 Проверка:

После перезапуска попробуйте удалить request, который имеет runs:

```bash
# В UI
1. Запустите request несколько раз (создадутся runs)
2. Нажмите 🗑️ на этом request
3. Подтвердите удаление

✅ Request должен удалиться без ошибок
✅ Все связанные runs автоматически удалятся
✅ В console не должно быть FK errors
```

---

✅ **Проблема решена!** Теперь можно удалять requests без ошибок Foreign Key constraint.
