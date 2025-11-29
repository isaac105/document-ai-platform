import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Document } from './document.entity';

@Entity('document_chunks')
export class DocumentChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  documentId: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column({ type: 'text' })
  content: string; // 청크된 텍스트 조각

  @Column({ type: 'int' })
  chunkIndex: number; // 문서 내 순서

  @Column({ type: 'int' })
  startPosition: number; // 원본 문서에서의 시작 위치

  @Column({ type: 'int' })
  endPosition: number; // 원본 문서에서의 끝 위치

  // pgvector를 위한 임베딩 컬럼
  @Column({
    type: 'vector',
    length: 1536, // .env의 VECTOR_DIMENSION과 일치
  })
  @Index('document_chunks_embedding_idx', { synchronize: false })
  embedding: string; // pgvector 타입

  @CreateDateColumn()
  createdAt: Date;
}
