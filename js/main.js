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
            })
            .on("input", function () {
                app.selectTime(app.times[d3.select(this).property("value")]);
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
            });

        divsRadios.append("label")
            .attr("for", function (d, i) {
                return "period-radio-btn-" + toId(d);
            })
            .attr("class", "custom-control-label unselectable check-label")
            .text(function (d) {
                var spl = d.toUpperCase().split("T");
                return "Temporada " + spl[1] + " del año " + spl[0];
            });

        /* Update period to deafult */
        this.updateRangeTime();
        this.selectTime(this.selectedPeriod);

        /* Dropdown menu for genders */

        divsRadios = d3.select("#gender-radio-menu-list")
            .selectAll("div")
            .data(this.genders.slice())
            .enter()
            .append("div")
            .attr("class", "form-group padded")
            .append("div")
            .attr("class", "custom-control custom-radio");

        divsRadios.append("input")
            .attr("class", "custom-control-input")
            .attr("type", "radio")
            .attr("id", function (d, i) {
                return "gender-radio-btn-" + toId(d);
            })
            .attr("name", "gender-radio-btn")
            .attr("value", function (d, i) {
                return d;
            })
            .on("change", function () {
                app.selectGender(d3.select("input[name='gender-radio-btn']:checked").property("value"));
            });

        divsRadios.append("label")
            .attr("for", function (d, i) {
                return "gender-radio-btn-" + toId(d);
            })
            .attr("class", "custom-control-label unselectable check-label")
            .text(function (d) {
                return d;
            });

        this.selectGender(this.selectedGender);

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
            .attr("class", "svg-map")
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
        d3.select(document).on("click", function () {
            if (app.mapHelpShown) {
                app.mapHelpShown = false;
                d3.select(".map-help-content").style("display", "none").style("opacity", 0);
            }
        });
    };

    VisualizationPrototype.prototype.drawBarsChart = function () {
        // Create SVG
        var svg = d3.select(".bars-graph-container")
            .append("svg")
            .attr("class", "svg-map")
            .attr("viewBox", "0 0 960 450")
            .attr("preserveAspectRatio", "xMidYMid meet");



    };

    VisualizationPrototype.prototype.drawPieChart = function () {
        // Create SVG
        var svg = d3.select(".pie-graph-container")
            .append("svg")
            .attr("id", "pie-chart")
            .attr("class", "svg-map")
            .attr("viewBox", "0 0 1200 800")
            .attr("preserveAspectRatio", "xMidYMid meet");

        svg.append("g")

        svg.append("g")
            .attr("class", "slices");
        svg.append("g")
            .attr("class", "labels");
        svg.append("g")
            .attr("class", "lines");
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

    VisualizationPrototype.prototype.updatePieChart = function () {
        var labelsArray = ["Agricultura", "Construcción", "Industria", "Servicios", "Parados de Corta Duración"];
        var dataset = this.getSelectedData().map(function (d, i) {
            return {label: labelsArray[i], count: d};
        });
        var svg = d3.select("#pie-chart");
        // chart dimensions
        var width = 1200;
        var height = 800;

        // a circle chart needs a radius
        var radius = (Math.min(width, height) / 2) - 50;

        // legend dimensions
        var legendRectSize = 25; // defines the size of the colored squares in legend
        var legendSpacing = 9; // defines spacing between squares

        // define color scale
        var color = d3.scaleOrdinal(d3.schemeCategory10);
        // more color scales: https://bl.ocks.org/pstuffa/3393ff2711a53975040077b7453781a9

        svg = svg.append('g') // append 'g' element to the svg element
            .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')'); // our reference is now to the 'g' element. centerting the 'g' element to the svg element

        var arc = d3.arc()
            .innerRadius(0) // none for pie chart
            .outerRadius(radius); // size of overall chart

        var pie = d3.pie() // start and end angles of the segments
            .value(function (d) { return d.count; }) // how to extract the numerical data from each entry in our dataset
            .sort(null); // by default, data sorts in oescending value. this will mess with our animation so we set it to null

        // define tooltip
        var tooltip = d3.select('#chart') // select element in the DOM with id 'chart'
            .append('div') // append a div element to the element we've selected                                    
            .attr('class', 'tooltip'); // add class 'tooltip' on the divs we just selected

        tooltip.append('div') // add divs to the tooltip defined above                            
            .attr('class', 'label'); // add class 'label' on the selection                         

        tooltip.append('div') // add divs to the tooltip defined above                     
            .attr('class', 'count'); // add class 'count' on the selection                  

        tooltip.append('div') // add divs to the tooltip defined above  
            .attr('class', 'percent'); // add class 'percent' on the selection

        // Confused? see below:

        // <div id="chart">
        //   <div class="tooltip">
        //     <div class="label">
        //     </div>
        //     <div class="count">
        //     </div>
        //     <div class="percent">
        //     </div>
        //   </div>
        // </div>

        dataset.forEach(function (d) {
            d.count = +d.count; // calculate count as we iterate through the data
            d.enabled = true; // add enabled property to track which entries are checked
        });

        // creating the chart
        var path = svg.selectAll('path') // select all path elements inside the svg. specifically the 'g' element. they don't exist yet but they will be created below
            .data(pie(dataset)) //associate dataset wit he path elements we're about to create. must pass through the pie function. it magically knows how to extract values and bakes it into the pie
            .enter() //creates placeholder nodes for each of the values
            .append('path') // replace placeholders with path elements
            .attr('d', arc) // define d attribute with arc function above
            .attr('fill', function (d) { return color(d.data.label); }) // use color scale to define fill of each label in dataset
            .each(function (d) { this._current - d; }); // creates a smooth animation for each track

        // mouse event handlers are attached to path so they need to come after its definition
        path.on('mouseover', function (d) {  // when mouse enters div      
            var total = d3.sum(dataset.map(function (d) { // calculate the total number of tickets in the dataset         
                return (d.enabled) ? d.count : 0; // checking to see if the entry is enabled. if it isn't, we return 0 and cause other percentages to increase                                      
            }));
            var percent = Math.round(1000 * d.data.count / total) / 10; // calculate percent
            tooltip.select('.label').html(d.data.label); // set current label           
            tooltip.select('.count').html('$' + d.data.count); // set current count            
            tooltip.select('.percent').html(percent + '%'); // set percent calculated above          
            tooltip.style('display', 'block'); // set display                     
        });

        path.on('mouseout', function () { // when mouse leaves div                        
            tooltip.style('display', 'none'); // hide tooltip for that element
        });

        path.on('mousemove', function (d) { // when mouse moves                  
            tooltip.style('top', (d3.event.layerY + 10) + 'px') // always 10px below the cursor
                .style('left', (d3.event.layerX + 10) + 'px'); // always 10px to the right of the mouse
        });

        // define legend
        var legend = svg.selectAll('.legend') // selecting elements with class 'legend'
            .data(color.domain()) // refers to an array of labels from our dataset
            .enter() // creates placeholder
            .append('g') // replace placeholders with g elements
            .attr('class', 'legend') // each g is given a legend class
            .attr('transform', function (d, i) {
                var height = legendRectSize + legendSpacing; // height of element is the height of the colored square plus the spacing      
                var offset = height * color.domain().length / 2; // vertical offset of the entire legend = height of a single element & half the total number of elements  
                var horz = 17 * legendRectSize; // the legend is shifted to the left to make room for the text
                var vert = i * height - offset; // the top of the element is hifted up or down from the center using the offset defiend earlier and the index of the current element 'i'               
                return 'translate(' + horz + ',' + vert + ')'; //return translation       
            });

        // adding colored squares to legend
        legend.append('rect') // append rectangle squares to legend                                   
            .attr('width', legendRectSize) // width of rect size is defined above                        
            .attr('height', legendRectSize) // height of rect size is defined above                      
            .style('fill', color) // each fill is passed a color
            .style('stroke', color) // each stroke is passed a color
            .on('click', function (label) {
                var rect = d3.select(this); // this refers to the colored squared just clicked
                var enabled = true; // set enabled true to default
                var totalEnabled = d3.sum(dataset.map(function (d) { // can't disable all options
                    return (d.enabled) ? 1 : 0; // return 1 for each enabled entry. and summing it up
                }));

                if (rect.attr('class') === 'disabled') { // if class is disabled
                    rect.attr('class', ''); // remove class disabled
                } else { // else
                    if (totalEnabled < 2) return; // if less than two labels are flagged, exit
                    rect.attr('class', 'disabled'); // otherwise flag the square disabled
                    enabled = false; // set enabled to false
                }

                pie.value(function (d) {
                    if (d.label === label) d.enabled = enabled; // if entry label matches legend label
                    return (d.enabled) ? d.count : 0; // update enabled property and return count or 0 based on the entry's status
                });

                path = path.data(pie(dataset)); // update pie with new data

                path.transition() // transition of redrawn pie
                    .duration(750) // 
                    .attrTween('d', function (d) { // 'd' specifies the d attribute that we'll be animating
                        var interpolate = d3.interpolate(this._current, d); // this = current path element
                        this._current = interpolate(0); // interpolate between current value and the new value of 'd'
                        return function (t) {
                            return arc(interpolate(t));
                        };
                    });
            });

        // adding text to legend
        legend.append('text')
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .attr("font-size", 32)
            .text(function (d) { return d; }); // return label
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
        d3.select("#rangeTimeLabel").text("Temporada " + spl[1] + " del año " + spl[0]);
        d3.select("#period-nav-indicator").text("Temporada " + spl[1] + " del año " + spl[0]);
    };

    VisualizationPrototype.prototype.selectGender = function (gender) {
        this.selectedGender = gender;
        d3.select("input[name='gender-radio-btn'][value='" + (gender) + "']").property('checked', true);
        d3.select("#gender-nav-indicator").text(this.selectedGender);
    };

    VisualizationPrototype.prototype.updateVisualizations = function (region) {
        this.updatePieChart();

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


