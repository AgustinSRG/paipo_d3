/* Main script */

window.toId = function (text) {
    return (text + "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

var colorSelected = "#bd0026";
var colorNotSelected = "#fd8d3c";

window.VisualizationPrototype = (function () {

    function VisualizationPrototype(mapData, ineData) {
        this.mapData = mapData;
        this.data = ineData.data;
        this.genders = ineData.genders;
        this.regions = ineData.regions.sort();
        this.sectors = ineData.sectors;
        this.times = ineData.times.slice().reverse();
        this.selectedRegion = null;
        this.mapHelpShown = false;
        this.pieHelpShown = false;
        this.barsHelpShown = false;
        this.selectedPeriod = this.times[this.times.length - 1];
        this.selectedGender = this.genders[0];
    }

    VisualizationPrototype.prototype.init = function () {
        this.drawMap();
        this.drawPieChart();
        this.drawBarsChart();

        var app = this;

        /* Dropdown menu for regions */

        var divsRadios = d3.select("#region-radio-menu-list")
            .selectAll("div")
            .data(this.regions)
            .enter()
            .append("div")
            .attr("class", "form-group padded")
            .append("div")
            .attr("class", "custom-control custom-radio");

        divsRadios.append("input")
            .attr("class", "custom-control-input")
            .attr("type", "radio")
            .attr("id", function (d, i) {
                return "region-radio-btn-" + toId(d);
            })
            .attr("name", "region-radio-btn")
            .attr("value", function (d, i) {
                return toId(d);
            })
            .on("change", function () {
                app.selectRegion(d3.select("input[name='region-radio-btn']:checked").property("value"));
                app.updateVisualizations();
            });

        divsRadios.append("label")
            .attr("for", function (d, i) {
                return "region-radio-btn-" + toId(d);
            })
            .attr("class", "custom-control-label unselectable check-label")
            .text(function (d) {
                return d;
            });

        /* Select default region */

        this.selectRegion(null);

        /* Range control for time periods */

        d3.select("#rangeTime")
            .attr("min", 0)
            .attr("max", this.times.length - 1)
            .on("change", function () {
                app.selectTime(app.times[d3.select(this).property("value")]);
                app.updateVisualizations();
            })
            .on("input", function () {
                app.selectTime(app.times[d3.select(this).property("value")]);
                app.updateVisualizations();
            });

        /* Dropdown menu for time periods */

        divsRadios = d3.select("#period-radio-menu-list")
            .selectAll("div")
            .data(this.times.slice().reverse())
            .enter()
            .append("div")
            .attr("class", "form-group padded")
            .append("div")
            .attr("class", "custom-control custom-radio");

        divsRadios.append("input")
            .attr("class", "custom-control-input")
            .attr("type", "radio")
            .attr("id", function (d, i) {
                return "period-radio-btn-" + toId(d);
            })
            .attr("name", "period-radio-btn")
            .attr("value", function (d, i) {
                return d;
            })
            .on("change", function () {
                app.selectTime(d3.select("input[name='period-radio-btn']:checked").property("value"));
                app.updateRangeTime();
                app.updateVisualizations();
            });

        divsRadios.append("label")
            .attr("for", function (d, i) {
                return "period-radio-btn-" + toId(d);
            })
            .attr("class", "custom-control-label unselectable check-label")
            .text(function (d) {
                var spl = d.toUpperCase().split("T");
                return "Trimestre " + spl[1] + " del año " + spl[0];
            });

        /* Update period to deafult */
        this.updateRangeTime();
        this.selectTime(this.selectedPeriod);

        /* Genders btn */

        d3.select(".gender-btn")
            .on("click", function () {
                switch (app.selectedGender) {
                    case "Ambos sexos":
                        app.selectGender("Hombres");
                        break;
                    case "Hombres":
                        app.selectGender("Mujeres");
                        break;
                    case "Mujeres":
                        app.selectGender("Ambos sexos");
                        break;
                }
                app.updatePieChart();
            });


        this.selectGender(this.selectedGender);

        /* Helpers */

        d3.select(document).on("click", function () {
            if (app.pieHelpShown) {
                app.pieHelpShown = false;
                d3.select(".pie-help-content").style("display", "none").style("opacity", 0);
            }
            if (app.mapHelpShown) {
                app.mapHelpShown = false;
                d3.select(".map-help-content").style("display", "none").style("opacity", 0);
            }
            if (app.barsHelpShown) {
                app.barsHelpShown = false;
                d3.select(".bars-help-content").style("display", "none").style("opacity", 0);
            }
        });

        /* Update view */
        this.updateVisualizations();
    };

    VisualizationPrototype.prototype.updateRangeTime = function () {
        d3.select("#rangeTime").property("value", this.times.indexOf(this.selectedPeriod));
    };

    VisualizationPrototype.prototype.drawMap = function () {
        // Width and height
        var w = 700;
        var h = 500;

        var app = this;

        // Define map projection
        var projection = d3.geoMercator()
            .scale(2000)
            .center([0, 39])

        var projection2 = d3.geoMercator()
            .scale(2000)
            .center([-5, 33])

        // Define path generator
        var path = d3.geoPath()
            .projection(projection);
        var path2 = d3.geoPath()
            .projection(projection2);

        // Create SVG
        var svg = d3.select(".map-container")
            .append("svg")
            .attr("class", "svg-map clickable")
            .attr("viewBox", "0 0 700 500")
            .attr("preserveAspectRatio", "xMidYMid meet")
            .on("mouseenter", function () {
                app.showMapTooltip();
            })
            .on("mouseleave", function () {
                app.hideMapTooltip();
            })
            .on("mousemove", function () {
                d3.select(".region-tooltip").style("top", d3.event.pageY + "px");
                d3.select(".region-tooltip").style("left", (d3.event.pageX + 20) + "px");
            }).on("click", function () {
                app.selectRegion(null);
                app.updateVisualizations();
            });


        // Regions
        svg.selectAll("path")
            .data(this.mapData.features)
            .enter()
            .append("path")
            .attr("d", function (d, i) {
                if (d.properties.NAME_1 === "Islas Canarias") {
                    return path2(d, i);
                }
                return path(d, i);
            })
            .attr("class", function (d, i) {
                return toId(d.properties.NAME_1) + " region";
            })
            .attr("stroke", "black")
            .attr("fill", colorNotSelected)
            .on("mouseenter", function () {
                var className = toId(d3.select(this).data()[0].properties.NAME_1);
                console.log("Entering " + className);
                d3.selectAll("." + className).attr("fill", colorSelected);
                app.changeMapTooltip(d3.select(this).data()[0].properties.NAME_1);
                app.showMapTooltip();
            })
            .on("mouseleave", function () {
                var className = toId(d3.select(this).data()[0].properties.NAME_1);
                console.log("Leaving " + className);
                if (app.selectedRegion === className) {
                    d3.selectAll("." + className).attr("fill", colorSelected);
                } else {
                    d3.selectAll("." + className).attr("fill", colorNotSelected);
                }
                app.changeMapTooltip("España");
            })
            .on("click", function () {
                var className = toId(d3.select(this).data()[0].properties.NAME_1);
                app.selectRegion(className);
                app.updateVisualizations();
                d3.event.stopPropagation();
            });

        //Canarias
        svg.append("rect")
            .attr("x", 5)
            .attr("y", 390)
            .attr("width", 190)
            .attr("height", 90)
            .attr("stroke", "black")
            .attr("fill", "transparent")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5")
            .attr("class", "clickable")
            .on("mouseenter", function () {
                var className = toId("Islas Canarias");
                console.log("Entering " + className);
                d3.selectAll("." + className).attr("fill", colorSelected);
                app.changeMapTooltip("Islas Canarias");
                app.showMapTooltip();
            })
            .on("mouseleave", function () {
                var className = toId("Islas Canarias");
                console.log("Leaving " + className);
                if (app.selectedRegion === className) {
                    d3.selectAll("." + className).attr("fill", colorSelected);
                } else {
                    d3.selectAll("." + className).attr("fill", colorNotSelected);
                }
                app.changeMapTooltip("España");
            })
            .on("click", function () {
                var className = toId("Islas Canarias");
                app.selectRegion(className);
                app.updateVisualizations();
                d3.event.stopPropagation();
            })
            ;

        // Help
        d3.select(".map-help-icon").on("click", function () {
            if (app.mapHelpShown) {
                app.mapHelpShown = false;
                d3.select(".map-help-content").style("display", "none").style("opacity", 0);
            } else {
                app.mapHelpShown = true;
                d3.select(".map-help-content").style("display", "block").style("opacity", 1);
            }
            d3.event.stopPropagation();
        });
        d3.select(".map-help-content").on("click", function () {
            d3.event.stopPropagation();
        });
        d3.select(".close-map-help").on("click", function () {
            app.mapHelpShown = false;
            d3.select(".map-help-content").style("display", "none").style("opacity", 0);
            d3.event.stopPropagation();
        });
    };

    VisualizationPrototype.prototype.drawBarsChart = function () {
        // Create SVG
        var svg = d3.select(".bars-graph-container")
            .append("svg")
            .attr("class", "svg-map")
            .attr("id", "bars-chart")
            .attr("viewBox", "0 0 800 480")
            .attr("preserveAspectRatio", "xMidYMid meet");

        var app = this;

        // Help
        d3.select(".bars-help-icon").on("click", function () {
            if (app.barsHelpShown) {
                app.barsHelpShown = false;
                d3.select(".bars-help-content").style("display", "none").style("opacity", 0);
            } else {
                app.barsHelpShown = true;
                d3.select(".bars-help-content").style("display", "block").style("opacity", 1);
            }
            d3.event.stopPropagation();
        });
        d3.select(".bars-help-content").on("click", function () {
            d3.event.stopPropagation();
        });
        d3.select(".close-bars-help").on("click", function () {
            app.barsHelpShown = false;
            d3.select(".bars-help-content").style("display", "none").style("opacity", 0);
            d3.event.stopPropagation();
        });
    };

    VisualizationPrototype.prototype.drawPieChart = function () {
        // Create SVG
        var svg = d3.select(".pie-graph-container")
            .append("svg")
            .attr("id", "pie-chart")
            .attr("class", "svg-map")
            .attr("viewBox", "0 0 1200 800")
            .attr("preserveAspectRatio", "xMidYMid meet");

        var app = this;

        // Help
        d3.select(".pie-help-icon").on("click", function () {
            if (app.pieHelpShown) {
                app.pieHelpShown = false;
                d3.select(".pie-help-content").style("display", "none").style("opacity", 0);
            } else {
                app.pieHelpShown = true;
                d3.select(".pie-help-content").style("display", "block").style("opacity", 1);
            }
            d3.event.stopPropagation();
        });
        d3.select(".pie-help-content").on("click", function () {
            d3.event.stopPropagation();
        });
        d3.select(".close-pie-help").on("click", function () {
            app.pieHelpShown = false;
            d3.select(".pie-help-content").style("display", "none").style("opacity", 0);
            d3.event.stopPropagation();
        });
    };

    VisualizationPrototype.prototype.getSelectedData = function () {
        var dataSet = [];
        for (var sector in this.data) {
            if (sector !== "Total") {
                var val = 0;
                try {
                    val = this.data[sector][this.selectedPeriod.toUpperCase()][this.findRegionName(this.selectedRegion)][this.selectedGender];
                } catch (ex) {
                    console.error(ex);
                }
                dataSet.push(val);
            }
        }
        return dataSet;
    };

    VisualizationPrototype.prototype.getBarsData = function () {
        var dataSet = [];
        var labels = ["Agricultura", "Construcción", "Industria", "Servicios", "Parados de Corta Duración"];
        var i = -1;
        for (var sector in this.data) {
            if (sector !== "Total") {
                i++;
                var val = null;
                try {
                    val = this.data[sector][this.selectedPeriod.toUpperCase()][this.findRegionName(this.selectedRegion)];
                } catch (ex) {
                    console.error(ex);
                }
                if (val) {
                    dataSet.push({
                        sector: labels[i],
                        "Hombres": val["Hombres"] || 0,
                        "Mujeres": val["Mujeres"] || 0,
                        "Ambos sexos": val["Ambos sexos"] || 0,
                    });
                } else {
                    dataSet.push({
                        sector: labels[i],
                        "Hombres": 0,
                        "Mujeres": 0,
                        "Ambos sexos": 0,
                    });
                }
            }
        }
        return dataSet;
    };

    VisualizationPrototype.prototype.updateBarsChart = function () {
        var data = this.getBarsData();
        var keys = Object.keys(data[0]).slice(1);

        var tip = d3.tip().html(d => d.value);

        var margin = {
            top: 40,
            right: 80,
            bottom: 50,
            left: 80
        };
        var width = 800;
        var height = 480;
        var innerWidth = width - margin.left - margin.right;
        var innerHeight = height - margin.top - margin.bottom;

        var svg = d3.select('#bars-chart').text("");

        var g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

        svg.call(tip)

        var x0 = d3.scaleBand()
            .rangeRound([0, innerWidth])
            .paddingInner(.1);

        var x1 = d3.scaleBand()
            .padding(.05);

        var y = d3.scaleLinear()
            .rangeRound([innerHeight, 0]);

        var z = d3.scaleOrdinal()
            .range(['#91bfdb', '#fc8d59', '#ffffbf']);

        x0.domain(data.map(d => d.sector));
        x1.domain(keys).rangeRound([0, x0.bandwidth()]);
        y.domain([0, d3.max(data, d => d3.max(keys, key => d[key]))]).nice();

        g.append('g')
            .selectAll('g')
            .data(data)
            .enter()
            .append('g')
            .attr('transform', d => 'translate(' + x0(d.sector) + ',0)')
            .selectAll('rect')
            .data(d => keys.map(key => { return { key: key, value: d[key] } }))
            .enter().append('rect')
            .attr('x', d => x1(d.key))
            .attr('y', d => y(d.value))
            .attr('width', x1.bandwidth())
            .attr('height', d => innerHeight - y(d.value))
            .attr('fill', d => z(d.key))
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)

        g.append('g')
            .attr('class', 'axis-bottom')
            .attr("font-size", 16)
            .attr('transform', 'translate(0,' + innerHeight + ')')
            .call(d3.axisBottom(x0));

        g.append('g')
            .attr('class', 'axis-left')
            .call(d3.axisLeft(y).ticks(null, 's'))
            .append('text')
            .attr('x', 10)
            .attr('y', y(y.ticks().pop()) + 10)
            .attr('dy', '0.32em')
            .attr('fill', '#000')
            .style('transform', 'rotate(-90deg)')
            .attr('font-weight', 'bold')
            .attr('font-size', 16)
            .attr('text-anchor', 'end')
            .text('%');

        var legend = g.append('g')
            .attr('font-family', 'sans-serif')
            .attr('font-size', 16)
            .attr('text-anchor', 'end')
            .selectAll('g')
            .data(keys.slice().reverse())
            .enter().append('g')
            .attr('transform', (d, i) => 'translate(0,' + i * 20 + ')');

        legend.append('rect')
            .attr('x', innerWidth - 17)
            .attr('width', 14)
            .attr('height', 14)
            .attr('fill', z);

        legend.append('text')
            .attr('x', innerWidth - 32)
            .attr('y', 6)
            .attr("font-size", 16)
            .attr('dy', '0.32em')
            .text(d => d);
    };

    VisualizationPrototype.prototype.updatePieChart = function () {
        // Labels and dataset to show
        var labelsArray = ["Agricultura", "Construcción", "Industria", "Servicios", "Parados de Corta Duración"];
        var dataset = this.getSelectedData().map(function (d, i) {
            return { label: labelsArray[i], count: d };
        });

        // SVG and dimensions
        var svg = d3.select("#pie-chart");
        var width = 1200;
        var height = 800;
        var radius = (Math.min(width, height) / 2) - 50;
        var legendRectSize = 32;
        var legendSpacing = 16;

        // Color
        var color = d3.scaleOrdinal(d3.schemeCategory10);

        if (svg.html()) {
            svg = svg.select('g')
                .attr('transform', 'translate(' + ((width / 2) - 200) + ',' + (height / 2) + ')');

            var arc = d3.arc()
                .innerRadius(0)
                .outerRadius(radius);

            var pie = d3.pie()
                .value(function (d) { return d.count; })
                .sort(null);

            var tooltip = d3.select('.pie-tooltip');

            dataset.forEach(function (d) {
                d.count = Number(d.count);
                d.enabled = true;
            });

            var path = svg.selectAll('path')
                .data(pie(dataset))
                .attr('d', arc)
                .attr('fill', function (d) { return color(d.data.label); })
                .each(function (d) { this._current - d; });

            path.on('mouseover', function (d) {
                tooltip.select('.label').html(d.data.label);
                tooltip.select('.percent').html(d.data.count + '%');
                tooltip.style('display', 'block');
            });

            path.on('mouseout', function () {
                tooltip.style('display', 'none');
            });

            path.on('mousemove', function (d) {
                tooltip.style('top', (d3.event.pageY + 10) + 'px')
                    .style('left', (d3.event.pageX + 10) + 'px');
            });

            path.transition()
                .duration(150)
                .attrTween('d', function (d) {
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function (t) {
                        return arc(interpolate(t));
                    };
                });
        } else {
            svg = svg.append('g')
                .attr('transform', 'translate(' + ((width / 2) - 200) + ',' + (height / 2) + ')');

            var arc = d3.arc()
                .innerRadius(0)
                .outerRadius(radius);

            var pie = d3.pie()
                .value(function (d) { return d.count; })
                .sort(null);

            var tooltip = d3.select('.pie-tooltip');

            dataset.forEach(function (d) {
                d.count = Number(d.count);
                d.enabled = true;
            });

            var path = svg.selectAll('path')
                .data(pie(dataset))
                .enter()
                .append('path')
                .attr('d', arc)
                .attr('fill', function (d) { return color(d.data.label); })
                .each(function (d) { this._current - d; });

            path.on('mouseover', function (d) {
                tooltip.select('.label').html(d.data.label);
                tooltip.select('.percent').html(d.data.count + '%');
                tooltip.style('display', 'block');
            });

            path.on('mouseout', function () {
                tooltip.style('display', 'none');
            });

            path.on('mousemove', function (d) {
                tooltip.style('top', (d3.event.pageY + 10) + 'px')
                    .style('left', (d3.event.pageX + 10) + 'px');
            });

            var legend = svg.selectAll('.legend')
                .data(color.domain())
                .enter()
                .append('g')
                .attr('class', 'legend')
                .attr('transform', function (d, i) {
                    var height = legendRectSize + legendSpacing;
                    var offset = height * color.domain().length / 2;
                    var horz = 13 * legendRectSize;
                    var vert = i * height - offset;
                    return 'translate(' + horz + ',' + vert + ')';
                });

            legend.append('rect')
                .attr('width', legendRectSize)
                .attr('height', legendRectSize)
                .style('fill', color)
                .style('stroke', color);

            legend.append('text')
                .attr('x', legendRectSize + legendSpacing)
                .attr('y', legendRectSize - legendSpacing + 10)
                .attr("font-size", 32)
                .text(function (d) { return d; });
        }
    };

    VisualizationPrototype.prototype.showMapTooltip = function () {
        d3.select(".region-tooltip").style("display", "block");
    };

    VisualizationPrototype.prototype.hideMapTooltip = function () {
        d3.select(".region-tooltip").style("display", "none");
    };

    VisualizationPrototype.prototype.changeMapTooltip = function (text) {
        d3.select(".region-tooltip").text(text);
    };

    VisualizationPrototype.prototype.findRegionName = function (region) {
        if (!region) {
            return "Total Nacional";
        }
        for (var i = 0; i < this.regions.length; i++) {
            if (toId(this.regions[i]) === toId(region)) {
                return this.regions[i];
            }
        }
        return region;
    };

    VisualizationPrototype.prototype.selectRegion = function (region) {
        this.selectedRegion = region;
        d3.selectAll(".region").attr("fill", function (d, i) {
            var className = toId(d.properties.NAME_1);
            if (className === region) {
                return colorSelected;
            } else {
                return colorNotSelected;
            }
        });
        d3.select("input[name='region-radio-btn'][value='" + (region || toId("Total Nacional")) + "']").property('checked', true);
        d3.select("#region-nav-indicator").text(this.findRegionName(region));
    };

    VisualizationPrototype.prototype.selectTime = function (period) {
        this.selectedPeriod = period;
        d3.select("input[name='period-radio-btn'][value='" + (period) + "']").property('checked', true);
        var spl = this.selectedPeriod.toUpperCase().split("T");
        d3.select("#rangeTimeLabel").text("Trimestre " + spl[1] + " del año " + spl[0]);
        d3.select("#period-nav-indicator").text("Trimestre " + spl[1] + " del año " + spl[0]);
    };

    VisualizationPrototype.prototype.selectGender = function (gender) {
        this.selectedGender = gender;
        switch (this.selectedGender) {
            case "Ambos sexos":
                d3.select(".gender-btn").attr("title", gender).html('<i class="fas fa-venus-mars"></i>');
                break;
            case "Hombres":
                d3.select(".gender-btn").attr("title", gender).html('<i class="fas fa-mars"></i>');
                break;
            case "Mujeres":
                d3.select(".gender-btn").attr("title", gender).html('<i class="fas fa-venus"></i>');
                break;
        }
    };

    VisualizationPrototype.prototype.updateVisualizations = function (region) {
        this.updatePieChart();
        this.updateBarsChart();
    };

    return VisualizationPrototype;
})();

document.addEventListener("DOMContentLoaded", function (event) {
    // Avoid dropdowns from closing
    $(document).on('click.bs.dropdown.data-api', '.dropdown.keep-inside-clicks-open', function (e) {
        e.stopPropagation();
    });

    window.App = new VisualizationPrototype(SpainMapData, DatosPoblActiva);
    App.init();
});


