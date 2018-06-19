var current_year = moment().year();
var data_file = "/data/data_" + current_year + "_min.json";
var cache_data = {};

// handle select event
d3.select('select#year-select').on('change', function(d) {
	console.log(d3.select(this).property("value"));

	var year = d3.select(this).property("value");
	var data_file = "/data/data_" + year + "_min.json";

	clear_chart();

	if(cache_data[year] !== undefined) {
		hide_year_tooltip();
		draw_chart(cache_data[year]);
	} else {
		hide_year_tooltip();
		show_loading_spin();
		Promise.all([data_file].map(url => d3.json(url))).then(function(data) {
			update_cache(data[0]);
			show_loading_spin();
			draw_chart(data[0]);
		});
	}
});

//init draw
show_loading_spin();
Promise.all([data_file].map(url => d3.json(url))).then(function(data) {
	update_cache(data[0]);
	hide_year_tooltip();
	draw_chart(data[0]);
});

function update_cache(data) {
	cache_data[data.year] = data;
}

function clear_chart() {
	d3.select('svg').remove();
}

function show_loading_spin() {
	d3.select("#loading-spin")
		.transition().duration(0)
		.style("opacity", 1);
}

function hide_loading_spin() {
	d3.select("#loading-spin")
		.transition().duration(100)
		.style("opacity", 0);
}

function show_year_tooltip(d) {
	d3.select("#year-tooltip")
		.transition().duration(0)
		.style("opacity", 1);
};

function hide_year_tooltip(d) {
	d3.select("#year-tooltip")
		.transition().duration(100)
		.style("opacity", 0);
};

