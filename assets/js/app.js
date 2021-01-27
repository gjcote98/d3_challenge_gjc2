var svgWidth = 950;
var svgHeight = 700;

var margin =
{
    top: 30,
    right: 40,
    bottom: 80,
    left: 80
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

var svg = d3
    .select("#scatter")
    .append("svg")
    .attr("height", svgHeight)
    .attr("width", svgWidth);

var chartGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

var chosenXAxis = "healthcare";

function xScale(healthData, chosenXAxis) 
{
    var xLinearScale = d3.scaleLinear()
        .domain([d3.min(healthData, d => d[chosenXAxis]) * 0.8,
        d3.max(healthData, d => d[chosenXAxis]) * 1.2])
        .range([0, width]);
    return xLinearScale;
}

function yScale(healthData, poverty) 
{
    var yLinearScale = d3.scaleLinear()
        .domain([d3.min(healthData, d => d[poverty]) * 0.8,
        d3.max(healthData, d => d.poverty) * 1.2])
        .range([height, 0]);
    return yLinearScale;
}

function renderAxes(newXScale, xAxis) 
{
    var bottomAxis = d3.axisBottom(newXScale);
    xAxis.transition()
        .duration(1000)
        .call(bottomAxis);
    return xAxis;
}

function renderCircles(circlesGroup, newXScale, chosenXAxis) 
{
    circlesGroup.transition()
        .duration(1000)
        .attr("cx", d => newXScale(d[chosenXAxis]));
    return circlesGroup;
}

function renderText(textGroup, newXScale, chosenXAxis) 
{
    textGroup.transition()
        .duration(1000)
        .ease(d3.easeBack)
        .attr("x", d => newXScale(d[chosenXAxis]));
    return textGroup;
}

function updateToolTip(chosenXAxis, circlesGroup, textGroup) 
{
    var label;
    if (chosenXAxis === "healthcare") 
    {
        label = "Healthcare:";
    }
    else 
    {
        label = "Smokes:";
    }

    var toolTip = d3.tip()
        .attr("class", "tooltip")
        .offset([80, -60])
        .html(function (data) 
        {
            return (`State: ${data.state}<br>${label}: ${data[chosenXAxis]}<br>Poverty: ${data.poverty}`);
        });

    circlesGroup.call(toolTip);

    circlesGroup.on("mouseover", function (data) 
    {
        toolTip.show(data, this);
    })
        .on("mouseout", function (data) 
        {
            toolTip.hide(data);
        });
    
    d3.selectAll(".stateText").call(toolTip);
    d3.selectAll(".stateText")
        .on("mouseover", toolTip.show)
        .on("mouseout", toolTip.hide);

    return circlesGroup;
    return textGroup;
}

d3.csv("assets/data/data.csv").then(healthData => 
{
    console.log(healthData);
    healthData.forEach(data =>
    {
        data.healthcare = +data.healthcare;
        data.healthcareLow = +data.healthcareLow;
        data.healthcareHigh = +data.healthcareHigh;
        data.poverty = +data.poverty;
        data.povertyMoe = +data.povertyMoe;
        data.smokes = +data.smokes;
        data.smokesLow = +data.smokesLow;
        data.smokesHigh = +data.smokesHigh;
        data.age = +data.age;
        data.ageMoe = +data.ageMoe;
    });

    var xLinearScale = xScale(healthData, chosenXAxis);

    var yLinearScale = d3.scaleLinear()
        .domain([d3.min(healthData, d => d.healthcare), d3.max(healthData, d => d.healthcare)])
        .range([height, 0]);

    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    var xAxis = chartGroup.append("g")
        .classed("x-axis", true)
        .attr("transform", `translate(0, ${height})`)
        .call(bottomAxis);

    chartGroup.append("g")
        .call(leftAxis);

    var circlesGroup = chartGroup.selectAll("circle")
        .data(healthData)
        .enter()
        .append("circle")
        .attr("cx", d => xLinearScale(d.healthcare))
        .attr("cy", d => yLinearScale(d.poverty))
        .attr("r", 20)
        .attr("fill", "cyan")
        .attr("opacity", ".65")

    var textGroup = chartGroup.append("g")
        .selectAll("text")
        .data(healthData)
        .enter()
        .append("text")
        .attr("x", d => xLinearScale(d.healthcare))
        .attr("transform", `translate(0, ${height})`)
        .text(d => d.abbr)
        .classed("stateText",true);

    var labelsGroup = chartGroup.append("g")
        .attr("transform", `translate(${width / 2}, ${height + 20})`);

    var healthcareLabel = labelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 20)
        .attr("value", "healthcare")
        .classed("active", true)
        .text("Healthcare %");

    var smokesLabel = labelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 40)
        .attr("value", "smokes")
        .classed("inactive", true)
        .text("Smokes %");

    chartGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .classed("axis-text", true)
        .text("Poverty %");

    var circlesGroup = updateToolTip(chosenXAxis, circlesGroup, textGroup);

    labelsGroup.selectAll("text")
        .on("click", function () 
        {
            var value = d3.select(this).attr("value");
            if (value !== chosenXAxis) 
            {
                chosenXAxis = value;
                console.log(chosenXAxis);
                xLinearScale = xScale(healthData, chosenXAxis);
                xAxis = renderAxes(xLinearScale, xAxis);
                circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);
                circlesGroup = updateToolTip(chosenXAxis, circlesGroup, textGroup);
                textGroup = renderText(textGroup, newXScale, chosenXAxis);
                textGroup = updateToolTip(chosenXAxis, circlesGroup, textGroup);

                if (chosenXAxis === "healthcareLabel") 
                {
                    healthcareLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    smokesLabel
                        .classed("active", false)
                        .classed("inactive", true);
                }
                else 
                {
                    healthcareLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    smokesLabel
                        .classed("active", true)
                        .classed("inactive", false);
                }
            }
        });
})
    .catch(function (error) 
    {
        console.log(error);
    });


// CSV:
// data.id
// data.state
// data.abbr
// data.poverty
// data.povertyMoe
// data.age
// data.ageMoe
// data.income
// data.incomeMoe
// data.healthcare
// data.healthcareLow
// data.healthcareHigh
// data.obesity
// data.obesityLow
// data.obesityHigh
// data.smokes
// data.smokesLow
// data.smokesHigh

//REQUIREMENTS
//healthcare v poverty
//smokes v age
//axes, ticks, labels
//abbr in circles and fits inside