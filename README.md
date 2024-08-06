### Задача: 
Cоздать систему, позволяющую выучить иностранные слова с использованием метода "карточек"

### Система должна содержать:
- Пользовательский интерфейс в виде ТГ бота.
- Сервер.
- Базу данных. В БД должны храниться базовые коллекции карточек по различным темам.

### Система должна обеспечивать:
- Регистрацию и авторизацию пользователей.
- Добавление / удаление собственных карточек, категорий.
- Вывод карточки пользователю с вариантами перевода, причем как с английского  на русский, так и наоборот.
- Ведение статистики (верных ответов), (времени использования) для каждого пользователя.
- Выбор класса карточек из общедоступных и собственных категорий. 

### Технологии:
- Python / Aiogram для реализации ТГ бота.
- Java / Tomcat / Spring / Maven / Docker / Kubernetes / Apache Kafka / ELK, Grafana для реализации сервера.
- JUnit для тестирования.
- PostgreSQL / Hibernate.
- CI/CD для непрерывного развертывания.

### Общая диаграмма

```mehrmaid
flowchart LR
	Telegram["Telegram"]
    Bot["Bot"]
    Server["Server"]
    DataBase["DataBase"]

    Telegram --> Bot --> Server --> DataBase
    DataBase --> Server --> Bot --> Telegram
```


![Alt text](Pasted_image_20240806171539.png)