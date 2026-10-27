# Especificação de Produto — Aplicação de Previsão do Tempo (v1)

## Overview

Aplicação web responsiva em português do Brasil para consultar o clima de uma cidade por vez. A pessoa usuária busca e seleciona uma localidade, consulta condições atuais e previsão diária para cinco datas, e escolhe Celsius ou Fahrenheit.

Open-Meteo é a fonte de geocoding e meteorologia; o produto não exige conta. Esta versão fecha as decisões de produto necessárias à implementação. Metas de qualidade são requisitos do aplicativo e não garantias de disponibilidade do provedor externo.

## Functional Requirements

- **RF-01 — Buscar e selecionar cidades:** aceitar nome de cidade, com região e país opcionais para refinar a busca. Após remover espaços externos, exigir ao menos três caracteres e aceitar até 100 caracteres. Exibir no máximo dez resultados, na ordem do provedor. Cada resultado deve mostrar cidade, região e país quando disponíveis; coordenadas identificam resultados que continuem ambíguos. Selecionar um resultado define a localidade consultada.
- **RF-02 — Consultar clima atual:** para a localidade selecionada, apresentar temperatura, condição em texto pt-BR, sensação térmica, umidade relativa em %, velocidade do vento em km/h e horário da observação informado pela fonte. Indicar claramente qualquer campo ausente; observações com mais de duas horas devem ser identificadas como desatualizadas.
- **RF-03 — Consultar previsão de cinco dias:** apresentar uma previsão diária para hoje e os quatro dias seguintes no fuso horário da cidade selecionada. Cada dia contém condição em texto pt-BR, temperaturas mínima e máxima e probabilidade máxima de precipitação em %, quando fornecida pela fonte; campos ausentes são identificados.
- **RF-04 — Alternar unidade de temperatura:** oferecer Celsius e Fahrenheit, com Celsius inicial. A escolha persiste localmente entre visitas no mesmo navegador. Converter todos os valores de temperatura visíveis, arredondados a uma casa decimal, e exibir °C ou °F; não converter outras grandezas.
- **RF-05 — Atualizar dados:** buscar dados ao selecionar uma cidade e oferecer atualização manual. Mostrar o horário da última consulta bem-sucedida. Não atualizar automaticamente.

## User Stories

O discovery não define personas formais nem segmentos de público; define apenas “usuário”. Os papéis funcionais abaixo são derivados das tarefas e necessidades registradas, sem pressupor características demográficas.

- **US-01 — RF-01, busca:** Como usuário que consulta uma cidade, quero pesquisar pelo nome e selecionar uma localidade para ver informações meteorológicas do lugar correto.
- **US-02 — RF-01, cidades homônimas:** Como usuário que encontra cidades com o mesmo nome, quero distinguir os resultados pelas informações de localidade disponíveis para selecionar a cidade desejada.
- **US-03 — RF-02, clima atual:** Como usuário que consulta as condições atuais, quero ver o clima da cidade selecionada para saber as condições meteorológicas desse lugar.
- **US-04 — RF-03, previsão:** Como usuário que consulta os próximos dias, quero ver a previsão de hoje e dos quatro dias seguintes para conhecer as condições esperadas nesse período.
- **US-05 — RF-04, unidade:** Como usuário que prefere Fahrenheit, quero alternar a unidade de temperatura para interpretar os valores na escala que prefiro.
- **US-06 — RF-05, atualização:** Como usuário que precisa de dados recentes, quero atualizar manualmente as consultas para obter a informação mais recente disponível da cidade selecionada.

## Acceptance Criteria

Os critérios estão agrupados por requisito para tornar rastreável a cobertura de cada RF.

### RF-01 — Buscar e selecionar cidades

- **CA-01.1 — Exibir resultados correspondentes**
	- **Given:** a consulta contém de três a 100 caracteres após remover espaços externos e o provedor retorna resultados.
	- **When:** a busca termina com sucesso.
	- **Then:** no máximo dez resultados são exibidos na ordem recebida, cada um como opção selecionável.
- **CA-01.2 — Distinguir cidades homônimas**
	- **Given:** os resultados incluem cidades com o mesmo nome.
	- **When:** a lista de resultados é exibida.
	- **Then:** cada opção exibe cidade, região e país disponíveis; se esses campos não distinguirem os resultados, exibe também as coordenadas retornadas.
