import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LetterTemplate, LetterTemplateDocument } from './schemas/letter-template.schema';
import { CreateLetterTemplateDto } from './dto/create-letter-template.dto';
import { UpdateLetterTemplateDto } from './dto/update-letter-template.dto';

@Injectable()
export class LetterTemplatesService {
  constructor(
    @InjectModel(LetterTemplate.name)
    private letterTemplateModel: Model<LetterTemplateDocument>,
  ) {}

  async create(
    createDto: CreateLetterTemplateDto,
    createdBy: string,
  ): Promise<LetterTemplate> {
    const template = new this.letterTemplateModel({
      ...createDto,
      createdBy,
    });
    return template.save();
  }

  async findAll(query?: {
    search?: string;
    regionId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: LetterTemplate[]; meta: any }> {
    const { search, regionId, isActive, page = 1, limit = 50 } = query || {};
    const filter: any = {};

    if (search) filter.$text = { $search: search };
    if (regionId) filter.regionId = regionId;
    if (isActive !== undefined) filter.isActive = isActive;

    const total = await this.letterTemplateModel.countDocuments(filter);
    const data = await this.letterTemplateModel
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

  async findOne(id: string): Promise<LetterTemplate> {
    const template = await this.letterTemplateModel.findOne({ _id: id });
    if (!template) {
      throw new NotFoundException('Letter template not found');
    }
    return template;
  }

  async findByCode(code: string): Promise<LetterTemplate> {
    const template = await this.letterTemplateModel.findOne({ code, isActive: true });
    if (!template) {
      throw new NotFoundException('Letter template not found');
    }
    return template;
  }

  async update(id: string, updateDto: UpdateLetterTemplateDto): Promise<LetterTemplate> {
    const template = await this.letterTemplateModel.findOne({ _id: id });
    if (!template) {
      throw new NotFoundException('Letter template not found');
    }
    Object.assign(template, updateDto);
    await template.save();
    return template;
  }

  async remove(id: string): Promise<void> {
    const template = await this.letterTemplateModel.findOne({ _id: id });
    if (!template) {
      throw new NotFoundException('Letter template not found');
    }
    await this.letterTemplateModel.deleteOne({ _id: id });
  }
}
