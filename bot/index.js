
process.env.NTBA_FIX_319 = 1;

require('make-promises-safe'); // eslint-disable-line import/no-unassigned-import

const Bluebird = require('bluebird');

Bluebird.config({
	cancellation: true,
});

const hash = require('object-hash');
const {
	uniqBy,
	path,
	merge,
	partition,
	propEq,
} = require('ramda');

const TelegramBot = require('node-telegram-bot-api');
const Agent = require('socks5-https-client/lib/Agent');

const { Client } = require('pg');

const token = process.env.TOKEN;
const socksHost = process.env.SOCKS_HOST;

const pg = new Client();
pg.connect();

const ensureSessionExists = `
INSERT INTO session VALUES ($1, $2) ON CONFLICT DO NOTHING
`;

const withSession = f => async message => {
	const { id } = message.from;

	await pg.query(ensureSessionExists, [ id, {} ]);

	const { rows: [ { data: session } ] } = await pg.query('SELECT * FROM session WHERE id = $1', [ id ]);

	const newSession = await f(message, session);

	if (newSession) {
		await pg.query('UPDATE session SET data = $2 WHERE id = $1', [ id, newSession ]);
	}
};

const helpMessageHelp = `
Forward or send a message here to get started (voice, gif, sticker, etc.).
`;
const helpMessageNew = `
Now reply to your own message with some text or keywords for the inline search.
`;
const helpMessageReply = `
You will now find your message via "@XPAM_BOT __FOO__" or something like that.

You can also reply to your older messages to amend the search tags.
You may also forward multiple messages and add search tags for them later in any order.

If you need help again, send /help.
`;

const withHelp = (action, f) => async (message, session) => {
	const result = await f(message, session);

	let result2;

	if (action === 'help' || action === 'start') {
		result2 = { helpReceived: false };
	}

	if (!session.helpReceived || (result2 && !result2.helpReceived)) {
		if (action === 'help' || action === 'start') {
			bot.sendMessage(message.chat.id, helpMessageHelp);
		} else if (action === 'new') {
			bot.sendMessage(message.chat.id, helpMessageNew);
		} else if (action === 'reply' && message.text) {
			bot.sendMessage(
				message.chat.id,
				helpMessageReply
					.replace(
						'__FOO__',
						message.text.trim().split(/\s+/g)[0] || message.text.slice(0, 10),
					),
			);
			result2 = { helpReceived: true };
		}
	}

	if (result2) {
		return merge(merge(session || {}, result || {}), result2);
	}

	return result;
};

const uniqById = uniqBy(x => x.id);

const withHashId = f => (...args) => {
	const o = f(...args);
	o.id = hash(o);
	return o;
};

const MESSAGE_TO_REPLY_FAILURES = {
	audio_title: {
		is_telegram_limitation: true,
		message: 'Audio must have a title.',
	},

	video_note: {
		is_telegram_limitation: true,
		message: 'Telegram does not allow bots to send video notes from inline query.',
	},

	animation_mime_type: {
		message: 'Only mpeg4 animations are supported.',
	},

	unexhaustive: {
		message: 'I don\'t know how to work with this kind of message yet.',
	},
};

const messageToInlineQueryReply = withHashId((message, reply = {}) => {
	const title = reply.text ||
		path([ 'document', 'file_name' ], message) ||
		path([ 'forward_from', 'first_name' ], message) ||
		path([ 'from', 'first_name' ], message) ||
		console.warn('title', { message, reply }) ||
		'❓❓❓'; // TODO

	if (message.sticker) {
		return {
			type: 'sticker',
			sticker_file_id: message.sticker.file_id,
		};
	}

	if (message.photo) {
		const photo = message.photo[message.photo.length - 1];
		return {
			type: 'photo',
			photo_file_id: photo.file_id,
		};
	}

	if (message.voice) {
		return {
			type: 'voice',
			voice_file_id: message.voice.file_id,
			title,
		};
	}

	if (message.audio) {
		if (message.audio.title) {
			return {
				type: 'audio',
				audio_file_id: message.audio.file_id,
			};
		}

		return {
			type: '_xpam_failure',
			failure: 'audio_title',
			title,
			message,
		};
	}

	if (message.animation) {
		if (message.animation.mime_type === 'video/mp4') {
			return {
				type: 'mpeg4_gif',
				mpeg4_file_id: message.animation.file_id,
			};
		}

		return {
			type: '_xpam_failure',
			failure: 'animation_mime_type',
			title,
			message,
		};
	}

	if (message.video) {
		return {
			type: 'video',
			video_file_id: message.video.file_id,
			title,
		};
	}

	if (message.video_note) {
		return {
			type: '_xpam_failure',
			failure: 'video_note',
			title,
			message,
		};
	}

	if (message.document) {
		return {
			type: 'document',
			document_file_id: message.document.file_id,
			title,
		};
	}

	if (message.text) {
		return {
			type: 'article',
			title: message.text,
			input_message_content: {
				message_text: message.text,
			},
		};
	}

	return {
		type: '_xpam_failure',
		failure: 'unexhaustive',
		title,
		message,
	};
});