- **CA-01.3 — Usar a cidade selecionada**
	- **Given:** a lista contém um resultado de cidade selecionável.
	- **When:** a pessoa usuária seleciona esse resultado.
	- **Then:** a localidade ativa corresponde ao resultado selecionado e as consultas meteorológicas seguintes usam as coordenadas desse resultado.
- **CA-01.4 — Preservar caracteres da busca**
	- **Given:** a pessoa usuária envia “São Paulo” e o provedor retorna esse nome.
	- **When:** os resultados são exibidos.
	- **Then:** o nome aparece como “São Paulo”, sem corrupção de caracteres; espaços externos da consulta não são enviados ao provedor.
- **CA-01.5 — Rejeitar busca inválida**
	- **Given:** o campo está vazio, contém apenas espaços ou tem menos de três caracteres após remover espaços externos.
	- **When:** a pessoa usuária tenta executar a busca.
	- **Then:** nenhum pedido é enviado e a interface informa que a consulta deve conter ao menos três caracteres.
- **CA-01.6 — Tratar geocoding sem resultados**
	- **Given:** o serviço de busca responde com sucesso e uma lista vazia.
	- **When:** a resposta é apresentada.
	- **Then:** a interface informa que nenhum resultado foi encontrado, mantém o campo disponível para nova busca e não solicita dados meteorológicos.
- **CA-01.7 — Tratar falha do geocoding**
	- **Given:** o serviço de busca falha ou excede o limite de espera.
	- **When:** a interface recebe a falha.
	- **Then:** a interface informa que a busca não pôde ser concluída, distingue o estado de uma lista vazia e oferece uma ação para tentar novamente.
- **CA-01.8 — Exibir estado de carregamento da busca**
	- **Given:** a pessoa usuária envia uma consulta válida.
	- **When:** a resposta do serviço ainda não chegou.
	- **Then:** a interface indica que a busca está em andamento e remove esse estado quando recebe uma resposta ou erro.
- **CA-01.9 — Ignorar resposta obsoleta da busca**
	- **Given:** a pessoa usuária envia a consulta A e, antes de sua resposta chegar, envia a consulta B.
	- **When:** a resposta de B chega antes da resposta de A.
	- **Then:** os resultados de B permanecem exibidos e a resposta tardia de A não substitui os resultados atuais.
- **CA-01.10 — Limitar o número de resultados**
	- **Given:** o provedor retorna mais de dez localidades.
	- **When:** os resultados são exibidos.
	- **Then:** são exibidas somente as dez primeiras localidades, preservando a ordem do provedor.
- **CA-01.11 — Rejeitar consulta acima do limite**
	- **Given:** o texto contém mais de 100 caracteres após remover espaços externos.
	- **When:** a pessoa usuária tenta executar a busca.
	- **Then:** nenhum pedido é enviado e a interface informa o limite de 100 caracteres.

### RF-02 — Consultar clima atual

- **CA-02.1 — Exibir clima da cidade selecionada**
	- **Given:** uma localidade está selecionada e a consulta retorna os campos atuais previstos em RF-02.
	- **When:** a seção de clima atual é exibida.
	- **Then:** cidade, região/país, temperatura com unidade, condição em pt-BR, sensação térmica, umidade em %, velocidade do vento em km/h e horário da observação são apresentados, sem dados de outra localidade.
- **CA-02.2 — Não apresentar consulta atual indisponível como válida**
	- **Given:** uma cidade está selecionada e a consulta do clima atual falha ou não retorna dados.
	- **When:** a seção de clima atual é exibida.
	- **Then:** nenhum valor da consulta é apresentado como atual, a interface informa que os dados estão indisponíveis e oferece uma ação para tentar novamente.
- **CA-02.3 — Exibir estado de carregamento do clima atual**
	- **Given:** uma cidade está selecionada e a consulta de clima atual foi iniciada.
	- **When:** a resposta ainda não chegou.
	- **Then:** a interface indica que os dados estão sendo carregados e encerra esse estado ao receber dados ou erro.
- **CA-02.4 — Identificar campo atual ausente**
	- **Given:** a resposta atual contém alguns, mas não todos, os campos definidos em RF-02.
	- **When:** a seção atual é exibida.
	- **Then:** campos recebidos são apresentados e cada campo ausente é marcado como indisponível, sem valor inventado.
