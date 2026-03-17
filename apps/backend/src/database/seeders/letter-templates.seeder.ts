export const seedLetterTemplates = async (templateModel: any) => {
  console.log('🌱 Seeding letter templates...');

  const templates = [
    {
      name: 'Surat Keterangan Domisili',
      code: 'SKD',
      title: 'SURAT KETERANGAN DOMISILI',
      description: 'Template surat keterangan domisili untuk warga',
      requiredFields: ['nama', 'nik', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'agama', 'pekerjaan', 'alamat', 'keperluan'],
      content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Times New Roman', serif; line-height: 1.6; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 10px; }
    .header h1 { margin: 5px 0; font-size: 18px; }
    .header h2 { margin: 5px 0; font-size: 16px; font-weight: normal; }
    .header p { margin: 2px 0; font-size: 12px; }
    .content { margin: 30px 0; text-align: justify; }
    .content p { margin: 10px 0; }
    .info-table { width: 100%; margin: 20px 0; }
    .info-table td { padding: 5px; }
    .info-table td:first-child { width: 200px; }
    .signature { margin-top: 50px; }
    .signature-box { float: right; text-align: center; width: 250px; }
    .qr-code { text-align: center; margin-top: 30px; }
    .qr-code img { width: 150px; height: 150px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PEMERINTAH KABUPATEN BANDUNG</h1>
    <h1>KECAMATAN BALEENDAH</h1>
    <h1>DESA SUKAMAJU</h1>
    <p>Jl. Raya Sukamaju No.100, Baleendah, Bandung 40375</p>
    <p>Email: desa.sukamaju@bandung.go.id | Telp: (022) 5940456</p>
  </div>

  <div class="content">
    <p style="text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 5px;">
      SURAT KETERANGAN DOMISILI
    </p>
    <p style="text-align: center; margin-top: 0;">
      Nomor: {{letterNumber}}
    </p>

    <p style="margin-top: 30px;">
      Yang bertanda tangan di bawah ini, Kepala Desa Sukamaju Kecamatan Baleendah Kabupaten Bandung,
      menerangkan dengan sebenarnya bahwa:
    </p>

    <table class="info-table">
      <tr>
        <td>Nama Lengkap</td>
        <td>: {{nama}}</td>
      </tr>
      <tr>
        <td>NIK</td>
        <td>: {{nik}}</td>
      </tr>
      <tr>
        <td>Tempat/Tanggal Lahir</td>
        <td>: {{tempatLahir}}, {{tanggalLahir}}</td>
      </tr>
      <tr>
        <td>Jenis Kelamin</td>
        <td>: {{jenisKelamin}}</td>
      </tr>
      <tr>
        <td>Agama</td>
        <td>: {{agama}}</td>
      </tr>
      <tr>
        <td>Pekerjaan</td>
        <td>: {{pekerjaan}}</td>
      </tr>
      <tr>
        <td>Alamat</td>
        <td>: {{alamat}}</td>
      </tr>
    </table>

    <p>
      Adalah benar warga/penduduk Desa Sukamaju yang berdomisili di alamat tersebut di atas.
    </p>

    <p>
      Surat keterangan ini dibuat untuk keperluan: <strong>{{keperluan}}</strong>
    </p>

    <p>
      Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
    </p>
  </div>

  <div class="signature">
    <div class="signature-box">
      <p>Sukamaju, {{generatedDate}}</p>
      <p>Kepala Desa Sukamaju</p>
      <br><br><br>
      <p style="text-decoration: underline; font-weight: bold;">{{approvedByDesa}}</p>
    </div>
  </div>

  {{#if qrCode}}
  <div class="qr-code" style="clear: both;">
    <p style="font-size: 10px;">Verifikasi surat:</p>
    <img src="{{qrCode}}" alt="QR Code">
  </div>
  {{/if}}
</body>
</html>
      `,
      isActive: true,
    },
    {
      name: 'Surat Keterangan Tidak Mampu',
      code: 'SKTM',
      title: 'SURAT KETERANGAN TIDAK MAMPU',
      description: 'Template SKTM untuk bantuan/beasiswa',
      requiredFields: ['nama', 'nik', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'agama', 'pekerjaan', 'alamat', 'keperluan', 'namaAnak', 'sekolah'],
      content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Times New Roman', serif; line-height: 1.6; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 10px; }
    .header h1 { margin: 5px 0; font-size: 18px; }
    .header p { margin: 2px 0; font-size: 12px; }
    .content { margin: 30px 0; text-align: justify; }
    .info-table { width: 100%; margin: 20px 0; }
    .info-table td { padding: 5px; }
    .info-table td:first-child { width: 200px; }
    .signature-box { float: right; text-align: center; width: 250px; margin-top: 30px; }
    .qr-code { text-align: center; margin-top: 30px; clear: both; }
    .qr-code img { width: 150px; height: 150px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PEMERINTAH KABUPATEN BANDUNG</h1>
    <h1>KECAMATAN BALEENDAH</h1>
    <h1>DESA SUKAMAJU</h1>
    <p>Jl. Raya Sukamaju No.100, Baleendah, Bandung 40375</p>
  </div>

  <div class="content">
    <p style="text-align: center; font-weight: bold; text-decoration: underline;">
      SURAT KETERANGAN TIDAK MAMPU
    </p>
    <p style="text-align: center;">Nomor: {{letterNumber}}</p>

    <p style="margin-top: 30px;">
      Yang bertanda tangan di bawah ini Kepala Desa Sukamaju, menerangkan bahwa:
    </p>

    <table class="info-table">
      <tr><td>Nama Lengkap</td><td>: {{nama}}</td></tr>
      <tr><td>NIK</td><td>: {{nik}}</td></tr>
      <tr><td>Tempat/Tanggal Lahir</td><td>: {{tempatLahir}}, {{tanggalLahir}}</td></tr>
      <tr><td>Jenis Kelamin</td><td>: {{jenisKelamin}}</td></tr>
      <tr><td>Pekerjaan</td><td>: {{pekerjaan}}</td></tr>
      <tr><td>Alamat</td><td>: {{alamat}}</td></tr>
    </table>

    <p>
      Adalah benar warga Desa Sukamaju yang <strong>tidak mampu secara ekonomi</strong> dan memerlukan bantuan
      untuk keperluan <strong>{{keperluan}}</strong> atas nama <strong>{{namaAnak}}</strong>
      yang bersekolah di <strong>{{sekolah}}</strong>.
    </p>

    <p>
      Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
    </p>
  </div>

  <div class="signature-box">
    <p>Sukamaju, {{generatedDate}}</p>
    <p>Kepala Desa Sukamaju</p>
    <br><br><br>
    <p style="text-decoration: underline; font-weight: bold;">{{approvedByDesa}}</p>
  </div>

  {{#if qrCode}}
  <div class="qr-code">
    <p style="font-size: 10px;">Verifikasi:</p>
    <img src="{{qrCode}}" alt="QR">
  </div>
  {{/if}}
</body>
</html>
      `,
      isActive: true,
    },
    {
      name: 'Surat Keterangan Usaha',
      code: 'SKU',
      title: 'SURAT KETERANGAN USAHA',
      description: 'Template SKU untuk pelaku UMKM',
      requiredFields: ['nama', 'nik', 'alamat', 'jenisUsaha', 'namaUsaha', 'alamatUsaha', 'tahunBerdiri', 'keperluan'],
      content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Times New Roman', serif; line-height: 1.6; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 10px; }
    .header h1 { margin: 5px 0; font-size: 18px; }
    .content { margin: 30px 0; }
    .info-table td { padding: 5px; }
    .info-table td:first-child { width: 200px; }
    .signature-box { float: right; text-align: center; width: 250px; margin-top: 30px; }
    .qr-code { text-align: center; margin-top: 30px; clear: both; }
    .qr-code img { width: 150px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PEMERINTAH KABUPATEN BANDUNG</h1>
    <h1>KECAMATAN BALEENDAH - DESA SUKAMAJU</h1>
    <p>Jl. Raya Sukamaju No.100, Baleendah, Bandung 40375</p>
  </div>

  <div class="content">
    <p style="text-align: center; font-weight: bold; text-decoration: underline;">
      SURAT KETERANGAN USAHA
    </p>
    <p style="text-align: center;">Nomor: {{letterNumber}}</p>

    <p style="margin-top: 30px;">Yang bertanda tangan di bawah ini menerangkan bahwa:</p>

    <table class="info-table">
      <tr><td>Nama</td><td>: {{nama}}</td></tr>
      <tr><td>NIK</td><td>: {{nik}}</td></tr>
      <tr><td>Alamat</td><td>: {{alamat}}</td></tr>
      <tr><td>Jenis Usaha</td><td>: {{jenisUsaha}}</td></tr>
      <tr><td>Nama Usaha</td><td>: {{namaUsaha}}</td></tr>
      <tr><td>Alamat Usaha</td><td>: {{alamatUsaha}}</td></tr>
      <tr><td>Tahun Berdiri</td><td>: {{tahunBerdiri}}</td></tr>
    </table>

    <p>Benar memiliki usaha di wilayah Desa Sukamaju untuk keperluan <strong>{{keperluan}}</strong>.</p>
    <p>Demikian surat ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
  </div>

  <div class="signature-box">
    <p>Sukamaju, {{generatedDate}}</p>
    <p>Kepala Desa</p>
    <br><br><br>
    <p style="text-decoration: underline; font-weight: bold;">{{approvedByDesa}}</p>
  </div>

  {{#if qrCode}}
  <div class="qr-code">
    <img src="{{qrCode}}" alt="QR">
  </div>
  {{/if}}
</body>
</html>
      `,
      isActive: true,
    },
    {
      name: 'Surat Pengantar SKCK',
      code: 'SKCK',
      title: 'SURAT PENGANTAR SKCK',
      description: 'Template pengantar SKCK ke polsek',
      requiredFields: ['nama', 'nik', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'agama', 'pekerjaan', 'alamat', 'keperluan'],
      content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Times New Roman', serif; line-height: 1.6; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 10px; }
    .header h1 { margin: 5px 0; font-size: 18px; }
    .content { margin: 30px 0; }
    .info-table td { padding: 5px; }
    .info-table td:first-child { width: 200px; }
    .signature-box { float: right; text-align: center; width: 250px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PEMERINTAH KABUPATEN BANDUNG</h1>
    <h1>KECAMATAN BALEENDAH - DESA SUKAMAJU</h1>
    <p>Jl. Raya Sukamaju No.100, Baleendah, Bandung 40375</p>
  </div>

  <div class="content">
    <p style="text-align: center; font-weight: bold; text-decoration: underline;">
      SURAT PENGANTAR SKCK
    </p>
    <p style="text-align: center;">Nomor: {{letterNumber}}</p>

    <p style="margin-top: 30px;">
      Kepada Yth.<br>
      Kepala Kepolisian Sektor Baleendah<br>
      di Tempat
    </p>

    <p style="margin-top: 20px;">Yang bertanda tangan di bawah ini menerangkan bahwa:</p>

    <table class="info-table">
      <tr><td>Nama</td><td>: {{nama}}</td></tr>
      <tr><td>NIK</td><td>: {{nik}}</td></tr>
      <tr><td>Tempat/Tgl Lahir</td><td>: {{tempatLahir}}, {{tanggalLahir}}</td></tr>
      <tr><td>Jenis Kelamin</td><td>: {{jenisKelamin}}</td></tr>
      <tr><td>Agama</td><td>: {{agama}}</td></tr>
      <tr><td>Pekerjaan</td><td>: {{pekerjaan}}</td></tr>
      <tr><td>Alamat</td><td>: {{alamat}}</td></tr>
    </table>

    <p>
      Adalah benar warga Desa Sukamaju yang akan mengurus SKCK untuk keperluan <strong>{{keperluan}}</strong>.
    </p>
    <p>Demikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
  </div>

  <div class="signature-box">
    <p>Sukamaju, {{generatedDate}}</p>
    <p>Kepala Desa</p>
    <br><br><br>
    <p style="text-decoration: underline; font-weight: bold;">{{approvedByDesa}}</p>
  </div>
</body>
</html>
      `,
      isActive: true,
    },
  ];

  for (const templateData of templates) {
    const existing = await templateModel.findOne({ code: templateData.code });
    if (!existing) {
      const template = new templateModel(templateData);
      await template.save();
      console.log(`✅ Created template: ${templateData.name} (${templateData.code})`);
    } else {
      console.log(`⏭️  Template already exists: ${templateData.name}`);
    }
  }

  console.log('✅ Letter templates seeding completed!\n');
};
