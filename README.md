# Build packs

[<img src="https://img.shields.io/static/v1?style=for-the-badge&label=%40atls%2Fcode-service&message=0.0.25&labelColor=ECEEF5&color=D7DCEB">](https://npmjs.com/package/@atls/code-service) [<img src="https://img.shields.io/static/v1?style=for-the-badge&label=%40atls%2Fschematics&message=0.0.21&labelColor=ECEEF5&color=D7DCEB">](https://npmjs.com/package/@atls/schematics)

## Порядок обновления версии `NodeJS` базового билдера

Для всех операций необходим аккаунт Docker с доступом к `atlantislab`.

1. `/stacks/node/.../Dockerfile` - поправить версию ноды на необходимую
2. `/stacks/build.sh`
3. Проверяем версию ноды через `docker inspect X` где Х - ID созданного образа
4. `/stacks/push.sh`

На текущем этапе в Docker Hub запушены все образы из `/stacks`

Делаем билдер:

1. `/builders/build:sh` - поправить тег на `:buster-XX.XX`, подставив версию ноды до минорной. ВАЖНО: тег всегда меняем кроме случаев когда идет исправление созданного образа. Добавляя новый тег вы создаете новый образ под новым тегом вместе перезаписывания старого.
2. `/builders/build.sh`
3. Проверяем версию ноды через `docker inspect X` где Х - ID созданного образа
4. `docker image push atlantislab/builder-base:buster-XX.XX`
5. Проверяем в [Docker Hub](https://hub.docker.com/r/atlantislab/builder-base/tags) - должен появится ваш образ
[//]: # (VERSIONS)
