const TelegramBot = require("node-telegram-bot-api");
const sql = require("mssql");
const token = "7043678274:AAGqFfaaqIjAOraj2oWhtMtn_xOEqsTpO2M";
const bot = new TelegramBot(token, { polling: true });
const axios = require("axios");
const express = require("express");
const app = express();

module.exports = { bot, token };

const dbConfig = {
	server: "localhost",
	user: "ravenfox",
	password: "67249123bjbf",
	database: "tgbot",
	options: {
		encrypt: false,
		trustServerCertificate: true,
	},
};

async function checkDBConnection() {
	try {
		console.log("Попытка подключения к базе данных...");
		await sql.connect(dbConfig);
		console.log("Успешное подключение к базе данных!");
	} catch (error) {
		console.error("Ошибка подключения к базе данных:", error);
	}
}

checkDBConnection();

async function saveUserDataToDB(
	userId,
	firstName,
	lastName,
	phoneNumber,
	telegramId
) {
	try {
		await sql.connect(dbConfig);
		const request = new sql.Request();

		const query = `
			INSERT INTO Users (UserID, FirstName, LastName, PhoneNumber, TelegramID)
			VALUES (@userId, @firstName, @lastName, @phoneNumber, @telegramId)
		`;

		request.input("userId", sql.Int, userId);
		request.input("firstName", sql.NVarChar, firstName);
		request.input("lastName", sql.NVarChar, lastName);
		request.input("phoneNumber", sql.NVarChar, phoneNumber);
		request.input("telegramId", sql.Int, telegramId);

		await request.query(query);
		console.log("Данные успешно сохранены в базу данных.");
	} catch (error) {
		console.error("Ошибка при сохранении данных в базу данных:", error);
	} finally {
		sql.close();
	}
}

// Функция для проверки существования пользователя в базе данных
async function checkUserExists(telegramId) {
	try {
		await sql.connect(dbConfig);
		const request = new sql.Request();
		request.input("telegramId", sql.Int, telegramId);
		const result = await request.query(
			`SELECT COUNT(*) AS count FROM Users WHERE TelegramID = @telegramId`
		);
		const count = result.recordset[0].count;
		return count > 0;
	} catch (error) {
		console.error("Ошибка при проверке существования пользователя:", error);
		throw error;
	} finally {
		sql.close();
	}
}

//Обработка полученного контакта
bot.on("contact", async (msg, res) => {
	const chatId = msg.chat.id;
	const userId = msg.from.id;
	const phoneNumber = msg.contact.phone_number;
	const firstName = msg.contact.first_name;
	const lastName = msg.contact.last_name || "";
	const telegramId = msg.contact.user_id;

	console.log(`Получен номер телефона: ${phoneNumber}`);
	console.log(`Имя: ${firstName}`);
	console.log(`Фамилия: ${lastName}`);
	console.log(`Телеграм id: ${telegramId}`);

	try {
		// Проверяем существование пользователя
		const userExists = await checkUserExists(telegramId);

		if (userExists) {
			bot
				.sendMessage(
					chatId,
					`Вы уже авторизованы как ${firstName} ${lastName}, номер телефона: ${phoneNumber}`
				)
				.then(() => {
					// Отправляем сообщение с предложением открыть ваше приложение
					bot.sendMessage(
						chatId,
						"Для продолжения откройте приложение Hubappsi.",
						{
							reply_markup: {
								inline_keyboard: [
									[
										{
											text: "Открыть приложение",
											url: "http://t.me/Hubappsi_bot/hubbb",
										},
									],
								],
							},
						}
					);
				});
		} else {
			// Если пользователь не существует, сохраняем его данные в базу данных
			await saveUserDataToDB(
				userId,
				firstName,
				lastName,
				phoneNumber,
				telegramId
			);
			bot
				.sendMessage(
					chatId,
					`Спасибо, ${firstName} ${lastName}! Вы успешно авторизованы.`
				)
				.then(() => {
					// Отправляем запрос на вашу веб-страницу с данными пользователя
					axios
						.get("http://t.me/Hubappsi_bot/hubbb", {})
						.catch((error) => {
							console.error(
								"Ошибка при отправке данных на веб-страницу:",
								error
							);
						})
						.finally(() => {
							// Отправляем сообщение с предложением открыть ваше приложение
							bot.sendMessage(
								chatId,
								"Для продолжения откройте приложение Hubappsi.",
								{
									reply_markup: {
										inline_keyboard: [
											[
												{
													text: "Открыть приложение",
													url: "http://t.me/Hubappsi_bot/hubbb",
												},
											],
										],
									},
								}
							);
						});
				});
		}
	} catch (error) {
		console.error("Ошибка при обработке контакта:", error);
	}
});

// /start
bot.onText(/\/start/, (msg) => {
	const chatId = msg.chat.id;
	const firstName = msg.from.first_name;

	bot.sendMessage(
		chatId,
		`Привет, ${firstName}! Для продолжения поделитесь своим контактом, пожалуйста.`,
		{
			reply_markup: {
				one_time_keyboard: true,
				keyboard: [[{ text: "Поделиться контактом", request_contact: true }]],
			},
		}
	);
});
