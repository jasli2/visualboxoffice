var data_files = ["boxoffice.csv", "films.csv"];
Promise.all(data_files.map(url => d3.csv(url))).then(function(data) {
	var boxoffice_data = data[0];
	var film_data = data[1];

	var years = boxoffice_data.map(function(d) { return +d.year; });
	var max_year = d3.max(years);
	var number_of_years = years.length;
	var margin = {top: 40, right: 25, bottom: 20, left: 25};
	var chart_header_height = 80;
	var year_height = 60;
	var year_padding = 40;
	var year_label_width = 30;
	var film_chart_width = 720; // for a whole year
	var film_chart_top_padding = 40;
	var film_chart_height = (number_of_years - 1) * year_height + film_chart_top_padding * 2;
	var boxoffice_chart_width = 320;
	var svg_width = 1200;
	var svg_height = (number_of_years - 1) * year_height + film_chart_top_padding * 2 + margin.top + margin.bottom + chart_header_height;

	var svg = d3.select("#chart-container")
		.append('svg')
		.attr("width", svg_width)
		.attr("height", svg_height)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	var g_films_header = svg.append('g').attr("transform", "translate(" + 0 + "," + 0 + ")");
	var g_films_chart = svg.append('g').attr("transform", "translate(" + 0 + "," + chart_header_height + ")");
	var g_year = svg.append('g').attr("transform", "translate(" + (film_chart_width + year_padding) + "," + chart_header_height + ")");
	var g_boxoffice_header = svg.append('g').attr("transform", "translate(" + (film_chart_width + year_label_width + 2*year_padding) + "," + 0 + ")");
	var g_boxoffice_chart = svg.append('g').attr("transform", "translate(" + (film_chart_width + year_label_width + 2*year_padding) + "," + chart_header_height + ")");

	var month_axis_x = d3.scaleLinear().domain([1, 13]).range([0, film_chart_width]);
	var monthes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];	// TODO
	var square_r = d3.scaleSqrt();

	// var group_data = d3.nest().key(function(d) {return d.year;}).entries(film_data);
	var film_types = film_data.map(function(d) {return d.type;}).filter(function(e, i, self) {return i == self.indexOf(e)});
	var ft_class = function(type) {
		switch (type) {
	    case "动作":
	      return "f-action";
	    case "喜剧":
	      return "f-comedy";
	    case "奇幻":
	      return "f-fantasy";
	    case "科幻":
	      return "f-sic-fi";
	    case "战争":
	      return "f-war";
	    case "动画":
	      return "f-animation";
	    case "剧情":
	      return "f-drama";
	    case "爱情":
	      return "f-romance";
	    case "灾难":
	      return "f-disaster";
	    case "惊悚":
	      return "f-thriller";
	    default:
	    	return "";
		}
	};

	// need to find a nice color theme.
	var ft_colors = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#b15928", "#ffff99"];
	var film_date_x = function(date_s) {
		var d = new Date(date_s);
		return (d.getMonth()*30 + d.getDate()) * 2;
	}

	var year_labels = g_year.selectAll('.year-label')
		.data(boxoffice_data)
		.enter()
		.append('text')
		.attr("class", 'year-label')
		.attr("transform", function(d, i) {
			return "translate(" + year_label_width / 2 + "," + (i * year_height + film_chart_top_padding) + ")";
		})
		.text(function(d) {return d.year;});

	// draw chart header
	g_films_header.append('text')
		.attr("class", "chart-header")
		.attr("transform", function(d, i) {
			return "translate(" + film_chart_width / 2 + "," + 0 + ")";
		})
		.text("年度票房前十");

	g_boxoffice_header.append('text')
		.attr("class", "chart-header")
		.attr("transform", function(d, i) {
			return "translate(" + boxoffice_chart_width / 2 + "," + 0 + ")";
		})
		.text("年度总票房");

	var film_chart_legend = g_films_header.append('g')
		.attr("id", "film-chart-legend")
    .attr("transform", "translate(" + 30 + "," + 40 + ")");

  var film_type_legend = film_chart_legend.selectAll("g")
    .data(film_types)
    .enter().append("g")
    .attr("transform", function(d, i) { return "translate(" + i * 50 + "," + 0 + ")"; });

  film_type_legend.append("rect")
  	.attr("width", 20)
  	.attr("height", 16)
  	.attr("transform", "translate(" + 0 + "," + "-12" + ")")
  	.attr("fill", function(d, i) { return ft_colors[i]; })
  	.on("mouseover", function(d, i){
  		var target_film_class = '.' + ft_class(d);
  		d3.selectAll(".film").style("opacity", 0.1);
  		d3.selectAll(target_film_class).style("opacity", 1);
  	})
  	.on("mouseout", function(d, i){
  		var target_film_class = 'text.' + ft_class(d);
  		d3.selectAll(".film").style("opacity", 0.8);
  		d3.selectAll(target_film_class).style("opacity", 0);
  	});

  film_type_legend.append("text")
    .attr("dominant-baseline", "center")
  	.attr("transform", function(d, i) { return "translate(" + 22 + "," + 0 + ")"; })
  	.text(function(d) {return d;});

  var film_boxoffice_legend = film_chart_legend.append('g').attr("transform", "translate(" + 600 + "," + 0 + ")");
  film_boxoffice_legend.append("circle")
  	.attr("cy", -4)
  	.attr("r", 12)
  	.attr("opacity", 0.8)
  	.attr("fill", "gray");
  film_boxoffice_legend.append("circle")
  	.attr("cy", -4)
  	.attr("r", 1)
  	.attr("fill", "black");
  film_boxoffice_legend.append("text")
    .attr("dominant-baseline", "center")
  	.attr("transform", function(d, i) { return "translate(" + 20 + "," + 0 + ")"; })
  	.text("累计票房（万元）");

	//draw boxoffice chart legend
	var boxoffice_chart_legend = g_boxoffice_header.append('g')
		.attr("id", "boxoffice-chart-legend")
    .attr("transform", "translate(" + 0 + "," + 40 + ")");

  boxoffice_chart_legend.append('rect')
  	.attr("width", 20)
  	.attr("height", 16)
  	.attr("transform", "translate(" + 0 + "," + "-12" + ")")
  	.attr("fill", "#264653")
  	.on("mouseover", function(d, i){
  		d3.selectAll(".local-bar").style("opacity", 0.1);
  		d3.selectAll(".total-inc").style("opacity", 0.1);
  		d3.selectAll(".local-inc").style("opacity", 0.1);
  		d3.selectAll(".total-bar").style("opacity", 1)
  		d3.selectAll(".total-bar-text").style("opacity", 1);
  	})
  	.on("mouseout", function(d, i){
  		d3.selectAll(".local-bar").style("opacity", 0.8);
  		d3.selectAll(".total-inc").style("opacity", 0.8);
  		d3.selectAll(".local-inc").style("opacity", 0.8);
  		d3.selectAll(".total-bar").style("opacity", 0.8);
  		d3.selectAll(".total-bar-text").style("opacity", 0);
  	});
  boxoffice_chart_legend.append("text")
    .attr("dominant-baseline", "center")
  	.attr("transform", function(d, i) { return "translate(" + 22 + "," + 0 + ")"; })
  	.text("总票房");

  boxoffice_chart_legend.append('rect')
  	.attr("width", 20)
  	.attr("height", 16)
  	.attr("transform", "translate(" + 60 + "," + "-12" + ")")
  	.attr("fill", "#F4A261")
  	.on("mouseover", function(d, i){
  		d3.selectAll(".local-bar").style("opacity", 1);
  		d3.selectAll(".local-bar-text").style("opacity", 1);
  		d3.selectAll(".total-inc").style("opacity", 0.1);
  		d3.selectAll(".local-inc").style("opacity", 0.1);
  		d3.selectAll(".total-bar").style("opacity", 0.1);
  	})
  	.on("mouseout", function(d, i){
  		d3.selectAll(".local-bar").style("opacity", 0.8);
  		d3.selectAll(".total-inc").style("opacity", 0.8);
  		d3.selectAll(".local-inc").style("opacity", 0.8);
  		d3.selectAll(".total-bar").style("opacity", 0.8)
  		d3.selectAll(".local-bar-text").style("opacity", 0);;
  	});
  boxoffice_chart_legend.append("text")
    .attr("dominant-baseline", "center")
  	.attr("transform", function(d, i) { return "translate(" + 82 + "," + 0 + ")"; })
  	.text("国产电影票房");

  boxoffice_chart_legend.append('line')
  	.attr("x1", 150)
  	.attr("x2", 170)
  	.attr("transform", "translate(" + 0 + "," + "-4" + ")")
  	.attr("stroke", "#2A9D8F")
    .attr("stroke-width", 2)
  	.on("mouseover", function(d, i){
  		d3.selectAll(".local-bar").style("opacity", 0.1);
  		d3.selectAll(".total-inc").style("opacity", 1);
  		d3.selectAll(".local-inc").style("opacity", 0.1);
  		d3.selectAll(".total-bar").style("opacity", 0.1);
  		d3.selectAll(".total-inc-text").style("opacity", 1);
  	})
  	.on("mouseout", function(d, i){
  		d3.selectAll(".local-bar").style("opacity", 0.8);
  		d3.selectAll(".total-inc").style("opacity", 0.8);
  		d3.selectAll(".local-inc").style("opacity", 0.8);
  		d3.selectAll(".total-bar").style("opacity", 0.8);
  		d3.selectAll(".total-inc-text").style("opacity", 0);
  	});
  boxoffice_chart_legend.append("text")
    .attr("dominant-baseline", "center")
  	.attr("transform", function(d, i) { return "translate(" + 172 + "," + 0 + ")"; })
  	.text("票房增速");

  boxoffice_chart_legend.append('line')
  	.attr("x1", 220)
  	.attr("x2", 240)
  	.attr("transform", "translate(" + 0 + "," + "-4" + ")")
  	.attr("stroke", "#E76F51")
    .attr("stroke-width", 2)
  	.on("mouseover", function(d, i){
  		d3.selectAll(".local-bar").style("opacity", 0.1);
  		d3.selectAll(".total-inc").style("opacity", 0.1);
  		d3.selectAll(".local-inc").style("opacity", 1);
  		d3.selectAll(".total-bar").style("opacity", 0.1);
  		d3.selectAll(".local-film-inc-text").style("opacity", 1);
  	})
  	.on("mouseout", function(d, i){
  		d3.selectAll(".local-bar").style("opacity", 0.8);
  		d3.selectAll(".total-inc").style("opacity", 0.8);
  		d3.selectAll(".local-inc").style("opacity", 0.8);
  		d3.selectAll(".total-bar").style("opacity", 0.8);
  		d3.selectAll(".local-film-inc-text").style("opacity", 0);
  	});
  boxoffice_chart_legend.append("text")
    .attr("dominant-baseline", "center")
  	.attr("transform", function(d, i) { return "translate(" + 242 + "," + 0 + ")"; })
  	.text("国产电影票房增速");


	// draw top 10 films chart
	var month_axis_g = g_films_chart.selectAll('.month-axis')
		.data(monthes)
		.enter().append('g')
		.attr("class", "month-axis")
		.attr("transform", function(d) {
			return "translate(" + month_axis_x(d) + "," + 0 + ")";
		});

	var month_axis = month_axis_g.append("line")
		.attr("class", "month-axis-line")
		.attr("y2", film_chart_height);

	var month_text_top = month_axis_g.append('text')
		.attr("class", "month-axis-label-top")
		.attr("transform", "translate(" + 30 + "," + 0 + ")")
		.text(function(d) {
			if(d < 13) return d + "月";
		});

	var month_text_bottom = month_axis_g.append('text')
		.attr("class", "month-axis-label-bottom")
		.attr("transform", "translate(" + 30 + "," + film_chart_height + ")")
		.text(function(d) {
			if(d < 13) return d + "月";
		});

	var year_axsi_g = g_films_chart.selectAll('.year-axis')
		.data(years)
		.enter().append("g")
		.attr("class", "year-axis")
		.attr("transform", function(d, i) {
			return "translate(" + 0 + "," + (i * year_height + film_chart_top_padding) + ")";
		});

	var year_axsi_line = year_axsi_g.append('line')
		.attr("x2", film_chart_width)
		.attr("stroke", "#C9C9C9")
		.attr("shape-rendering", "crispEdges").style("stroke-dasharray", ("2, 2"));

	// draw text first otherwise it will affect mouse over event.
	top_10_films = g_films_chart.selectAll(".g-film")
		.data(film_data)
		.enter().append('g')
		.attr("class", "g-film");

	top_10_films
		.append('text')
		.attr("class", function(d) {return "film-name " + ft_class(d.type);})
		.attr("x", function(d) {return film_date_x(d.release_date);})
		.attr("y", function(d) {return (+years[0] - d.year) * year_height + film_chart_top_padding + Math.round(square_r(d.box_office/10000)*5) + 12;})
		.attr("text-anchor", "middle")
		.text(function(d) { return d.name; })
		.style('opacity', 0);

	var films = top_10_films
		.append('circle')
		.attr("class", function(d) {return "film " + ft_class(d.type);})
		.attr("cx", function(d) {return film_date_x(d.release_date);})
		.attr("cy", function(d) {
			return (+years[0] - d.year) * year_height + film_chart_top_padding;
		})
		.attr("r", function(d) {return Math.round(square_r(d.box_office/10000)*5); })
		.attr("fill", function(d) { return ft_colors[film_types.indexOf(d.type)]; })
		.style('opacity', 0.8)
		.on("mouseover", function(d, i){
			d3.selectAll(".film").style("opacity", 0.1);
			var r = +d3.select(this).attr("r") + 2;
			d3.select(this).attr("r", r).style("opacity", 1);

			show_film_tooltip(d, []);
		})
		.on("mouseout", function(d, i) {
			var r = +d3.select(this).attr("r") - 2;
			d3.select(this).attr("r", r).style("opacity", 0.8);
			d3.selectAll(".film").style("opacity", 0.8);

			hide_film_tooltip();
		});

	top_10_films
		.append('circle')
		.attr("class", "film-center")
		.attr("cx", function(d) { return film_date_x(d.release_date); })
		.attr("cy", function(d) {
			return (+years[0] - d.year) * year_height + film_chart_top_padding;
		})
		.attr("r", 1)
		.attr("fill", "black")
		.style('opacity', 1);

	// draw box office chart
	// FIXME: we assume the laat year box office always the max number and have a '.' there.  `3`
	var find_boxoffice_max_range = function(data) {
		var max_boxoffice = '' + d3.max(data.map(function(d) {return +d.total;}));
		var power_size = max_boxoffice.indexOf('.') ? max_boxoffice.indexOf('.') - 1 : max_boxoffice.length - 1;
		return (+max_boxoffice[0] + 1) * Math.pow(10, power_size);
	}
	var bo_range_max = find_boxoffice_max_range(boxoffice_data);
	var x = d3.scaleLinear().domain([0, bo_range_max]).range([0, boxoffice_chart_width]);
	var x_inc = d3.scaleLinear().domain([-20, 100]).range([0, boxoffice_chart_width]);
	var x_axis_top = d3.axisTop(x).ticks(7);
	var x_axis_bottom = d3.axisBottom(x_inc).ticks(7).tickFormat(function(d) {return d + "%"});
	var boxoffice_bar_height = 14;

	g_boxoffice_chart.append("g")
		.attr("class", "boxoffice-axis-top")
		.call(x_axis_top)
		.append('text')
		.attr("transform", "translate(" + (boxoffice_chart_width) + "," + 14 + ")")
		.text("单位：亿元");
	g_boxoffice_chart.append("g")
		.attr("class", "boxoffice-axis-bottom")
		.attr("transform", "translate(" + 0 + "," + film_chart_height + ")").call(x_axis_bottom);

	var year_boxoffice = g_boxoffice_chart.selectAll('.year-boxoffice')
		.data(boxoffice_data)
		.enter()
		.append('g')
		.attr("class", 'year-boxoffice')
		.attr("transform", function(d, i) {
			return "translate(" + 0 + "," + (i * year_height + film_chart_top_padding) + ")";
		})
		.on("mouseover", function(d, i){
			show_boxoffice_tooltip(d);
		})
		.on("mouseout", function(d, i) {
			hide_boxoffice_tooltip();
		});

	var total_boxoffice_bar = year_boxoffice
		.append('rect')
		.attr('class', 'total-bar')
		.attr('y', (-1 - boxoffice_bar_height))
		.attr('height', boxoffice_bar_height)
		.attr('width', function(d) { return x(d.total); })
		.style('opacity', 0.8)
		.style('fill', '#264653');
	year_boxoffice
		.append('text')
		.attr('class', 'total-bar-text')
		.attr('x', function(d) { return x(d.total) + 4; })
		.attr('y', (-1 - boxoffice_bar_height/2))
		.attr("opacity", 0)
		.attr("dominant-baseline", "central")
		.text(function(d) { return d.total; } );

	var local_boxoffice_bar = year_boxoffice
		.append('rect')
		.attr('class', 'local-bar')
		.attr('y', 1)
		.attr('height', boxoffice_bar_height)
		.attr('width', function(d) { return x(d.local_film); })
		.style('opacity', 0.8)
		.style('fill', '#F4A261');
	year_boxoffice
		.append('text')
		.attr('class', 'local-bar-text')
		.attr('x', function(d) { return x(d.local_film) + 4; })
		.attr('y', 1 + boxoffice_bar_height/2)
		.attr("opacity", 0)
		.attr("dominant-baseline", "central")
		.text(function(d) { return d.local_film; } );


	var total_lines = d3.line()
    .x(function(d) { return x_inc(d.inc_rate); })
    .y(function(d) { return (max_year-d.year) * year_height + film_chart_top_padding; })
    .curve(d3.curveMonotoneY);

  g_boxoffice_chart.append("path")
    .datum(boxoffice_data)
    .attr("class", "line total-inc")
    .attr("fill", "none")
    .attr("stroke", "#2A9D8F")
    .attr("stroke-width", 2)
    .attr("d", total_lines)
    .style('opacity', 0.8);

  var local_lines = d3.line()
    .x(function(d) { return x_inc(d.local_film_inc_rate); })
    .y(function(d) { return (max_year-d.year) * year_height + film_chart_top_padding; })
    .curve(d3.curveMonotoneY);

  g_boxoffice_chart.append("path")
    .datum(boxoffice_data)
    .attr("class", "line local-inc")
    .attr("fill", "none")
    .attr("stroke", "#E76F51")
    .attr("stroke-width", 2)
    .attr("d", local_lines)
    .style('opacity', 0.8);

  year_boxoffice
  	.append("circle")
  	.attr("cx", function(d) { return x_inc(d.inc_rate); })
  	.attr("cy", 0)
  	.attr("r", 3)
  	.attr("fill", "#2A9D8F")
  	.attr("class", "circle total-inc")
  	.style('opacity', 0.8);
  year_boxoffice
  	.append("text")
  	.attr("x", function(d) { return x_inc(d.inc_rate) + 6; })
  	.attr("y", 0)
  	.attr("class", "total-inc-text")
  	.attr("dominant-baseline", "central")
  	.attr("opacity", 0)
  	.text(function(d) { return d.inc_rate + '%' });

  year_boxoffice
  	.append("circle")
  	.attr("cx", function(d) { return x_inc(d.local_film_inc_rate); })
  	.attr("cy", 0)
  	.attr("r", 3)
  	.attr("fill", "#E76F51")
  	.attr("class", "circle local-inc")
  	.style('opacity', 0.8);
  year_boxoffice
  	.append("text")
  	.attr("x", function(d) { return x_inc(d.local_film_inc_rate) + 6; })
  	.attr("y", 0)
  	.attr("class", "local-film-inc-text")
  	.attr("dominant-baseline", "central")
  	.attr("opacity", 0)
  	.text(function(d) { return d.local_film_inc_rate + '%' });

	//Show the tooltip on hover
	function show_film_tooltip(d, color) {
		var xpos =  d3.event.pageX - 15;
		var ypos =  d3.event.pageY - 15;

		if( max_year - d.year < 2) {
			ypos += 240;
		}

		d3.select("#tooltip-name").text(d.name);
		d3.select("#tooltip-rate").text(d.rate ? d.rate : "暂无");
		d3.select("#tooltip-release-date").text(d.release_date);
		d3.select("#tooltip-film-boxoffice").text(d.box_office);
		d3.select("#tooltip-rank").text(d.rank);


		d3.select("#tooltip-film")
			.style("top", ypos + "px")
			.style("left", xpos + "px")
			.transition().duration(0)
			.style("opacity", 1);
	};

	//Hide the tooltip
	function hide_film_tooltip() {
		d3.select("#tooltip-film")
			.transition().duration(100)
			.style("opacity", 0);
	};

	function show_boxoffice_tooltip(d) {
		var xpos =  d3.event.pageX - 15;
		var ypos =  d3.event.pageY - 15;

		if( max_year - d.year < 2) {
			ypos += 240;
		}

		d3.select("#tooltip-year").text(d.year);
		d3.select("#tooltip-total").text(d.total ? d.total : "暂无");
		d3.select("#tooltip-total-inc").text(d.inc_rate ? d.inc_rate : "暂无");
		d3.select("#tooltip-local").text(d.local_film ? d.local_film : "暂无");
		d3.select("#tooltip-local-inc").text(d.local_film_inc_rate ? d.local_film_inc_rate : "暂无");


		d3.select("#tooltip-boxoffice")
			.style("top", ypos + "px")
			.style("left", xpos + "px")
			.transition().duration(0)
			.style("opacity", 1);

	};

	function hide_boxoffice_tooltip() {
		d3.select("#tooltip-boxoffice")
			.transition().duration(100)
			.style("opacity", 0);
	};
});


