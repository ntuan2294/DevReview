// src/services/FileService.js

class FileService {
  // Mapping file extensions to programming languages
  static LANGUAGE_MAP = {
    'py': 'python',
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'javascript',
    'tsx': 'javascript',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'c': 'cpp',
    'h': 'cpp',
    'hpp': 'cpp',
    'java': 'java',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'css',
    'sass': 'css',
    'less': 'css'
  };

  // Allowed file extensions
  static ALLOWED_EXTENSIONS = Object.keys(FileService.LANGUAGE_MAP);
  
  // Max file size (5MB)
  static MAX_FILE_SIZE = 5 * 1024 * 1024;

  /**
   * Detect programming language from file extension
   * @param {string} filename - The name of the file
   * @returns {string|null} - The detected language or null if not supported
   */
  static detectLanguage(filename) {
    if (!filename) return null;
    
    const extension = filename.split('.').pop()?.toLowerCase();
    return FileService.LANGUAGE_MAP[extension] || null;
  }

  /**
   * Validate file before processing
   * @param {File} file - The file to validate
   * @returns {object} - Validation result with isValid and error message
   */
  static validateFile(file) {
    if (!file) {
      return { isValid: false, error: 'Không có file được chọn' };
    }

    // Check file size
    if (file.size > FileService.MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `File quá lớn. Kích thước tối đa cho phép: ${FileService.MAX_FILE_SIZE / (1024 * 1024)}MB` 
      };
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!FileService.ALLOWED_EXTENSIONS.includes(extension)) {
      return { 
        isValid: false, 
        error: `Định dạng file không được hỗ trợ. Các định dạng cho phép: ${FileService.ALLOWED_EXTENSIONS.join(', ')}` 
      };
    }

    return { isValid: true, error: null };
  }

  /**
   * Read file content as text
   * @param {File} file - The file to read
   * @returns {Promise<string>} - Promise that resolves to file content
   */
  static readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Lỗi khi đọc file'));
      };
      
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Process uploaded file (validate + read content + detect language)
   * @param {File} file - The uploaded file
   * @returns {Promise<object>} - Promise that resolves to processed file data
   */
  static async processFile(file) {
    try {
      // Validate file
      const validation = FileService.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Read file content
      const content = await FileService.readFileContent(file);
      
      // Detect language
      const language = FileService.detectLanguage(file.name);

      return {
        success: true,
        data: {
          content,
          language,
          filename: file.name,
          size: file.size,
          extension: file.name.split('.').pop()?.toLowerCase()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get file info without reading content
   * @param {File} file - The file to get info from
   * @returns {object} - File information
   */
  static getFileInfo(file) {
    if (!file) return null;

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: file.name.split('.').pop()?.toLowerCase(),
      language: FileService.detectLanguage(file.name),
      lastModified: new Date(file.lastModified)
    };
  }

  /**
   * Format file size to human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default FileService;