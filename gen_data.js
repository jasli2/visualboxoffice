var moment = require('moment');
var faker = require('faker');
const fs = require('fs');

var a = moment('2017-01-01');
var b = moment('2018-01-01');

var bo_min = 1200;
var bo_max = 56000;

var max_film = 12;

var min_days = 10;
var max_days = 35;

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

var data = [];
var rank = 1;

for (var m = moment(a); m.isBefore(b); m.add(1, 'day')) {
	var boxoffice = getRandomInt(bo_min, bo_max);
	var dbo_max = Math.floor(boxoffice * 0.6);
	var dbo_min = Math.floor(boxoffice * 0.2);
	var film_count = getRandomInt(0, max_film);
	var d = {
		date: m.format('YYYY-MM-DD'),
		boxoffice: boxoffice,
		film_count: film_count,
		films: []
	};

	for(var i = 0; i < film_count; i ++) {
		var onshow_days = getRandomInt(min_days, max_days);
		var film = {
			name: faker.name.findName(),
			release_date: m.format('YYYY-MM-DD'),
			onshow_days: onshow_days,
			boxoffice: getRandomInt(bo_min, bo_max),
			rank: rank,
			daily_boxoffice: []
		};

		var release_date = moment(m);
		for(var j = 0; j < onshow_days; j++) {
			film.daily_boxoffice.push({
				date: release_date.format('YYYY-MM-DD'),
				boxoffice: getRandomInt(dbo_min, dbo_max)
			});

			release_date.add(1, 'day');
		}

		rank += 1;
		d.films.push(film);
	}

	data.push(d);
}

fs.writeFile('data.json', JSON.stringify(data, null, 2), 'utf8', function(err, result) {});


