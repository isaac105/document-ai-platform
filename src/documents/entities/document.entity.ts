import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column()
  filePath: string;

  @Column({ type: 'text' })
  content: string; // 파싱된 텍스트 내용

  @Column({ type: 'text', nullable: true })
  summary: string; // AI가 생성한 요약

  @Column({ default: 'pending' })
  @Index()
  status: string; // pending, processing, completed, failed

  @Column({ nullable: true })
  uploadedBy: string; // 업로드한 사용자 (추후 인증 구현 시 사용)

  @Column({ nullable: true })
  team: string; // 팀 정보

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
