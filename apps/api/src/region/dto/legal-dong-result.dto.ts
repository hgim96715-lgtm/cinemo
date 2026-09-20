import { ApiProperty } from '@nestjs/swagger';

export class LegalDongResultDto {
  @ApiProperty({ example: 'INFO-0', description: 'API 처리 결과 코드' })
  resultCode!: string;

  @ApiProperty({
    example: 'NOMAL SERVICE',
    description: 'API 처리 결과 메시지',
  })
  resultMsg!: string;
}
