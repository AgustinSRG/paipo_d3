/* Main script */

window.toId = function (text) {
    return (text + "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

var colorSelected = "#bd0026";
var colorNotSelected = "#fd8d3c";

window.VisualizationPrototype = (function () {

    function VisualizationPrototype(mapData, ineData) {
        this.mapData = mapData;
        this.genders = ineData.genders;
        this.regions = ineData.regions;
        this.sectors = ineData.sectors;
        this.times = ineData.times.reverse();
        this.selectedRegion = null;
        this.mapHelpShown = false;
        this.selectedPeriod = this.times[this.times.length - 1];
    }

    VisualizationPrototype.prototype.init = function () {
        this.drawMap();
        
        var app = this;

        d3.select("#rangeTime")
        .attr("min", 0)
        .attr("max", this.times.length - 1)
        .on("change", function () {
            app.selectTime(app.times[d3.select(this).property("value")]);
            app.updateTimeLabel();
        })
        .on("input", function () {
            app.selectTime(app.times[d3.select(this).property("value")]);
            app.updateTimeLabel();
        });

        this.updateRangeTime();
        this.updateTimeLabel();
    };

    VisualizationPrototype.prototype.updateRangeTime = function () {
        d3.select("#rangeTime").property("value", this.times.indexOf(this.selectedPeriod));
    };

    VisualizationPrototype.prototype.updateTimeLabel = function () {
        var spl = this.selectedPeriod.split("T");
        d3.select("#rangeTimeLabel").text("Temporada " + spl[1] + " del año " + spl[0]);
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
            .data(SpainMapData.features)
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
            .on("click", function() {
                var className = toId(d3.select(this).data()[0].properties.NAME_1);
                app.selectRegion(className);
                d3.event.stopPropagation();
            })
            ;

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
            .on("click", function() {
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

    VisualizationPrototype.prototype.showMapTooltip = function () {
        d3.select(".region-tooltip").style("display", "block");
    };

    VisualizationPrototype.prototype.hideMapTooltip = function () {
        d3.select(".region-tooltip").style("display", "none");
    };

    VisualizationPrototype.prototype.changeMapTooltip = function (text) {
        d3.select(".region-tooltip").text(text);
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
        this.updateVisualizations();
    };

    VisualizationPrototype.prototype.selectTime = function (period) {
        this.selectedPeriod = period;
        
    };

    VisualizationPrototype.prototype.updateVisualizations = function (region) {
    };

    return VisualizationPrototype;
})();

document.addEventListener("DOMContentLoaded", function (event) {
    window.App = new VisualizationPrototype(SpainMapData, DatosPoblActiva);
    App.init();
});


