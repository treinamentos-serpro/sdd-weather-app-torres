# Backlog de Tarefas — Weather App v1

Fonte: `plans/weather-app-plan.md`.

As tarefas estão agrupadas na sequência de implementação — contratos → funções puras → services → hook → componentes → integração → testes → hardening — e ordenadas pelas dependências. Todas iniciam como **Pendente**; conclua as dependências antes de iniciar uma tarefa dependente.

**Prioridade:** P0 = necessário para a primeira fatia utilizável ou bloqueador de segurança; P1 = necessário para completar qualidade/requisitos da v1 antes de produção; P2 = melhoria adiável sem descumprir o baseline. **Tamanho relativo:** P = pequeno e localizado; M = esforço moderado; G = maior complexidade de integração/validação. Não representa estimativa de duração.

## Entrega 1 — Contratos

### T-01 — Definir tipos do domínio

- **ID:** T-01
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Criar contratos TypeScript para localidade, condição, clima atual, previsão diária, relatório, unidade e erros.
- **Critérios de aceite:**
  - `City`, `WeatherCondition`, `CurrentWeather`, `DailyForecast`, `WeatherReport`, `RequestError` e `OpenMeteoClient` seguem os contratos do plano.
  - Campos meteorológicos opcionais aceitam `null`; zero continua sendo um valor válido.
  - Temperaturas no modelo permanecem em Celsius; `observedAt` e `fetchedAt` têm semânticas distintas.
  - `pnpm build` completa sem erro de tipo para os contratos TypeScript strict.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`.
- **Rastreabilidade:** RF-01–RF-05; RNF-01, RNF-08, RNF-09.

## Entrega 2 — Funções puras

### T-02 — Validar consultas de cidade

- **ID:** T-02
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Implementar função pura para limpar espaços externos e validar o tamanho da consulta antes do geocoding.
- **Critérios de aceite:**
  - Após `trim`, consultas com menos de 3 ou mais de 100 caracteres são inválidas.
  - Entradas válidas preservam acentos e pontuação sem normalização adicional.
  - A função não executa I/O nem altera a entrada recebida.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/searchQuery.ts`.
- **Rastreabilidade:** RF-01; CA-01.4, CA-01.5, CA-01.11; RNF-08.

### T-03 — Implementar conversão de temperatura

- **ID:** T-03
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Criar funções puras para conversão entre Celsius e Fahrenheit e formatação pt-BR.
- **Critérios de aceite:**
  - Conversões partem sempre do valor canônico em Celsius e não acumulam erro ao alternar unidades.
  - Temperaturas são arredondadas a uma casa decimal e usam vírgula decimal e símbolo correto.
  - `20 °C` resulta em `68,0 °F`, `-40 °C` em `-40,0 °F` e `12,34 °C` em `54,2 °F`.
  - Valores ausentes não são formatados como zero.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/temperature.ts`.
- **Rastreabilidade:** RF-04; CA-04.1–CA-04.4, CA-04.6; RNF-01.

### T-04 — Mapear códigos meteorológicos WMO

- **ID:** T-04
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Implementar o mapeamento puro de códigos WMO para rótulos em pt-BR com fallback neutro.
- **Critérios de aceite:**
  - Cada código presente no mapa retorna um `labelPtBr` não vazio em português e um ícone.
  - Um código fora do mapa retorna o fallback neutro definido e não lança erro.
  - A saída atende `WeatherCondition`.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`.
- **Rastreabilidade:** RF-02, RF-03; CA-02.1, CA-03.1; RNF-01.

### T-05 — Normalizar datas e frescor da observação

