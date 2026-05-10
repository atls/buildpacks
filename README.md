# Build packs

[<img src="https://img.shields.io/static/v1?style=for-the-badge&label=%40atls%2Fcode-service&message=0.0.25&labelColor=ECEEF5&color=D7DCEB">](https://npmjs.com/package/@atls/code-service) [<img src="https://img.shields.io/static/v1?style=for-the-badge&label=%40atls%2Fschematics&message=0.0.21&labelColor=ECEEF5&color=D7DCEB">](https://npmjs.com/package/@atls/schematics)

## Порядок обновления версии `NodeJS` базового билдера

Текущий production baseline: `Node.js 24 LTS`.

Для всех операций необходим аккаунт Docker с доступом к `atlantislab`.

1. `/stacks/node/.../Dockerfile` - поправить версию ноды на актуальную LTS
2. `/stacks/build.sh`
3. Проверяем версию ноды через `docker inspect X` где Х - ID созданного образа
4. `/stacks/push.sh`

На текущем этапе в Docker Hub запушены все образы из `/stacks`

Делаем билдер:

1. Собрать или подтянуть `atlantislab/stack-node:run`
2. Собрать или подтянуть `atlantislab/stack-node:build`
3. `/builders/build.sh` и `/builders/build-local.sh` - поправить тег билдера на актуальную major-версию Node. ВАЖНО: тег всегда меняем кроме случаев когда идет исправление созданного образа. Добавляя новый тег вы создаете новый образ под новым тегом вместе перезаписывания старого.
4. `/builders/build.sh`
5. Проверяем версию ноды через `docker inspect X` где Х - ID созданного образа
6. `docker image push atlantislab/builder-base:24`
7. Проверяем в [Docker Hub](https://hub.docker.com/r/atlantislab/builder-base/tags) - должен появится ваш образ

## Runtime запуск Yarn PnP ESM workspace

`buildpack-yarn-workspace-start` формирует launch layer с `NODE_OPTIONS` для workspace без `node_modules`.

Если в приложении есть `.pnp.cjs`, buildpack добавляет его через `--require`.
Если в приложении есть `.pnp.loader.mjs`, buildpack добавляет его через `--loader`.
Source maps включаются через `--enable-source-maps`.

Прикладной `package.json` не должен дублировать эти флаги в `start`-команде. Для ESM workspace достаточно запускать собранную точку входа, например `node dist/index.js`.
