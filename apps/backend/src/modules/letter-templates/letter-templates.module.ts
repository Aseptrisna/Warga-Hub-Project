import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LetterTemplatesService } from './letter-templates.service';
import { LetterTemplatesController } from './letter-templates.controller';
import { LetterTemplate, LetterTemplateSchema } from './schemas/letter-template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LetterTemplate.name, schema: LetterTemplateSchema },
    ]),
  ],
  controllers: [LetterTemplatesController],
  providers: [LetterTemplatesService],
  exports: [LetterTemplatesService],
})
export class LetterTemplatesModule {}