- **CA-02.5 — Identificar observação desatualizada**
	- **Given:** o horário da observação retornado pela fonte é mais antigo que duas horas em relação ao horário atual da cidade.
	- **When:** a seção de clima atual é exibida.
	- **Then:** o horário de observação é apresentado e os dados são identificados como desatualizados, não como atuais.

### RF-03 — Consultar previsão de cinco dias

- **CA-03.1 — Exibir cinco dias de previsão**
	- **Given:** uma cidade está selecionada e há previsão para a data local D e os quatro dias locais seguintes.
	- **When:** a seção de previsão é exibida.
	- **Then:** são exibidos cinco registros diários em ordem, para D a D+4 no fuso da cidade, cada um com condição, mínima, máxima e probabilidade máxima de precipitação disponíveis.
- **CA-03.2 — Não apresentar previsão indisponível como válida**
	- **Given:** uma cidade está selecionada e a consulta de previsão falha ou não retorna dados.
	- **When:** a seção de previsão é exibida.
	- **Then:** nenhum dado da consulta é apresentado como previsão válida, a interface informa que a previsão está indisponível e oferece uma ação para tentar novamente.
- **CA-03.3 — Identificar previsão parcial**
	- **Given:** há dados de previsão para três das cinco datas solicitadas e não há dados para as outras duas.
	- **When:** a seção de previsão é exibida.
	- **Then:** os dados das três datas disponíveis são apresentados, as duas datas ausentes são identificadas como indisponíveis e a previsão não é indicada como completa.
- **CA-03.4 — Exibir estado de carregamento da previsão**
	- **Given:** uma cidade está selecionada e a consulta de previsão foi iniciada.
	- **When:** a resposta ainda não chegou.
	- **Then:** a interface indica que a previsão está sendo carregada e encerra esse estado ao receber dados ou erro.
- **CA-03.5 — Identificar campo diário ausente**
	- **Given:** um registro diário não contém probabilidade máxima de precipitação.
	- **When:** esse dia é exibido.
	- **Then:** os campos disponíveis são exibidos e a probabilidade em % é identificada como indisponível, sem ser mostrada como zero.

### RF-04 — Alternar unidade de temperatura

- **CA-04.1 — Usar Celsius por padrão**
	- **Given:** não há preferência de unidade previamente definida.
	- **When:** uma temperatura é exibida.
	- **Then:** o valor é apresentado com uma casa decimal e identificado com °C.
- **CA-04.2 — Converter Celsius para Fahrenheit**
	- **Given:** temperaturas de 20 °C e -40 °C são exibidas.
	- **When:** a pessoa usuária seleciona Fahrenheit.
	- **Then:** os valores correspondentes são exibidos como 68,0 °F e -40,0 °F.
- **CA-04.3 — Converter Fahrenheit para Celsius**
	- **Given:** temperaturas de 68 °F e -40 °F são exibidas.
	- **When:** a pessoa usuária seleciona Celsius.
	- **Then:** os valores correspondentes são exibidos como 20,0 °C e -40,0 °C.
- **CA-04.4 — Aplicar a unidade selecionada em todas as consultas**
	- **Given:** há temperaturas disponíveis tanto no clima atual quanto na previsão e a pessoa usuária selecionou uma unidade.
	- **When:** as duas seções são exibidas.
	- **Then:** todas as temperaturas nas duas seções são apresentadas com uma casa decimal e o símbolo correspondente (°C ou °F), sem alterar os demais dados.
- **CA-04.5 — Persistir a unidade escolhida**
	- **Given:** a pessoa usuária seleciona Fahrenheit e fecha ou atualiza a aplicação no mesmo navegador.
	- **When:** abre a aplicação novamente.
	- **Then:** a unidade permanece Fahrenheit; em outro navegador sem preferência armazenada, o padrão é Celsius.
- **CA-04.6 — Arredondar temperatura convertida**
	- **Given:** a temperatura de origem é 12,34 °C.
	- **When:** a pessoa usuária seleciona Fahrenheit.
	- **Then:** o valor exibido é 54,2 °F.

### RF-05 — Atualizar dados

- **CA-05.1 — Consultar ao selecionar cidade**
	- **Given:** a pessoa usuária seleciona um resultado de cidade.
	- **When:** a seleção é concluída.
	- **Then:** as consultas de clima atual e previsão são iniciadas usando as coordenadas selecionadas.