- **ID:** T-05
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Implementar funções puras de data/hora para preservar datas locais e classificar observações antigas.
- **Critérios de aceite:**
  - Datas diárias `YYYY-MM-DD` mantêm a data do fuso da localidade, sem deslocamento UTC.
  - Horário local da observação e offset recebido são convertidos em instante ISO-8601 UTC válido.
  - Observação com mais de duas horas é desatualizada; exatamente duas horas ou menos não é.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/dateTime.ts`.
- **Rastreabilidade:** RF-02, RF-03; CA-02.5, CA-03.1; RNF-01.

## Entrega 3 — Acesso a dados

### T-06 — Implementar cliente Open-Meteo

- **ID:** T-06
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Implementar `searchCities` e `getWeather` com chamadas aos endpoints de geocoding e forecast, validação e normalização.
- **Critérios de aceite:**
  - URL geocoding contém `name`, `count=10`, `language=pt` e `format=json`; normalização preserva ordem e retorna no máximo 10 localidades.
  - Cada resultado válido mapeia ID, nome, região, país e coordenadas a `City`; resposta válida sem resultados retorna `[]`.
  - URL forecast usa latitude/longitude fornecidas e inclui `current` (também `precipitation` e `pressure_msl`), `daily`, Celsius, km/h, `precipitation_unit=mm`, `timezone=auto` e `forecast_days=5`; normaliza precipitação em mm e pressão ao nível do mar em hPa para os novos campos nullable.
  - Fixture válida retorna `WeatherReport` com timezone, current, dias associados por índice, datas locais e `fetchedAt` ISO-8601.
  - Campo meteorológico opcional ausente ou nulo mapeia para `null`; estrutura incompatível rejeita `RequestError` com código `invalid-response`.
  - Cada método aceita `AbortSignal` e rejeita após 10 s; rede, HTTP não-2xx, timeout e payload inválido rejeitam com códigos correspondentes.
- **Dependências:** T-01, T-02, T-04, T-05.
- **Arquivos prováveis:** `src/services/openMeteoClient.ts`.
- **Rastreabilidade:** RF-01–RF-03, RF-05; CA-01.1–CA-01.4, CA-01.6, CA-01.10, CA-02.1–CA-02.5, CA-03.1–CA-03.5, CA-05.1–CA-05.2; RNF-05, RNF-07, RNF-09.

## Entrega 4 — Orquestração e estado

### T-07 — Implementar hook de aplicação

- **ID:** T-07
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Implementar `useWeatherApp` para coordenar busca, seleção, consulta, atualização manual, concorrência e unidade.
- **Critérios de aceite:**
  - Busca válida transita de `loading` para `success`, `empty` ou `error`; busca inválida resulta em zero chamadas a `searchCities`.
  - Seleção chama `getWeather` com as coordenadas selecionadas; resultado vazio resulta em zero chamadas a `getWeather`.
  - Busca e forecast têm estados separados; retry chama novamente apenas o método da operação com falha.
  - Respostas de busca/forecast resolvidas fora de ordem não alteram a última operação nem associam dados à cidade errada.
  - Falha de refresh da mesma cidade preserva relatório e `fetchedAt`; após selecionar outra cidade, relatório anterior não aparece associado à cidade ativa.
  - Unidade inicial é `celsius`; leitura/escrita é somente em `localStorage`; exceções de storage não impedem inicialização ou troca de unidade.
  - Avançar cinco minutos sem ação do usuário resulta em zero chamadas novas a `getWeather`.
- **Dependências:** T-01, T-06.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`.
- **Rastreabilidade:** RF-01–RF-05; CA-01.5–CA-01.9, CA-01.11, CA-02.2–CA-02.3, CA-03.2, CA-03.4, CA-04.1, CA-04.5, CA-05.1–CA-05.3; RNF-05, RNF-07–RNF-09.

## Entrega 5 — Componentes de UI

### T-08 — Implementar busca e estados de solicitação

- **ID:** T-08
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Criar os componentes de busca, resultados selecionáveis e apresentação de loading, vazio e erro.
- **Critérios de aceite:**
  - Campo tem label acessível; busca e opções podem ser acionadas por teclado.
  - Cada resultado exibe nome e região/país disponíveis; coordenadas aparecem quando esses textos não distinguem resultados.
  - Loading, vazio e erro têm conteúdo textual distinto; erro oferece ação ligada ao callback de retry.
  - Estado e callbacks são controlados por props; componente não importa `services/` nem invoca `fetch`.
