import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting } from './schemas/setting.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name) private settingModel: Model<Setting>,
  ) {}

  async findAll(category?: string) {
    const filter: any = {};
    if (category) filter.category = category;
    const settings = await this.settingModel.find(filter).sort({ category: 1, key: 1 });
    return { data: settings };
  }

  async findByKey(key: string) {
    const setting = await this.settingModel.findOne({ key });
    if (!setting) throw new NotFoundException(`Setting "${key}" tidak ditemukan`);
    return setting;
  }

  async update(key: string, value: string) {
    const setting = await this.settingModel.findOne({ key });
    if (!setting) throw new NotFoundException(`Setting "${key}" tidak ditemukan`);
    if (!setting.isEditable) throw new Error('Setting ini tidak dapat diubah');
    setting.value = value;
    await setting.save();
    return { message: 'Setting berhasil diperbarui', data: setting };
  }

  async bulkUpdate(updates: { key: string; value: string }[]) {
    const results = [];
    for (const { key, value } of updates) {
      const setting = await this.settingModel.findOne({ key });
      if (setting && setting.isEditable) {
        setting.value = value;
        await setting.save();
        results.push(setting);
      }
    }
    return { message: 'Settings berhasil diperbarui', data: results };
  }

  async initDefaults() {
    const defaults = [
      { key: 'app_name', value: 'WargaHub', category: 'general', description: 'Nama aplikasi' },
      { key: 'app_description', value: 'Platform Digital RT/RW/Desa', category: 'general', description: 'Deskripsi aplikasi' },
      { key: 'maintenance_mode', value: 'false', category: 'general', description: 'Mode maintenance' },
      { key: 'max_upload_size', value: '5242880', category: 'general', description: 'Ukuran upload maksimal (bytes)' },
      { key: 'notification_email', value: 'true', category: 'notification', description: 'Aktifkan notifikasi email' },
      { key: 'notification_whatsapp', value: 'false', category: 'notification', description: 'Aktifkan notifikasi WhatsApp' },
      { key: 'session_timeout', value: '30', category: 'security', description: 'Timeout sesi (menit)' },
      { key: 'max_login_attempts', value: '5', category: 'security', description: 'Maksimal percobaan login' },
    ];
    for (const d of defaults) {
      await this.settingModel.updateOne(
        { key: d.key },
        { $setOnInsert: d },
        { upsert: true },
      );
    }
  }
}
