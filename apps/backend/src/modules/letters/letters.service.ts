import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Letter, LetterDocument, LetterStatus } from './schemas/letter.schema';
import { LetterTemplate, LetterTemplateDocument } from '../letter-templates/schemas/letter-template.schema';
import { CreateLetterDto } from './dto/create-letter.dto';
import { ApproveLetterDto, RejectLetterDto } from './dto/approve-letter.dto';
import { PdfGenerator } from '../../utils/pdf-generator';
import { QrGenerator } from '../../utils/qr-generator';
import { LetterNumberGenerator } from '../../utils/letter-number-generator';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LettersService {
  constructor(
    @InjectModel(Letter.name) private letterModel: Model<LetterDocument>,
    @InjectModel(LetterTemplate.name) private templateModel: Model<LetterTemplateDocument>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createDto: CreateLetterDto, user: any): Promise<Letter> {
    // Get template
    const template = await this.templateModel.findOne({ _id: createDto.templateId });
    if (!template) {
      throw new NotFoundException('Letter template not found');
    }

    // Get sequence number for this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const count = await this.letterModel.countDocuments({
      templateCode: template.code,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Generate letter number
    const regionCode = createDto.regionId
      ? await this.getRegionCode(createDto.regionId)
      : 'DESA';

    const letterNumber = LetterNumberGenerator.generate(
      count + 1,
      template.code,
      regionCode,
      now,
    );

    // Create letter
    const letter = new this.letterModel({
      letterNumber,
      templateId: createDto.templateId,
      templateName: template.name,
      templateCode: template.code,
      requestedBy: user.id,
      requestedByName: user.name,
      citizenId: createDto.citizenId,
      regionId: createDto.regionId,
      desa: user.desa,
      rw: user.rw,
      rt: user.rt,
      data: createDto.data,
      status: LetterStatus.PENDING_RT,
      metadata: createDto.metadata,
    });

    await letter.save();

    this.auditService.log({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE',
      module: 'letters',
      entityId: letter._id,
      entityType: 'Letter',
      description: `Mengajukan surat: ${template.name} (${letterNumber})`,
    });

    // Notify KetuaRT & AdminRT about new letter
    this.notificationsService.notifyByRole(
      ['KetuaRT', 'AdminRT'],
      {
        title: 'Surat Baru Diajukan',
        message: `${user.name} mengajukan surat ${template.name}`,
        type: 'info',
        module: 'letters',
        referenceId: letter._id,
        referenceUrl: `/letters/${letter._id}`,
      },
    );

    return letter;
  }

  async findAll(query?: {
    status?: LetterStatus;
    templateId?: string;
    requestedBy?: string;
    regionId?: string;
    desa?: string;
    rw?: string;
    rt?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Letter[]; meta: any }> {
    const {
      status,
      templateId,
      requestedBy,
      regionId,
      desa,
      rw,
      rt,
      search,
      page = 1,
      limit = 50,
    } = query || {};

    const filter: any = {};
    if (status) filter.status = status;
    if (templateId) filter.templateId = templateId;
    if (requestedBy) filter.requestedBy = requestedBy;
    if (regionId) filter.regionId = regionId;
    if (desa) filter.desa = desa;
    if (rw) filter.rw = rw;
    if (rt) filter.rt = rt;
    if (search) filter.letterNumber = { $regex: search, $options: 'i' };

    const total = await this.letterModel.countDocuments(filter);
    const data = await this.letterModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Letter> {
    const letter = await this.letterModel.findOne({ _id: id });
    if (!letter) {
      throw new NotFoundException('Letter not found');
    }
    return letter;
  }

  // RT Approval
  async approveByRT(id: string, user: any, dto: ApproveLetterDto): Promise<LetterDocument> {
    const letter = await this.letterModel.findOne({ _id: id });
    if (!letter) {
      throw new NotFoundException('Letter not found');
    }

    if (letter.status !== LetterStatus.PENDING_RT) {
      throw new BadRequestException('Letter is not pending RT approval');
    }

    letter.status = LetterStatus.APPROVED_RT;
    letter.status = LetterStatus.PENDING_RW; // Auto forward to RW
    letter.approvedByRT = user.id;
    letter.approvedByRTName = user.name;
    letter.approvedAtRT = new Date();
    letter.rtNotes = dto.notes;

    await letter.save();

    this.auditService.log({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'APPROVE',
      module: 'letters',
      entityId: letter._id,
      entityType: 'Letter',
      description: `Menyetujui surat tingkat RT: ${letter.letterNumber}`,
    });

    // Notify KetuaRW & AdminRW for next level approval
    this.notificationsService.notifyByRole(
      ['KetuaRW', 'AdminRW'],
      {
        title: 'Surat Menunggu Persetujuan RW',
        message: `Surat ${letter.letterNumber} telah disetujui RT, menunggu persetujuan RW`,
        type: 'info',
        module: 'letters',
        referenceId: letter._id,
        referenceUrl: `/letters/${letter._id}`,
      },
    );

    return letter;
  }

  // RW Approval
  async approveByRW(id: string, user: any, dto: ApproveLetterDto): Promise<LetterDocument> {
    const letter = await this.letterModel.findOne({ _id: id });
    if (!letter) {
      throw new NotFoundException('Letter not found');
    }

    if (letter.status !== LetterStatus.PENDING_RW) {
      throw new BadRequestException('Letter is not pending RW approval');
    }

    letter.status = LetterStatus.APPROVED_RW;
    letter.status = LetterStatus.PENDING_DESA; // Auto forward to Desa
    letter.approvedByRW = user.id;
    letter.approvedByRWName = user.name;
    letter.approvedAtRW = new Date();
    letter.rwNotes = dto.notes;

    await letter.save();

    this.auditService.log({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'APPROVE',
      module: 'letters',
      entityId: letter._id,
      entityType: 'Letter',
      description: `Menyetujui surat tingkat RW: ${letter.letterNumber}`,
    });

    // Notify KepalaDesa & SekretarisDesa for final approval
    this.notificationsService.notifyByRole(
      ['KepalaDesa', 'SekretarisDesa'],
      {
        title: 'Surat Menunggu Persetujuan Desa',
        message: `Surat ${letter.letterNumber} telah disetujui RW, menunggu persetujuan Desa`,
        type: 'info',
        module: 'letters',
        referenceId: letter._id,
        referenceUrl: `/letters/${letter._id}`,
      },
    );

    return letter;
  }

  // Desa Approval & PDF Generation
  async approveByDesa(id: string, user: any, dto: ApproveLetterDto): Promise<Letter> {
    const letter = await this.letterModel.findOne({ _id: id });
    if (!letter) {
      throw new NotFoundException('Letter not found');
    }

    if (letter.status !== LetterStatus.PENDING_DESA) {
      throw new BadRequestException('Letter is not pending Desa approval');
    }

    // Update approval
    letter.status = LetterStatus.APPROVED;
    letter.approvedByDesa = user.id;
    letter.approvedByDesaName = user.name;
    letter.approvedAtDesa = new Date();
    letter.desaNotes = dto.notes;

    await letter.save();

    this.auditService.log({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'APPROVE',
      module: 'letters',
      entityId: letter._id,
      entityType: 'Letter',
      description: `Menyetujui surat tingkat Desa (final): ${letter.letterNumber}`,
    });

    // Notify the requester that letter is approved
    this.notificationsService.create({
      userId: letter.requestedBy,
      title: 'Surat Disetujui',
      message: `Surat ${letter.letterNumber} (${letter.templateName}) telah disetujui dan siap diunduh`,
      type: 'success',
      module: 'letters',
      referenceId: letter._id,
      referenceUrl: `/letters/${letter._id}`,
    });

    // Generate PDF with QR code
    await this.generatePDF(letter._id);

    return this.findOne(letter._id);
  }

  // Reject letter
  async reject(id: string, user: any, dto: RejectLetterDto): Promise<LetterDocument> {
    const letter = await this.letterModel.findOne({ _id: id });
    if (!letter) {
      throw new NotFoundException('Letter not found');
    }

    if (letter.status === LetterStatus.APPROVED || letter.status === LetterStatus.REJECTED) {
      throw new BadRequestException('Cannot reject this letter');
    }

    letter.status = LetterStatus.REJECTED;
    letter.rejectedBy = user.id;
    letter.rejectedByName = user.name;
    letter.rejectedAt = new Date();
    letter.rejectionReason = dto.reason;

    await letter.save();

    this.auditService.log({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'REJECT',
      module: 'letters',
      entityId: letter._id,
      entityType: 'Letter',
      description: `Menolak surat: ${letter.letterNumber} (Alasan: ${dto.reason})`,
    });

    // Notify the requester that letter is rejected
    this.notificationsService.create({
      userId: letter.requestedBy,
      title: 'Surat Ditolak',
      message: `Surat ${letter.letterNumber} ditolak. Alasan: ${dto.reason}`,
      type: 'error',
      module: 'letters',
      referenceId: letter._id,
      referenceUrl: `/letters/${letter._id}`,
    });

    return letter;
  }

  // Generate PDF
  async generatePDF(letterId: string): Promise<LetterDocument> {
    const letter = await this.letterModel.findOne({ _id: letterId });
    if (!letter) {
      throw new NotFoundException('Letter not found');
    }

    // Get template
    const template = await this.templateModel.findOne({ _id: letter.templateId });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Generate QR code
    const qrCode = await QrGenerator.generateLetterQRCode(letter._id);

    // Prepare data for template
    const pdfData = {
      ...letter.data,
      letterNumber: letter.letterNumber,
      approvedByRT: letter.approvedByRTName,
      approvedByRW: letter.approvedByRWName,
      approvedByDesa: letter.approvedByDesaName,
      approvalDate: letter.approvedAtDesa,
    };

    // Generate PDF
    const { pdfUrl } = await PdfGenerator.generatePDF(
      template.content,
      pdfData,
      {
        filename: `${letter.letterNumber.replace(/\//g, '-')}.pdf`,
        qrCode,
      },
    );

    // Update letter
    letter.pdfUrl = pdfUrl;
    letter.qrCode = qrCode;
    letter.generatedAt = new Date();

    return letter.save();
  }

  async remove(id: string, user?: any): Promise<void> {
    const letter = await this.letterModel.findOne({ _id: id });
    if (!letter) {
      throw new NotFoundException('Letter not found');
    }
    await this.letterModel.deleteOne({ _id: id });

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'DELETE',
      module: 'letters',
      entityId: id,
      entityType: 'Letter',
      description: `Menghapus surat: ${letter.letterNumber}`,
    });
  }

  // Helper: Get region code
  private async getRegionCode(regionId: string): Promise<string> {
    // This should query regions collection
    // For now, return default
    return 'RT.01';
  }
}
