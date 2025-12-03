import 'reflect-metadata';
import { validate, Environment } from './env.validation';

describe('env.validation', () => {
  it('필수 환경변수가 모두 있으면 객체를 반환한다', () => {
    const cfg = validate({
      NODE_ENV: 'development',
      PORT: 3000,
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_USERNAME: 'user',
      DB_PASSWORD: 'pass',
      DB_DATABASE: 'db',
      LLM_BASE_URL: 'https://example.com',
      LLM_API_KEY: 'key',
      LLM_MODEL: 'model',
      LLM_CHAT_PATH: '/v1/chat',
      LLM_EMBEDDING_PATH: '/v1/embeddings',
      LLM_EMBEDDING_MODEL: 'embed-model',
    });

    expect(cfg.NODE_ENV).toBe(Environment.DEVELOPMENT);
    expect(cfg.PORT).toBe(3000);
    expect(cfg.DB_HOST).toBe('localhost');
  });

  it('필수 값이 빠지면 에러를 던진다', () => {
    expect(() =>
      validate({
        // DB_HOST 누락
        NODE_ENV: 'development',
        PORT: 3000,
        DB_PORT: 5432,
        DB_USERNAME: 'user',
        DB_PASSWORD: 'pass',
        DB_DATABASE: 'db',
        LLM_BASE_URL: 'https://example.com',
        LLM_API_KEY: 'key',
        LLM_MODEL: 'model',
        LLM_CHAT_PATH: '/v1/chat',
        LLM_EMBEDDING_PATH: '/v1/embeddings',
        LLM_EMBEDDING_MODEL: 'embed-model',
      }),
    ).toThrow();
  });
});