- **Dependências:** T-02, T-07.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`, `src/components/RequestStatus.tsx`.
- **Rastreabilidade:** RF-01; CA-01.1–CA-01.11; RNF-01, RNF-03, RNF-08.

### T-09 — Implementar painéis meteorológicos

- **ID:** T-09
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Criar apresentação de clima atual e previsão diária usando o modelo normalizado e a unidade escolhida.
- **Critérios de aceite:**
  - Fixture completa mostra cidade e cada métrica atual com os valores recebidos: temperatura, condição com ícone WMO, sensação térmica, umidade, vento, precipitação em mm, pressão ao nível do mar em hPa e horário.
  - Fixture de observação 2 h 1 min antiga mostra “Desatualizado”; fixture com 2 h não mostra o rótulo.
  - Lista datas locais em ordem e no máximo cinco dias; cada item mostra condição, mínima, máxima e probabilidade disponível.
  - Campo ausente mostra “Indisponível”; fixture com três de cinco dias identifica duas datas sem previsão e indica cobertura incompleta.
  - Loading/erro não apresenta valor antigo ou de outra cidade como atual/previsão válida.
  - Componentes recebem estado/dados por props e não importam serviços nem acessam `fetch`, storage ou relógio global.
- **Dependências:** T-01, T-03, T-04, T-05, T-07.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`, `src/components/ForecastList.tsx`.
- **Rastreabilidade:** RF-02, RF-03; CA-02.1–CA-02.5, CA-03.1–CA-03.5; RNF-01, RNF-03, RNF-07.

### T-10 — Implementar controle de unidade

- **ID:** T-10
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Criar controle acessível de Celsius/Fahrenheit conectado ao estado central da aplicação.
- **Critérios de aceite:**
  - Controle tem nome acessível, expõe unidade selecionada e pode ser operado por teclado.
  - Selecionar Celsius/Fahrenheit atualiza todas as temperaturas dos painéis; umidade, vento e precipitação permanecem inalterados.
  - Sem preferência válida, estado inicial é Celsius; após escolha, novo carregamento lê a mesma unidade de `localStorage`.
- **Dependências:** T-03, T-07.
- **Arquivos prováveis:** `src/components/TemperatureUnitControl.tsx`.
- **Rastreabilidade:** RF-04; CA-04.1–CA-04.5; RNF-03, RNF-08.

## Entrega 6 — Integração da aplicação

### T-11 — Compor tela principal

- **ID:** T-11
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Conectar hook e componentes na tela principal, sem acoplar apresentação ao cliente HTTP.
- **Critérios de aceite:**
  - `App` conecta estado/callbacks do hook à busca, painéis, controle de unidade e botão de atualização.
  - Selecionar cidade chama a ação de seleção; botão “Atualizar” chama ação de refresh para cidade ativa.
  - Estados loading/vazio/erro do hook são encaminhados ao componente correspondente, incluindo retry.
  - `App.tsx` não importa `services/` nem invoca `fetch`.
- **Dependências:** T-08, T-09, T-10.
- **Arquivos prováveis:** `src/App.tsx`.
- **Rastreabilidade:** RF-01–RF-05; CA-01.1–CA-01.8, CA-02.1–CA-02.4, CA-03.1–CA-03.5, CA-04.1–CA-04.5, CA-05.1–CA-05.3; RNF-03, RNF-07.

### T-12 — Configurar entrada e estilos globais

- **ID:** T-12
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Conectar a aplicação ao ponto de entrada React/Vite e definir estilos globais do tema do projeto.
- **Critérios de aceite:**
  - `main.tsx` monta exatamente uma instância de `App` no elemento raiz.
  - `index.css` inclui as diretivas Tailwind configuradas e define o tema dark glassmorphism.
  - Nos cinco viewports da spec, `document.documentElement.scrollWidth <= window.innerWidth` no shell.
