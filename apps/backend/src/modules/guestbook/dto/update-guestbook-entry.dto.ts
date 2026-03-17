import { PartialType } from '@nestjs/swagger';
import { CreateGuestbookEntryDto } from './create-guestbook-entry.dto';

export class UpdateGuestbookEntryDto extends PartialType(CreateGuestbookEntryDto) {}
