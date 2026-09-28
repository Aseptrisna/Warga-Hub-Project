import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KicauPost, KicauPostDocument } from './schemas/kicau-post.schema';
import { KicauComment, KicauCommentDocument } from './schemas/kicau-comment.schema';
import { CreateKicauPostDto, CreateKicauCommentDto, HideKicauPostDto } from './dto/kicau.dto';
import { Role } from '../../common/enums/role.enum';

export const KICAU_MODERATOR_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN_PLATFORM,
  Role.ADMIN_DESA,
  Role.KEPALA_DESA,
  Role.SEKRETARIS_DESA,
  Role.KETUA_RW,
  Role.KETUA_RT,
];

const PLATFORM_ROLES: string[] = [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM];
const MAX_LIMIT = 50;

@Injectable()
export class KicauService {
  private readonly logger = new Logger(KicauService.name);

  constructor(
    @InjectModel(KicauPost.name) private postModel: Model<KicauPostDocument>,
    @InjectModel(KicauComment.name) private commentModel: Model<KicauCommentDocument>,
  ) {}

  private isPlatform(user: any) {
    return PLATFORM_ROLES.includes(user.role);
  }

  isModerator(user: any) {
    return (KICAU_MODERATOR_ROLES as string[]).includes(user.role);
  }

  /** Mongo filter restricting access to the caller's own desa (platform admins see all). */
  private scopeFilter(user: any): Record<string, any> {
    if (this.isPlatform(user)) return {};
    if (!user.desa) throw new ForbiddenException('Akun Anda belum terhubung ke desa');
    return { desa: user.desa };
  }

  private toFeedItem(post: KicauPostDocument, userId: string) {
    const json: any = post.toJSON();
    json.likedByMe = (post.likedBy || []).includes(userId);
    delete json.likedBy;
    return json;
  }

  private parsePaging(query: any) {
    const page = Math.max(parseInt(query?.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query?.limit, 10) || 10, 1), MAX_LIMIT);
    return { page, limit };
  }

  private async findVisiblePost(id: string, user: any) {
    const post = await this.postModel.findOne({ _id: id, isHidden: false, ...this.scopeFilter(user) });
    if (!post) throw new NotFoundException('Kicauan tidak ditemukan');
    return post;
  }

  async getFeed(query: any, user: any) {
    const { page, limit } = this.parsePaging(query);
    const filter: Record<string, any> = { isHidden: false, ...this.scopeFilter(user) };
    if (this.isPlatform(user) && query?.desa) filter.desa = query.desa;

    const [total, posts] = await Promise.all([
      this.postModel.countDocuments(filter),
      this.postModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
    ]);

    return {
      data: posts.map((p) => this.toFeedItem(p, String(user.id))),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreateKicauPostDto, fotoUrls: string[], user: any) {
    const isi = (dto.isi || '').trim();
    if (!isi && fotoUrls.length === 0) {
      throw new BadRequestException('Tulis sesuatu atau lampirkan foto');
    }
    if (!user.desa) {
      throw new BadRequestException('Akun Anda belum terhubung ke desa');
    }

    const post = await this.postModel.create({
      authorUserId: String(user.id),
      authorName: user.name,
      authorRole: user.role,
      isi,
      fotoUrls,
      desa: user.desa,
      rw: user.rw,
      rt: user.rt,
    });

    return { message: 'Kicauan terkirim', data: this.toFeedItem(post, String(user.id)) };
  }

  /**
   * Atomic like toggle: each branch is a single conditional findOneAndUpdate,
   * so concurrent requests can never double-count or go negative.
   */
  async toggleLike(id: string, user: any) {
    const userId = String(user.id);
    const base = { _id: id, isHidden: false, ...this.scopeFilter(user) };

    const unliked = await this.postModel.findOneAndUpdate(
      { ...base, likedBy: userId },
      { $pull: { likedBy: userId }, $inc: { likeCount: -1 } },
      { new: true },
    );
    if (unliked) return { liked: false, likeCount: unliked.likeCount };

    const liked = await this.postModel.findOneAndUpdate(
      { ...base, likedBy: { $ne: userId } },
      { $addToSet: { likedBy: userId }, $inc: { likeCount: 1 } },
      { new: true },
    );
    if (liked) return { liked: true, likeCount: liked.likeCount };

    // Neither matched: either the post is gone/out of scope, or a concurrent
    // request flipped the state between our two updates.
    const current = await this.findVisiblePost(id, user);
    return { liked: current.likedBy.includes(userId), likeCount: current.likeCount };
  }

  async getComments(id: string, query: any, user: any) {
    await this.findVisiblePost(id, user);
    const { page, limit } = this.parsePaging(query);

    const [total, comments] = await Promise.all([
      this.commentModel.countDocuments({ postId: id }),
      this.commentModel
        .find({ postId: id })
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
    ]);

    return {
      data: comments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async addComment(id: string, dto: CreateKicauCommentDto, user: any) {
    const post = await this.findVisiblePost(id, user);
    const isi = dto.isi.trim();
    if (!isi) throw new BadRequestException('Komentar tidak boleh kosong');

    const comment = await this.commentModel.create({
      postId: String(post._id),
      authorUserId: String(user.id),
      authorName: user.name,
      isi,
    });
    await this.postModel.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });

    return { message: 'Komentar terkirim', data: comment };
  }

  async removePost(id: string, user: any) {
    const post = await this.postModel.findOne({ _id: id, ...this.scopeFilter(user) });
    if (!post) throw new NotFoundException('Kicauan tidak ditemukan');
    if (post.authorUserId !== String(user.id) && !this.isModerator(user)) {
      throw new ForbiddenException('Anda tidak dapat menghapus kicauan ini');
    }

    await Promise.all([post.deleteOne(), this.commentModel.deleteMany({ postId: String(post._id) })]);
    return { message: 'Kicauan dihapus' };
  }

  async removeComment(commentId: string, user: any) {
    const comment = await this.commentModel.findOne({ _id: commentId });
    if (!comment) throw new NotFoundException('Komentar tidak ditemukan');

    // Scope check goes through the parent post's desa.
    const post = await this.postModel.findOne({ _id: comment.postId, ...this.scopeFilter(user) });
    if (!post) throw new NotFoundException('Komentar tidak ditemukan');
    if (comment.authorUserId !== String(user.id) && !this.isModerator(user)) {
      throw new ForbiddenException('Anda tidak dapat menghapus komentar ini');
    }

    await comment.deleteOne();
    await this.postModel.updateOne(
      { _id: post._id, commentCount: { $gt: 0 } },
      { $inc: { commentCount: -1 } },
    );
    return { message: 'Komentar dihapus' };
  }

  async hidePost(id: string, dto: HideKicauPostDto, user: any) {
    const post = await this.postModel.findOneAndUpdate(
      { _id: id, ...this.scopeFilter(user) },
      { isHidden: true, hiddenBy: String(user.id), hiddenReason: dto.reason.trim() },
      { new: true },
    );
    if (!post) throw new NotFoundException('Kicauan tidak ditemukan');

    this.logger.log(`Post ${id} hidden by ${user.id}: ${dto.reason}`);
    return { message: 'Kicauan disembunyikan' };
  }
}
