# ATPV Central

Portal local e de código aberto para consultar e baixar o PDF da ATPV-e pelo Web Service oficial do RENAVE.

> Este é um projeto independente. Ele não é um produto oficial da SENATRAN, do SERPRO ou do RENAVE.

## O que o sistema faz

- Lista os certificados digitais ICP-Brasil válidos instalados no perfil do Windows.
- Consulta a ATPV-e por placa + Renavam ou por chassi.
- Converte o PDF retornado pelo RENAVE em Base64 para visualização e download.
- Mantém a chave privada dentro do repositório de certificados do Windows.
- Restringe o portal ao próprio computador (`127.0.0.1`).
- Aceita comunicação somente com os hosts oficiais de produção e homologação do RENAVE/SERPRO.

O sistema é somente para consulta da ATPV-e. Ele não realiza entrada ou saída de estoque.

## Requisitos

- Windows 10 ou Windows 11.
- PowerShell 5.1 ou superior.
- [Node.js 22 ou superior](https://nodejs.org/).
- Certificado digital ICP-Brasil com chave privada instalado em `Certificados do Usuário Atual > Pessoal` no Windows.
- Estabelecimento credenciado no RENAVE.
- Certificado previamente cadastrado e autorizado no Credencia/SENATRAN.
- Permissão para acessar a ATPV-e consultada. O RENAVE limita o acesso aos estabelecimentos relacionados ao documento.

O certificado que já funciona no Swagger do RENAVE normalmente atende aos requisitos de autenticação.

## Instalação rápida

1. Baixe o código em **Code > Download ZIP** nesta página.
2. **Descompacte todo o arquivo** em uma pasta local. Não execute o sistema diretamente de dentro do ZIP.
3. Dê dois cliques em `INICIAR.bat`.
4. Na primeira execução, aguarde a instalação dos componentes.
5. O navegador abrirá `http://localhost:3000`.

O portal deve ser executado no mesmo usuário do Windows em que o certificado está instalado.

## Instalação pelo terminal

```powershell
git clone https://github.com/ItalianoD/atpv-central.git
cd atpv-central
npm install
npm run dev
```

Depois, acesse [http://localhost:3000](http://localhost:3000).

Para gerar e executar a versão de produção local:

```powershell
npm run build
npm start
```

## Configuração do ambiente RENAVE

Produção é o ambiente padrão:

```text
https://renave.estaleiro.serpro.gov.br/renave-ws
```

Para usar homologação, copie `.env.example` para `.env.local` e ajuste `RENAVE_BASE_URL` para o endereço oficial de homologação:

```env
RENAVE_BASE_URL=https://hom.renave.estaleiro.serpro.gov.br/renave-ws
```

Somente os dois hosts oficiais acima são aceitos pelo aplicativo.

## Como usar

1. Abra o ATPV Central.
2. Selecione o mesmo certificado utilizado no Swagger.
3. Escolha a consulta por **Placa + Renavam** ou **Chassi**.
4. Preencha os dados e clique em **Consultar ATPV-e**.
5. Visualize ou baixe o PDF retornado.

## Segurança

- Nenhum certificado, chave privada ou senha é incluído neste repositório.
- O aplicativo lê somente os metadados dos certificados ICP-Brasil válidos instalados no Windows.
- A chave privada não é exportada: o próprio Windows a utiliza para a autenticação mútua TLS.
- O servidor escuta somente em `127.0.0.1`; outros dispositivos da rede não conseguem acessá-lo.
- As APIs recusam chamadas cuja origem não seja local.
- A consulta permite somente os endpoints de PDF da ATPV-e.
- O PDF e os metadados de certificados usam `Cache-Control: no-store`.
- Extensões comuns de certificados, chaves e arquivos de ambiente estão bloqueadas no `.gitignore`.

Não altere o aplicativo para disponibilizá-lo diretamente na internet sem implementar autenticação, autorização por usuário, TLS, auditoria, limites de requisição e gestão segura de certificados. Não copie arquivos `.pfx`, `.p12`, `.pem` ou `.key` para a pasta do projeto.

Consulte também a [política de segurança](SECURITY.md).

## Solução de problemas

### Nenhum certificado encontrado

- Confirme que o certificado está instalado no perfil do usuário atual e possui chave privada.
- Abra `certmgr.msc` e verifique a pasta **Pessoal > Certificados**.
- Confirme que o certificado está válido e pertence à cadeia ICP-Brasil.
- Execute o portal com o mesmo usuário utilizado para acessar o Swagger.

### Erro ao executar `INICIAR.bat`

- Confirme que o ZIP foi completamente descompactado antes da execução.
- Não execute `INICIAR.bat` dentro da visualização de arquivos compactados do Windows.
- Verifique se o Node.js 22 ou superior está instalado.
- Feche outro programa que esteja utilizando a porta 3000.
- Leia a mensagem mantida na janela: o inicializador agora informa se faltam arquivos, Node.js, acesso à internet ou componentes.

### Erro 401 ou 403 do RENAVE

O certificado foi apresentado, mas não está autenticado ou autorizado para a operação. Confirme o cadastro do certificado e do estabelecimento no Credencia/SENATRAN.

### ATPV-e não encontrada ou acesso negado

O estabelecimento autenticado precisa estar relacionado à ATPV-e conforme as regras do RENAVE. Confira placa, Renavam ou chassi e a situação do documento.

### Alerta de hidratação no desenvolvimento

Algumas extensões do navegador adicionam atributos à página antes do React carregar. Teste em uma janela anônima ou desative extensões como ferramentas de cores e atalhos. Esse alerta não indica falha na consulta ao RENAVE.

## Desenvolvimento

```powershell
npm install
npm run lint
npm run build
npm run dev
```

Principais arquivos:

- `app/page.tsx`: interface do portal.
- `app/api/certificates/route.ts`: lista segura de certificados do Windows.
- `app/api/atpv/route.ts`: validação e entrega do PDF.
- `scripts/renave-request.ps1`: chamada autenticada ao RENAVE.

Documentação oficial utilizada:

- [Manual do RENAVE](https://renave.estaleiro.serpro.gov.br/renave-ws/manual/)
- [Obter PDF de ATPV-e](https://renave.estaleiro.serpro.gov.br/renave-ws/manual/obter-pdf-atpv)
- [Uso de certificados digitais](https://renave.estaleiro.serpro.gov.br/renave-ws/manual/dicas-ssl)

## Uso responsável

Utilize o projeto apenas com certificados e dados para os quais você possui autorização. O operador é responsável pelo cumprimento das regras do RENAVE, da legislação aplicável e das obrigações de proteção de dados.

## Licença

[MIT](LICENSE)
