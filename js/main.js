/* Main script */

document.addEventListener("DOMContentLoaded", function (event) {
    //Width and height
    var w = 700;
    var h = 500;

    //Define map projection
    var projection = d3.geoMercator()
        .scale(1700)
        .center([0, 39])

    var projection2 = d3.geoMercator()
        .scale(1700)
        .center([-5, 33])

    //Define path generator
    var path = d3.geoPath()
        .projection(projection);
    var path2 = d3.geoPath()
        .projection(projection2);

    //Create SVG
    var svg = d3.select(".map-container")
        .append("svg")
        .attr("class", "svg-map")
        .attr("viewBox", "0 0 700 500")
        .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("path")
        .data(SpainMapData.features)
        .enter()
        .append("path")
        .attr("d", function (d, i) {
            if (d.properties.NAME_1 === "Islas Canarias") {
                return path2(d, i);
            }
            return path(d, i);
        });
});


