import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVectorIndex1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // pgvector 확장 활성화
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // HNSW 인덱스 생성 (빠른 유사도 검색)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
      ON document_chunks 
      USING hnsw (embedding vector_cosine_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS document_chunks_embedding_idx`,
    );
  }
}
