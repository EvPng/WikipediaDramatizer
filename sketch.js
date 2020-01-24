let userInput, input, button, startDate, endDate;
let originalSearch = '.wikipedia.org/w/api.php?action=opensearch&format=json&search=';
let search1 = '.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&titles=';
let search2 = '&rvprop=timestamp%7Cuser%7Ccomment&rvlimit=5000&rvstart=';
let searchAfterStartDate = 'T00%3A00%3A00.000Z&rvend=';
let searchAfterEndDate= 'T00%3A00%3A00.000Z&rvdir=newer';

let counter = 0;
let headings = [];
let printedHeadings = [];
let editDates = [];
function setup() {

	let myDictionary = createStringDict('p5', 'js');
	noCanvas();
	userInput = select('#userinput');
    let searchLanguage = select('#languageinput');
    goWiki(userInput.value());


    d3.select("#go")
    .on("click", startSearch);


	function startSearch(){
        clearExisting();
		goWiki(userInput.value());
	}

    function clearExisting(){
        headings = [];
        editDates = [];
        var dashboard = d3.select("#dashboard").select("svg");
        dashboard.remove();

        if (printedHeadings.length !== undefined)
        {
            for (let i = 0; i < printedHeadings.length; i++)
            {
                printedHeadings[i].remove();
            }
        }
    }


	function goWiki(term){


		//let term = userInput.value()
		let currentTitle = term;
        let language = searchLanguage.value();
		currentTitle = currentTitle.replace(/\s+/g, '_');
        startDate = document.getElementById('startDate');
        endDate = document.getElementById('endDate');

        let newUrl = "https://" + language  + originalSearch + currentTitle;



		if (currentTitle.length >= 1)
		{
			console.log(currentTitle);
			loadJSON(newUrl, gotSearch, 'jsonp');

		}
	

	}

		function gotSearch(data){
			//console.log(data);

            let language = searchLanguage.value();
            startDate = document.getElementById('startDate');
            endDate = document.getElementById('endDate');

            let len = data[1].length;
            let title = data[1][0];
            title = title.replace(/\s+/g, '_');
            createDiv(title);
            console.log('Querying: ' + title);

            let newUrl = "https://" + language  + search1 + title + search2 + startDate.value + searchAfterEndDate + endDate.value + searchAfterEndDate;
			loadJSON(newUrl, gotContent, 'jsonp');
		}

		function gotContent(data){
            
			let page = data.query.pages; 
			let pageId = Object.keys(data.query.pages)[0];
			console.log(pageId);

			let content = page[pageId].revisions; //[0]['*'];
            console.log(content);
			printComments(content);

			console.log(myDictionary);

			// let wordRegex = /\b\w{4,}\b/g;
			// var words = content.match(wordRegex);
			// var word = random(words);
			// goWiki(word);
			// console.log(word);

		}

		function printComments(data){

			//console.log(data[0].comment);

			for (let i = 0; i < 5000; i++)
			{
				//console.log(data[i].comment);
				if (data !== undefined && data[i] !== undefined) {

					var str = data[i].comment;

                    //we're in a section that has a section edited;
					if (str != null && str.startsWith("/*")){

                        //add or update new section
						var mySubString = str.substring(
		    				str.lastIndexOf("/*") + 3, 
		    				str.lastIndexOf("*/"));
	    				addToList(mySubString);

                        //update or add contributor info
                        addContributorInfo(mySubString, data[i].user, data[i].comment);
                        addTimeStampInfo(data[i].timestamp, mySubString);


				   }
				}



			}

					
					sortSectionList(headings);
					console.log(headings);
                    //printEverything(headings);
					dashboard('#dashboard',headings);
                    pie(headings[0]);
                    makeCalendar(editDates, startDate, endDate);
                    console.log(editDates);


		}

		function addToList(title)
		{
			let check = 0;
			for (let i = 0; i<headings.length; i++)
			{
				if (headings[i].title == title)
				{
					check++;
					headings[i].edits = headings[i].edits + 1;
				}
			}

			if (check == 0)
			{
				headings.push(new Section(title));
			}

		}


		function addContributorInfo(section, editor, comment){

            //run through sections to find right one
            for (let i = 0; i<headings.length; i++)
            {
                let check = 0;
                //once we find the correct section, add the commentor
                if (headings[i].title == section)
                {
                    for (let c = 0; c<headings[i].totalContributors; c++)
                    {

                        //section already has this contributor, add new comment to its list
                        if (headings[i].contributors[c].name == editor)
                        {
                            check ++;

                            headings[i].contributors[c].totalComments ++;
                            headings[i].contributors[c].comments.push(comment);
                        }

                    }

                    //this is a new contributor, construct a new one in the list with its name and comment
                    if (check == 0)
                    {
                        headings[i].contributors.push(new Contributor(editor, comment));
                        headings[i].totalContributors ++;
                    }

                }
            }

		}



        function addTimeStampInfo(timestamp, section){

            timestamp = timestamp.substring(0, timestamp.indexOf("T"));
            let check = 0;

                    for (let c = 0; c<editDates.length; c++)
                    {

                        //section already has this contributor, add new comment to its list
                        if (editDates[c].date == timestamp)
                        {
                            check ++;

                            editDates[c].edits ++;
                            let sectionCheck = 0;

                            //now check within that date if that section has been edited
                            for (let d = 0; d<editDates[c].sections.length; d++)
                            {
                                //there's an existing section that has been edited on this date: add one edit to this value
                                if (editDates[c].sections[d].title == section)
                                sectionCheck ++;
                                editDates[c].sections[d].edits ++;

                            }

                            //this means there are other edits on this date, but none from this section title
                            //add a new section with one edit to the list of edits on this date
                            if (sectionCheck == 0)
                            {
                                editDates[c].sections.push(new EditDateSection(section))
                            }




                        }

                    }

                    //this is a totally new edit date: construct a new one in the list with its name and comment
                    if (check == 0)
                    {
                        editDates.push(new EditDate(timestamp, section));

                    }

            }


		function sortSectionList(list)
		{
			list.sort((a,b) =>{

				if (a.edits > b.edits){
					return -1
			} else {
				return 1
			}
			})

            for (let i = 0; i < list.length; i++)
            {
                list[i].order = i;
            }

		}

		function printEverything(list){
			for (let i = 0; i<list.length; i++)
			{
				//printedHeadings[i] = createP(list[i].title + ": "  + list[i].edits + " edits");
                var button = createButton(list[i].title + ": "  + list[i].edits + " edits");
                // button.listValue = i;
                // //button.mousePressed(SelectionButtonPress(this.listValue));
                printedHeadings[i] = button;


 			}
		}

        function SelectionButtonPress(value){

            console.log("button is pressed! ");
        }

        function mousePressed(event) {
            console.log(event);
            console.log("button is pressed! ");

}

		

 
}

