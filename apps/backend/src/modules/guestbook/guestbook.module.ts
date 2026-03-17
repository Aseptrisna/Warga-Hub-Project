import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GuestbookService } from './guestbook.service';
import { GuestbookController } from './guestbook.controller';
import { GuestbookEntry, GuestbookEntrySchema } from './schemas/guestbook-entry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: GuestbookEntry.name, schema: GuestbookEntrySchema }]),
  ],
  controllers: [GuestbookController],
  providers: [GuestbookService],
  exports: [GuestbookService, MongooseModule],
})
export class GuestbookModule {}