- **Dependências:** T-11.
- **Arquivos prováveis:** `src/main.tsx`, `src/index.css`.
- **Rastreabilidade:** RNF-01, RNF-02.

## Entrega 7 — Testes

### T-13 — Testar validação da busca

- **ID:** T-13
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Cobrir limites, espaços e preservação de caracteres da função de busca.
- **Critérios de aceite:**
  - Testes cobrem vazio, espaços, 2, 3, 100 e 101 caracteres após `trim`.
  - `" São Paulo "` resulta em `"São Paulo"` e mantém acentos.
  - Testes não usam rede.
- **Dependências:** T-02.
- **Arquivos prováveis:** `tests/unit/lib/searchQuery.test.ts`.
- **Rastreabilidade:** RF-01; CA-01.4, CA-01.5, CA-01.11.

### T-14 — Testar conversão de temperatura

- **ID:** T-14
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Criar testes unitários Vitest para conversões, arredondamento, unidades e valores ausentes.
- **Critérios de aceite:**
  - Vitest cobre as funções puras nos dois sentidos: Celsius → Fahrenheit e Fahrenheit → Celsius, com valores positivos e negativos.
  - As asserções confirmam `20 °C` → `68,0 °F`, `-40 °C` → `-40,0 °F`, `68 °F` → `20,0 °C` e `12,34 °C` → `54,2 °F`.
  - Testes confirmam uma casa decimal, símbolo/unidade correspondentes e que `null` permanece indisponível, não zero.
  - A suíte não usa DOM, rede ou mocks de `fetch`.
- **Dependências:** T-03.
- **Arquivos prováveis:** `tests/unit/lib/temperature.test.ts`.
- **Rastreabilidade:** RF-04; CA-04.1–CA-04.4, CA-04.6.

### T-15 — Testar mapeamento WMO

- **ID:** T-15
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Cobrir grupos de condições suportados e o fallback do mapeador.
- **Critérios de aceite:**
  - Testes cobrem ao menos um código por grupo implementado.
  - Código desconhecido retorna o fallback esperado.
- **Dependências:** T-04.
- **Arquivos prováveis:** `tests/unit/lib/weatherCodes.test.ts`.
- **Rastreabilidade:** RF-02, RF-03; CA-02.1, CA-03.1.

### T-16 — Testar datas e frescor

- **ID:** T-16
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Verificar preservação de datas locais, conversão de instante e limite de frescor.
- **Critérios de aceite:**
  - Observações de 1 h 59 min e exatamente 2 h são classificadas como recentes; 2 h 1 min como desatualizada.
  - Datas diárias em exemplos de fuso UTC positivo e negativo permanecem idênticas à string de entrada.
  - Um par conhecido de horário local e offset resulta no instante ISO-8601 UTC esperado.
- **Dependências:** T-05.
- **Arquivos prováveis:** `tests/unit/lib/dateTime.test.ts`.
- **Rastreabilidade:** RF-02, RF-03; CA-02.5, CA-03.1; RNF-01.

### T-17 — Testar cliente Open-Meteo

- **ID:** T-17
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Criar testes Vitest do service com `fetch` mockado para validar requests, erros e normalização.
- **Critérios de aceite:**
  - Vitest substitui `fetch` e confirma URL/parâmetros dos dois endpoints, coordenadas selecionadas e encoding de `"São Paulo"`; nenhuma chamada real sai do teste.
  - Fixtures cobrem geocoding vazio, 11 resultados (ordem e limite 10), homônimos e campos opcionais ausentes.
  - Fixtures Forecast cobrem cinco e três dias, campos nulos/ausentes, unidade e timezone válidos, além de payload malformado.
  - Testes verificam `RequestError` correto para HTTP não-2xx, rejeição de rede, timeout de 10 s e cancelamento.
  - A suíte passa sem conexão com Open-Meteo.
