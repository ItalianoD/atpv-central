# Política de segurança

## Versões suportadas

A versão mais recente publicada no branch `main` recebe correções de segurança.

## Como reportar uma vulnerabilidade

Não publique certificados, chaves, senhas, dados de veículos ou informações pessoais em uma issue pública.

Use o recurso **Report a vulnerability** na aba **Security** do repositório para enviar um relato privado. Inclua uma descrição do impacto, os passos mínimos para reprodução e a versão afetada, sem anexar credenciais ou documentos reais.

## Materiais que nunca devem ser enviados ao repositório

- Certificados `.pfx`, `.p12`, `.pem`, `.cer` ou `.crt`.
- Chaves privadas `.key`, `.jks` ou `.keystore`.
- Senhas, PINs, tokens e cookies.
- Arquivos `.env` reais.
- PDFs de ATPV-e ou outros documentos veiculares.
- Placas, Renavams, chassis, CPFs ou CNPJs utilizados em consultas reais.

O `.gitignore` bloqueia os formatos mais comuns, mas cada colaborador deve revisar as alterações antes de fazer um commit.
