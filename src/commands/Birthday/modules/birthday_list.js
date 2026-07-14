import { EmbedBuilder, MessageFlags } from 'discord.js';
import { getBirthdayList } from '../../../services/birthdayService.js';
import { deleteBirthday } from '../../../utils/database.js';
import { logger } from '../../../utils/logger.js';
import { InteractionHelper } from '../../../utils/interactionHelper.js';

export default {
    async execute(interaction, config, client) {
        if (!interaction.guild) {
            return InteractionHelper.safeReply(interaction, {
                content: 'This command can only be used in a server.',
                flags: MessageFlags.Ephemeral,
            });
        }

        await InteractionHelper.safeDefer(interaction);

        const all = await getBirthdayList(client, interaction.guildId);

        if (all.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('No Birthdays Found')
                .setDescription('No birthdays have been set up in this server yet. Use `/birthday set` to add birthdays!');
            return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        }

        // Cache-first member resolve with max 2 parallel fetches (lower for large lists)
        const valid = [];
        const staleIds = [];

        for (let i = 0; i < all.length; i += 2) {
            const chunk = all.slice(i, i + 2);
            const results = await Promise.allSettled(
                chunk.map(async (b) => {
                    let m = interaction.guild.members.cache.get(b.userId);
                    if (!m) {
                        try { m = await interaction.guild.members.fetch(b.userId); }
                        catch { return { b, m: null }; }
                    }
                    return { b, m };
                })
            );

            for (const r of results) {
                if (r.status === 'rejected' || !r.value?.m) {
                    staleIds.push(r.value?.b?.userId);
                    continue;
                }
                valid.push(r.value);
            }
        }

        // Background cleanup
        if (staleIds.length > 0) {
            Promise.allSettled(
                staleIds.map((uid) => deleteBirthday(client, interaction.guildId, uid).catch(() => null))
            ).then((res) => {
                const deleted = res.filter((r) => r.status === 'fulfilled').length;
                if (deleted > 0) logger.info('Cleaned stale birthdays', { event: 'birthday.stale_cleanup', count: deleted, guildId: interaction.guildId });
            });
        }

        if (valid.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('No Birthdays Found')
                .setDescription('All birthday records belong to members who have left the server.');
            return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        }

        // Sort by upcoming date
        valid.sort((a, b) => a.b.daysUntil - b.b.daysUntil);

        const lines = valid.map((item, idx) => {
            const { m, b } = item;
            const time = b.daysUntil === 0 ? '🎉 **Today!**' :
                         b.daysUntil === 1 ? '📅 **Tomorrow!**' :
                         `In ${b.daysUntil} day${b.daysUntil > 1 ? 's' : ''}`;
            return `${idx + 1}. **${m.displayName}**\n<@${b.userId}>\n📅 **Date:** ${b.monthName} ${b.day}\n⏰ **Time:** ${time}\n`;
        });

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`🎂 Birthday List (${valid.length})`)
            .setDescription(lines.join('\n'))
            .setFooter({ text: `Use /birthday set to add yours! • ${staleIds.length} stale records cleaned` });

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });

        logger.info('Birthday list retrieved successfully', {
            userId: interaction.user.id,
            guildId: interaction.guildId,
            totalCount: valid.length,
            staleCleaned: staleIds.length,
            commandName: 'birthday_list',
        });
    }
};
