const http = require('http');
const https = require('https');
const flatten = require('array-flatten');
const cheerio = require('cheerio');
const fs = require('fs');

var getHtml = function(url) {
	return new Promise((resolve, reject) => {
			https.get(url, (res) => {
			  const { statusCode } = res;
			  const contentType = res.headers['content-type'];

			  if (statusCode !== 200) {
			  	reject(new Error('Request Failed.\n' + `Status Code: ${statusCode}`));
			  }

			  res.setEncoding('utf8');
			  let rawData = '';
			  res.on('data', (chunk) => { rawData += chunk; });
			  res.on('end', () => {
			  	if(rawData) {
			  		try {
			  			resolve(rawData);
			  		} catch(e) {
			  			reject(e);
			  		}
			  	} else {
			  		reject(new Error('Empty Body.\n'));
			  	}
			  });
			}).on('error', (e) => { reject(e); });
	});
};

var getDates = function(startDate, endDate) {
  var dates = [],
      currentDate = startDate,
      addDays = function(days) {
        var date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
      };
  while (currentDate <= endDate) {
    dates.push(currentDate);
    currentDate = addDays.call(currentDate, 1);
  }
  return dates;
};

var year;
if(process.argv[2]) {
	year = +process.argv[2];
} else {
	console.log("No year specified. Exit...");
	process.exit(1);
}

// var dates = getDates(new Date(year,1,1), new Date(year,1,4));
var d1 = new Date(2017,5,20);
var dates = [d1];

Promise.all(dates.map( (d) => {

	var d_str = d.toISOString().substr(0, 10);
	var url = `https://piaofang.maoyan.com/?date=${d_str}`;
	console.log("request : ", url);

	return new Promise( (resolve, reject) => {
			getHtml(url).then((body) => {
				console.log("Starting parsing : ", url);

				var t_boxoffice = $('span.cal-box-num').text();

				resolve(
					{
						date: d_str,
						boxoffice: t_boxoffice
					}
				);
			});

	} );

})).then((result) => {
	console.log(result);
});


