import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DEFAULT_LOBBY_GUIDE_STEPS,
  type LobbyGuide,
  type LobbyGuideStep,
  type UpdateLobbyGuideInput,
} from '@cinemo/shared';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuideService {
  constructor(private readonly prisma: PrismaService) {}

  private parseSteps(value: unknown): LobbyGuideStep[] {
    if (!Array.isArray(value)) return [];

    return value.filter((step): step is LobbyGuideStep =>
      Boolean(
        step &&
        typeof step === 'object' &&
        typeof step.id === 'string' &&
        typeof step.kicker === 'string' &&
        typeof step.title === 'string' &&
        typeof step.body === 'string',
      ),
    );
  }
  private toGuide(row: {
    id: string;
    key: string;
    steps: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): LobbyGuide {
    return {
      id: row.id,
      key: row.key,
      steps: this.parseSteps(row.steps),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async ensureGuide() {
    const guide = await this.prisma.lobbyGuide.upsert({
      where: { key: 'guide' },
      create: {
        key: 'guide',
        steps: DEFAULT_LOBBY_GUIDE_STEPS as unknown as Prisma.InputJsonValue,
      },
      update: {},
    });

    if (this.parseSteps(guide.steps).length > 0) {
      return guide;
    }

    return this.prisma.lobbyGuide.update({
      where: { id: guide.id },
      data: {
        steps: DEFAULT_LOBBY_GUIDE_STEPS as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async getGuide(): Promise<LobbyGuide> {
    const guide = await this.ensureGuide();
    return this.toGuide(guide);
  }

  async updateGuide(input: UpdateLobbyGuideInput): Promise<LobbyGuide> {
    const steps = input.steps.map((step) => ({
      id: step.id.trim(),
      kicker: step.kicker.trim(),
      title: step.title.trim(),
      body: step.body.trim(),
    }));

    if (steps.length === 0) {
      throw new BadRequestException(
        '가이드 단계를 최소 1개 이상 입력해야 합니다.',
      );
    }

    if (
      steps.some(
        (step) => !step.id || !step.kicker || !step.title || !step.body,
      )
    ) {
      throw new BadRequestException(
        '가이드의 ID, Kicker, 제목, 본문을 모두 입력해야 합니다.',
      );
    }

    const ids = steps.map((step) => step.id);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('가이드의 ID는 중복될 수 없습니다.');
    }
    const guide = await this.ensureGuide();
    const updated = await this.prisma.lobbyGuide.update({
      where: { id: guide.id },
      data: { steps: steps as unknown as Prisma.InputJsonValue },
    });

    return this.toGuide(updated);
  }
}