- **Dependências:** T-06.
- **Arquivos prováveis:** `tests/unit/services/openMeteoClient.test.ts`.
- **Rastreabilidade:** RF-01–RF-03, RF-05; CA-01.1–CA-01.4, CA-01.6, CA-01.10, CA-02.1–CA-02.5, CA-03.1–CA-03.5, CA-05.1–CA-05.2; RNF-05, RNF-07, RNF-09.

### T-18 — Testar hook e transições de estado

- **ID:** T-18
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Testar a orquestração do hook com o cliente Open-Meteo substituído por mock.
- **Critérios de aceite:**
  - Mocks cobrem loading → success/empty/error e verificam zero chamadas para input inválido.
  - Seleção chama forecast com coordenadas exatas; retry chama novamente somente a operação que falhou.
  - Promises controladas resolvidas em ordem inversa mantêm resultados e relatório correspondentes à última busca/cidade.
  - Erro de refresh mantém relatório e `fetchedAt` anteriores; selecionar cidade B nunca exibe relatório identificado como cidade A.
  - Timer controlado avança cinco minutos sem nova chamada automática.
  - Testes verificam unidade default/persistida e falha de `localStorage` na leitura ou escrita.
- **Dependências:** T-07.
- **Arquivos prováveis:** `tests/unit/hooks/useWeatherApp.test.ts`.
- **Rastreabilidade:** RF-01–RF-05; CA-01.5–CA-01.9, CA-01.11, CA-02.2–CA-02.3, CA-03.2, CA-03.4, CA-04.1, CA-04.5, CA-05.1–CA-05.3; RNF-05, RNF-07–RNF-09.

### T-19 — Testar componente de busca

- **ID:** T-19
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Criar testes de componente com Testing Library para interação, validação, seleção e estados da busca.
- **Critérios de aceite:**
  - Asserções cobrem 0/2/3/100/101 caracteres, entrada `"São Paulo"` e trim dos espaços externos.
  - Testes separados renderizam os estados `loading`, `empty` (geocoding sem resultados), `error` e `success`; cada estado mostra a mensagem/lista esperada, identificável por role ou label.
  - Homônimos exibem distinção; selecionar a segunda opção invoca callback com ID e coordenadas da segunda cidade.
  - Acionar retry invoca o callback exatamente uma vez.
  - Interações de busca e seleção funcionam por teclado; testes não acessam service nem rede.
- **Dependências:** T-08.
- **Arquivos prováveis:** `tests/components/CitySearch.test.tsx`.
- **Rastreabilidade:** RF-01; CA-01.1–CA-01.11; RNF-01, RNF-03.

### T-20 — Testar painéis meteorológicos

- **ID:** T-20
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Testar conteúdo, estados, dados parciais e acessibilidade dos painéis.
- **Critérios de aceite:**
  - Fixtures exercitam loading, erro, sucesso completo, campo ausente e previsão de três dias.
  - Asserções verificam cada métrica atual, nome da cidade, limite de frescor, ordem/datas previstas e mensagens de ausência.
  - Campo ausente nunca é renderizado como número zero; mensagens e campos são localizáveis por roles/labels.
- **Dependências:** T-09.
- **Arquivos prováveis:** `tests/components/WeatherViews.test.tsx`.
- **Rastreabilidade:** RF-02, RF-03; CA-02.1–CA-02.5, CA-03.1–CA-03.5; RNF-01, RNF-03.

### T-21 — Testar controle e persistência da unidade

- **ID:** T-21
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Verificar interação acessível e persistência da unidade entre renderizações.
- **Critérios de aceite:**
  - Teste seleciona ambas as unidades por teclado e verifica estado acessível e temperaturas atualizadas nos dois painéis.
  - Remontagem com armazenamento compartilhado restaura Fahrenheit; preferência ausente/corrompida inicializa Celsius.
  - Mocks de `localStorage` que lançam em leitura/escrita não impedem renderização ou troca de unidade.
