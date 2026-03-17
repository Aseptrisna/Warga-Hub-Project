import { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * UUID Plugin for Mongoose Schemas
 *
 * CRITICAL: This plugin replaces MongoDB's default ObjectId with UUID v4
 * All schemas MUST use this plugin to ensure consistent ID generation
 *
 * Features:
 * - Generates UUID v4 for _id field
 * - Disables MongoDB versioning (__v)
 * - Transforms _id to id in JSON output
 * - Removes _id from JSON output
 */
export function uuidPlugin(schema: Schema) {
  // Replace _id with UUID
  schema.add({
    _id: {
      type: String,
      default: () => uuidv4(),
    },
  });

  // Disable versioning
  schema.set('versionKey', false);

  // Transform output
  schema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  });

  schema.set('toObject', {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  });
}
