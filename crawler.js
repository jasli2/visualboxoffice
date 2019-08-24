const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');
const url = require('url');
const moment = require('moment');
const Promise = require("bluebird");
const opentype = require('opentype.js');

var now = moment();
var logfile = './logs/' + now.format("YYYY-MM-DD-HH-mm-ss") + '.log';
const log = require('simple-node-logger').createSimpleFileLogger(logfile);
//const log = require('simple-node-logger').createSimpleLogger();

var getUrl = function(content_type, url_str) {
	return new Promise((resolve, reject) => {
		var targetUrl = url.parse(url_str);
		var options = {
			hostname: targetUrl.hostname,
		  port: 443,
		  path: targetUrl.pathname + (targetUrl.search ? targetUrl.search : ''),
			headers: {
		    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36",
		    "Referer": "https://piaofang.maoyan.com/movie/346625"
		  }
		};

		https.get(options, (res) => {
		  const { statusCode } = res;

		  if (statusCode !== 200) {
		  	reject(new Error('Request Failed.\n' + `Status Code: ${statusCode}`));
		  }

		  res.setEncoding('utf8');
		  let rawData = '';
		  res.on('data', (chunk) => { rawData += chunk; });
		  res.on('end', () => {
		  	if(rawData) {
		  		if(content_type === "json") {
			  		try {
			  			const parsedData = JSON.parse(rawData);
			  			resolve(parsedData);
			  		} catch(e) {
			  			reject(e);
			  		}
			  	} else {
			  		resolve(rawData);
			  	}
		  	} else {
		  		reject(new Error('Empty Body.\n'));
		  	}
		  });
		}).on('error', (e) => { reject(e); });
	});
};

var year;
var yesterday = now.subtract(1, 'days');

if(process.argv[2]) {
	year = process.argv[2];
} else {
	year = yesterday.year();
}

year = +year;

var start_date = moment([year]);
var end_date = moment([year+1]);
if(yesterday.diff(end_date, 'days') < 0) {
	end_date = yesterday;
}

var dates = [];
var bo = {
	year: year,
	boxoffice: 0,
	film_count: 0,
	max_daily_boxoffice: 0,
	max_film_boxoffice: 0,
	daily_boxoffice: []
};

const number_position = [4, 1, 7, 5, 0, 2, 3, 6, 9, 8];
function toArrayBuffer(buf) {
  var ab = new ArrayBuffer(buf.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

function get_unicode_mapping(base64_str) {
	//var ab = toArrayBuffer(new Buffer(base64_str, 'base64'));
	var ab = toArrayBuffer(Buffer.from(base64_str, 'base64'));
	var font = opentype.parse(ab);

	var unicode_mapping = [];
    var sort_a = [];
	for(var i=2; i<12; i++) {
		var l = font.glyphs.glyphs[i].getPath(0, 0, 72).commands.map(c => c.type).join('').length;
        sort_a.push([l, font.glyphs.glyphs[i].unicode]);
	}

    sort_a.sort((a, b) => a[0] - b[0]);
    sort_a.forEach((a, i) => unicode_mapping[number_position[i]] = a[1]);

	return unicode_mapping;
};

function str_unicode_map(str, uni_map) {
	var s = '';
	for(var i = 0; i < str.length; i++) {
		if(uni_map.includes(str.charCodeAt(i))) {
			s = s + uni_map.indexOf(str.charCodeAt(i))
		} else {
			s = s + str[i];
		}
	}

	return s;
};

log.info("Start parsing: ", start_date.format("YYYY-MM-DD"), " - ", end_date.format("YYYY-MM-DD"));

for (var m = moment(start_date); m.isBefore(end_date); m.add(1, 'day')) {
	dates.push(m.format('YYYY-MM-DD'));
};

Promise.map(dates, function(d) {
	// get boxoffice of d
	var daily_boxoffice_url = `https://box.maoyan.com/promovie/api/box/national.json?endDate=0&type=0&language=zh&beginDate=${d.replace(/-/g, '')}`;
    log.info("get data information: ", d);
	return getUrl('json', daily_boxoffice_url).then(function(data) {
		var daily_boxoffice_value = +data.data.totalBox;

		//update yearly date
		bo.boxoffice += daily_boxoffice_value;
		if(daily_boxoffice_value > bo.max_daily_boxoffice) bo.max_daily_boxoffice = daily_boxoffice_value;

        log.info("get film list: ", d);
		var film_list_url = `https://api.maoyan.com/mmdb/movie/calendar/${d}/around/list.json`;
		return getUrl('json', film_list_url).then(function(data) {
			var films = data.data.movies.filter(movie => movie.isReleased === true && movie.rt === d);

			//update yearly data
			bo.film_count += films.length;

			return Promise.map(films, function(movie){
				const film_url = `https://piaofang.maoyan.com/movie/${movie.id}/boxshow`;
				log.info("parsing... ", movie.nm, ':', movie.id);
				return getUrl('html', film_url)
					.then(html => {
						const $ = cheerio.load(html);
						const font_encode_str = $('#js-nuwa').get()[0].children[0].data.split(';base64,')[1].split(') format(')[0];
						const unicode_mapping = get_unicode_mapping(font_encode_str);

						var box_text = $('i.cs').eq(0).text();
						box_text = +str_unicode_map(box_text, unicode_mapping);

						//update bo max film boxoffice
						if(box_text > bo.max_film_boxoffice) bo.max_film_boxoffice = box_text;

						var details = [];

						var d_dates = $('div.t-main-col > div.t-row > div.t-col > span > b').map(function(x) {
							return $(this).text();
						}).toArray();
						var d_boxoffice = $('div.t-other-col > div.t-change-wrapper > div.t-change > div.t-row').map(function(x) {
							var daily_boxoffice_str = $(this).children('div.t-col').eq(14).children('i.cs').eq(0).text();
							daily_boxoffice_str = str_unicode_map(daily_boxoffice_str, unicode_mapping);
							return daily_boxoffice_str;
						}).toArray();

						var daily_details = d_dates.map(function(d, i) {
							return {
								date: d,
								boxoffice: d_boxoffice[i] === '--' ? 0 : +d_boxoffice[i]
							};
						});

						return {
							id: movie.id,
							name: movie.nm,
							category: movie.cat,
							rate: movie.sc,
							release_date: movie.rt,
							boxoffice: box_text,
							onshow_days: daily_details.length,
							daily_boxoffice: daily_details
						};
					});
				}, {concurrency: 1}).then(function(films) {
					return {
						date: d,
						boxoffice: daily_boxoffice_value,
						film_count: films.length,
						films: films
					};
				});
		});

	});
}, {concurrency: 1}).then(function(result) {
	bo.daily_boxoffice = result;
	log.info("done parsing, writing file");
	var file_name = `./data/data_${year}.json`;
	var min_file_name = `./data/data_${year}_min.json`;
	fs.writeFile(file_name, JSON.stringify(bo, null, 2), 'utf8', function(err, result) {});
	fs.writeFile(min_file_name, JSON.stringify(bo), 'utf8', function(err, result) {});
}).catch(function(e) {
	log.error(e);
	throw e;
});



