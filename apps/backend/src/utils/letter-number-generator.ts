/**
 * Generate letter number in format:
 * 001/SKD/RT.01/XII/2026
 *
 * Format breakdown:
 * - Sequential number (001, 002, etc.)
 * - Letter code (SKD, SKTM, SKCK, etc.)
 * - Region (RT.01, RW.01, DESA, etc.)
 * - Month in Roman numerals (I-XII)
 * - Year (YYYY)
 */

export class LetterNumberGenerator {
  private static readonly ROMAN_MONTHS = [
    'I', 'II', 'III', 'IV', 'V', 'VI',
    'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
  ];

  /**
   * Get month in Roman numerals
   */
  private static getRomanMonth(month: number): string {
    return this.ROMAN_MONTHS[month - 1] || 'I';
  }

  /**
   * Generate letter number
   *
   * @param sequenceNumber - Sequential number (1, 2, 3, ...)
   * @param letterCode - Letter code (SKD, SKTM, etc.)
   * @param regionCode - Region code (RT.01, RW.01, DESA, etc.)
   * @param date - Optional date (defaults to now)
   */
  static generate(
    sequenceNumber: number,
    letterCode: string,
    regionCode: string,
    date: Date = new Date(),
  ): string {
    const paddedNumber = sequenceNumber.toString().padStart(3, '0');
    const month = this.getRomanMonth(date.getMonth() + 1);
    const year = date.getFullYear();

    return `${paddedNumber}/${letterCode}/${regionCode}/${month}/${year}`;
  }

  /**
   * Extract region code from region data
   */
  static getRegionCode(region: {
    type: string;
    rt?: string;
    rw?: string;
    desa?: string;
  }): string {
    if (region.type === 'RT' && region.rt) {
      return `RT.${region.rt}`;
    }
    if (region.type === 'RW' && region.rw) {
      return `RW.${region.rw}`;
    }
    if (region.type === 'Desa' && region.desa) {
      return 'DESA';
    }
    return 'DESA'; // Default
  }
}
