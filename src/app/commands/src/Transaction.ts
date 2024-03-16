import { Guild, SlashCommandBuilder, TextChannel, User } from "discord.js";

import Bot from "../../Bot";
import { Command, Interaction } from "../Command";
import { TransactionEntry, getAllTransactions, getTransaction, registerTransaction, removeTransaction } from "../../modules/TransactionStuff";
import DefaultEmbed from "../../utils/DefaultEmbed";

export async function buildTransactionMessage(transaction: TransactionEntry, title: string, guild: Guild, tag: Boolean, embedAuthor: User | null = null) {
	const embed = new DefaultEmbed()
		.setTitle(title)
		.addFields([
			{
				name: "Transaction ID",
				value: transaction.id ? "n°" + transaction.id.toString() : "none",
				inline: true
			},
			{
				name: "Sending Monkey",
				value: (await guild.members.fetch(transaction.sending_monkey)).displayName + ` (id: ${transaction.sending_monkey})`
			},
			{
				name: "Receiving Monkey",
				value: (await guild.members.fetch(transaction.receiving_monkey)).displayName + ` (id: ${transaction.receiving_monkey})`
			},
			{
				name: "Merchandise",
				value: `${transaction.amount} ${transaction.unit}`,
				inline: true
			},
			{
				name: "Reason",
				value: transaction.reason
			}
		])
		.setFooter({ text: 'Union des Banques Simiennes, presque codé par le sublime Athanaze', iconURL: guild.iconURL() ?? "" });

	if (embedAuthor) {
		embed.setAuthor({
			name: embedAuthor.displayName,
			iconURL: embedAuthor.avatarURL() ?? ""
		})
	}

	return {
		content: tag ? `<@${transaction.receiving_monkey}> <@${transaction.sending_monkey}>` : "",
		embeds: [embed]
	}
}

export default class Transaction extends Command {
	override get data() {
		return new SlashCommandBuilder()
			.setName('ubs')
			.setDescription('The bank of the Monkey Empire')

			.addSubcommand(subcommand =>
				subcommand
					.setName('add_transaction')
					.setDescription('Warning: this is not MonkeyProof, you cannot cancel a transaction !')
					.addUserOption(option =>
						option.setName("sending_monkey")
							.setDescription("The monkey that must pay")
							.setRequired(true)
					)
					.addUserOption(option =>
						option.setName("receiving_monkey")
							.setDescription("The monkey receiving")
							.setRequired(true)
					)
					.addIntegerOption(option =>
						option.setName("amount")
							.setDescription("1-999999 (we prevent int overflow like proper cs monkeys :insert sunglass emoji: ")
							.setMinValue(1).setMaxValue(999999)
							.setRequired(true)
					)
					.addStringOption(option =>
						option.setName("unit")
							.setDescription("Unit of payment: could be bananas, grams of cocaine, barrels of oil...")
							.setRequired(true)
					)
					.addStringOption(option =>
						option.setName("reason")
							.setDescription("Why ?")
							.setRequired(true)
					)
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName("complete_transaction")
					.setDescription("Complete a transaction")
					.addIntegerOption(option =>
						option.setName("transaction_id")
							.setDescription("It's in the name")
							.setMinValue(0).setMaxValue(999999)
							.setRequired(true)
					)
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName("account")
					.setDescription("View the account of a monkey")
					.addUserOption(option =>
						option.setName("monkey")
							.setDescription("an animal that lives in hot countries, has a long tail, and climbs trees.")
					)
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName("PIB")
					.setDescription("Produit Intérieur Bananier")
			)
	}

	override async execute(bot: Bot, interaction: Interaction) {

		const subCommand = interaction.options.getSubcommand()

		const channel = interaction.channel
		if (channel instanceof TextChannel) {

			if (subCommand === "add_transaction") {
				const sending_monkey = interaction.options.getUser("sending_monkey", true)
				const receiving_monkey = interaction.options.getUser("receiving_monkey", true)
				const amount = interaction.options.getInteger("amount", true)
				const unit = interaction.options.getString("unit", true)
				const reason = interaction.options.getString("reason", true)

				const entr: TransactionEntry = {
					id: null,
					sending_monkey: sending_monkey.id,
					receiving_monkey: receiving_monkey.id,
					amount: amount,
					unit: unit,
					reason: reason
				}

				registerTransaction(entr, async (transactionId) => {
					if (transactionId) {
						entr.id = transactionId
						interaction.reply(await buildTransactionMessage(entr, "New pending transaction registered :bank:", channel.guild, true, interaction.user))
					} else {
						interaction.reply({ content: "This is broken" })
					}
				})
			}

			if (subCommand === "complete_transaction") {
				const transactionId = interaction.options.getInteger("transaction_id", true)

				getTransaction(transactionId, (transaction) => {
					if (transaction) {
						removeTransaction(transactionId, async (removed) => {
							if (removed) {
								interaction.reply(await buildTransactionMessage(transaction, "Transaction completed !", channel.guild, true, interaction.user))
							} else {
								interaction.reply("No transaction with the specified id !")
							}
						})
					} else {
						interaction.reply({ content: "No transaction with the specified id !", ephemeral: true })
					}
				})
			}

			if (subCommand === "account") {
				const monkey = interaction.options.getUser("monkey")

				const target = monkey ?? interaction.user
				getAllTransactions(target.id, async (transactions) => {
					if (transactions.length === 0) interaction.reply("No pending transaction for the given user !")
					else {
						await interaction.reply(`Account of ${target.displayName}`)
						transactions.forEach(async transaction => {
							channel.send(await buildTransactionMessage(transaction, "Pending transaction", channel.guild, false))
						})
					}
				})
			}

			if (subCommand === "PIB") {
				getAllTransactionsGivenUnit("banane", async (transactions) => {
					if (transactions.length === 0) interaction.reply("No pending transaction for the given user !")
					else {
						await interaction.reply(`Account of ${target.displayName}`)
						transactions.forEach(async transaction => {
							channel.send(await buildTransactionMessage(transaction, "Pending transaction", channel.guild, false))
						})
					}
				})
			}
		}
	}
}