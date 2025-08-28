import * as fs from 'fs';
import * as path from 'path';

export class FileValidator {
  /**
   * Check if the input file exists at the specified path
   * @param relativePath - Relative path from project root
   * @returns true if file exists, false otherwise
   */
  static fileExists(relativePath: string): boolean {
    const absolutePath = path.resolve(process.cwd(), relativePath);
    return fs.existsSync(absolutePath);
  }

  /**
   * Get the absolute path for a relative path from project root
   * @param relativePath - Relative path from project root
   * @returns Absolute file path
   */
  static getAbsolutePath(relativePath: string): string {
    return path.resolve(process.cwd(), relativePath);
  }
}
