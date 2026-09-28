import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KicauService } from './kicau.service';
import { KicauController } from './kicau.controller';
import { KicauPost, KicauPostSchema } from './schemas/kicau-post.schema';
import { KicauComment, KicauCommentSchema } from './schemas/kicau-comment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KicauPost.name, schema: KicauPostSchema },
      { name: KicauComment.name, schema: KicauCommentSchema },
    ]),
  ],
  controllers: [KicauController],
  providers: [KicauService],
})
export class KicauModule {}
