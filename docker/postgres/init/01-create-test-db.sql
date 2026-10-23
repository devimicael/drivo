-- Banco isolado para os testes e2e da API.
-- Executado apenas na inicialização do volume (docker-entrypoint-initdb.d).
-- Para recriar: docker compose down -v && docker compose up -d postgres
CREATE DATABASE drivo_test OWNER drivo;
