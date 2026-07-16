# Быстрый запуск

## Подготовка

- Установите [Node.js](https://nodejs.org/en/download) v22 или выше.

- Установите текстовый редактор, например [VS Code](https://code.visualstudio.com/).

- Установите пакет [Diplodoc CLI](https://diplodoc.com/docs/ru/tools/docs/), выполнив в терминале команду `npm i @diplodoc/cli -g`.

## Запуск локальной сборки

* Запустить сборку доки по умолчанию (внешняя):
    ```
    yfm -i ./ yfm -o docs-html
    ```

* Запустить сборку внутренней доки:

    ```
    yfm -i ./ yfm -o docs-html --vars-preset "internal"
    ```