- **CA-05.2 — Atualizar manualmente**
	- **Given:** uma cidade está selecionada e há dados previamente carregados.
	- **When:** a pessoa usuária aciona “Atualizar”.
	- **Then:** as duas consultas são refeitas para as coordenadas selecionadas e o horário da consulta bem-sucedida é atualizado.
- **CA-05.3 — Não atualizar automaticamente**
	- **Given:** os dados foram carregados e a pessoa usuária não solicita atualização nem troca a cidade.
	- **When:** passam cinco minutos.
	- **Then:** nenhuma consulta automática é iniciada.

## Non-Functional Requirements

- **RNF-01 — Localização:** textos, números e datas seguem pt-BR. Horários da previsão usam o fuso local da cidade; horário da observação usa o horário informado pela fonte no mesmo fuso.
- **RNF-02 — Responsividade:** suportar viewports de 320 a 1920 CSS px, sem rolagem horizontal da página, controles sobrepostos ou conteúdo essencial cortado. Validar ao menos 320, 375, 768, 1024 e 1440 CSS px.
- **RNF-03 — Acessibilidade:** atender WCAG 2.2 nível AA nos fluxos de busca, seleção, consulta e troca de unidade. Todos os controles devem funcionar por teclado e estados de carregamento/erro devem ser anunciáveis por tecnologia assistiva.
- **RNF-04 — Compatibilidade:** suportar as duas versões estáveis mais recentes de Chrome, Edge, Firefox e Safari, além de Safari no iOS e Chrome no Android nas versões estáveis atuais.
- **RNF-05 — Desempenho e timeout:** em testes com RTT de 100 ms e largura de banda de 50 Mbps, 95% das buscas e consultas bem-sucedidas devem renderizar em até 3 s. Cada requisição expira após 10 s; a interface encerra o carregamento e apresenta erro recuperável.
- **RNF-06 — Disponibilidade do shell:** verificações HTTP sintéticas executadas a cada cinco minutos devem receber resposta 200 e carregar o shell em pelo menos 99,5% das verificações por mês. Indisponibilidade de Open-Meteo é medida separadamente e não conta como falha do shell.
- **RNF-07 — Dependência externa:** não há SLA assumido para Open-Meteo. Indisponibilidade do provedor não deve impedir a interface de carregar; a seção afetada deve exibir erro e oferecer nova tentativa manual.
- **RNF-08 — Segurança e privacidade:** servir a aplicação por HTTPS; tratar entradas da busca como texto, sem executar conteúdo fornecido pela pessoa usuária. Não coletar nem persistir dados pessoais; persistir somente a unidade localmente no navegador.
- **RNF-09 — Fonte de dados:** usar Open-Meteo para geocoding e meteorologia, sem exigir conta ou chave da pessoa usuária. Consultas meteorológicas usam latitude e longitude do resultado explicitamente selecionado.

## Edge Cases

- **Cidade inexistente:** quando a busca por um nome válido não corresponder a nenhuma cidade, informar que a cidade não foi encontrada, não selecionar uma localidade nem solicitar dados meteorológicos, e permitir uma nova busca.
- **Input inválido:** se o campo estiver vazio, contiver apenas espaços ou tiver menos de três caracteres após remover espaços externos, não enviar consulta; informar o mínimo de três caracteres. Rejeitar entradas acima de 100 caracteres antes da chamada.
- **Caracteres especiais:** enviar a consulta como texto, preservar acentos e pontuação e exibir corretamente os caracteres retornados. Remover espaços externos; não normalizar acentos ou pontuação localmente.
- **Geocoding sem resultados:** quando o serviço de geocoding responder com uma lista vazia, informar que nenhum resultado foi encontrado, manter a busca disponível para edição e não iniciar consulta meteorológica. Esse estado deve ser distinto de erro ou indisponibilidade do serviço.
- **Cidades homônimas:** exibir cidade, região e país quando disponíveis; se ainda forem indistinguíveis, exibir as coordenadas retornadas.
- **Falha da API ou erro de rede:** informar que a consulta falhou, manter a cidade selecionada, não exibir dados antigos como atuais e oferecer uma ação para tentar novamente. Uma falha técnica não deve ser apresentada como uma busca sem resultados.
- **Timeout:** após 10 segundos sem resposta, encerrar o estado de carregamento, informar que a consulta excedeu o limite e oferecer nova tentativa manual. Não repetir automaticamente.
- **Respostas fora de ordem:** se uma busca nova for enviada antes de uma busca anterior terminar, somente a resposta da consulta mais recente pode atualizar a lista exibida.
- **Resposta parcial:** exibir campos recebidos e válidos; identificar campos ausentes como indisponíveis, sem substituí-los por valores presumidos. Se faltarem dias, mostrar as datas sem previsão e indicar que a cobertura está incompleta.
- **Mudança de unidade durante erro ou carregamento:** quando a pessoa usuária alternar Celsius/Fahrenheit, aplicar a unidade escolhida a todos os valores disponíveis quando forem exibidos; não converter ou inventar valores ausentes.

