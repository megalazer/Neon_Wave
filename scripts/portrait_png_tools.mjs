import { deflateSync, inflateSync } from 'node:zlib';

const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const RGBA8_ERROR = 'Only RGBA8 PNG portrait pieces are supported';
const COLOR_TYPE_RGBA = 6;
const BIT_DEPTH_8 = 8;
const BYTES_PER_PIXEL = 4;

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    c = crcTable[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function assertRgba8Png({ bitDepth, colorType, compression, filter, interlace }) {
  if (
    bitDepth !== BIT_DEPTH_8 ||
    colorType !== COLOR_TYPE_RGBA ||
    compression !== 0 ||
    filter !== 0 ||
    interlace !== 0
  ) {
    throw new Error(RGBA8_ERROR);
  }
}

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilterScanlines(inflated, width, height) {
  const stride = width * BYTES_PER_PIXEL;
  const expected = (stride + 1) * height;
  if (inflated.length !== expected) {
    throw new Error('Invalid PNG scanline data length');
  }

  const data = Buffer.alloc(width * height * BYTES_PER_PIXEL);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    const filterType = inflated[rowStart];
    const outStart = y * stride;
    const prevStart = outStart - stride;

    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[rowStart + 1 + x];
      const left = x >= BYTES_PER_PIXEL ? data[outStart + x - BYTES_PER_PIXEL] : 0;
      const up = y > 0 ? data[prevStart + x] : 0;
      const upLeft = y > 0 && x >= BYTES_PER_PIXEL ? data[prevStart + x - BYTES_PER_PIXEL] : 0;

      let value;
      if (filterType === 0) {
        value = raw;
      } else if (filterType === 1) {
        value = raw + left;
      } else if (filterType === 2) {
        value = raw + up;
      } else if (filterType === 3) {
        value = raw + Math.floor((left + up) / 2);
      } else if (filterType === 4) {
        value = raw + paethPredictor(left, up, upLeft);
      } else {
        throw new Error('Unsupported PNG filter type');
      }
      data[outStart + x] = value & 0xff;
    }
  }
  return data;
}

function writeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  const crcInput = Buffer.concat([typeBuffer, data]);
  chunk.writeUInt32BE(crc32(crcInput), 8 + data.length);
  return chunk;
}

export function decodePngRgba(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer);
  }
  if (buffer.length < PNG_SIGNATURE.length || !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error('Invalid PNG signature');
  }

  let offset = PNG_SIGNATURE.length;
  let width = 0;
  let height = 0;
  const idatChunks = [];
  let sawIhdr = false;
  let sawIend = false;

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const crcEnd = dataEnd + 4;
    if (crcEnd > buffer.length) {
      throw new Error('Invalid PNG chunk length');
    }

    const data = buffer.subarray(dataStart, dataEnd);
    if (type === 'IHDR') {
      sawIhdr = true;
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assertRgba8Png({
        bitDepth: data[8],
        colorType: data[9],
        compression: data[10],
        filter: data[11],
        interlace: data[12],
      });
    } else if (type === 'IDAT') {
      idatChunks.push(Buffer.from(data));
    } else if (type === 'IEND') {
      sawIend = true;
      break;
    }

    offset = crcEnd;
  }

  if (!sawIhdr || !sawIend || idatChunks.length === 0 || width <= 0 || height <= 0) {
    throw new Error('Invalid PNG data');
  }

  const inflated = inflateSync(Buffer.concat(idatChunks));
  return { width, height, data: unfilterScanlines(inflated, width, height) };
}

export function encodePngRgba({ width, height, data }) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error('Invalid PNG dimensions');
  }
  if (!Buffer.isBuffer(data)) {
    data = Buffer.from(data);
  }
  const stride = width * BYTES_PER_PIXEL;
  if (data.length !== stride * height) {
    throw new Error('Invalid RGBA data length');
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = BIT_DEPTH_8;
  ihdr[9] = COLOR_TYPE_RGBA;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rawStart = y * (stride + 1);
    raw[rawStart] = 0;
    data.copy(raw, rawStart + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    writeChunk('IHDR', ihdr),
    writeChunk('IDAT', deflateSync(raw)),
    writeChunk('IEND', Buffer.alloc(0)),
  ]);
}