const bot = new TelegramBot(token, {
	autoStart: true,
	polling: true,
	request: socksHost ? {
		agentClass: Agent,
		agentOptions: {
			socksHost,
			socksPort: 9050,
		},
	} : {},
});

bot.on('message', function (message) {
	if (message.chat && message.chat.type === 'private') {
		this.emit('private_message', message);
	}
});

bot.on('private_message', function (message) {
	if (message.reply_to_message) {
		this.emit('reply_private_message', message);
	} else if (message.text && message.text.startsWith('/help')) {
		this.emit('help_private_message', message);
	} else if (message.text && message.text.startsWith('/start')) {
		this.emit('start_private_message', message);
	} else {
		this.emit('new_private_message', message);
	}
});

bot.on('help_private_message', withSession(withHelp('help', () => {})));
bot.on('start_private_message', withSession(withHelp('start', () => {})));

bot.on('new_private_message', withSession(withHelp('new', async message => {
	console.log('new_private_message', message);

	await pg.query('INSERT INTO message VALUES (DEFAULT, $1, $2, $3, $4)', [
		message.message_id,
		message.from.id,
		message.chat.id,
		message,
	]);

	const inlineQueryReply = messageToInlineQueryReply(message);
	if (inlineQueryReply.type === '_xpam_failure') {
		console.log('messageToInlineQueryReply', inlineQueryReply);
		const failure = MESSAGE_TO_REPLY_FAILURES[inlineQueryReply.failure] ||
			MESSAGE_TO_REPLY_FAILURES.unexhaustive;
		const failureReply = [
			'😞 ' + failure.message,
			failure.is_telegram_limitation && 'This is a limitation of the Telegram Bot API.',
			'I will remember your message, and you may reply to it, but you\'ll not be able to find it until this is fixed.',
			'Sorry for the inconvenience.',
		].filter(Boolean).join('\n\n');
		bot.sendMessage(message.chat.id, failureReply, {
			reply_to_message_id: message.message_id,
		});
	}
})));

const selectReply = `
SELECT id FROM message
WHERE message_id = $1
AND from_id = $2
AND chat_id = $3
LIMIT 1
`;

bot.on('reply_private_message', withSession(withHelp('reply', async message => {
	console.log('reply_private_message', message);

	const { rows } = await pg.query(selectReply, [
		message.reply_to_message.message_id,
		message.reply_to_message.from.id,
		message.reply_to_message.chat.id,
	]);

	if (rows.length === 0) {
		console.warn('reply to unknown message:', message);
		return;
	}

	const [ { id } ] = rows;

	await pg.query('INSERT INTO reply VALUES (DEFAULT, $1, $2, $3, $4, $5)', [
		id,
		message.message_id,
		message.from.id,
		message.chat.id,
		message,
	]);
})));

const selectNthLast = `
SELECT * FROM message
WHERE from_id = $1
ORDER BY id DESC
LIMIT 1 OFFSET $2
`;

const selectNthFirst = `
SELECT * FROM message
WHERE from_id = $1
ORDER BY id ASC
LIMIT 1 OFFSET $2
`;

const selectPersonalByText = `
SELECT message.data, reply.data AS reply_data, ts_rank(vector, query) AS rank
FROM message JOIN reply ON message.id = reply.reply_to_message_id
, plainto_tsquery($1) query
, my_to_tsvector(reply.data->>'text') vector
WHERE reply.from_id = $2
AND query @@ vector
ORDER BY rank DESC
LIMIT 3;
`;

const selectGlobalByText = `
SELECT message.data, reply.data AS reply_data, ts_rank(vector, query) AS rank
FROM message JOIN reply ON message.id = reply.reply_to_message_id
, plainto_tsquery($1) query
, my_to_tsvector(reply.data->>'text') vector
WHERE query @@ vector
ORDER BY rank DESC
LIMIT 3;
`;

const insertInlineResults = `
INSERT INTO inline_result (id, data) SELECT * FROM UNNEST ($1::text[], $2::jsonb[]) ON CONFLICT DO NOTHING
`;

const selectRecentlyUsed = `
SELECT data
FROM inline_result_lru
INNER JOIN inline_result
ON inline_result.id = inline_result_lru.inline_result_id
WHERE inline_result_lru.session_id = $1
LIMIT 3
`;