function pie(originalData) {

        if (d3.select("pieChart").select("svg"))
        {
            d3.select("pieChart").remove();
        }

        var piesvg = d3.select("#pieChart").append("pieChart")
            .append("svg")
            .append("g")

        piesvg.append("g")
            .attr("class", "slices");
        piesvg.append("g")
            .attr("class", "labels");
        piesvg.append("g")
            .attr("class", "lines");

        d3.select("pieChart").select("svg")
            .attr("width", 1000)
            .attr("height", 1000)


        // PicurrentWidth = parseInt(d3.select('.col-md-6').style('width'), 10)
        // PicurrentHeight = parseInt(d3.select('.col-md-6').style('height'), 10)

        var width = 960,
            height = 450,
            radius = Math.min(width, height) / 2;

        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) {
                return d.value;
            });

        var arc = d3.svg.arc()
            .outerRadius(radius * 0.8)
            .innerRadius(radius * 0.4);

        var outerArc = d3.svg.arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);

        piesvg.attr("transform", "translate(" + width / 2.5 + "," + height / 2 + ")");

        var key = function(d){ return d.data.label; };

        var tempDomain = []
        var nameOnly = []
        var tempValues = []
        var tempComments = []
        for (let i = 0; i < originalData.contributors.length; i++)
                {
                    tempDomain[i] = originalData.contributors[i].name + ": " + originalData.contributors[i].totalComments;
                    nameOnly[i] = originalData.contributors[i].name;
                    tempValues[i] = originalData.contributors[i].totalComments;
                    tempComments[i] = originalData.contributors[i].comments;

                }

        var color = d3.scale.ordinal()
            .domain([tempDomain, "test"])
            .range(["#ccc2bd", "#5e656a", "#955251", "#fbede8", "#bdc7cc", "#e9e9ec", "#878181", "#9da9b2"]);
            // .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
            // console.log(tempDomain);
            // console.log(color.domain);

        function inputData (){
            var labels = tempDomain;//color.domain();
            let i = -1;
            return labels.map(function(label)
            {
                i++;
                // console.log("I am label " + label);
                return { label: label, value: tempValues[i], comments: tempComments[i], names: nameOnly[i]}
            });
}

