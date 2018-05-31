const http = require('http');
const flatten = require('array-flatten');
const cheerio = require('cheerio');
const fs = require('fs');

var getJson = function(url) {
	return new Promise((resolve, reject) => {
			http.get(url, (res) => {
			  const { statusCode } = res;
			  const contentType = res.headers['content-type'];

			  if (statusCode !== 200) {
			  	reject(new Error('Request Failed.\n' + `Status Code: ${statusCode}`));
			  } else if (!/^application\/json/.test(contentType)) {
			    reject(new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`));
			  }

			  res.setEncoding('utf8');
			  let rawData = '';
			  res.on('data', (chunk) => { rawData += chunk; });
			  res.on('end', () => {
			  	if(rawData) {
			  		try {
			  			const parsedData = JSON.parse(rawData);
			  			resolve(parsedData);
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

var getHtml = function(url) {
	return new Promise((resolve, reject) => {
			http.get(url, (res) => {
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

var area_code = [50, 37, 40, 1, 25, 16, 4, 30, 2, 7, 14, 42, 11, 43, 2102, 24, 20, 26, 32, 8, 22, 19, 9, 6, 45, 33, 17, 31, 29, 69, 3, 44, 13, 10, 21, 74, 60, 15, 28, 39, 41, 75, 54, 46, 64, 51, 23, 66, 18, 35, 48, 49, 82, 5, 27, 52, 53, 38, 47, 55, 36, 56, 65, 57, 12, 34, 58, 68, 59, 61, 62, 63, 67, 70, 72, 73, 76, 77, 78, 79, 80, 81, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 118, 128, 137, 148, 151, 152, 156, 158, 2087, 2088, 2089, 2090, 2091, 2092, 2093, 2094, 2095, 2096, 2097, 2099, 2103, 2104, 2106, 2107, 2119, 2120, 2121, 2123, 2125, 2127, 2128, 2131, 2132, 2141, 2142, 2143, 2144, 2145, 2146, 2147, 2148, 2149, 2150, 2151, 2152, 2153, 2154, 2155, 2156, 2157, 2158, 2159, 2160, 2161, 2162, 2163, 2164, 2165, 2166, 2167, 2168, 2169, 2170, 2171, 2172, 2174, 2175, 2176, 2177, 2178, 2179, 2180, 2181, 2182, 2183, 2184, 2185, 2186, 2187, 2188, 2189, 2190, 2194, 2202];

// var area_code = [37];
var year;
if(process.argv[2]) {
	year = process.argv[2];
} else {
	console.log("No year specified. Exit...");
	process.exit(1);
}

Promise.all(area_code.map( (code) => {

	// first need to get max page
	var url = `http://www.cbooo.cn/Mdata/getMdata_movie?area=${code}&type=0&year=${year}&initial=%E5%85%A8%E9%83%A8&pIndex=1`;

	return new Promise( (resolve, reject) => {
			getJson(url).then((data) => {
				// console.log(code, " : ", data.tPage);
				resolve( Promise.all(Array.from(Array(data.tPage+1).keys()).slice(1).map((index) => {
						var i_url = `http://www.cbooo.cn/Mdata/getMdata_movie?area=${code}&type=0&year=${year}&initial=%E5%85%A8%E9%83%A8&pIndex=${index}`;
						// console.log(i_url);
						return new Promise((resolve, reject) => {
							getJson(i_url).then((data) => {
								resolve(data.pData.map(film => film.ID));
							}).catch((err) => { reject(err); });
						});
					})));
			});

	} );

})).then((result) => {
	var list = flatten(result);
	console.log(list.length);
	list = list.filter(function(item, pos, self) { return self.indexOf(item) == pos; }); // remove duplicate id

	console.log(list.length);
	// console.log(list);

	// var targets = [list[2], list[0], list[1]];

	Promise.all( list.map((film_id) => {
		var url = `http://www.cbooo.cn/m/${film_id}`;

		return new Promise( (resolve, reject) => {
			getHtml(url).then((body) => {
				console.log("Starting parsing : ", film_id);
				const $ = cheerio.load(body);

				// parsing data
				var t_name = $('.ziliaoku .cont h2').text();
				var t_boxoffice = $('.m-span').text();
				var t_genres = $('.ziliaoku .cont p').eq(2).text().split('：')[1].trim().split('/');
				var t_date = $('.ziliaoku .cont p').eq(4).text().split('：')[1].split('（')[0].trim();
				var t_country = $('.ziliaoku .cont p').eq(6).text().split('：')[1].split('/')[0].trim();

				resolve(
					{
						name: t_name.split('（')[0].trim(),
						en_name: t_name.split('）')[1].trim(),
						boxoffice: t_boxoffice ? +t_boxoffice.split('累计票房')[1].split('万')[0].trim() : 0,
						genres: t_genres,
						date: t_date,
						country: t_country
					}
				);
			}).catch( (e) => { reject(e); } );
		} );
	}) ).then( (result) => {
		// first add yearly rank
		console.log("add rank..");
		var films = result.sort( (f1, f2) => {
			// return new Date(f1.date) - new Date(f2.date);
			return f2.boxoffice - f1.boxoffice;
		});
		films.forEach( (f, index) => {
			f.rank = index+1;
		});

		// sort by date
		console.log("sort by date..");
		console.log(films);
		films = films.sort( (f1, f2) => {
			return new Date(f1.date) - new Date(f2.date);
		});

		var file_name = `films${year}.json`;
		fs.writeFile(file_name, JSON.stringify(films, null, 2), 'utf8', function(err, result) {});
	});
});


