import { DB } from "./Database";
import Bot from "../Bot";
import logger from "./Logger";

type TransactionId = number

export interface TransactionEntry {
	id: TransactionId | null,
	sending_monkey: string, 
	receiving_monkey: string,
	amount: number,
	unit: string,
	reason: string
}

// everyday at 7am
export function getUnpaidedAccountingEntriesFromDB(bot: Bot) {
	DB.serialize(() => {			
		DB.each("SELECT * FROM transactions", (err, entr: TransactionEntry) => {
			// TODO Prince : genre le bot envoie un message avec l'accounting entry
			//scheduleMessage(bot, entr)
		});
	});
}

export function registerTransaction(transaction: TransactionEntry, callback: (transactionId: TransactionId) => void) {
	DB.serialize(() => {
		const stmt = DB.prepare("INSERT INTO transactions (sending_monkey, receiving_monkey, amount, unit, reason) VALUES (?, ?, ?, ?, ?)");			
		stmt.run([transaction.sending_monkey, transaction.receiving_monkey, transaction.amount, transaction.unit, transaction.reason], function(err) {
			if (err) logger.error(err)
			else callback(this.lastID)
		})		
	});
}

export function removeTransaction(id: TransactionId, callback: (removed: Boolean) => void) {
	DB.serialize(() => {
		const stmt = DB.prepare("DELETE FROM transactions WHERE id = ?");			
		stmt.run(id, function(err) {
			if (err) logger.error(err)
			callback(this.changes ? true : false)
		})		
	});
}

export function getTransaction(transactionId: TransactionId, callback: (transaction: TransactionEntry  | null) => void) {
	DB.serialize(() => {
		const stmt = DB.prepare("SELECT * FROM transactions WHERE id = ?");			
		stmt.get(transactionId, (err, transaction: TransactionEntry) => {
			if (err) {
				logger.error(err)
			} else {
				callback(transaction)
			}
		})
	})
}

export function getAllTransactions(monkey: string | null, callback: (transactions: TransactionEntry[]) => void) {
	const requestTemplate = monkey ? "SELECT * FROM transactions WHERE sending_monkey = ? OR receiving_monkey = ?" : "SELECT * FROM transactions"
	DB.serialize(() => {
		const stmt = DB.prepare(requestTemplate);			
		stmt.all(monkey ? [monkey, monkey] : [], (err, transactions: TransactionEntry[]) => {
			if (err) {
				logger.error(err)
			} else {
				callback(transactions)
			}
		})
	})
}

export function getAllTransactionsGivenUnit(unit: string, callback: (transactions: TransactionEntry[]) => void) {
	DB.serialize(() => {
		const stmt = DB.prepare("SELECT * FROM transactions WHERE unit = ?");			
		stmt.all(unit, (err, transactions: TransactionEntry[]) => {
			if (err) {
				logger.error(err)
			} else {
				callback(transactions)
			}
		})
	})
}


DB.run('CREATE TABLE "transactions" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "sending_monkey" TEXT NOT NULL, "receiving_monkey" TEXT NOT NULL, "amount" INTEGER NOT NULL, "unit" TEXT NOT NULL, "reason" TEXT NOT NULL)', (err) => {
	if (err) {
		logger.info("SQL: table transactions already created")
	} else {
		logger.info("SQL: table transactions created")
	}
})