change(inputData());

d3.select("#randomize")
    .on("click", function(){
        change(inputData());
    });




        function change(data) {

            var userpage = "";

            /* ------- PIE SLICES -------*/
            var slice = piesvg.select(".slices").selectAll("path.slice")
                .data(pie(data), key);

            slice.enter()
                .insert("path")
                .style("fill", function(d) {return color(d.data.label); })
                .attr("class", "slice")
                .on("mouseover", function(d) { mouseover (d.data.comments, d.data.names); return color(d.data.label); })


            slice       
                .transition().duration(1000)
                .attrTween("d", function(d) {
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        return arc(interpolate(t));
                    };
                })

            slice.exit()
                .remove();

            /* ------- TEXT LABELS -------*/

            var text = piesvg.select(".labels").selectAll("text")
                .data(pie(data), key);

            text.enter()
                .append("text")
                .attr("dy", ".35em")
                .text(function(d) {
                    return d.data.label;
                });
            
            function midAngle(d){
                return d.startAngle + (d.endAngle - d.startAngle)/2;
            }

            function mouseover(comments, username) {
                
                //print the comments for the given user
                const myNode = document.getElementById("print");
                  while (myNode.firstChild) {
                    myNode.removeChild(myNode.firstChild);
                  }

                //print the user's name
                var div1=document.getElementById("print");//get the div element
                var newButton = document.createElement("button");
                newButton.innerHTML = username;
                newButton.onclick = userSelect;
                div1.appendChild(newButton);



                //print the comments
                for (let i = 0; i < comments.length; i++)
                {

                    var div1=document.getElementById("print");//get the div element
                    var div2=document.createElement("div");//create a new div
                    div2.innerHTML=comments[i];

                    div1.appendChild(div2);// append to div
                }

                //make the new current url the correct one based on the user that's being viewed
                username = username.replace(/\s+/g, '_');
                var language = select('#languageinput').value();
                var original = ".wikipedia.org/wiki/User:"
                var finalstring = "https://" + language + original + username;
                userpage = finalstring;

            }

            function userSelect(){
                            window.open( userpage, "_blank"); 
            }

            text.transition().duration(1000)
                .attrTween("transform", function(d) {
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        var d2 = interpolate(t);
                        var pos = outerArc.centroid(d2);
                        pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                        return "translate("+ pos +")";
                    };
                })
                .styleTween("text-anchor", function(d){
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        var d2 = interpolate(t);
                        return midAngle(d2) < Math.PI ? "start":"end";
                    };
                });

            text.exit()
                .remove();

            /* ------- SLICE TO TEXT POLYLINES -------*/

            var polyline = piesvg.select(".lines").selectAll("polyline")
                .data(pie(data), key);
            
            polyline.enter()
                .append("polyline");

            polyline.transition().duration(1000)
                .attrTween("points", function(d){
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        var d2 = interpolate(t);
                        var pos = outerArc.centroid(d2);
                        pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                        return [arc.centroid(d2), outerArc.centroid(d2), pos];
                    };          
                });
            
            polyline.exit()
                .remove();
};
}