export function isCheckerPixel(r, g, b, a) {
  return a > 0 && Math.max(r, g, b) - Math.min(r, g, b) <= 8 && (r + g + b) / 3 >= 180;
}

export function sanitizeTransparentLayerPng(buffer) {
  const decoded = decodePngRgba(buffer);
  const data = Buffer.from(decoded.data);
  let changedPixels = 0;
  let checkerPixelsBefore = 0;

  for (let i = 0; i < data.length; i += BYTES_PER_PIXEL) {
    if (isCheckerPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) {
      checkerPixelsBefore += 1;
      changedPixels += 1;
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    }
  }

  return {
    buffer: encodePngRgba({ width: decoded.width, height: decoded.height, data }),
    changedPixels,
    checkerPixelsBefore,
  };
}

function measureDecodedContentBounds(width, height, data) {
  let opaquePixels = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * BYTES_PER_PIXEL;
      if (data[index + 3] > 0) {
        opaquePixels += 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const bounds = opaquePixels === 0 ? null : {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };

  const contentWidthRatio = bounds == null ? 0 : bounds.width / width;
  const contentHeightRatio = bounds == null ? 0 : bounds.height / height;

  return {
    width,
    height,
    opaquePixels,
    bounds,
    contentWidthRatio,
    contentHeightRatio,
    maxContentRatio: Math.max(contentWidthRatio, contentHeightRatio),
  };
}

export function measurePngContentBounds(buffer) {
  const { width, height, data } = decodePngRgba(buffer);
  return measureDecodedContentBounds(width, height, data);
}

export function normalizePortraitLayerScalePng(buffer, options = {}) {
  const {
    targetMaxContentRatio = 0.72,
    maxContentRatio = 0.82,
    offsetYRatio = 0.04,
  } = options;
  const decoded = decodePngRgba(buffer);
  const { width, height, data } = decoded;
  const boundsBefore = measureDecodedContentBounds(width, height, data);

  if (boundsBefore.bounds == null || boundsBefore.maxContentRatio <= maxContentRatio) {
    return {
      buffer,
      changed: false,
      scale: 1,
      boundsBefore,
      boundsAfter: boundsBefore,
    };
  }

  const scale = targetMaxContentRatio / boundsBefore.maxContentRatio;
  const scaled = Buffer.alloc(data.length);
  const centerX = width / 2;
  const centerY = height / 2;
  const offsetY = height * offsetYRatio;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const srcX = Math.round((x - centerX) / scale + centerX);
      const srcY = Math.round((y - centerY - offsetY) / scale + centerY);
      if (srcX < 0 || srcX >= width || srcY < 0 || srcY >= height) continue;

      const srcIndex = (srcY * width + srcX) * BYTES_PER_PIXEL;
      const destIndex = (y * width + x) * BYTES_PER_PIXEL;
      scaled[destIndex] = data[srcIndex];
      scaled[destIndex + 1] = data[srcIndex + 1];
      scaled[destIndex + 2] = data[srcIndex + 2];
      scaled[destIndex + 3] = data[srcIndex + 3];
    }
  }

  return {
    buffer: encodePngRgba({ width, height, data: scaled }),
    changed: true,
    scale,
    boundsBefore,
    boundsAfter: measureDecodedContentBounds(width, height, scaled),
  };
}

export function measurePngAlpha(buffer) {
  const { width, height, data } = decodePngRgba(buffer);
  const pixels = width * height;
  let transparentPixels = 0;
  let opaquePixels = 0;
  let checkerOpaquePixels = 0;

  for (let i = 0; i < data.length; i += BYTES_PER_PIXEL) {
    const a = data[i + 3];
    if (a === 0) transparentPixels += 1;
    if (a > 0) opaquePixels += 1;
    if (isCheckerPixel(data[i], data[i + 1], data[i + 2], a)) checkerOpaquePixels += 1;
  }

  return {
    width,
    height,
    pixels,
    transparentPixels,
    opaquePixels,
    checkerOpaquePixels,
    transparentRatio: pixels === 0 ? 0 : transparentPixels / pixels,
    checkerOpaqueRatio: pixels === 0 ? 0 : checkerOpaquePixels / pixels,
  };
}
