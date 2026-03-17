import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Citizen } from './schemas/citizen.schema';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { AuditService } from '../audit/audit.service';
import { Role } from '../../common/enums/role.enum';
import { getRegionScope } from '../../common/helpers/region-scope.helper';
import * as ExcelJS from 'exceljs';

const PLATFORM_ROLES = [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM];

@Injectable()
export class CitizensService {
  constructor(
    @InjectModel(Citizen.name) private citizenModel: Model<Citizen>,
    private readonly auditService: AuditService,
  ) {}

  async create(createCitizenDto: CreateCitizenDto, user?: any) {
    const existingNik = await this.citizenModel.findOne({ nik: createCitizenDto.nik });
    if (existingNik) {
      throw new ConflictException('NIK sudah terdaftar');
    }

    // Scope validation: citizen's region must match user's scope
    if (user && !PLATFORM_ROLES.includes(user.role)) {
      this.validateCitizenScope(createCitizenDto, user);
    }

    const citizen = new this.citizenModel(createCitizenDto);
    await citizen.save();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'CREATE',
      module: 'citizens',
      entityId: citizen._id,
      entityType: 'Citizen',
      description: `Menambahkan data warga: ${citizen.namaLengkap} (NIK: ${citizen.nik})`,
    });

    return {
      message: 'Data warga berhasil ditambahkan',
      data: citizen,
    };
  }

  async findAll(query?: any) {
    const {
      page = 1,
      limit = 10,
      search,
      rt,
      rw,
      desa,
      noKk,
      jenisKelamin,
      statusPerkawinan,
      agama,
      pendidikan,
      pekerjaan,
      statusKependudukan,
    } = query;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { namaLengkap: { $regex: search, $options: 'i' } },
        { nik: { $regex: search, $options: 'i' } },
        { noKk: { $regex: search, $options: 'i' } },
      ];
    }

    if (rt) filter.rt = rt;
    if (rw) filter.rw = rw;
    if (desa) filter.desa = desa;
    if (noKk) filter.noKk = noKk;
    if (jenisKelamin) filter.jenisKelamin = jenisKelamin;
    if (statusPerkawinan) filter.statusPerkawinan = statusPerkawinan;
    if (agama) filter.agama = agama;
    if (pendidikan) filter.pendidikan = pendidikan;
    if (pekerjaan) filter.pekerjaan = { $regex: pekerjaan, $options: 'i' };
    if (statusKependudukan) filter.statusKependudukan = statusKependudukan;

    const total = await this.citizenModel.countDocuments(filter);
    const citizens = await this.citizenModel
      .find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ namaLengkap: 1 })
      .exec();

    return {
      data: citizens,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user?: any) {
    const citizen = await this.citizenModel.findOne({ _id: id });

    if (!citizen) {
      throw new NotFoundException('Data warga tidak ditemukan');
    }

    // Scope validation: user can only view citizens in their scope
    if (user && !PLATFORM_ROLES.includes(user.role)) {
      this.validateCitizenBelongsToScope(citizen, user);
    }

    return citizen;
  }

  async update(id: string, updateCitizenDto: UpdateCitizenDto, user?: any) {
    const citizen = await this.citizenModel.findOne({ _id: id });
    if (!citizen) {
      throw new NotFoundException('Data warga tidak ditemukan');
    }

    // Scope validation: user can only edit citizens in their scope
    if (user && !PLATFORM_ROLES.includes(user.role)) {
      this.validateCitizenBelongsToScope(citizen, user);
    }

    if (updateCitizenDto.nik && updateCitizenDto.nik !== citizen.nik) {
      const existingNik = await this.citizenModel.findOne({ nik: updateCitizenDto.nik });
      if (existingNik) {
        throw new ConflictException('NIK sudah terdaftar');
      }
    }

    const changes = { ...updateCitizenDto };
    Object.assign(citizen, updateCitizenDto);
    await citizen.save();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'UPDATE',
      module: 'citizens',
      entityId: citizen._id,
      entityType: 'Citizen',
      description: `Memperbarui data warga: ${citizen.namaLengkap}`,
      changes,
    });

    return {
      message: 'Data warga berhasil diperbarui',
      data: citizen,
    };
  }

  async remove(id: string, user?: any) {
    const citizen = await this.citizenModel.findOne({ _id: id });
    if (!citizen) {
      throw new NotFoundException('Data warga tidak ditemukan');
    }

    // Scope validation: user can only delete citizens in their scope
    if (user && !PLATFORM_ROLES.includes(user.role)) {
      this.validateCitizenBelongsToScope(citizen, user);
    }

    await this.citizenModel.deleteOne({ _id: id });

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'DELETE',
      module: 'citizens',
      entityId: id,
      entityType: 'Citizen',
      description: `Menghapus data warga: ${citizen.namaLengkap} (NIK: ${citizen.nik})`,
    });

    return {
      message: 'Data warga berhasil dihapus',
    };
  }

  async getStatistics(filter?: any) {
    const matchFilter: any = {};
    if (filter?.desa) matchFilter.desa = filter.desa;
    if (filter?.rw) matchFilter.rw = filter.rw;
    if (filter?.rt) matchFilter.rt = filter.rt;

    const stats = await this.citizenModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          lakiLaki: {
            $sum: { $cond: [{ $eq: ['$jenisKelamin', 'Laki-laki'] }, 1, 0] },
          },
          perempuan: {
            $sum: { $cond: [{ $eq: ['$jenisKelamin', 'Perempuan'] }, 1, 0] },
          },
          kawin: {
            $sum: { $cond: [{ $eq: ['$statusPerkawinan', 'Kawin'] }, 1, 0] },
          },
          belumKawin: {
            $sum: { $cond: [{ $eq: ['$statusPerkawinan', 'Belum Kawin'] }, 1, 0] },
          },
        },
      },
    ]);

    return stats[0] || {
      total: 0,
      lakiLaki: 0,
      perempuan: 0,
      kawin: 0,
      belumKawin: 0,
    };
  }

  async exportToExcel(query?: any, user?: any): Promise<Buffer> {
    const filter: any = {};
    if (query?.rt) filter.rt = query.rt;
    if (query?.rw) filter.rw = query.rw;
    if (query?.desa) filter.desa = query.desa;
    if (query?.noKk) filter.noKk = query.noKk;
    if (query?.search) {
      filter.$or = [
        { namaLengkap: { $regex: query.search, $options: 'i' } },
        { nik: { $regex: query.search, $options: 'i' } },
        { noKk: { $regex: query.search, $options: 'i' } },
      ];
    }

    const citizens = await this.citizenModel.find(filter).sort({ namaLengkap: 1 }).exec();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WargaHub';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Data Warga');

    // Header style
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF2563EB' } },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const },
      },
    };

    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'NIK', key: 'nik', width: 20 },
      { header: 'No. KK', key: 'noKk', width: 20 },
      { header: 'Nama Lengkap', key: 'namaLengkap', width: 30 },
      { header: 'Jenis Kelamin', key: 'jenisKelamin', width: 15 },
      { header: 'Tempat Lahir', key: 'tempatLahir', width: 18 },
      { header: 'Tanggal Lahir', key: 'tanggalLahir', width: 15 },
      { header: 'Agama', key: 'agama', width: 12 },
      { header: 'Pendidikan', key: 'pendidikan', width: 15 },
      { header: 'Pekerjaan', key: 'pekerjaan', width: 20 },
      { header: 'Status Perkawinan', key: 'statusPerkawinan', width: 18 },
      { header: 'Hub. Keluarga', key: 'statusHubunganDalamKeluarga', width: 18 },
      { header: 'Nama Ayah', key: 'namaAyah', width: 25 },
      { header: 'Nama Ibu', key: 'namaIbu', width: 25 },
      { header: 'Alamat', key: 'alamat', width: 35 },
      { header: 'RT', key: 'rt', width: 5 },
      { header: 'RW', key: 'rw', width: 5 },
      { header: 'Desa', key: 'desa', width: 15 },
      { header: 'Kecamatan', key: 'kecamatan', width: 15 },
      { header: 'Kabupaten', key: 'kabupaten', width: 15 },
      { header: 'Provinsi', key: 'provinsi', width: 15 },
      { header: 'Kode Pos', key: 'kodePos', width: 10 },
      { header: 'No. Telp', key: 'noTelp', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Kewarganegaraan', key: 'kewarganegaraan', width: 15 },
      { header: 'Golongan Darah', key: 'golonganDarah', width: 15 },
      { header: 'NPWP', key: 'npwp', width: 20 },
      { header: 'No. BPJS Kesehatan', key: 'noBpjsKesehatan', width: 20 },
      { header: 'No. BPJS Ketenagakerjaan', key: 'noBpjsKetenagakerjaan', width: 22 },
      { header: 'No. Akta Lahir', key: 'nomorAktaLahir', width: 20 },
      { header: 'Status Kependudukan', key: 'statusKependudukan', width: 18 },
    ];

    // Apply header styles
    sheet.getRow(1).eachCell((cell) => {
      Object.assign(cell, { style: headerStyle });
    });
    sheet.getRow(1).height = 25;

    // Add data rows
    citizens.forEach((c, index) => {
      const dateStr = c.tanggalLahir
        ? new Date(c.tanggalLahir).toISOString().split('T')[0]
        : '';
      sheet.addRow({
        no: index + 1,
        nik: c.nik,
        noKk: c.noKk,
        namaLengkap: c.namaLengkap,
        jenisKelamin: c.jenisKelamin,
        tempatLahir: c.tempatLahir,
        tanggalLahir: dateStr,
        agama: c.agama,
        pendidikan: c.pendidikan,
        pekerjaan: c.pekerjaan || '',
        statusPerkawinan: c.statusPerkawinan,
        statusHubunganDalamKeluarga: c.statusHubunganDalamKeluarga,
        namaAyah: c.namaAyah || '',
        namaIbu: c.namaIbu || '',
        alamat: c.alamat,
        rt: c.rt,
        rw: c.rw,
        desa: c.desa,
        kecamatan: c.kecamatan || '',
        kabupaten: c.kabupaten || '',
        provinsi: c.provinsi || '',
        kodePos: c.kodePos || '',
        noTelp: c.noTelp || '',
        email: c.email || '',
        kewarganegaraan: c.kewarganegaraan || 'WNI',
        golonganDarah: c.golonganDarah || '',
        npwp: c.npwp || '',
        noBpjsKesehatan: c.noBpjsKesehatan || '',
        noBpjsKetenagakerjaan: c.noBpjsKetenagakerjaan || '',
        nomorAktaLahir: c.nomorAktaLahir || '',
        statusKependudukan: c.statusKependudukan || 'Aktif',
      });
    });

    // NIK and KK columns as text (prevent Excel from converting to number)
    sheet.getColumn('nik').numFmt = '@';
    sheet.getColumn('noKk').numFmt = '@';

    const buffer = await workbook.xlsx.writeBuffer();

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'EXPORT',
      module: 'citizens',
      entityType: 'Citizen',
      description: `Mengekspor data warga (${citizens.length} record)`,
    });

    return buffer as unknown as Buffer;
  }

  async importFromExcel(buffer: Buffer, user?: any) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    const sheet = workbook.getWorksheet('Data Warga') || workbook.getWorksheet(1);
    if (!sheet) {
      throw new BadRequestException('File Excel tidak valid atau kosong');
    }

    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value || '').trim();
    });

    // Map Indonesian headers to field names
    const headerMap: Record<string, string> = {
      'NIK': 'nik',
      'No. KK': 'noKk',
      'Nama Lengkap': 'namaLengkap',
      'Jenis Kelamin': 'jenisKelamin',
      'Tempat Lahir': 'tempatLahir',
      'Tanggal Lahir': 'tanggalLahir',
      'Agama': 'agama',
      'Pendidikan': 'pendidikan',
      'Pekerjaan': 'pekerjaan',
      'Status Perkawinan': 'statusPerkawinan',
      'Hub. Keluarga': 'statusHubunganDalamKeluarga',
      'Nama Ayah': 'namaAyah',
      'Nama Ibu': 'namaIbu',
      'Alamat': 'alamat',
      'RT': 'rt',
      'RW': 'rw',
      'Desa': 'desa',
      'Kecamatan': 'kecamatan',
      'Kabupaten': 'kabupaten',
      'Provinsi': 'provinsi',
      'Kode Pos': 'kodePos',
      'No. Telp': 'noTelp',
      'Email': 'email',
      'Kewarganegaraan': 'kewarganegaraan',
      'Golongan Darah': 'golonganDarah',
      'NPWP': 'npwp',
      'No. BPJS Kesehatan': 'noBpjsKesehatan',
      'No. BPJS Ketenagakerjaan': 'noBpjsKetenagakerjaan',
      'No. Akta Lahir': 'nomorAktaLahir',
      'Status Kependudukan': 'statusKependudukan',
    };

    // Build column index map
    const colMap: Record<string, number> = {};
    headers.forEach((header, colNum) => {
      const fieldName = headerMap[header];
      if (fieldName) {
        colMap[fieldName] = colNum;
      }
    });

    if (!colMap['nik'] || !colMap['namaLengkap']) {
      throw new BadRequestException('File harus memiliki kolom NIK dan Nama Lengkap');
    }

    // Get user scope for validation
    const scope = user ? getRegionScope(user) : {};

    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);
      if (!row.hasValues) continue;

      const getCellValue = (field: string): string => {
        const colNum = colMap[field];
        if (!colNum) return '';
        const val = row.getCell(colNum).value;
        if (val === null || val === undefined) return '';
        if (val instanceof Date) return val.toISOString().split('T')[0];
        return String(val).trim();
      };

      const nik = getCellValue('nik');
      const namaLengkap = getCellValue('namaLengkap');

      if (!nik || !namaLengkap) {
        results.skipped++;
        continue;
      }

      // Check if NIK already exists
      const existing = await this.citizenModel.findOne({ nik });
      if (existing) {
        results.errors.push(`Baris ${rowNum}: NIK ${nik} sudah terdaftar (${existing.namaLengkap})`);
        results.skipped++;
        continue;
      }

      try {
        const citizenData: any = {
          nik,
          namaLengkap,
          noKk: getCellValue('noKk') || nik,
          jenisKelamin: getCellValue('jenisKelamin') || 'Laki-laki',
          tempatLahir: getCellValue('tempatLahir') || '-',
          tanggalLahir: getCellValue('tanggalLahir') ? new Date(getCellValue('tanggalLahir')) : new Date('1990-01-01'),
          agama: getCellValue('agama') || 'Islam',
          pendidikan: getCellValue('pendidikan') || 'SMA',
          pekerjaan: getCellValue('pekerjaan') || '',
          statusPerkawinan: getCellValue('statusPerkawinan') || 'Belum Kawin',
          statusHubunganDalamKeluarga: getCellValue('statusHubunganDalamKeluarga') || 'Kepala Keluarga',
          namaAyah: getCellValue('namaAyah') || '',
          namaIbu: getCellValue('namaIbu') || '',
          alamat: getCellValue('alamat') || '-',
          rt: getCellValue('rt') || scope.rt || '001',
          rw: getCellValue('rw') || scope.rw || '001',
          desa: getCellValue('desa') || scope.desa || '-',
          kecamatan: getCellValue('kecamatan') || '',
          kabupaten: getCellValue('kabupaten') || '',
          provinsi: getCellValue('provinsi') || '',
          kodePos: getCellValue('kodePos') || '',
          noTelp: getCellValue('noTelp') || '',
          email: getCellValue('email') || '',
          kewarganegaraan: getCellValue('kewarganegaraan') || 'WNI',
          golonganDarah: getCellValue('golonganDarah') || '',
          npwp: getCellValue('npwp') || '',
          noBpjsKesehatan: getCellValue('noBpjsKesehatan') || '',
          noBpjsKetenagakerjaan: getCellValue('noBpjsKetenagakerjaan') || '',
          nomorAktaLahir: getCellValue('nomorAktaLahir') || '',
          statusKependudukan: getCellValue('statusKependudukan') || 'Aktif',
        };

        // Scope validation for non-platform users
        if (user && !PLATFORM_ROLES.includes(user.role)) {
          try {
            this.validateCitizenScope(citizenData, user);
          } catch {
            results.errors.push(`Baris ${rowNum}: Warga ${namaLengkap} di luar wilayah Anda`);
            results.skipped++;
            continue;
          }
        }

        const citizen = new this.citizenModel(citizenData);
        await citizen.save();
        results.imported++;
      } catch (err: any) {
        results.errors.push(`Baris ${rowNum}: ${err.message}`);
        results.skipped++;
      }
    }

    this.auditService.log({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'IMPORT',
      module: 'citizens',
      entityType: 'Citizen',
      description: `Mengimpor data warga: ${results.imported} berhasil, ${results.skipped} dilewati`,
      changes: { imported: results.imported, skipped: results.skipped, errors: results.errors.length },
    });

    return {
      message: `Import selesai: ${results.imported} berhasil, ${results.skipped} dilewati`,
      data: results,
    };
  }

  async getUniqueNoKk(scope?: Record<string, string>) {
    const matchStage: any = {};
    if (scope?.desa) matchStage.desa = scope.desa;
    if (scope?.rw) matchStage.rw = scope.rw;
    if (scope?.rt) matchStage.rt = scope.rt;

    const pipeline: any[] = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }
    pipeline.push(
      {
        $group: {
          _id: '$noKk',
          kepalaKeluarga: { $first: '$namaLengkap' },
          count: { $sum: 1 },
        },
      },
      { $sort: { kepalaKeluarga: 1 } },
    );

    const families = await this.citizenModel.aggregate(pipeline);

    return families.map((f) => ({
      noKk: f._id,
      kepalaKeluarga: f.kepalaKeluarga,
      jumlahAnggota: f.count,
    }));
  }

  // Validate that a citizen's desa/rw/rt falls within the user's scope
  private validateCitizenScope(citizenData: any, user: any): void {
    const scope = getRegionScope(user);

    if (scope.desa && citizenData.desa && citizenData.desa !== scope.desa) {
      throw new ForbiddenException('Warga harus berada di desa Anda');
    }
    if (scope.rw && citizenData.rw && citizenData.rw !== scope.rw) {
      throw new ForbiddenException('Warga harus berada di RW Anda');
    }
    if (scope.rt && citizenData.rt && citizenData.rt !== scope.rt) {
      throw new ForbiddenException('Warga harus berada di RT Anda');
    }
  }

  // Validate that an existing citizen belongs to user's scope
  private validateCitizenBelongsToScope(citizen: any, user: any): void {
    const scope = getRegionScope(user);

    if (scope.desa && citizen.desa !== scope.desa) {
      throw new ForbiddenException('Anda tidak memiliki akses ke data warga ini');
    }
    if (scope.rw && citizen.rw !== scope.rw) {
      throw new ForbiddenException('Anda tidak memiliki akses ke data warga ini');
    }
    if (scope.rt && citizen.rt !== scope.rt) {
      throw new ForbiddenException('Anda tidak memiliki akses ke data warga ini');
    }
  }
}