function dashboard(id, fData){
    var barColor = '#d3d3d3'; //#4E4B49

    function histoGram(fD){
        var hG={},    hGDim = {t: 2, r: 2, b: 2, l: 280};
        
        currentWidth = parseInt(d3.select(id).style('width'), 10)
        

        hGDim.w = currentWidth - hGDim.l - hGDim.r;     
        hGDim.h = fD.length * 25 - hGDim.t - hGDim.b;
        // console.log("lalalalal"+fD.length)

            
        //create svg for histogram.
        var hGsvg = d3.select(id).append("svg")
            .attr("width", hGDim.w + hGDim.l + hGDim.r)
            .attr("height", hGDim.h + hGDim.t + hGDim.b)
            .append("g")
            .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");

        
        // Create function for x-axis map.
        var x = d3.scale.linear().range([0, hGDim.w - 5])
                .domain([0, d3.max(fD, function(d) { return d[1]; })]);

        // create function for y-axis mapping.
        var y = d3.scale.ordinal().rangeRoundBands([0, hGDim.h], 0.1)
                .domain(fD.map(function(d) { return d[0]; }));

        // Add y-axis to the histogram svg.
        hGsvg.append("g").attr("class", "y axis")
            .attr("transform", "translate(0," + hGDim.w  + '%' + ")")
            .call(d3.svg.axis().scale(y).orient("left"))
            // .selectAll("text").attr("transform", "rotate(-25)");

        // Create bars for histogram to contain rectangles and freq labels.
        var bars = hGsvg.selectAll(".bar").data(fD).enter()
                .append("g").attr("class", "bar");
        
        //create the rectangles.
        bars.append("rect")
            .attr("x", 0)
            .attr("y", function(d) { return y(d[0]); })
            .attr("height", y.rangeBand())
            .attr("width", function(d) { return x(d[1]); })
            .attr('fill',barColor)
            .on("mouseover",mouseover)// mouseover is defined below.
            // .on("mouseout",mouseout);// mouseout is defined below.

            console.log(fD);
        //bars.append("text").text("hello")//{ return d3.format(",")(d[1])})
        let i = -1;
        bars.append("text").text(function(d){ 
            i++
            let string = fD[i][0];
            let addedString = ":  ";
            addedString += string;
            //previously had been printing the labels, now just keeping it only the number of edits
            return "  "

        })
            .attr("x", function(d) { return x(d[1])+10; })
            .attr("y", function(d) { return y(d[0])+y.rangeBand()/2+6; })
            .attr("text-anchor", "start");


        //Create the frequency labels above the rectangles.
        bars.append("text").text(function(d){ return d3.format(",")(d[1])})
            .attr("x", function(d) { return x(d[1])+10; })
            .attr("y", function(d) { return y(d[0])+y.rangeBand()/2+6; })
            .attr("text-anchor", "end");

        
        function mouseover(d){  // utility function to be called on mouseover.
            // filter for selected state.
            var st = fData.filter(function(s){ return s.title == d[0];})[0],
                nD = d3.keys(st.freq).map(function(s){ return {type:s, freq:st.freq[s]};});
                console.log(st.title);
                pie(headings[st.order]);

            //go to the page section
                const myNode = document.getElementById("pageHistory");
                  while (myNode.firstChild) {
                    myNode.removeChild(myNode.firstChild);
                  }

                const myNode2 = document.getElementById("print");
                  while (myNode2.firstChild) {
                    myNode2.removeChild(myNode2.firstChild);
                  }

                var div1=document.getElementById("pageHistory");//get the div element
                var newButton = document.createElement("button");
                var pageTitle = select('#userinput').value();
                newButton.innerHTML = pageTitle + " revision history";
                newButton.onclick = pageSelect;
                div1.appendChild(newButton);

                //make the new current url the correct one based on the user that's being viewed
                pageTitle = pageTitle.replace(/\s+/g, '_');
                var language = select('#languageinput').value();
                var original = ".wikipedia.org/w/index.php?title="

                var hpage = "https://" + language + original + pageTitle + "&action=history";


                // section button
                var div2=document.getElementById("print");//get the div element
                var newButton2 = document.createElement("button");
                var pageSection = st.title;
                newButton2.innerHTML = "Go to section: " + pageSection;
                newButton2.onclick = sectionSelect;
                div2.appendChild(newButton2);

                pageSection = pageSection.replace(/\s?$/,'');
                pageSection = pageSection.replace(/\s+/g, '_');

                var original_2 = ".wikipedia.org/wiki/"

                var spage = "https://" + language + original_2 + pageTitle + "#" + pageSection;

            

            function pageSelect(){
                            window.open( hpage, "_blank"); 
            }

            function sectionSelect(){
                            window.open( spage, "_blank"); 
            }
               
        }
        
        
        // create function to update the bars. This will be used by pie-chart.
        hG.update = function(nD, color){
            // update the domain of the y-axis map to reflect change in frequencies.
            x.domain([0, d3.max(nD, function(d) { return d[1]; })]);
            
            // Attach the new data to the bars.
            var bars = hGsvg.selectAll(".bar").data(nD);
            
            // transition the height and color of rectangles.
            bars.select("rect").transition().duration(500)
                .attr("x", 0)
                .attr("width", function(d) { return x(d[1]); })
                .attr("fill", color);

            // transition the frequency labels location and change value.
            bars.select("text").transition().duration(500)
                .text(function(d){ return d3.format(",")(d[1])})
                .attr("x", function(d) {return y(d[1])+5; });            
        }        
        return hG;
    }
    
    
    // calculate total frequency by state for all segment.
    var sF = fData.map(function(d){return [d.title,d.edits];});

    var hG = histoGram(sF); // create the histogram.

}