- **Dependências:** T-10.
- **Arquivos prováveis:** `tests/components/TemperatureUnitControl.test.tsx`.
- **Rastreabilidade:** RF-04; CA-04.1–CA-04.5; RNF-03, RNF-08.

### T-22 — Testar composição da aplicação

- **ID:** T-22
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Cobrir integração entre hook e componentes no ambiente de teste React.
- **Critérios de aceite:**
  - Cliente mockado verifica resultados e relatório após busca e seleção, sem request real.
  - Antes da seleção, `getWeather` tem zero chamadas; depois dela recebe as coordenadas selecionadas.
  - Testes renderizam loading/erro/vazio/sucesso e verificam os callbacks de retry e refresh.
  - Busca, seleção, unidade e atualização são acessíveis por role/label e podem ser acionadas por teclado.
- **Dependências:** T-11, T-12.
- **Arquivos prováveis:** `tests/components/App.test.tsx`.
- **Rastreabilidade:** RF-01–RF-05; CA-01.3, CA-01.5–CA-01.8, CA-02.1–CA-02.4, CA-03.1–CA-03.5, CA-04.1–CA-04.5, CA-05.1–CA-05.3; RNF-03, RNF-07.

### T-23 — Testar fluxo E2E bem-sucedido

- **ID:** T-23
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Validar no Playwright o caminho principal em viewport mobile com rotas Open-Meteo interceptadas.
- **Critérios de aceite:**
  - Com viewport de 375 CSS px, rotas interceptadas e sem chamadas externas, busca e seleção exibem clima atual e cinco datas; alternar para Fahrenheit e recarregar mantém Fahrenheit.
  - Atualização manual gera nova chamada para a cidade selecionada e renderiza a resposta fixture atualizada.
  - Todo o fluxo principal — busca, seleção, consulta, troca de unidade, reload e atualização manual — passa no viewport mobile de 375 CSS px.