function draw_chart(data) {
	var year_data = data;
	var data = year_data.daily_boxoffice;
	var year = +year_data.year;
  var days_of_year = moment([year+1]).diff(moment([year]), 'days');
  var days_of_yesterday = days_of_year;
  if(year === current_year) {
    days_of_yesterday = moment().subtract(1, "days").diff(moment([year]), 'days')
  }

	// find the hightest boxoffice number
	var max_daily_boxoffice = Math.max(year_data.max_daily_boxoffice, 20000);
  var max_film_boxoffice = Math.max(year_data.max_film_boxoffice, 20000);

  var avg_daily_boxoffice = Math.max(Math.floor(year_data.boxoffice/days_of_yesterday), 10000);
  var avg_film_boxoffice = Math.max(Math.floor(year_data.boxoffice/year_data.film_count), 10000);

	// set year boxoffice data
	d3.select('#year-name').text(year_data.year + '年');
	d3.select('#year-boxoffice').text(Math.round(year_data.boxoffice/100) / 100);
	d3.select('#year-film-count').text(year_data.film_count);

	hide_loading_spin();
	show_year_tooltip();

	var margin = {top: 0, right: 0, bottom: 0, left: 0};
	var svg_width = 1200;
	var svg_height = 1040;
	var center_x = svg_width / 2;
	var center_y = svg_height / 2;

	var do_rect_width = 4;
	var do_radius = 400;
	var film_circle_r = 2.5;
	var film_radius = 300;

	var max_do_height = 120;

	var svg = d3.select("#chart-container")
		.append('svg')
		.attr("width", svg_width)
		.attr("height", svg_height)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var y = d3.scaleLinear()
    .domain([0, max_daily_boxoffice])
    .range([0, max_do_height]);

  var degree = d3.scaleLinear()
    .domain([0, days_of_year-1])
    .range([-180, 179]);

  var month_degree = d3.scaleLinear()
    .domain([0, days_of_year-1])
    .range([0, 359]);

  // color : pun yeta
  var do_colors = d3.scaleLinear()
    .domain([0, avg_daily_boxoffice, max_daily_boxoffice])
    .range(['#108dc7', '#908d77', '#ef8e38']);
  var film_colors = d3.scaleLinear()
    .domain([0, 1, avg_film_boxoffice, max_film_boxoffice])
    .range(['#ddd','#108dc7', '#908d77', '#ef8e38']);

  var start_date = moment([year]);

  // draw circle indication
  svg.append('circle')
  	.attr('cx', center_x)
  	.attr('cy', center_y)
  	.attr('r', do_radius + 1)
  	.attr('stroke', '#ddd')
  	.attr('stroke-width', 1)
  	.attr('fill-opacity', 0);

  svg.append('circle')
  	.attr('cx', center_x)
  	.attr('cy', center_y)
  	.attr('r', film_radius)
  	.attr('stroke', '#ddd')
  	.attr('stroke-width', 1)
  	.attr('fill-opacity', 0);

  // draw month indicator
  svg.selectAll('.month-axis')
  	.data([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  	.enter()
  	.append('rect')
  	.attr('class', 'month-axis')
  	.attr('x', center_x - 0.5)
  	.attr('y', center_y - 400)
  	.attr('width', 1)
  	.attr('height', 126)
  	.attr("transform", function(d, i) {
			return "rotate(" + month_degree(moment([year, d]).diff(start_date, 'days')) + "," + center_x + "," + center_y + ")";
		})
  	.attr('fill', '#ddd');
  svg.selectAll('.month-axis-text')
  	.data(['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'])
  	.enter()
  	.append('text')
  	.attr('class', 'month-axis-text')
  	.attr('x', center_x - 0.5)
  	.attr('y', center_y - 260)
  	.attr("transform", function(d, i) {
			return "rotate(" + month_degree(moment([year, i, 15]).diff(start_date, 'days')) + "," + center_x + "," + center_y + ")";
		})
  	.attr('fill', '#ddd')
  	.attr('dominant-baseline', 'central')
  	.attr('text-anchor', 'middle')
  	.attr('font-size', '10px')
  	.text(function(d) { return d; });
  svg.append('circle')
  	.attr('cx', center_x)
  	.attr('cy', center_y)
  	.attr('r', 274)
  	.attr('stroke', '#ddd')
  	.attr('stroke-width', 1)
  	.attr('fill-opacity', 0);

	var arc1 = d3.arc()
    .outerRadius(do_radius + max_do_height)
    .innerRadius(do_radius);

  var arc2 = d3.arc()
    .outerRadius(390)
    .innerRadius(film_radius - film_circle_r);

	var pie = d3.pie()
    .value((d) => d);

  var g1 = svg.selectAll(".arc1")
    .data(pie([100]))
    .enter()
    .append("g")
    .attr("class", "arc1")
    .attr("transform", "translate(" + center_x + "," + center_y + ")")
    .on('mouseenter', function(d) {
      d3.selectAll(".daily-boxoffice").style("opacity", 0.3);
      d3.selectAll(".released-films").style("opacity", 0.3);
      hide_year_tooltip(d);
    })
    .on("mouseleave", function(d, i){
      d3.selectAll(".daily-boxoffice").style("opacity", 1);
      d3.selectAll(".released-films").style("opacity", 1);
      show_year_tooltip(d);
    });

  g1.append("path")
    .attr("d", arc1)
    .attr("fill", "#eee")
    .attr('fill-opacity', 0);

  var g2 = svg.selectAll(".arc2")
    .data(pie([100]))
    .enter().append("g")
    .attr("class", "arc2")
    .attr("transform", "translate(" + center_x + "," + center_y + ")")
    .on('mouseenter', function(d) {
      d3.selectAll(".daily-boxoffice").style("opacity", 0.3);
      d3.selectAll(".film").style("opacity", 0.3);
      hide_year_tooltip(d);
    })
    .on("mouseleave", function(d, i){
      d3.selectAll(".daily-boxoffice").style("opacity", 1);
      d3.selectAll(".film").style("opacity", 1);
      show_year_tooltip(d);
    });

  g2.append("path")
    .attr("d", arc2)
    .attr("fill", "#eee")
    .attr('fill-opacity', 0);

	g1.selectAll('.daily-boxoffice')
		.data(data)
		.enter()
		.append('rect')
		.attr("x", -do_rect_width / 2)
		.attr("y", do_radius)
		.attr("width", do_rect_width)
		.attr("height", function(d) { return y(d.boxoffice); })
		.attr("rx", do_rect_width / 2)
		.attr("ry", do_rect_width / 2)
		.attr("fill", function(d) { return do_colors(d.boxoffice); })
		.attr("transform", function(d, i) {
			return "rotate(" + degree(i) + ")";
		})
		.attr("class", function(d) {
			return "daily-boxoffice " + "date-" + d.date;
		})
		.on("mouseover", function(d, i){
			d3.selectAll(".date-" + d.date).style("opacity", 1);
			show_daily_boxoffice_tooltip(d);
		})
		.on("mouseout", function(d, i){
			d3.selectAll(".date-" + d.date).style("opacity", 0.3);
			hide_daily_boxoffice_tooltip(d);
		});

	var detail_g = svg.append('g');

	var gs = g2.selectAll('.released-films')
		.data(data)
		.enter()
		.append('g')
		.attr("class", function(d) {
			return "released-films " + "date-" + d.date;
		})
		.attr("transform", function(d, i) {
			return "rotate(" + degree(i) + ")";
		});

	gs.selectAll(".film")
		.data(function(d) {return d.films; })
		.enter()
		.append('circle')
		.attr("cx", 0)
		.attr("cy", function(d, i) { return (film_radius + i * (2 * film_circle_r + 2) ); })
		.attr("r", film_circle_r)
		.attr("fill", function(d) { return film_colors(d.boxoffice); })
		.attr("class", function(d) {
			return "film";
		})
		.on("mouseover", function(d, i){
			d3.select(this).style("opacity", 1);
			draw_detail_boxoffice(d);
			show_film_tooltip(d);
		})
		.on("mouseout", function(d, i){
			d3.select(this).style("opacity", 0.3);
			undraw_details_boxoffice(d);
			hide_film_tooltip(d);
		});


	function draw_detail_boxoffice(d) {
		detail_g.selectAll('rect')
			.data(d.daily_boxoffice)
			.enter()
			.append('rect')
			.attr("x", center_x - (do_rect_width/2))
			.attr("y", center_y + do_radius)
			.attr("width", do_rect_width)
			.attr("height", function(d) { return y(d.boxoffice); })
			.attr("rx", do_rect_width / 2)
			.attr("ry", do_rect_width / 2)
			.attr("fill", function(d) { return do_colors(d.boxoffice); })
			.attr("transform", function(d, i) {
				return "rotate(" + degree(moment(d.date).diff(start_date, 'days')) + "," + center_x + "," + center_y + ")";
			});
	};

	function undraw_details_boxoffice(d) {
		detail_g.selectAll('*').remove();
	};

	function show_film_tooltip(d) {
		d3.select("#film-name").text(d.name);
		d3.select("#film-boxoffice").text(d.boxoffice);
		d3.select("#film-released-date").text(d.release_date.replace('-', '年').replace('-', '月') + '日');
		d3.select("#film-onshow-days").text(d.onshow_days);
		d3.select("#film-rate").text(d.rate);

		d3.select("#film-tooltip")
			.transition().duration(0)
			.style("opacity", 1);
	};

	function hide_film_tooltip(d) {
		d3.select("#film-tooltip")
			.transition().duration(100)
			.style("opacity", 0);
	};

	function show_daily_boxoffice_tooltip(d) {
		d3.select("#do-date").text(d.date.replace('-', '年').replace('-', '月') + '日');
		d3.select("#do-boxoffice").text(d.boxoffice);
		d3.select("#do-film-count").text(d.film_count);

		d3.select("#daily-boxoffice-tooltip")
			.transition().duration(0)
			.style("opacity", 1);
	};

	function hide_daily_boxoffice_tooltip(d) {
		d3.select("#daily-boxoffice-tooltip")
			.transition().duration(100)
			.style("opacity", 0);
	};

}

