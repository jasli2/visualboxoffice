var data_files = ["data.json"];
Promise.all(data_files.map(url => d3.json(url))).then(function(data) {
	var data = data[0];

	var margin = {top: 0, right: 0, bottom: 0, left: 0};
	var svg_width = 1200;
	var svg_height = 1100;
	var center_x = svg_width / 2;
	var center_y = svg_height / 2;

	var do_rect_width = 4;
	var do_radius = 400;
	var film_circle_r = 2.3;
	var film_radius = 300;

	var max_do_height = 120;

	var svg = d3.select("#chart-container")
		.append('svg')
		.attr("width", svg_width)
		.attr("height", svg_height)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var y = d3.scaleLinear()
    .domain([0, 56000])
    .range([0, max_do_height]);

  var degree = d3.scaleLinear()
    .domain([0, data.length-1])
    .range([-180, 179]);

  var colors = d3.scaleLinear()
        .domain([0, 56000])
        .range(['#108dc7', '#ef8e38']);

  var start_date = moment("2017-01-01");

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
    .enter().append("g")
      .attr("class", "arc1")
      .attr("transform", "translate(" + center_x + "," + center_y + ")")
      .on('mouseenter', function(d) {
      	d3.selectAll(".daily-boxoffice").style("opacity", 0.3);
				d3.selectAll(".released-films").style("opacity", 0.3);
      })
			.on("mouseleave", function(d, i){
				d3.selectAll(".daily-boxoffice").style("opacity", 1);
				d3.selectAll(".released-films").style("opacity", 1);
			});

  g1.append("path")
      .attr("d", arc1)
      .style("fill", "#eee");

  var g2 = svg.selectAll(".arc2")
      .data(pie([100]))
    .enter().append("g")
      .attr("class", "arc2")
      .attr("transform", "translate(" + center_x + "," + center_y + ")")
      .on('mouseenter', function(d) {
      	d3.selectAll(".daily-boxoffice").style("opacity", 0.3);
				d3.selectAll(".film").style("opacity", 0.3);
      })
			.on("mouseleave", function(d, i){
				d3.selectAll(".daily-boxoffice").style("opacity", 1);
				d3.selectAll(".film").style("opacity", 1);
			});

  g2.append("path")
      .attr("d", arc2)
      .style("fill", "#eee");

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
		.attr("fill", function(d) { return colors(d.boxoffice); })
		.attr("transform", function(d, i) {
			return "rotate(" + degree(i) + ")";
		})
		.attr("class", function(d) {
			return "daily-boxoffice " + "date-" + d.date;
		})
		.on("mouseover", function(d, i){
			console.log("daily-boxoffice mouseover ::: ");
			d3.selectAll(".date-" + d.date).style("opacity", 1);
			show_daily_boxoffice_tooltip(d);
		})
		.on("mouseout", function(d, i){
			console.log("daily-boxoffice mouseout ::: ");
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
		.attr("cy", function(d, i) { return (film_radius + i * (2 * film_circle_r + 3) ); })
		.attr("r", film_circle_r)
		.attr("fill", function(d) { return colors(d.boxoffice); })
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
			.attr("fill", function(d) { return colors(d.boxoffice); })
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
		d3.select("#film-onshow-days").text(d.onshow_days);

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
		d3.select("#do-date").text(d.date);
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

});


