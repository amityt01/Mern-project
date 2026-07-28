const fs = require("fs");
const path = require("path");

// Directory where uploaded files will be stored
const UPLOAD_DIR = path.join(__dirname, "../public/uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuration for file validation
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/jpg",
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit for low-bandwidth rural environments

/**
 * Validates file extension, mime type, and file size.
 */
function validateUploadedFile(originalname, mimetype, size) {
  const ext = path.extname(originalname || "").toLowerCase();
  const isExtensionValid = ALLOWED_EXTENSIONS.includes(ext);
  const isMimeValid = ALLOWED_MIME_TYPES.includes(mimetype) || isExtensionValid;

  if (!isExtensionValid && !isMimeValid) {
    return {
      valid: false,
      message: `Invalid file format (${ext || "unknown"}). Allowed formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG.`,
    };
  }

  if (size && size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      message: `File size (${sizeMB} MB) exceeds the maximum limit of 5 MB for rural uploads.`,
    };
  }

  return { valid: true };
}

/**
 * Parses multipart/form-data payload from raw Buffer.
 */
function parseMultipartBuffer(buffer, boundary) {
  const fields = {};
  let file = null;

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let start = buffer.indexOf(boundaryBuffer);

  while (start !== -1) {
    let nextStart = buffer.indexOf(boundaryBuffer, start + boundaryBuffer.length);
    if (nextStart === -1) break;

    let partBuffer = buffer.slice(start + boundaryBuffer.length, nextStart);
    if (partBuffer.length >= 2 && partBuffer[0] === 13 && partBuffer[1] === 10) {
      partBuffer = partBuffer.slice(2);
    }
    if (partBuffer.length >= 2 && partBuffer[partBuffer.length - 2] === 13 && partBuffer[partBuffer.length - 1] === 10) {
      partBuffer = partBuffer.slice(0, partBuffer.length - 2);
    }

    const headerEnd = partBuffer.indexOf("\r\n\r\n");
    if (headerEnd !== -1) {
      const headerStr = partBuffer.slice(0, headerEnd).toString("utf8");
      const bodyBuffer = partBuffer.slice(headerEnd + 4);

      const dispositionMatch = headerStr.match(/name="([^"]+)"/);
      const filenameMatch = headerStr.match(/filename="([^"]+)"/);
      const contentTypeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);

      if (dispositionMatch) {
        const fieldName = dispositionMatch[1];
        if (filenameMatch) {
          const originalname = filenameMatch[1];
          const mimetype = contentTypeMatch ? contentTypeMatch[1].trim() : "application/octet-stream";
          file = {
            fieldname: fieldName,
            originalname,
            mimetype,
            buffer: bodyBuffer,
            size: bodyBuffer.length,
          };
        } else {
          fields[fieldName] = bodyBuffer.toString("utf8");
        }
      }
    }

    start = nextStart;
  }

  return { fields, file };
}

/**
 * Single File Upload Middleware
 */
function singleUploadMiddleware(fieldname = "file") {
  return (req, res, next) => {
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("multipart/form-data")) {
      // Non-multipart request (e.g. standard JSON body), skip file handling
      return next();
    }

    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!boundaryMatch) {
      return res.status(400).json({ message: "Bad Request: Missing multipart boundary header." });
    }

    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const chunks = [];
    let totalBytes = 0;
    let limitExceeded = false;

    req.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_FILE_SIZE_BYTES + 2 * 1024 * 1024) {
        limitExceeded = true;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (limitExceeded) {
        return res.status(400).json({ message: "File size exceeds the maximum limit of 5 MB." });
      }

      try {
        const fullBuffer = Buffer.concat(chunks);
        const { fields, file } = parseMultipartBuffer(fullBuffer, boundary);

        req.body = req.body || {};
        Object.assign(req.body, fields);

        if (file) {
          const validation = validateUploadedFile(file.originalname, file.mimetype, file.size);
          if (!validation.valid) {
            return res.status(400).json({ message: validation.message });
          }

          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = path.extname(file.originalname).toLowerCase();
          const filename = `${uniqueSuffix}${ext}`;
          const filePath = path.join(UPLOAD_DIR, filename);

          fs.writeFileSync(filePath, file.buffer);

          req.file = {
            fieldname: file.fieldname,
            originalname: file.originalname,
            filename: filename,
            mimetype: file.mimetype,
            size: file.size,
            path: filePath,
            destination: UPLOAD_DIR,
            fileUrl: `/uploads/${filename}`,
          };
        }

        next();
      } catch (err) {
        return res.status(400).json({ message: `File upload error: ${err.message}` });
      }
    });

    req.on("error", (err) => {
      return res.status(400).json({ message: `Upload stream error: ${err.message}` });
    });
  };
}

/**
 * Express Multer Interface Wrapper
 */
function multer(config = {}) {
  return {
    single: (fieldname = "file") => singleUploadMiddleware(fieldname),
    array: (fieldname = "file") => singleUploadMiddleware(fieldname),
    fields: () => singleUploadMiddleware("file"),
    any: () => singleUploadMiddleware("file"),
  };
}

multer.diskStorage = (opts = {}) => opts;
multer.memoryStorage = () => ({});
multer.single = singleUploadMiddleware;
multer.validateFile = validateUploadedFile;

module.exports = multer;