const selectGlobalRecentlyUsed = `
SELECT data
FROM inline_result
	INNER JOIN
		(
			SELECT inline_result_id
			FROM inline_result_lru
			GROUP BY inline_result_id
			HAVING count(session_id) > 2
			ORDER BY max(last_chosen_at) DESC
			LIMIT 4
		) as global_lru
	ON inline_result.id = global_lru.inline_result_id
`;

const addTitleIcon = getIconFor => o => {
	if (o.title) {
		const icon = getIconFor(o);
		if (icon) {
			return merge(o, {
				title: icon + ' ' + o.title,
			});
		}
	}

	return o;
};

bot.on('inline_query', withSession(async query => {
	const showRecent = query.query.trim() === '';
	const q = query.query || '-1';

	const answer = [];

	const qIndex = Number.parseInt(q, 10);
	if (!Number.isNaN(qIndex)) {
		if (qIndex < 0) {
			const { rows } = await pg.query(selectNthLast, [
				query.from.id,
				Math.abs(qIndex) - 1,
			]);
			if (rows.length > 0) {
				const [ { data } ] = rows;
				answer.push(messageToInlineQueryReply(data));
			}
		} else {
			const { rows } = await pg.query(selectNthFirst, [
				query.from.id,
				Math.abs(qIndex),
			]);
			if (rows.length > 0) {
				const [ { data } ] = rows;
				answer.push(messageToInlineQueryReply(data));
			}
		}
	}

	if (showRecent) {
		const { rows: recentAnswerRows } = await pg.query(selectRecentlyUsed, [ query.from.id ]);
		answer.push(
			...recentAnswerRows
				.map(r => r.data)
				.map(addTitleIcon(() => '🕰')),
		);

		const { rows: recentGlobalAnswerRows } = await pg.query(selectGlobalRecentlyUsed);
		if (answer.length === 0) {
			answer.push(
				...recentGlobalAnswerRows
					.map(r => r.data)
					.map(addTitleIcon(() => '🔥')),
			);
		}
	}

	const { rows: personalRows } = await pg.query(selectPersonalByText, [ q, query.from.id ]);
	answer.push(
		...personalRows
			.map(r => messageToInlineQueryReply(r.data, r.reply_data)),
	);

	const { rows: globalRows } = await pg.query(selectGlobalByText, [ q ]);
	answer.push(
		...globalRows
			.map(r => messageToInlineQueryReply(r.data, r.reply_data)),
	);

	const [ failures, successes ] = partition(propEq('type', '_xpam_failure'), answer);

	if (successes.length === 0 && failures.length !== 0) {
		successes.push(withHashId(() => ({
			type: 'sticker',
			sticker_file_id: 'CAADAgADHQAD7UJ-DAaGB7D7zfUMAg',
		}))());
	}

	const inlineQueryResults = uniqById(successes).map(addTitleIcon(r => {
		if (personalRows.includes(r)) {
			return '🏠';
		}

		if (globalRows.includes(r)) {
			return '🌎';
		}

		return undefined;
	}));

	const buttonWebAppUrl = new URL('https://xpam.vercel.app/');
	let buttonText;

	if (
		inlineQueryResults.length > 0
			&& query.query.trim().length > 0
			&& !showRecent
			&& Number.isNaN(qIndex)
	) {
		buttonText = 'Advanced search';
		buttonWebAppUrl.pathname = 'search';
		buttonWebAppUrl.searchParams.set('q', query.query);
	} else {
		buttonText = 'Explore';
		buttonWebAppUrl.pathname = 'explore';
	}

	bot.answerInlineQuery(query.id, inlineQueryResults, {
		cache_time: 10,
		is_personal: true,
		button: JSON.stringify({
			text: buttonText,
			web_app: {
				url: buttonWebAppUrl.toString(),
			},
		}),
	});

	await pg.query(insertInlineResults, [
		successes.map(r => r.id),
		successes,
	]);
}));

const insertInlineResultLru = `
INSERT INTO inline_result_lru
VALUES ($1, $2, DEFAULT)
ON CONFLICT (session_id, inline_result_id) DO UPDATE
SET last_chosen_at = NOW()
`;

const deleteInlineResultLru = `
DELETE FROM inline_result_lru
WHERE ctid IN (
	SELECT ctid
	FROM inline_result_lru
	WHERE session_id = $1
	ORDER BY last_chosen_at DESC
	OFFSET 3
)
`;

bot.on('chosen_inline_result', async message => {
	console.log('chosen_inline_result', message);

	await pg.query(insertInlineResultLru, [
		message.from.id,
		message.result_id,
	]);

	await pg.query(deleteInlineResultLru, [
		message.from.id,
	]);
});

bot.on('polling_error', error => {
	console.error(error);
});
bot.on('webhook_error', error => {
	console.error(error);
});
bot.on('error', error => {
	console.error(error);
});
