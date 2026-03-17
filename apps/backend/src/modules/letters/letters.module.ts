import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LettersService } from './letters.service';
import { LettersController } from './letters.controller';
import { Letter, LetterSchema } from './schemas/letter.schema';
import { LetterTemplate, LetterTemplateSchema } from '../letter-templates/schemas/letter-template.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Letter.name, schema: LetterSchema },
      { name: LetterTemplate.name, schema: LetterTemplateSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [LettersController],
  providers: [LettersService],
  exports: [LettersService],
})
export class LettersModule {}
