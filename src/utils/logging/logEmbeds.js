// logEmbeds.js — shared helpers for clean, scannable log embeds

import { EmbedBuilder } from 'discord.js';

// ─── Constants ──────────────────────────────────────────────────────────────────

const EMOJI_PREFIX = /^[\p{Extended_Pictographic}\uFE0F\s]+/u;

const LIMITS = Object.freeze({
  TITLE: 256,
  DESCRIPTION: 4096,
  FIELD_NAME: 256,
  FIELD_VALUE: 1024,
  FOOTER_TEXT: 2048,
  AUTHOR_NAME: 256,
  FIELDS: 25,
  MAX_ROLE_PERMISSIONS: 5,
});

const SEPARATORS = Object.freeze({
  META: ' • ',
  LINE: '\n',
  BLOCKQUOTE: '> ',
  SECTION: '\n\n',
});

// ─── String Helpers ───────────────────────────────────────────────────────────

/**
 * Strip emoji prefix from a field label for consistent comparison.
 * @param {string} name
 * @returns {string}
 */
export function stripFieldLabel(name = '') {
  const stripped = name.replace(EMOJI_PREFIX, '').trim();
  return stripped || name;
}

/**
 * Safely truncate a string to a maximum length.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
function truncate(str, max) {
  if (typeof str !== 'string') return String(str).slice(0, max);
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Format a bold label + value pair.
 * @param {string} label
 * @param {string} value
 * @returns {string}
 */
export function formatLogLine(label, value) {
  return `**${truncate(label, LIMITS.FIELD_NAME)}:** ${truncate(String(value), LIMITS.FIELD_VALUE)}`;
}

/**
 * Format metadata entries as a joined line.
 * @param {[string, unknown][]} entries
 * @returns {string}
 */
export function formatMetaLine(entries) {
  return entries
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => `**${truncate(label, LIMITS.FIELD_NAME)}:** ${truncate(String(value), LIMITS.FIELD_VALUE)}`)
    .join(SEPARATORS.META);
}

/**
 * Wrap lines in Discord blockquote formatting.
 * @param {string[]} lines
 * @returns {string}
 */
export function buildQuotedBlock(lines) {
  return lines.map((line) => `${SEPARATORS.BLOCKQUOTE}${line}`).join(SEPARATORS.LINE);
}

/**
 * Build a log description from structured parts.
 * @param {object} [options]
 * @param {string} [options.headline]
 * @param {string[]} [options.lines]
 * @param {boolean} [options.quoted]
 * @param {[string, unknown][]} [options.meta]
 * @returns {string}
 */
export function buildLogDescription({ headline, lines = [], quoted = false, meta = [] } = {}) {
  const parts = [];

  if (headline) {
    parts.push(truncate(headline, LIMITS.DESCRIPTION));
  }

  if (lines.length > 0) {
    const content = quoted ? buildQuotedBlock(lines) : lines.join(SEPARATORS.LINE);
    parts.push(content);
  }

  if (meta.length > 0) {
    parts.push(formatMetaLine(meta));
  }

  return parts.join(SEPARATORS.SECTION).slice(0, LIMITS.DESCRIPTION);
}

/**
 * Convert embed fields to log lines.
 * @param {import('discord.js').EmbedField[]} fields
 * @returns {string[]}
 */
export function fieldsToLines(fields = []) {
  return fields.map((field) => formatLogLine(stripFieldLabel(field.name), field.value));
}

/**
 * Split fields into before/after comparison groups.
 * @param {import('discord.js').EmbedField[]} fields
 * @returns {{before: string|null, after: string|null, rest: import('discord.js').EmbedField[]}}
 */
export function splitComparisonFields(fields = []) {
  const comparison = { before: null, after: null, rest: [] };

  for (const field of fields) {
    const label = stripFieldLabel(field.name).toLowerCase();

    if (/^old|^before/.test(label)) {
      comparison.before = field.value;
    } else if (/^new|^after/.test(label)) {
      comparison.after = field.value;
    } else {
      comparison.rest.push(field);
    }
  }

  return comparison;
}

// ─── Footer & Author ──────────────────────────────────────────────────────────

/**
 * Apply a footer to a log embed with fallback strategies.
 * @param {EmbedBuilder} embed
 * @param {object} [options]
 * @param {import('discord.js').Guild|null} [options.guild]
 * @param {string} [options.executorId]
 * @param {string} [options.executorTag]
 * @param {string} [options.executorAvatar]
 * @param {string} [options.footerText]
 * @returns {EmbedBuilder}
 */
export function applyLogFooter(embed, { guild, executorId, executorTag, executorAvatar, footerText } = {}) {
  if (footerText) {
    embed.setFooter({
      text: truncate(footerText, LIMITS.FOOTER_TEXT),
      iconURL: executorAvatar || undefined,
    });
    return embed;
  }

  if (executorId && executorTag) {
    embed.setFooter({
      text: truncate(`${executorTag} • ${executorId}`, LIMITS.FOOTER_TEXT),
      iconURL: executorAvatar || undefined,
    });
    return embed;
  }

  if (guild) {
    embed.setFooter({
      text: truncate(guild.name, LIMITS.FOOTER_TEXT),
      iconURL: guild.iconURL({ dynamic: true }) || undefined,
    });
  }

  return embed;
}

