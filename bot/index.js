
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
} = require('ramda');

const TelegramBot = require('node-telegram-bot-api');
const Agent = require('socks5-https-client/lib/Agent');

const { Client } = require('pg');

const token = process.env.TOKEN;
const useTor = process.env.NODE_ENV !== 'production';
const socksHost = process.env.SOCKS_HOST || 'localhost';

const pg = new Client();
pg.connect();

const ensureSessionExists = `
INSERT INTO session VALUES ($1, $2) ON CONFLICT DO NOTHING
`;

const withSession = f => async msg => {
	const { id } = msg.from;

	await pg.query(ensureSessionExists, [ id, {} ]);

	const { rows: [ { data: session } ] } = await pg.query('SELECT * FROM session WHERE id = $1', [ id ]);

	const newSession = await f(msg, session);

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

const withHelp = (action, f) => async (msg, session) => {
	const res = await f(msg, session);

	let res2;

	if (action === 'help' || action === 'start') {
		res2 = { helpReceived: false };
	}

	if (!session.helpReceived || (res2 && !res2.helpReceived)) {
		if (action === 'help' || action === 'start') {
			bot.sendMessage(msg.chat.id, helpMessageHelp);
		} else if (action === 'new') {
			bot.sendMessage(msg.chat.id, helpMessageNew);
		} else if (action === 'reply' && msg.text) {
			bot.sendMessage(
				msg.chat.id,
				helpMessageReply
					.replace(
						'__FOO__',
						msg.text.trim().split(/\s+/g)[0] || msg.text.slice(0, 10),
					),
			);
			res2 = { helpReceived: true };
		}
	}

	if (res2) {
		return merge(merge(session || {}, res || {}), res2);
	}

	return res;
};

const uniqById = uniqBy(x => x.id);

const withHashId = f => (...args) => {
	const o = f(...args);
	o.id = hash(o);
	return o;
};

const messageToInlineQueryReply = withHashId((msg, reply = {}) => {
	const title = reply.text ||
		path([ 'document', 'file_name' ], msg) ||
		path([ 'forward_from', 'first_name' ], msg) ||
		path([ 'from', 'first_name' ], msg) ||
		console.warn('title', { msg, reply }) ||
		'❓❓❓'; // TODO

	if (msg.sticker) {
		return {
			type: 'sticker',
			sticker_file_id: msg.sticker.file_id,
		};
	}

	if (msg.photo) {
		const photo = msg.photo[msg.photo.length - 1];
		return {
			type: 'photo',
			photo_file_id: photo.file_id,
		};
	}

	if (msg.voice) {
		return {
			type: 'voice',
			voice_file_id: msg.voice.file_id,
			title,
		};
	}

	if (msg.audio && msg.audio.title) {
		return {
			type: 'audio',
			audio_file_id: msg.audio.file_id,
		};
	}

	if (msg.animation && msg.animation.mime_type === 'video/mp4') {
		return {
			type: 'mpeg4_gif',
			mpeg4_file_id: msg.animation.file_id,
		};
	}

	if (msg.video) {
		return {
			type: 'video',
			video_file_id: msg.video.file_id,
			title,
		};
	}

	if (msg.document) {
		return {
			type: 'document',
			document_file_id: msg.document.file_id,
			title,
		};
	}

	if (msg.text) {
		return {
			type: 'article',
			title: msg.text,
			input_message_content: {
				message_text: msg.text,
			},
		};
	}

	console.log('messageToInlineQueryReply', msg);
	return {
		type: 'sticker',
		sticker_file_id: 'CAADAgADHQAD7UJ-DAaGB7D7zfUMAg',
	};
});

const bot = new TelegramBot(token, {
	polling: true,
	request: useTor ? {
		agentClass: Agent,
		agentOptions: {
			socksHost,
			socksPort: 9050,
		},
	} : {},
});

bot.on('message', function (msg) {
	if (msg.chat && msg.chat.type === 'private') {
		this.emit('private_message', msg);
	}
});

bot.on('private_message', function (msg) {
	if (msg.reply_to_message) {
		this.emit('reply_private_message', msg);
	} else if (msg.text && msg.text.startsWith('/help')) {
		this.emit('help_private_message', msg);
	} else if (msg.text && msg.text.startsWith('/start')) {
		this.emit('start_private_message', msg);
	} else {
		this.emit('new_private_message', msg);
	}
});

bot.on('help_private_message', withSession(withHelp('help', () => {})));
bot.on('start_private_message', withSession(withHelp('start', () => {})));

bot.on('new_private_message', withSession(withHelp('new', async msg => {
	console.log('new_private_message', msg);

	await pg.query('INSERT INTO message VALUES (DEFAULT, $1, $2, $3, $4)', [
		msg.message_id,
		msg.from.id,
		msg.chat.id,
		msg,
	]);
})));

const selectReply = `
SELECT id FROM message
WHERE message_id = $1
AND from_id = $2
AND chat_id = $3
LIMIT 1
`;

bot.on('reply_private_message', withSession(withHelp('reply', async msg => {
	console.log('reply_private_message', msg);

	const { rows: [ { id } ] } = await pg.query(selectReply, [
		msg.reply_to_message.message_id,
		msg.reply_to_message.from.id,
		msg.reply_to_message.chat.id,
	]);

	await pg.query('INSERT INTO reply VALUES (DEFAULT, $1, $2, $3, $4, $5)', [
		id,
		msg.message_id,
		msg.from.id,
		msg.chat.id,
		msg,
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

const addTitleIcon = icon => o => {
	if (o.title) {
		o.title = icon + ' ' + o.title;
	}
	return o;
};

bot.on('inline_query', async query => {
	const q = query.query || '-1';

	const answer = [];

	const i = Number.parseInt(q, 10);
	if (!isNaN(i)) {
		if (i < 0) {
			const { rows } = await pg.query(selectNthLast, [
				query.from.id,
				Math.abs(i) - 1,
			]);
			if (rows.length > 0) {
				const [ { data } ] = rows;
				answer.push(messageToInlineQueryReply(data));
			}
		} else {
			const { rows } = await pg.query(selectNthFirst, [
				query.from.id,
				Math.abs(i),
			]);
			if (rows.length > 0) {
				const [ { data } ] = rows;
				answer.push(messageToInlineQueryReply(data));
			}
		}
	}

	const { rows: personalRows } = await pg.query(selectPersonalByText, [ q, query.from.id ]);
	answer.push(
		...personalRows
			.map(r => messageToInlineQueryReply(r.data, r.reply_data))
			.map(addTitleIcon('🏠'))
	);

	const { rows: globalRows } = await pg.query(selectGlobalByText, [ q ]);
	answer.push(
		...globalRows
			.map(r => messageToInlineQueryReply(r.data, r.reply_data))
			.map(addTitleIcon('🌎'))
	);

	bot.answerInlineQuery(query.id, uniqById(answer), {
		cache_time: 10,
		is_personal: true,
	});
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
