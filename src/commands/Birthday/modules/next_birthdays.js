import { EmbedBuilder, MessageFlags } from 'discord.js';
import { getUpcomingBirthdays } from '../../../services/birthdayService.js';
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

        const next5 = await getUpcomingBirthdays(client, interaction.guildId, 5);

        if (next5.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('No Birthdays Found')
                .setDescription('No birthdays have been set up in this server yet. Use `/birthday set` to add birthdays!');
            return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        }

        // Cache-first member resolve with max 3 parallel fetches
        const valid = [];
        const staleIds = [];

        for (let i = 0; i < next5.length; i += 3) {
            const chunk = next5.slice(i, i + 3);
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

        // Background cleanup of stale birthdays
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
                .setTitle('No Upcoming Birthdays')
                .setDescription('No upcoming birthdays found for current server members.');
            return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        }

        const lines = valid.map((item, idx) => {
            const { m, b } = item;
            const time = b.daysUntil === 0 ? '🎉 **Today!**' :
                         b.daysUntil === 1 ? '📅 **Tomorrow!**' :
                         `In ${b.daysUntil} day${b.daysUntil > 1 ? 's' : ''}`;
            return `${idx + 1}. **${m.displayName}**\n<@${b.userId}>\n📅 **Date:** ${b.monthName} ${b.day}\n⏰ **Time:** ${time}\n`;
        });

        const birthdayList = [
            `🎂 **Next ${valid.length} Upcoming Birthday${valid.length !== 1 ? 's' : ''}**`,
            `Here are the upcoming birthdays in ${interaction.guild.name}:\n`,
            ...lines,
            `Use \`/birthday set\` to add your birthday!`,
        ].join('\n');

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Upcoming Birthdays')
            .setDescription(birthdayList);

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });

        logger.info('Next birthdays retrieved successfully', {
            userId: interaction.user.id,
            guildId: interaction.guildId,
            upcomingCount: valid.length,
            staleCleaned: staleIds.length,
            commandName: 'next_birthdays',
        });
    }
};
