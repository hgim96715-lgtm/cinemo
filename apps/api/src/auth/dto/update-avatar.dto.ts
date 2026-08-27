import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SolidOutfitDto {
  @IsIn(['solid'])
  type!: 'solid';

  @IsOptional()
  @IsIn(['basic', 'staff', 'velvet', 'tuxedo', 'hoodie', 'knit'])
  preset?: 'basic' | 'staff' | 'velvet' | 'tuxedo' | 'hoodie' | 'knit';

  @IsString()
  color!: string;
}

class StripeOutfitDto {
  @IsIn(['stripe'])
  type!: 'stripe';

  @IsOptional()
  @IsIn(['basic', 'staff', 'velvet', 'tuxedo', 'hoodie', 'knit'])
  preset?: 'basic' | 'staff' | 'velvet' | 'tuxedo' | 'hoodie' | 'knit';

  @IsString()
  color1!: string;

  @IsString()
  color2!: string;
}

class DotsOutfitDto {
  @IsIn(['dots'])
  type!: 'dots';

  @IsOptional()
  @IsIn(['basic', 'staff', 'velvet', 'tuxedo', 'hoodie', 'knit'])
  preset?: 'basic' | 'staff' | 'velvet' | 'tuxedo' | 'hoodie' | 'knit';

  @IsString()
  color1!: string;

  @IsString()
  color2!: string;
}

class OutfitDto {
  @IsIn(['solid', 'stripe', 'dots'])
  type!: 'solid' | 'stripe' | 'dots';
}

export class UpdateAvatarDto {
  @IsIn(['cap', 'beanie', 'crown', 'beret', 'director', 'popcorn', 'none'])
  hat!: 'cap' | 'beanie' | 'crown' | 'beret' | 'director' | 'popcorn' | 'none';

  @IsString()
  hatColor!: string;

  @IsString()
  skinColor!: string;

  @IsIn(['normal', 'crescent', 'dot'])
  eyeStyle!: 'normal' | 'crescent' | 'dot';

  @IsOptional()
  @IsIn(['natural', 'raised', 'soft'])
  eyebrowStyle?: 'natural' | 'raised' | 'soft';

  @IsOptional()
  @IsIn(['none', 'round', 'square'])
  glassesStyle?: 'none' | 'round' | 'square';

  @IsOptional()
  @IsIn(['none', 'short', 'bob'])
  hairStyle?: 'none' | 'short' | 'bob';

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  blushColor!: string | null;

  @IsIn(['smile', 'open', 'neutral', 'surprised', 'pout'])
  mouthStyle!: 'smile' | 'open' | 'neutral' | 'surprised' | 'pout';

  @IsObject()
  @ValidateNested()
  @Type(() => OutfitDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: SolidOutfitDto, name: 'solid' },
        { value: StripeOutfitDto, name: 'stripe' },
        { value: DotsOutfitDto, name: 'dots' },
      ],
    },
  })
  outfit!: SolidOutfitDto | StripeOutfitDto | DotsOutfitDto;
}