/**
 * Append a labeled content section to a description.
 * @param {string} description
 * @param {string} label
 * @param {string} content
 * @returns {string}
 */
export function appendContentSection(description = '', label, content) {
  if (!content) {
    return description;
  }

  const base = description?.trim() || '';
  const section = `**${truncate(label, LIMITS.FIELD_NAME)}**\n${truncate(String(content), LIMITS.DESCRIPTION)}`;
  const combined = base ? `${base}${SEPARATORS.SECTION}${section}` : section;
  return combined.slice(0, LIMITS.DESCRIPTION);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Format a numeric rating as stars.
 * @param {number} rating
 * @returns {string|null}
 */
export function formatRatingStars(rating) {
  const numeric = Number(rating);
  if (!Number.isFinite(numeric) || numeric < 1) {
    return null;
  }

  const clamped = Math.min(5, Math.max(1, Math.round(numeric)));
  return `${'⭐'.repeat(clamped)} (${clamped}/5)`;
}

/**
 * Resolve a user as an embed author.
 * @param {import('discord.js').Client} client
 * @param {string} userId
 * @returns {Promise<{name: string, iconURL?: string}|null>}
 */
export async function resolveUserAuthor(client, userId) {
  if (!userId) {
    return null;
  }

  try {
    const user = await client.users.fetch(userId);
    return {
      name: truncate(user.tag, LIMITS.AUTHOR_NAME),
      iconURL: user.displayAvatarURL({ dynamic: true }),
    };
  } catch {
    return {
      name: truncate(`User ${userId}`, LIMITS.AUTHOR_NAME),
    };
  }
}

// ─── Standard Embed Builder ───────────────────────────────────────────────────

/**
 * Build a standard log embed with safe truncation.
 * @param {object} options
 * @param {number} options.color
 * @param {string} [options.title]
 * @param {string} [options.description]
 * @param {string} [options.thumbnail]
 * @param {string} [options.image]
 * @param {import('discord.js').EmbedFieldData[]} [options.inlineFields]
 * @param {import('discord.js').EmbedFieldData[]} [options.fields]
 * @param {{name: string, iconURL?: string}|null} [options.author]
 * @param {boolean} [options.timestamp=true]
 * @param {{text: string, iconURL?: string}} [options.footer]
 * @returns {EmbedBuilder}
 */
export function buildStandardLogEmbed({
  color,
  title,
  description,
  thumbnail,
  image,
  inlineFields = [],
  fields = [],
  author = null,
  timestamp = true,
  footer,
}) {
  const embed = new EmbedBuilder().setColor(color);

  if (title) embed.setTitle(truncate(title, LIMITS.TITLE));
  if (description) embed.setDescription(truncate(description, LIMITS.DESCRIPTION));
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);

  if (author?.name) {
    embed.setAuthor({
      name: truncate(author.name, LIMITS.AUTHOR_NAME),
      iconURL: author.iconURL || undefined,
    });
  }

  const combinedFields = [...inlineFields, ...fields].slice(0, LIMITS.FIELDS);
  if (combinedFields.length > 0) {
    embed.addFields(
      combinedFields.map((field) => ({
        name: truncate(field.name, LIMITS.FIELD_NAME),
        value: truncate(String(field.value), LIMITS.FIELD_VALUE),
        inline: field.inline === true,
      }))
    );
  }

  if (timestamp) embed.setTimestamp();

  if (footer?.text) {
    embed.setFooter({
      text: truncate(footer.text, LIMITS.FOOTER_TEXT),
      iconURL: footer.iconURL || undefined,
    });
  }

  return embed;
}

// ─── Role Audit Helpers ───────────────────────────────────────────────────────

/**
 * Build fields for role audit logging.
 * @param {import('discord.js').Role} role
 * @param {object} [options]
 * @param {boolean} [options.includeMemberCount=false]
 * @returns {import('discord.js').EmbedFieldData[]}
 */
export function buildRoleAuditFields(role, { includeMemberCount = false } = {}) {
  const fields = [
    { name: 'Role Name', value: role.name, inline: true },
    { name: 'Color', value: role.hexColor || '#000000', inline: true },
    { name: 'Role ID', value: role.id, inline: true },
  ];

  const permissions = role.permissions.toArray();
  if (permissions.length > 0) {
    const displayed = permissions.slice(0, LIMITS.MAX_ROLE_PERMISSIONS).join(', ');
    const remaining = permissions.length - LIMITS.MAX_ROLE_PERMISSIONS;
    fields.push({
      name: 'Permissions',
      value: remaining > 0
        ? `${displayed}… (+${remaining} more)`
        : displayed,
      inline: false,
    });
  }

  fields.push(
    { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
    { name: 'Managed', value: role.managed ? 'Yes (Bot role)' : 'No', inline: true },
    { name: 'Position', value: role.position.toString(), inline: true }
  );

  if (includeMemberCount) {
    fields.push({
      name: 'Members with Role',
      value: role.members.size.toString(),
      inline: true,
    });
  }

  return fields;
}

/**
 * Build role audit lines for text-based logging.
 * @param {import('discord.js').Role} role
 * @param {object} [options]
 * @returns {string[]}
 */
export function buildRoleAuditLines(role, options = {}) {
  return buildRoleAuditFields(role, options).map((field) =>
    formatLogLine(field.name, field.value),
  );
                               }