function makeCalendar(editDates, startDate, endDate) {
    // var now = moment().endOf('day').toDate();
    // var yearAgo = moment().startOf('day').subtract(1, 'year').toDate();
    // var dateElement = editDates.date;
    // var formatDate = d3.timeParse("%Y-%m-%d");
    
    var start = new Date(startDate.value);
    var end = new Date(endDate.value);
    console.log(start);

    var chartData = editDates.map(function(element){
            return {
                date: new Date(element.date),
                count: element.edits
            };
        });
        //console.log(chartData);

    var heatmap = calendarHeatmap()
                  .data(chartData)
                  .selector('#calendar')
                  .startDate(start, end)
                  .tooltipEnabled(true)
                  .legendEnabled(true)
                  // .colorRange(['#f4f7f7', '#79a8a9'])
                  // .colorRange(['#faf7f7', '#9f5f5f'])
                  .colorRange(['#f6f6f6', '#9f5f5f'])
                  .onClick(function (data) {
                    //pie(headings[st.order]);
                    //console.log(editDates);
                    //pie(editDates[0]);
                    console.log('data', data);
                    document.getElementById("print").innerHTML = JSON.stringify(data);
                  });
    heatmap();  // render the chart

}


class Section {
	constructor(title)
	{	
		this.title = title;
		this.edits = 1;
		this.contributors = [];
		this.totalContributors = 0;
        this.editDates = [];
        this.order;

	}
}

class Contributor {
    constructor(name, comment)
    {
        this.name = name;
        this.totalComments = 1;
        this.comments = [comment];
    }
}

class EditDate{
    constructor(date, section)
    {
        this.date = date;
        this.edits = 1;
        this.sections = [new EditDateSection(section)]
    }
}

class EditDateSection{
    constructor(title)
    {
        this.title = title;
        this.edits = 1;
    }
}