- **Dependências:** T-12, T-22.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`, `playwright.config.ts`.
- **Rastreabilidade:** RF-01–RF-05; CA-01.1–CA-01.3, CA-02.1, CA-03.1, CA-04.1–CA-04.5, CA-05.1–CA-05.2; RNF-04, RNF-07, RNF-09.

### T-24 — Testar erros e tentativas novamente em E2E

- **ID:** T-24
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** Cobrir estados recuperáveis de erro nos fluxos E2E.
- **Critérios de aceite:**
  - Contador de rotas confirma zero requests para consulta inválida e zero requests de forecast para geocoding vazio.
  - HTTP não-2xx e rede abortada encerram loading, mostram erro distinto de vazio e retry acionado pelo usuário faz uma nova tentativa.
  - Rota sem resposta excede 10 s, mostra erro de timeout e não gera nova tentativa sem ação do usuário.
  - Todas as rotas externas usadas são interceptadas.
- **Dependências:** T-23.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.
- **Rastreabilidade:** RF-01–RF-03; CA-01.5–CA-01.8, CA-02.2–CA-02.3, CA-03.2, CA-03.4; RNF-05, RNF-07.

### T-25 — Testar respostas parciais e concorrência em E2E

- **ID:** T-25
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** Validar respostas incompletas e respostas fora de ordem entre buscas e localidades.
- **Critérios de aceite:**
  - Fixture com três datas identifica duas indisponíveis e não renderiza valores numéricos inventados.
  - Duas buscas/consultas atrasadas resolvidas em ordem inversa mantêm visíveis resultados e relatório da operação mais recente.
  - Após selecionar cidade B, resposta tardia de cidade A nunca aparece sob o nome de B.
- **Dependências:** T-23.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.
- **Rastreabilidade:** CA-01.9, CA-02.1–CA-02.4, CA-03.1–CA-03.5; Edge Cases “Respostas fora de ordem” e “Resposta parcial”.

### T-26 — Validar viewports responsivos

- **ID:** T-26
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Verificar layout e fluxo principal em larguras mobile, tablet e desktop especificadas.
- **Critérios de aceite:**
  - Em cada largura 320, 375, 768, 1024 e 1440 CSS px, `document.documentElement.scrollWidth <= window.innerWidth`.
  - Em cada largura, bounding boxes dos controles e do conteúdo essencial permanecem na viewport e não se sobrepõem.
  - Fluxo principal passa com viewport configurado em 375 px; todas as rotas Open-Meteo são interceptadas.
- **Dependências:** T-23.
- **Arquivos prováveis:** `tests/e2e/non-functional.spec.ts`.
- **Rastreabilidade:** RNF-02.

### T-27 — Validar navegadores, teclado e estados acessíveis

- **ID:** T-27
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** G
- **Descrição:** Verificar compatibilidade e acessibilidade nos fluxos suportados.
- **Critérios de aceite:**
  - Configuração lista projetos das versões de Chrome, Edge, Firefox e Safari suportadas e executa o fluxo principal em cada projeto.
  - Checklist de release registra resultado de verificação em Safari iOS e Chrome Android nas versões estáveis atuais.
  - Um teste de teclado completa busca, seleção, troca de unidade e atualização sem mouse.
  - Árvore acessível expõe loading/erro como mensagens anunciáveis associadas às seções correspondentes.
- **Dependências:** T-23.
- **Arquivos prováveis:** `playwright.config.ts`, `tests/e2e/non-functional.spec.ts`.
- **Rastreabilidade:** RNF-03, RNF-04.

## Entrega 8 — Hardening e validação operacional

### T-28 — Configurar publicação por HTTPS

- **ID:** T-28
- **Tipo:** Infra
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Configurar o hosting para servir o shell da aplicação por HTTPS.
- **Critérios de aceite:**
  - URL de produção responde em HTTPS com cadeia de certificado válida; HTTP redireciona para HTTPS quando suportado pela plataforma.
  - Inspeção de requests não encontra recursos HTTP nem avisos de conteúdo misto.
  - Regra de HTTPS está aplicada na plataforma de hosting/deploy e presente em configuração versionada.
- **Dependências:** T-12.
- **Arquivos prováveis:** configuração existente de hosting/deploy e headers/redirects da plataforma.
- **Rastreabilidade:** RNF-08.

### T-29 — Configurar monitoramento sintético do shell

- **ID:** T-29
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** Configurar a verificação de disponibilidade do shell independentemente do provedor meteorológico.
- **Critérios de aceite:**
  - Configuração do monitor define intervalo de cinco minutos e verifica HTTP 200 mais carregamento do shell.
  - Relatório mensal calcula sucesso/total de verificações e alerta abaixo de 99,5%.
  - Probe verifica somente o shell, sem consultar Open-Meteo; falhas do provedor não alteram a métrica.
- **Dependências:** T-28.
- **Arquivos prováveis:** configuração do monitor sintético da plataforma.
- **Rastreabilidade:** RNF-06, RNF-07.

### T-30 — Medir desempenho sob rede controlada

- **ID:** T-30
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** Medir o p95 de buscas e consultas bem-sucedidas sob as condições de rede da especificação.
- **Critérios de aceite:**
  - Execução aplica RTT de 100 ms e largura de banda de 50 Mbps e registra essa configuração.
  - Para cada busca/consulta bem-sucedida, mede do submit/seleção até a renderização dos resultados/dados.
  - Calcula e reporta p95 separadamente para busca e consulta; o teste falha se qualquer p95 exceder 3 s.
- **Dependências:** T-23.
- **Arquivos prováveis:** `tests/e2e/performance.spec.ts`, configuração de CI para execução do cenário.
- **Rastreabilidade:** RNF-05.

## Matriz de rastreabilidade dos requisitos funcionais

| Requisito da spec | Tarefas correspondentes | Cobertura |
| --- | --- | --- |
| **RF-01 — Buscar e selecionar cidades** | T-02, T-06, T-07, T-08, T-13, T-17, T-18, T-19, T-22, T-23, T-24, T-25 | Validação de entrada, geocoding e limite/ordem de resultados, seleção e distinção de homônimos, estados vazio/erro/loading, proteção contra resposta obsoleta e fluxo E2E. |
| **RF-02 — Consultar clima atual** | T-01, T-04, T-05, T-06, T-07, T-09, T-15, T-16, T-17, T-18, T-20, T-22, T-23, T-24, T-25 | Modelo e normalização dos dados atuais, condição WMO, timezone/frescor, apresentação de métricas e campos ausentes, estados de consulta e testes unitários, componentizados e E2E. |
| **RF-03 — Consultar previsão de cinco dias** | T-01, T-04, T-05, T-06, T-07, T-09, T-15, T-16, T-17, T-18, T-20, T-22, T-23, T-24, T-25 | Consulta diária no fuso local, mapeamento WMO, cinco datas, cobertura parcial e campos ausentes, apresentação e testes do service, componentes, integração e E2E. |
| **RF-04 — Alternar unidade de temperatura** | T-01, T-03, T-07, T-10, T-14, T-18, T-21, T-22, T-23 | Celsius padrão, conversões e arredondamento, aplicação a todas as temperaturas, persistência local, controle acessível e cobertura unitária, hook, componente e E2E. |
| **RF-05 — Atualizar dados** | T-06, T-07, T-11, T-18, T-22, T-23, T-24 | Consulta ao selecionar cidade, atualização manual, atualização do horário de sucesso, falhas/retentativa e ausência de atualização automática, cobertas no service, hook, integração e E2E. |

**Lacunas de cobertura funcional:** nenhum dos requisitos RF-01 a RF-05 está sem tarefa correspondente no backlog. Os requisitos não funcionais são rastreados separadamente nas tarefas e nos campos de rastreabilidade individuais.

## Sequência sugerida em fatias verticais

Execute por fatia de ponta a ponta, antecipando feedback visual em vez de concluir toda uma camada antes de integrar a seguinte. As tarefas continuam sujeitas às dependências declaradas.

### Fatia 1 — Primeira consulta meteorológica visível

- **Sequência:** T-01 → (T-02 + T-13) → (T-03 + T-14) → (T-04 + T-15) → (T-05 + T-16) → (T-06 + T-17) → (T-07 + T-18) → (T-08 + T-19) → (T-09 + T-20) → (T-10 + T-21) → (T-11 + T-12 + T-22) → T-23.
- **Resultado demonstrável:** buscar e selecionar uma cidade, ver clima atual e cinco dias, alternar e persistir unidade; o E2E do fluxo principal roda em viewport mobile de 375 px. Cada teste focal acompanha sua implementação; integrar os componentes em `App` assim que estado e componente estiverem prontos, sem esperar o hardening.

### Fatia 2 — Cobertura e resiliência do fluxo

- **Tarefas:** T-24 e T-25.
- **Resultado verificável:** geocoding vazio, erros/timeout, retry manual, dados parciais e respostas fora de ordem se comportam conforme os critérios sem dados antigos ou incorretos apresentados como atuais.

### Fatia 3 — Responsividade e release confiável

- **Tarefas:** T-26 e T-27.
- **Resultado verificável:** viewports requeridos, teclado, estados anunciáveis e navegadores/plataformas suportados são verificados. Tratar esta fatia como gate de release, embora não bloqueie a primeira demonstração funcional.

### Fatia 4 — Operação em produção

- **Tarefas:** T-28 → T-29; T-30 pode avançar em paralelo após T-23.
- **Resultado verificável:** HTTPS, disponibilidade do shell separada da API externa e p95 medido sob rede controlada. Concluir antes da publicação/aceite de produção.

**Prioridade P2:** nenhuma tarefa foi classificada como P2. Todos os requisitos do baseline da spec têm cobertura e não devem ser tratados como adiáveis para uma entrega v1 completa.