## Assumptions

- A aplicação atende uma cidade por vez; comparação simultânea entre cidades não foi solicitada.
- A busca é iniciada por texto digitado. Geolocalização não foi solicitada.
- A previsão é diária para cinco datas no fuso local da cidade; “hoje” é a data local da localidade selecionada.
- Celsius é a unidade padrão.
- Alternar unidades afeta somente valores de temperatura, não outras unidades meteorológicas.
- A experiência inicial é uma aplicação web responsiva, com interface em pt-BR.
- Open-Meteo é a fonte de dados; a aplicação não promete SLA para disponibilidade ou cobertura do provedor.
- Não haverá autenticação nem persistência no servidor. A unidade é persistida somente no navegador; cidade selecionada e resultados não são persistidos após encerrar a sessão.
- A busca usa nome de cidade com região/país opcionais; código postal e localização atual não são entradas aceitas.
- Como o discovery não nomeia personas, as user stories usam papéis genéricos baseados nas tarefas e preferências descritas.

## Risks

- **Seleção de cidade incorreta:** homônimos podem levar a uma consulta equivocada. Mitigação: apresentar região, país e coordenadas quando necessários; consultar sempre pelas coordenadas do resultado selecionado.
- **Indisponibilidade ou cobertura incompleta do provedor:** pode impedir ou limitar dados. Mitigação: erro recuperável, indicação de campos ausentes e ausência de SLA assumido para o provedor.
- **Dados atuais desatualizados:** observações antigas podem ser confundidas com atuais. Mitigação: mostrar horário da observação e marcar dados com mais de duas horas como desatualizados.
- **Compatibilidade ou acessibilidade insuficiente:** mitigação: executar a matriz de navegadores, viewports e WCAG definida nos RNFs antes da entrega.

## Out of Scope

- Autenticação, contas de usuário e persistência de dados no servidor.
- Comparação simultânea de várias cidades.
- Geolocalização automática, busca pela localização atual e busca por código postal.
- Persistência da cidade consultada, histórico de consultas, favoritos e acompanhamento de várias cidades.
- Notificações.
- Aplicativos nativos para iOS ou Android; a entrega é web responsiva.
- Suporte a idiomas além de pt-BR.
- Escolha ou configuração de outras fontes meteorológicas além de Open-Meteo.
- Dados meteorológicos históricos, alertas severos e recomendações personalizadas.

## Open Questions

Nenhuma decisão bloqueadora permanece para o baseline v1 definido nesta especificação. A persona é genérica (pessoa que consulta o tempo); ampliar público, plataformas ou funcionalidades requer atualizar requisitos e critérios de aceite.

## Traceability

Cada linha liga a história aos critérios que a verificam e aos RNFs que condicionam sua implementação ou validação.

| User Story | Acceptance Criteria | Requisitos não funcionais relevantes |
| --- | --- | --- |
| US-01 — Buscar e selecionar uma cidade | CA-01.1, CA-01.3–CA-01.11 | RNF-01–RNF-09 |
| US-02 — Distinguir cidades homônimas | CA-01.1–CA-01.3 | RNF-01–RNF-09 |
| US-03 — Consultar clima atual | CA-02.1–CA-02.5 | RNF-01–RNF-07, RNF-09 |
| US-04 — Consultar previsão de cinco dias | CA-03.1–CA-03.5 | RNF-01–RNF-07, RNF-09 |
| US-05 — Alternar unidade de temperatura | CA-04.1–CA-04.6 | RNF-01–RNF-04, RNF-08 |
| US-06 — Atualizar dados manualmente | CA-02.2–CA-02.3, CA-03.2, CA-03.4, CA-05.1–CA-05.3 | RNF-01–RNF-07, RNF-09 |