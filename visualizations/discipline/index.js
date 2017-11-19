(() => {
    const dataSource = "data.json";
    const disciplineConsts = {
      STUDENTS: 'students',
      STUDENTS_DISCIPLINED: 'studentsDisciplined',
      IN_SCHOOL_SUSPENSION: 'inSchoolSuspension',
      OUT_SCHOOL_SUSPENSION: 'outSchoolSuspension',
      EXPULSION: 'expulsion',
      REMOVED_TO_ALTERNATE: 'removedToAlternate',
      EMERGENCY_REMOVAL: 'emergencyRemoval',
    }

    const colorMap = {
      "Boston": "#98abc5",
      "Boston Charter Schools" : "#8a89a6"
    }
    const svgMargins = {top: 20, right: 20, bottom: 70, left: 80};
    let enrollmentData = [];
    let x;
    let y;
    let g;
    let svg;
    let schoolSelectorWrapper;
    let allSchoolNames = [];
    let width;
    let height;

    let model = {};

    const filterByDistrictType = (data, schoolType) => {
      const charterSchools = data.filter((school) => {
        return school.schoolType === schoolType;
      });

      return charterSchools;
    }

    const filterByYear = (data, year) => {
      return data.filter((district) => {
        return district.fiscalYear === year;
      });
    }

    const filterByStudentType = (data, studentType) => {
      return data.filter((district) => {
        return district.studentType === studentType;
      })
    }

    // Takes all charter school entries, sums up data, and creates new object with select properties summed
    const sumCharterSchools = (data) => {
      const charterSummaryData = {
        schoolType: 'Charter',
        districtName: 'Boston Charter Schools',
        [disciplineConsts.STUDENTS]: 0,
        [disciplineConsts.STUDENTS_DISCIPLINED]: 0,
        [disciplineConsts.IN_SCHOOL_SUSPENSION]: 0,
        [disciplineConsts.OUT_SCHOOL_SUSPENSION]: 0,
        [disciplineConsts.EXPULSION]: 0,
        [disciplineConsts.REMOVED_TO_ALTERNATE]: 0,
        [disciplineConsts.EMERGENCY_REMOVAL]: 0
      }

      data.forEach((school) => {
        charterSummaryData[disciplineConsts.STUDENTS] += school[disciplineConsts.STUDENTS] || 0;
        charterSummaryData[disciplineConsts.STUDENTS_DISCIPLINED] += school[disciplineConsts.STUDENTS_DISCIPLINED] || 0;
        charterSummaryData[disciplineConsts.IN_SCHOOL_SUSPENSION] += school[disciplineConsts.IN_SCHOOL_SUSPENSION] || 0;
        charterSummaryData[disciplineConsts.OUT_SCHOOL_SUSPENSION] += school[disciplineConsts.OUT_SCHOOL_SUSPENSION] || 0;
        charterSummaryData[disciplineConsts.EXPULSION] += school[disciplineConsts.EXPULSION] || 0;
        charterSummaryData[disciplineConsts.REMOVED_TO_ALTERNATE] += school[disciplineConsts.REMOVED_TO_ALTERNATE] || 0;
        charterSummaryData[disciplineConsts.EMERGENCY_REMOVAL] += school[disciplineConsts.EMERGENCY_REMOVAL] || 0;
      });

      return charterSummaryData;
    }

    // SVG related additions
    const view = {
      renderData: (data) => {

        // Set up d3 scales
        var svg = d3.select("svg"),
            margin = {top: 20, right: 20, bottom: 30, left: 100},
            width = +svg.attr("width") - margin.left - margin.right,
            height = +svg.attr("height") - margin.top - margin.bottom,
            g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x0 = d3.scaleBand()
            .rangeRound([50, width/3])
            .paddingInner(0.01);

        var x1 = d3.scaleBand()
            .padding(0.05);

        var y = d3.scaleLinear()
            .rangeRound([height, 0]);

        var z = d3.scaleOrdinal()
            .range(["#98abc5", "#8a89a6"]);

        // Manipulating data to get 2015 all student data
        const allStudentsData = filterByStudentType(data, 'all');

        const studentFifteenData = filterByYear(data, 2015);

        console.log(studentFifteenData);

        const charterSchools = filterByDistrictType(studentFifteenData, 'Charter');
        const charterSummaryData = sumCharterSchools(charterSchools);

        const publicDistrictSummaryData = filterByDistrictType(studentFifteenData, 'Traditional Public');

        const combinedSummary = [charterSummaryData, publicDistrictSummaryData[0]];

        console.log(combinedSummary);


        // Start plotting

        x0.domain(combinedSummary.map(function(district) { 
          return district.districtName; 
        }));

        y.domain([0, .25]);

        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x0));

        g.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y).ticks(5, '%'))

        g.selectAll(".bar")
          .data(combinedSummary)
          .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { 
              return x0(d.districtName);
            })
            .attr("y", height)
            .attr("width", x0.bandwidth())
            .attr("height", 0)
            .attr("fill", function(district) {
              console.log(district);
              return colorMap[district.districtName];
            })
            .transition()
            .duration(1000)
            .attr("height", function(district) { 
              const percentDisciplined = district.studentsDisciplined / district.students
              return height - y(percentDisciplined); 
            })
            .attr("y", function(district) {
              const percentDisciplined = district.studentsDisciplined / district.students
              return y(percentDisciplined); 
            })

        // Append y axis label
        g.append("text")
            .attr("class", "label-y")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - (svgMargins.left))
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("% Students Disciplined");

        const legend = g.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
          .selectAll("g")
          .data(["Boston Charter Schools", "Boston"].reverse())
          .enter().append("g")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("rect")
            .attr("x", width - 19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", z);

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .text(function(d) { 
              return d; 
            });
      }
    }

    // Append legend

    // Initialize table with all charter schools
    // @params (this, schoolName)
    d3.json(dataSource, view.renderData);
      
})();