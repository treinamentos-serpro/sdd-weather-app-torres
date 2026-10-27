# Memória da conversa — Weather App

## Objetivo e escopo

O briefing solicita uma aplicação de previsão do tempo em que usuários possam buscar cidades, consultar o clima atual, ver a previsão de cinco dias, alternar entre Celsius e Fahrenheit e usar o produto em dispositivos móveis. O fluxo do repositório é Spec-Driven Development (SDD); o discovery foi trabalhado antes da especificação de produto. Esta memória consolida a conversa para apoiar as próximas etapas.

## Decisões confirmadas

- **Fonte de dados:** Open-Meteo, sem API key.
- **Período da previsão:** hoje mais os quatro dias seguintes.
- **Unidade padrão:** Celsius; o usuário também pode alternar para Fahrenheit.
- **Idioma inicial da interface:** pt-BR.
- **Autenticação e persistência:** sem autenticação e sem persistência no servidor.

Essas decisões estão registradas em `specs/discovery.md`, na seção “Decisões”. A persistência local de preferências ou de cidade, favoritos e múltiplas cidades ainda não foi decidida.

## Requisitos identificados

### Funcionais

- Pesquisar cidades e selecionar uma localidade para consulta.
- Apresentar as condições meteorológicas atuais da cidade selecionada.
- Apresentar a previsão para hoje e os quatro dias seguintes.
- Permitir alternar entre Celsius e Fahrenheit e refletir a escolha nos valores de temperatura.

### Não funcionais

- A aplicação deve ser utilizável em dispositivos móveis. A interpretação provisória é uma aplicação web responsiva; aplicativos nativos não foram confirmados.
- Busca, seleção da cidade e leitura das informações devem funcionar em telas móveis sem perda de conteúdo ou de funcionalidades essenciais.
- Ainda faltam metas mensuráveis de desempenho, disponibilidade, acessibilidade, compatibilidade entre navegadores e segurança.

A classificação discutida foi: busca, consulta do clima, previsão e alternância de unidade são requisitos funcionais; suporte móvel e responsividade são não funcionais. No discovery, RNF-01 e RNF-02 se sobrepõem e podem ser consolidados em um requisito responsivo testável.

## Perguntas e lacunas pendentes

- Quais entradas a busca aceita (nome, região, país, código postal) e como desambigua cidades homônimas?
- Quais campos compõem “clima atual” (temperatura, sensação térmica, condição, umidade, vento etc.)?
- A previsão será diária, horária ou combinada? Qual fuso horário define “hoje” para cada cidade?
- Quais requisitos de cobertura, atualização, disponibilidade e limites de uso do Open-Meteo devem ser atendidos?
- Como tratar busca sem resultados, timeout, falha, dados parciais e dados antigos? Deve haver cache e qual a idade máxima aceitável?
- A preferência por unidade e a última cidade devem persistir localmente? Favoritos ou acompanhamento de várias cidades fazem parte do escopo?
- Quais tamanhos de tela, plataformas, navegadores, métricas de desempenho, disponibilidade, acessibilidade e segurança serão critérios de aceite?
- O produto atenderá outros países ou idiomas além de pt-BR? Geolocalização não foi solicitada.
- Público-alvo, necessidades prioritárias e métricas de sucesso de negócio ainda não foram definidos.

## Riscos discutidos

- Dependência do provedor: indisponibilidade, limite de requisições, cobertura ou qualidade inadequadas podem interromper consultas.
- Busca ambígua pode fazer o usuário selecionar a cidade errada.
- Definição incompleta de dados, dias e fuso horário pode gerar resultados inconsistentes com a expectativa.
- Dados desatualizados apresentados como atuais prejudicam confiança e podem induzir decisões erradas.
- Falta de comportamento definido para erros e respostas incompletas pode resultar em experiência quebrada.
- Falta de critérios móveis, de acessibilidade e de desempenho pode deixar a aplicação tecnicamente funcional, mas difícil de usar.
- Sem público-alvo e métricas de sucesso, há risco de entregar funcionalidades sem validar o problema de produto.
- Se geolocalização vier a ser incluída, será necessário decidir consentimento, privacidade e tratamento dos dados; ela não faz parte do escopo confirmado.

As probabilidades discutidas anteriormente eram estimativas iniciais, não resultados de análise quantitativa. O risco de provedor/API foi considerado alto; busca ambígua, falhas de dados, dados antigos e experiência móvel têm impacto potencial alto.

## Personas hipotéticas

As personas foram propostas como hipóteses, pois não houve pesquisa com usuários:

- **Marina, usuária do dia a dia:** consulta o clima atual no celular antes de sair. Métrica proposta: encontrar a cidade e entender as condições em menos de 30 segundos, sem repetir a busca.
- **Rafael, planejador de atividades:** compara a previsão de cinco dias, em celular ou desktop. Métrica proposta: identificar as condições dos cinco dias e decidir sem ambiguidade sobre as datas.
- **Camila, viajante entre regiões:** pesquisa cidades e prefere uma unidade de temperatura específica, em celular durante deslocamentos e desktop no planejamento. Métrica proposta: selecionar a cidade correta e visualizar as temperaturas na unidade escolhida.

Os limites de tempo acima são hipóteses e devem ser validados com usuários.

## Sugestões de requisitos não funcionais mensuráveis

Valores apresentados como ponto de partida para aprovação, não como decisões confirmadas:

- **Performance:** após resposta bem-sucedida da fonte, exibir dados em até 3 segundos para 95% das consultas em condições normais de rede.
- **Acessibilidade:** WCAG 2.2 AA; fluxos principais operáveis por teclado, com foco visível e nomes acessíveis.
- **Responsividade:** suportar larguras de 360 px a 1440 px sem rolagem horizontal na experiência principal, preservando as funcionalidades essenciais.
- **Disponibilidade:** 99,5% mensal para serviços sob controle da aplicação, definindo separadamente como contabilizar falhas do provedor.
- **Compatibilidade:** especificar navegadores e versões suportados antes de fixar os critérios de teste.

## Próxima etapa

O arquivo `specs/discovery.md` contém as seções Contexto, Requisitos Funcionais, Requisitos Não-Funcionais, Riscos, Perguntas em Aberto, Suposições e Decisões. A especificação completa `specs/weather-app-spec.md` ainda não foi criada nesta conversa. Antes de finalizar critérios de aceite, priorizar decisões sobre campos meteorológicos, forma da previsão/fuso, busca e desambiguação, política de atualização/falhas e metas mensuráveis de qualidade. As lacunas que não forem resolvidas devem permanecer explicitamente como perguntas ou premissas na spec.
