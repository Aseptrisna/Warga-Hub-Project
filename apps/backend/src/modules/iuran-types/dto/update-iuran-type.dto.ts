import { PartialType } from '@nestjs/swagger';
import { CreateIuranTypeDto } from './create-iuran-type.dto';

export class UpdateIuranTypeDto extends PartialType(CreateIuranTypeDto) {}
